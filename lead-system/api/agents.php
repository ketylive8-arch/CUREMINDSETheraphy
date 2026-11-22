<?php
/** AI Agents Connection & Auth Hub — API keys, agents registry, connection test. */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

function norm_perm(string $p): string
{
    return $p === 'read_write' ? 'read_write' : 'read';
}

/* ---------------- API keys ---------------- */

/** List the admin's API keys (masked — never the full key). */
function handle_list_keys(): void
{
    $u = require_admin();
    $st = db()->prepare(
        'SELECT id, name, prefix, permissions, created_at, last_used_at, revoked
         FROM api_keys WHERE owner_user_id = ? ORDER BY id DESC'
    );
    $st->execute([(int) $u['id']]);
    json_out(['keys' => $st->fetchAll()]);
}

/** Generate a new API key. The full key is returned ONCE and never stored. */
function handle_create_key(): void
{
    $u = require_admin();
    $in = body();
    $name = trim((string) ($in['name'] ?? ''));
    if ($name === '') {
        json_err('צריך לתת שם למפתח');
    }
    $perm = norm_perm((string) ($in['permissions'] ?? 'read'));
    $raw = 'sk_live_' . random_token(24);
    $prefix = substr($raw, 0, 14);
    $hash = hash('sha256', $raw);
    db()->prepare(
        'INSERT INTO api_keys (owner_user_id, name, prefix, key_hash, permissions) VALUES (?,?,?,?,?)'
    )->execute([(int) $u['id'], $name, $prefix, $hash, $perm]);
    $id = last_id('api_keys');
    log_activity(null, (int) $u['id'], 'create_key', "$name ($perm)");
    // key is shown exactly once
    json_out(['ok' => true, 'id' => $id, 'name' => $name, 'permissions' => $perm, 'key' => $raw], 201);
}

function handle_revoke_key(int $id): void
{
    $u = require_admin();
    db()->prepare('UPDATE api_keys SET revoked = 1 WHERE id = ? AND owner_user_id = ?')
        ->execute([$id, (int) $u['id']]);
    log_activity(null, (int) $u['id'], 'revoke_key', (string) $id);
    json_out(['ok' => true]);
}

/* ---------------- Agents ---------------- */

function handle_list_agents(): void
{
    $u = require_admin();
    $st = db()->prepare(
        'SELECT id, name, platform, permissions, webhook_url, status, last_action_at, created_at,
                kind, instructions, offer, subject, targets, area, active, last_run_at, last_result, found_total
         FROM agents WHERE owner_user_id = ? ORDER BY id DESC'
    );
    $st->execute([(int) $u['id']]);
    json_out(['agents' => $st->fetchAll()]);
}

function handle_create_agent(): void
{
    $u = require_admin();
    $in = body();
    $name = trim((string) ($in['name'] ?? ''));
    if ($name === '') {
        json_err('צריך שם לסוכן');
    }
    $webhook = trim((string) ($in['webhook_url'] ?? ''));
    if ($webhook !== '' && !filter_var($webhook, FILTER_VALIDATE_URL)) {
        json_err('כתובת Webhook לא תקינה');
    }
    $hunter = ($in['kind'] ?? '') === 'hunter';
    db()->prepare(
        'INSERT INTO agents (owner_user_id, name, platform, permissions, webhook_url, kind, instructions, offer, subject, targets, area, active, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        (int) $u['id'],
        $name,
        $hunter ? 'סוכן פנימי' : (trim((string) ($in['platform'] ?? '')) ?: null),
        $hunter ? 'read_write' : norm_perm((string) ($in['permissions'] ?? 'read')),
        $webhook ?: null,
        $hunter ? 'hunter' : 'external',
        trim((string) ($in['instructions'] ?? '')) ?: null,
        trim((string) ($in['offer'] ?? '')) ?: null,
        trim((string) ($in['subject'] ?? '')) ?: null,
        trim((string) ($in['targets'] ?? '')) ?: null,
        trim((string) ($in['area'] ?? '')) ?: null,
        $hunter ? 1 : 0,
        $hunter ? 'connected' : 'disconnected',
    ]);
    $id = last_id('agents');
    log_activity(null, (int) $u['id'], 'add_agent', $name);
    json_out(['ok' => true, 'id' => $id], 201);
}

function handle_delete_agent(int $id): void
{
    $u = require_admin();
    db()->prepare('DELETE FROM agents WHERE id = ? AND owner_user_id = ?')
        ->execute([$id, (int) $u['id']]);
    json_out(['ok' => true]);
}

/** Test an agent's connection: ping its webhook (if set) and update status. */
function handle_test_agent(int $id): void
{
    $u = require_admin();
    $st = db()->prepare('SELECT * FROM agents WHERE id = ? AND owner_user_id = ?');
    $st->execute([$id, (int) $u['id']]);
    $agent = $st->fetch();
    if (!$agent) {
        json_err('סוכן לא נמצא', 404);
    }
    $ok = true;
    $detail = 'הסוכן מוגדר ומוכן. צרפי מפתח API כדי שיתחבר.';
    $webhook = (string) ($agent['webhook_url'] ?? '');
    if ($webhook !== '') {
        [$ok, $detail] = ping_webhook($webhook);
    }
    $status = $ok ? 'connected' : 'disconnected';
    db()->prepare('UPDATE agents SET status = ?, last_action_at = ? WHERE id = ?')
        ->execute([$status, date('Y-m-d H:i:s'), $id]);
    log_activity(null, (int) $u['id'], 'test_agent', $agent['name'] . ' → ' . $status);
    json_out(['ok' => $ok, 'status' => $status, 'detail' => $detail]);
}

/** Send a small signed ping to a webhook; returns [ok, detail]. */
function ping_webhook(string $url): array
{
    $payload = json_encode(['event' => 'segev_mkg.ping', 'at' => date('c')], JSON_UNESCAPED_UNICODE);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-Segev-Event: ping'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($code >= 200 && $code < 400) {
            return [true, "החיבור הצליח — ה-Webhook ענה ($code)."];
        }
        if ($code > 0) {
            return [false, "ה-Webhook החזיר שגיאה ($code)."];
        }
        return [false, 'לא הצלחתי להגיע ל-Webhook' . ($err ? " ($err)" : '') . '.'];
    }
    // Fallback without cURL.
    $ctx = stream_context_create(['http' => [
        'method' => 'POST', 'header' => "Content-Type: application/json\r\n",
        'content' => $payload, 'timeout' => 6, 'ignore_errors' => true,
    ]]);
    $res = @file_get_contents($url, false, $ctx);
    return $res !== false ? [true, 'החיבור הצליח.'] : [false, 'לא הצלחתי להגיע ל-Webhook.'];
}
