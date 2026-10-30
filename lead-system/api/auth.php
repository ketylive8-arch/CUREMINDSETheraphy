<?php
/** Authentication: login, logout, current user, invite (access codes). */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

/** Rate limit: max 8 failed attempts per email in the last 15 minutes. */
function login_rate_limited(string $email): bool
{
    $st = db()->prepare(
        "SELECT COUNT(*) c FROM login_attempts
         WHERE email = ? AND ok = 0 AND created_at > datetime('now','-15 minutes')"
    );
    $st->execute([$email]);
    return (int) $st->fetch()['c'] >= 8;
}

function record_attempt(string $email, bool $ok): void
{
    $st = db()->prepare('INSERT INTO login_attempts (email, ip, ok) VALUES (?,?,?)');
    $st->execute([$email, client_ip(), $ok ? 1 : 0]);
}

function handle_login(): void
{
    $in = body();
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $password = (string) ($in['password'] ?? '');
    if ($email === '' || $password === '') {
        json_err('חסרים אימייל או סיסמה');
    }
    if (login_rate_limited($email)) {
        json_err('יותר מדי ניסיונות. נסי שוב בעוד 15 דקות.', 429);
    }
    $st = db()->prepare('SELECT * FROM users WHERE email = ? AND status = \'active\'');
    $st->execute([$email]);
    $user = $st->fetch();
    if (!$user || !password_verify($password, $user['password_hash'])) {
        record_attempt($email, false);
        json_err('אימייל או סיסמה שגויים', 401);
    }
    record_attempt($email, true);
    $cfg = require __DIR__ . '/config.php';
    $token = random_token();
    $exp = date('Y-m-d H:i:s', time() + (int) $cfg['session_ttl']);
    $st = db()->prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)');
    $st->execute([$token, $user['id'], $exp]);
    log_activity(null, (int) $user['id'], 'login', $email);
    json_out([
        'token' => $token,
        'user'  => public_user($user),
    ]);
}

function handle_logout(): void
{
    $token = bearer_token();
    if ($token) {
        $st = db()->prepare('DELETE FROM sessions WHERE token = ?');
        $st->execute([$token]);
    }
    json_out(['ok' => true]);
}

function handle_me(): void
{
    $u = require_user();
    json_out(['user' => public_user($u)]);
}

/** Admin creates a new user and issues an access code (חיבור יוזרים עם קוד). */
function handle_create_user(): void
{
    require_admin();
    $in = body();
    $name = trim((string) ($in['name'] ?? ''));
    $email = strtolower(trim((string) ($in['email'] ?? '')));
    $role = ($in['role'] ?? 'agent') === 'admin' ? 'admin' : 'agent';
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_err('שם או אימייל לא תקינים');
    }
    $code = strtoupper(substr(random_token(6), 0, 8));
    // The access code doubles as the initial password (the user changes it later).
    $hash = password_hash($code, PASSWORD_BCRYPT);
    try {
        $st = db()->prepare(
            'INSERT INTO users (name, email, password_hash, role, access_code) VALUES (?,?,?,?,?)'
        );
        $st->execute([$name, $email, $hash, $role, $code]);
    } catch (PDOException $e) {
        json_err('האימייל כבר קיים במערכת', 409);
    }
    log_activity(null, null, 'create_user', $email);
    json_out([
        'ok'   => true,
        'user' => ['name' => $name, 'email' => $email, 'role' => $role, 'access_code' => $code],
    ], 201);
}

function public_user(array $u): array
{
    return [
        'id'    => (int) $u['id'],
        'name'  => $u['name'],
        'email' => $u['email'],
        'role'  => $u['role'],
    ];
}
