<?php
/** Leads: stats, list, bounces, per-lead actions, activity feed, users. */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

/** Dashboard counts by status. */
function handle_stats(): void
{
    require_user();
    $rows = db()->query(
        "SELECT status, COUNT(*) c FROM leads GROUP BY status"
    )->fetchAll();
    $by = [];
    foreach ($rows as $r) {
        $by[$r['status']] = (int) $r['c'];
    }
    $total = (int) db()->query('SELECT COUNT(*) c FROM leads')->fetch()['c'];
    json_out([
        'total'    => $total,
        'new'      => $by['new']      ?? 0,
        'sent'     => $by['sent']     ?? 0,
        'bounced'  => $by['bounced']  ?? 0,
        'no_reply' => $by['no_reply'] ?? 0,
        'replied'  => $by['replied']  ?? 0,
        'removed'  => $by['removed']  ?? 0,
    ]);
}

/** List leads, optional ?status= and ?q= search. */
function handle_leads(): void
{
    require_user();
    $status = $_GET['status'] ?? '';
    $q = trim((string) ($_GET['q'] ?? ''));
    $sql = 'SELECT * FROM leads WHERE 1=1';
    $args = [];
    if ($status !== '' && $status !== 'all') {
        $sql .= ' AND status = ?';
        $args[] = $status;
    }
    if ($q !== '') {
        $sql .= ' AND (company LIKE ? OR email LIKE ? OR sector LIKE ?)';
        $like = "%$q%";
        array_push($args, $like, $like, $like);
    }
    $sql .= ' ORDER BY updated_at DESC, id DESC LIMIT 500';
    $st = db()->prepare($sql);
    $st->execute($args);
    json_out(['leads' => $st->fetchAll()]);
}

/** Bounced list with reasons (רשימת מיילים שחזרו). */
function handle_bounces(): void
{
    require_user();
    $rows = db()->query(
        "SELECT * FROM leads WHERE status = 'bounced' ORDER BY updated_at DESC"
    )->fetchAll();
    json_out(['bounces' => $rows]);
}

function find_lead(int $id): array
{
    $st = db()->prepare('SELECT * FROM leads WHERE id = ?');
    $st->execute([$id]);
    $lead = $st->fetch();
    if (!$lead) {
        json_err('ליד לא נמצא', 404);
    }
    return $lead;
}

function touch_lead(int $id, array $fields): void
{
    $fields['updated_at'] = date('Y-m-d H:i:s');
    $sets = implode(', ', array_map(fn ($k) => "$k = ?", array_keys($fields)));
    $args = array_values($fields);
    $args[] = $id;
    $st = db()->prepare("UPDATE leads SET $sets WHERE id = ?");
    $st->execute($args);
}

/**
 * Re-find a real address for a bounced/unknown lead.
 * Marks the lead as being re-researched and logs it. The actual web lookup is
 * performed by the daily agent / a background job (documented in SPEC); the
 * system never invents an address — a human-verified address is required
 * before the status returns to 'new' and becomes sendable again.
 */
function handle_refind(int $id): void
{
    $u = require_user();
    $lead = find_lead($id);
    touch_lead($id, ['status' => 'refinding', 'notes' => trim(($lead['notes'] ?? '') . "\n[איתור מייל מחדש התחיל]")]);
    log_activity($id, (int) $u['id'], 'refind', $lead['company']);
    json_out(['ok' => true, 'status' => 'refinding']);
}

/** Save a verified new address for a lead and make it sendable again. */
function handle_set_email(int $id): void
{
    $u = require_user();
    $lead = find_lead($id);
    $email = strtolower(trim((string) (body()['email'] ?? '')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_err('כתובת מייל לא תקינה');
    }
    touch_lead($id, ['email' => $email, 'status' => 'new', 'bounce_reason' => null]);
    log_activity($id, (int) $u['id'], 'set_email', "$lead[company] → $email");
    json_out(['ok' => true, 'email' => $email, 'status' => 'new']);
}

/**
 * Queue a (re)send. If no sending source is configured the system refuses to
 * pretend — it marks the lead 'queued' and tells the UI there is no live
 * sending channel yet. Real sending happens through the mailer once SMTP
 * credentials for segevmkg are set, and only after human approval.
 */
function handle_resend(int $id): void
{
    $u = require_user();
    $lead = find_lead($id);
    if (!filter_var($lead['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
        json_err('אין כתובת מייל תקינה לליד הזה — צריך קודם לאתר כתובת', 422);
    }
    $cfg = require __DIR__ . '/config.php';
    $canSend = $cfg['smtp_host'] !== '' && $cfg['smtp_user'] !== '';
    touch_lead($id, ['status' => 'queued']);
    log_activity($id, (int) $u['id'], 'queue_resend', $lead['company']);
    json_out([
        'ok'        => true,
        'status'    => 'queued',
        'can_send'  => $canSend,
        'message'   => $canSend
            ? 'נכנס לתור השליחה'
            : 'נכנס לתור — אך עדיין אין מקור שליחה מוגדר (SMTP). ברגע שתגדירי, יישלח.',
    ]);
}

/** Generate a final follow-up email draft (דוגמת מייל אחרון) for a no-reply lead. */
function handle_followup(int $id): void
{
    $u = require_user();
    $lead = find_lead($id);
    $cfg = require __DIR__ . '/config.php';
    $company = $lead['company'] ?: 'שלום';
    $subject = 'מייל אחרון מצידי — ' . $company;
    $body = "שלום $company,\n\n"
        . "שלחתי אליכם לפני כמה ימים ולא קיבלתי תשובה — אני מניחה שהתקופה עמוסה, ולגמרי בסדר.\n\n"
        . "זה המייל האחרון שלי בנושא, רק כדי לוודא שלא נפל בין הכיסאות: אני מתקינה לעסקים "
        . "סוכן AI שעובד 24/7 — עונה לכל פנייה תוך שניות, עוקב אחרי כל ליד עד סגירה, "
        . "ומביא כל בוקר דוח קצר אחד של מה שקרה.\n\n"
        . "אם זה לא רלוונטי כרגע — תגידו מילה ואסגור את הנושא. "
        . "אם כן מעניין, ענו \"כן\" ואחזור עם שני מועדים לשיחה קצרה.\n\n"
        . $cfg['signature'] . "\n\n"
        . "להסרה מרשימת התפוצה, השיבו \"הסרה\".";
    touch_lead($id, ['last_followup_at' => date('Y-m-d H:i:s')]);
    log_activity($id, (int) $u['id'], 'followup_draft', $company);
    json_out([
        'ok'      => true,
        'to'      => $lead['email'],
        'subject' => $subject,
        'body'    => $body,
    ]);
}

/** Recent activity feed — every action the system performed. */
function handle_activity(): void
{
    require_user();
    $rows = db()->query(
        "SELECT a.*, l.company FROM activity a
         LEFT JOIN leads l ON l.id = a.lead_id
         ORDER BY a.id DESC LIMIT 100"
    )->fetchAll();
    json_out(['activity' => $rows]);
}

function handle_users(): void
{
    require_admin();
    $rows = db()->query(
        'SELECT id, name, email, role, status, access_code, created_at FROM users ORDER BY id'
    )->fetchAll();
    json_out(['users' => $rows]);
}
