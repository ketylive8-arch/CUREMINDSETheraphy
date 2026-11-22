<?php
/**
 * Automatic per-client lead engine.
 *
 * The admin (Kety) + the AI research agent keep a POOL of unassigned leads
 * (owner_user_id IS NULL, status 'new'). Each registered client picks a
 * segment and a daily time. This engine runs on a schedule and automatically
 * assigns fresh pool leads that match each client's segment into that client's
 * own dashboard — up to a daily quota, once per day, suppression-checked.
 *
 * Sourcing (filling the pool with real researched leads) is the agent's job;
 * distribution (pool -> each client, on their schedule) is this pure logic,
 * triggered by a scheduler that can reach the app.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

function engine_today(): string
{
    return date('Y-m-d');
}

function engine_quota(): int
{
    $q = (int) (getenv('DAILY_QUOTA') ?: 3);
    return $q > 0 ? $q : 3;
}

/** Does a pool lead's sector satisfy a client's desired sectors? */
function engine_match(string $leadSector, array $want): bool
{
    $ls = trim($leadSector);
    if (!$want) {
        return true;              // client asked for leads with no specific segment
    }
    if ($ls === '') {
        return false;
    }
    foreach ($want as $w) {
        $w = trim((string) $w);
        if ($w === '') {
            continue;
        }
        if (mb_strpos($ls, $w) !== false || mb_strpos($w, mb_substr($ls, 0, 4)) !== false) {
            return true;
        }
        // common wording differences
        if (mb_strpos($w, 'מלונ') !== false && mb_strpos($ls, 'מלונ') !== false) {
            return true;
        }
        if (mb_strpos($w, 'תעופה') !== false && mb_strpos($ls, 'תעופה') !== false) {
            return true;
        }
    }
    return false;
}

/**
 * Assign pool leads to due clients.
 * @param int|null $onlyClient  limit to one client (admin "run now")
 * @param bool     $force       ignore the daily time + already-delivered-today guard
 */
function engine_distribute(?int $onlyClient, bool $force): array
{
    $quota = engine_quota();
    $today = engine_today();
    $nowHm = date('H:i');

    if ($onlyClient !== null) {
        $cst = db()->prepare('SELECT * FROM client_profiles WHERE user_id = ?');
        $cst->execute([$onlyClient]);
        $clients = $cst->fetchAll();
    } else {
        $clients = db()->query('SELECT * FROM client_profiles WHERE daily_enabled = 1')->fetchAll();
    }

    $delivered = 0;
    $processed = 0;
    $detail = [];

    foreach ($clients as $c) {
        $uid = (int) $c['user_id'];
        $enabled = (int) ($c['daily_enabled'] ?? 0) === 1;
        if (!$force) {
            if (!$enabled) {
                continue;
            }
            if (($c['last_delivery_date'] ?? '') === $today) {
                continue;                       // already delivered today
            }
            $dt = (string) ($c['daily_time'] ?? '');
            if ($dt !== '' && $dt > $nowHm) {
                continue;                       // their chosen time hasn't arrived yet
            }
        }

        $want = json_decode((string) ($c['target_sectors'] ?? '[]'), true) ?: [];
        $pool = db()->query(
            "SELECT id, company, sector, email FROM leads
             WHERE owner_user_id IS NULL AND status = 'new' ORDER BY id"
        )->fetchAll();

        $assign = db()->prepare(
            'UPDATE leads SET owner_user_id = ?, updated_at = ? WHERE id = ? AND owner_user_id IS NULL'
        );
        $supCheck = db()->prepare('SELECT 1 FROM suppressions WHERE email = ?');

        $n = 0;
        foreach ($pool as $lead) {
            if ($n >= $quota) {
                break;
            }
            if (!engine_match((string) ($lead['sector'] ?? ''), $want)) {
                continue;
            }
            if (!empty($lead['email'])) {
                $supCheck->execute([strtolower((string) $lead['email'])]);
                if ($supCheck->fetch()) {
                    continue;
                }
            }
            $assign->execute([$uid, date('Y-m-d H:i:s'), (int) $lead['id']]);
            if ($assign->rowCount() > 0) {
                log_activity((int) $lead['id'], $uid, 'delivered', (string) $lead['company']);
                $n++;
                $delivered++;
            }
        }

        // Mark the day done so a scheduler running every N minutes delivers once.
        if (!$force || $n > 0) {
            db()->prepare('UPDATE client_profiles SET last_delivery_date = ? WHERE user_id = ?')
                ->execute([$today, $uid]);
        }
        $processed++;
        $detail[] = ['client' => $uid, 'business' => $c['business_name'] ?? '', 'delivered' => $n];
    }

    return ['ok' => true, 'processed' => $processed, 'delivered' => $delivered, 'today' => $today, 'detail' => $detail];
}

/** Scheduler entrypoint — authenticated by a shared token (not a user). */
function handle_engine_run(): void
{
    $cfg = require __DIR__ . '/config.php';
    $token = (string) ($cfg['engine_token'] ?? '');
    $sent = (string) ($_SERVER['HTTP_X_ENGINE_TOKEN'] ?? '');
    if ($token === '' || !hash_equals($token, $sent)) {
        json_err('מנוע: טוקן לא תקין', 401);
    }
    $force = !empty(body()['force']);
    json_out(engine_distribute(null, $force));
}

/** Admin "run now" for one client — ignores the schedule, for demos/manual pushes. */
function handle_engine_run_client(int $clientId): void
{
    require_admin();
    json_out(engine_distribute($clientId, true));
}

/** Admin view: pool size + every subscriber's segment, time, and last delivery. */
function handle_engine_status(): void
{
    require_admin();
    $pool = (int) db()->query(
        "SELECT COUNT(*) c FROM leads WHERE owner_user_id IS NULL AND status = 'new'"
    )->fetch()['c'];
    $subs = db()->query(
        "SELECT cp.user_id, cp.business_name, cp.business_type, cp.target_sectors,
                cp.daily_time, cp.daily_enabled, cp.last_delivery_date,
                u.name, u.email,
                (SELECT COUNT(*) FROM leads l WHERE l.owner_user_id = cp.user_id) AS lead_count
         FROM client_profiles cp JOIN users u ON u.id = cp.user_id
         ORDER BY cp.daily_enabled DESC, cp.user_id DESC"
    )->fetchAll();
    json_out(['pool' => $pool, 'today' => engine_today(), 'quota' => engine_quota(), 'subscribers' => $subs]);
}
