<?php
/** HTTP helpers, security headers, input parsing, auth guard. */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function send_security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header('Content-Security-Policy: default-src \'self\'; '
        . 'script-src \'self\'; '
        . 'style-src \'self\' \'unsafe-inline\'; '
        . 'img-src \'self\' data:; '
        . 'connect-src \'self\'');
}

function json_out($data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_err(string $message, int $code = 400): void
{
    json_out(['error' => $message], $code);
}

/** Read and decode JSON request body. */
function body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/** Bearer token from the Authorization header. */
function bearer_token(): ?string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/Bearer\s+(\S+)/i', $h, $m)) {
        return $m[1];
    }
    return null;
}

/**
 * Authenticate an AI agent by API key (Bearer sk_...). Returns the owning user
 * (so the agent acts with that account's data scope) or null if not an API key.
 * A read-only key may only make GET requests — anything else is refused 403.
 */
function auth_via_api_key(string $token): ?array
{
    if (!str_starts_with($token, 'sk_')) {
        return null;
    }
    $hash = hash('sha256', $token);
    $st = db()->prepare(
        "SELECT k.*, u.id uid, u.name, u.email, u.role, u.status
         FROM api_keys k JOIN users u ON u.id = k.owner_user_id
         WHERE k.key_hash = ? AND k.revoked = 0"
    );
    $st->execute([$hash]);
    $row = $st->fetch();
    if (!$row) {
        json_err('מפתח API לא תקין או בוטל', 401);
    }
    // Read-only keys cannot write.
    if (($row['permissions'] ?? 'read') === 'read'
        && ($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        json_err('למפתח הזה יש הרשאת קריאה בלבד', 403);
    }
    db()->prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?')
        ->execute([date('Y-m-d H:i:s'), (int) $row['id']]);
    return [
        'id'     => (int) $row['uid'],
        'name'   => $row['name'],
        'email'  => $row['email'],
        'role'   => $row['role'],
        'status' => $row['status'],
        'via'    => 'api_key',
    ];
}

/** Return the authenticated user row, or send 401 and stop. */
function require_user(): array
{
    $token = bearer_token();
    if (!$token) {
        json_err('לא מחובר', 401);
    }
    // An AI agent key authenticates first.
    $agent = auth_via_api_key($token);
    if ($agent) {
        return $agent;
    }
    $st = db()->prepare(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > ?"
    );
    $st->execute([$token, date('Y-m-d H:i:s')]);
    $user = $st->fetch();
    if (!$user) {
        json_err('החיבור פג, התחברי מחדש', 401);
    }
    return $user;
}

function require_admin(): array
{
    $u = require_user();
    if (($u['role'] ?? '') !== 'admin') {
        json_err('נדרשת הרשאת מנהל', 403);
    }
    return $u;
}

/** Random URL-safe token. */
function random_token(int $bytes = 32): string
{
    return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
}
