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

/** Return the authenticated user row, or send 401 and stop. */
function require_user(): array
{
    $token = bearer_token();
    if (!$token) {
        json_err('לא מחובר', 401);
    }
    $st = db()->prepare(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > datetime('now')"
    );
    $st->execute([$token]);
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
