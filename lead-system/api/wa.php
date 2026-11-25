<?php
/**
 * לידים מקבוצות וואטסאפ — מודול מופרד.
 *
 * עיקרון: חשבון אחד (של המנהלת/הלקוח), בקבוצות שהוא כבר חבר בהן. שירות הוואטסאפ
 * (whatsapp/index.js) מאזין פסיבית, ולכל הודעה בקבוצה שולח לכאן טקסט בלבד.
 * המערכת מסווגת ב-AI, ושומרת ליד **רק** כשמישהו באמת מבקש שירות ("מחפשת מעצבת",
 * "דרוש אינסטלטור", "ממליצים על…"). אין קצירה של מספרי כל חברי הקבוצה.
 *
 * ingest מאובטח בסוד (אותו HUNT_SECRET של הציד). ניהול הקבוצות דורש מנהל.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

/** קטגוריות עסקיות לסיווג ליד מקבוצה (enum סגור — ה-AI חייב לבחור אחת). */
const WA_CATEGORIES = [
    'נדל״ן ותיווך', 'שיפוצים ובנייה', 'עיצוב ומיתוג', 'שיווק דיגיטלי',
    'משפט ופיננסים', 'רואי חשבון ומיסוי', 'אירועים והפקות', 'טכנולוגיה ו-AI',
    'בריאות וטיפול', 'חינוך והדרכה', 'רכב ותחבורה', 'יופי וטיפוח',
    'מזון וקייטרינג', 'ניקיון ותחזוקה', 'שירותים כלליים',
];

/** בדיקת הסוד של ה-worker (כמו הציד). עוצר 403 אם לא תואם. */
function wa_require_worker(): void
{
    db();
    $secret = (string) (env('HUNT_SECRET', '') ?? '');
    $given = (string) ($_SERVER['HTTP_X_HUNT_SECRET'] ?? $_GET['secret'] ?? '');
    if ($secret === '' || !hash_equals($secret, $given)) {
        json_err('forbidden', 403);
    }
}

/** בעל הנתונים של לידים מקבוצות — המנהל/ת הראשון/ה (מערכת של קטי, דייר יחיד). */
function wa_owner_id(): int
{
    $row = db()->query("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1")->fetch();
    return (int) ($row['id'] ?? 1);
}

/** ספרות בלבד מתוך מזהה/מספר, בפורמט בינלאומי קצר. */
function wa_digits(string $s): string
{
    $d = preg_replace('/\D+/', '', $s) ?? '';
    // 0xxxxxxxxx ישראלי → 972xxxxxxxxx
    if (str_starts_with($d, '0')) {
        $d = '972' . substr($d, 1);
    }
    return $d;
}

/** מספר טלפון שמופיע בתוך טקסט ההודעה (אם הפונה השאיר מספר). */
function wa_phone_in_text(string $t): string
{
    if (preg_match('/0(?:5\d|7\d|[23489])-?\s?\d{3}-?\s?\d{4}/', $t, $m)) {
        return wa_digits($m[0]);
    }
    return '';
}

/* ------------------------------------------------------- סיווג כוונת-קנייה */

/**
 * מסווג הודעת קבוצה. מחזיר:
 * ['is_lead'=>bool, 'category'=>string, 'summary'=>string, 'contact_name'=>string, 'urgency'=>'high'|'medium'|'low']
 * עם מפתח ANTHROPIC_API_KEY — סיווג חכם. בלי מפתח — היוריסטיקה לפי מילות בקשה.
 */
function wa_classify(string $text, string $senderName = ''): array
{
    $text = trim($text);
    if (mb_strlen($text) < 15) {
        return ['is_lead' => false];
    }
    $key = (string) (env('ANTHROPIC_API_KEY', '') ?? '');
    if ($key !== '') {
        $ai = wa_classify_ai($text, $senderName, $key);
        if ($ai !== null) {
            return $ai;
        }
    }
    return wa_classify_heuristic($text, $senderName);
}

function wa_classify_ai(string $text, string $senderName, string $key): ?array
{
    $cats = implode(' | ', WA_CATEGORIES);
    $sys = "את מסווגת הודעות שנכתבו בקבוצות וואטסאפ עסקיות בישראל. המטרה: לזהות רק הודעות "
        . "שבהן מישהו **מחפש או מבקש** שירות/מוצר/נותן-שירות (לידים אמיתיים). "
        . "להחזיר is_lead=false לפרסום עצמי, מכירה, פרסומת, ברכות, פטפוט, שאלות כלליות או ספאם.\n"
        . "category חייב להיות אחד מתוך: $cats.\n"
        . "להחזיר JSON בלבד, בלי טקסט נוסף, במבנה:\n"
        . '{"is_lead":true/false,"category":"...","summary":"משפט עברי קצר מה הפונה צריך",'
        . '"contact_name":"שם הפונה אם ברור, אחרת ריק","urgency":"high|medium|low"}';
    $payload = json_encode([
        'model' => env('HUNT_MODEL', 'claude-sonnet-4-6'),
        'max_tokens' => 300,
        'system' => $sys,
        'messages' => [['role' => 'user', 'content' => "שולח: " . ($senderName ?: 'לא ידוע') . "\nההודעה:\n" . mb_substr($text, 0, 1200)]],
    ], JSON_UNESCAPED_UNICODE);
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25,
        CURLOPT_HTTPHEADER => ['content-type: application/json', 'x-api-key: ' . $key, 'anthropic-version: 2023-06-01'],
        CURLOPT_POSTFIELDS => $payload,
    ]);
    $res = json_decode((string) curl_exec($ch), true);
    curl_close($ch);
    $out = trim((string) ($res['content'][0]['text'] ?? ''));
    if ($out === '' || !preg_match('/\{.*\}/s', $out, $m)) {
        return null;
    }
    $j = json_decode($m[0], true);
    if (!is_array($j) || !array_key_exists('is_lead', $j)) {
        return null;
    }
    $cat = (string) ($j['category'] ?? '');
    if (!in_array($cat, WA_CATEGORIES, true)) {
        $cat = 'שירותים כלליים';
    }
    $urg = (string) ($j['urgency'] ?? 'medium');
    return [
        'is_lead'      => (bool) $j['is_lead'],
        'category'     => $cat,
        'summary'      => trim((string) ($j['summary'] ?? '')),
        'contact_name' => trim((string) ($j['contact_name'] ?? '')),
        'urgency'      => in_array($urg, ['high', 'medium', 'low'], true) ? $urg : 'medium',
    ];
}

/** גיבוי בלי AI: זיהוי לפי ניסוחי בקשה נפוצים + קטגוריה לפי מילות מפתח. */
function wa_classify_heuristic(string $text, string $senderName): array
{
    $t = $text;
    // ניסוחים שמעידים על בקשת שירות
    $ask = '/(מחפש(?:ת|ים)?|דרוש(?:ה|ים)?|צריך(?:ה)?|מעוניינ(?:ת|ים)?|ממליצ(?:ים|ה)?\s+על|יש\s+למישהו|מישהו\s+מכיר|המלצה\s+ל|מי\s+עושה|מי\s+יכול|אשמח\s+ל(?:המלצה|פרטים|הצעה))/u';
    $promo = '/(מציע(?:ה|ים)?|למכירה|בהנחה|מבצע|הזדמנות\s+ל|חדש\s+אצלנו|לפרטים\s+בפרטי|שלחו\s+לי\s+הודעה)/u';
    $isAsk = preg_match($ask, $t) === 1;
    $isPromo = preg_match($promo, $t) === 1;
    if (!$isAsk || $isPromo) {
        return ['is_lead' => false];
    }
    $map = [
        'נדל״ן ותיווך'   => '(דירה|נדל|תיווך|להשכרה|למכירה דירה|משכנתא|שכירות)',
        'שיפוצים ובנייה' => '(שיפוץ|אינסטלט|חשמלאי|צבע|גבס|קבלן|שיפוצ|אדריכל)',
        'עיצוב ומיתוג'   => '(מעצב|לוגו|מיתוג|גרפיק|עיצוב גרפי)',
        'שיווק דיגיטלי'  => '(שיווק|קמפיין|פרסום|סושיאל|אינסטגרם|פייסבוק|גוגל|SEO|קידום)',
        'משפט ופיננסים'  => '(עורך דין|עו"ד|משפט|חוזה|תביע|ייעוץ משפטי)',
        'רואי חשבון ומיסוי' => '(רואה חשבון|רו"ח|הנהלת חשבונות|מיסוי|החזר מס)',
        'אירועים והפקות' => '(אירוע|חתונה|בר מצווה|הפקה|צלם|dj|תקליטן|קייטרינג לאירוע)',
        'טכנולוגיה ו-AI' => '(אתר|תכנת|מתכנת|אפליקצי|מערכת|אוטומצ|בוט|AI|בינה)',
        'בריאות וטיפול'  => '(מטפל|פיזיותרפ|דיאטנ|פסיכולוג|רפואה|נטורופת|רגשי)',
        'חינוך והדרכה'   => '(מורה|שיעור|הדרכ|קורס|מרצה|מורה פרטי)',
        'רכב ותחבורה'    => '(מוסך|רכב|גרר|צמיג|חשמלאי רכב|הסעה)',
        'יופי וטיפוח'    => '(קוסמטיק|מספר|תסרוק|איפור|ציפורניים|לק ג)',
        'מזון וקייטרינג' => '(קייטרינג|אוכל|מאפ|עוג|שף|בישול)',
        'ניקיון ותחזוקה' => '(ניקיון|מנקה|גינון|גנן|הדברה|תחזוק)',
    ];
    $cat = 'שירותים כלליים';
    foreach ($map as $c => $re) {
        if (preg_match('/' . $re . '/iu', $t)) {
            $cat = $c;
            break;
        }
    }
    $urg = preg_match('/(דחוף|היום|עכשיו|בהקדם|מחר|למחר)/u', $t) ? 'high' : 'medium';
    $summary = mb_substr(preg_replace('/\s+/u', ' ', $t) ?? '', 0, 140);
    return ['is_lead' => true, 'category' => $cat, 'summary' => $summary, 'contact_name' => $senderName, 'urgency' => $urg];
}

/* ------------------------------------------------------------- ingest */

/**
 * קליטת הודעת קבוצה מה-worker. גוף:
 * {group, group_jid, sender_name, sender_phone, text}
 * שומר ליד רק אם סווג כבקשת שירות אמיתית, ועם דה-דופ של 7 ימים (טלפון+קטגוריה).
 */
function handle_wa_ingest(): void
{
    wa_require_worker();
    $in = body();
    $text = trim((string) ($in['text'] ?? ''));
    if ($text === '') {
        json_out(['ok' => true, 'stored' => false, 'reason' => 'empty']);
    }
    $group = trim((string) ($in['group'] ?? ''));
    $jid = trim((string) ($in['group_jid'] ?? ''));
    $senderName = trim((string) ($in['sender_name'] ?? ''));
    $phone = wa_digits((string) ($in['sender_phone'] ?? '')) ?: wa_phone_in_text($text);

    $c = wa_classify($text, $senderName);
    if (empty($c['is_lead'])) {
        wa_touch_group($jid, $group, false);
        json_out(['ok' => true, 'stored' => false, 'reason' => 'not_a_request']);
    }

    $owner = wa_owner_id();
    $pdo = db();
    // דה-דופ: אותו טלפון + קטגוריה ב-7 הימים האחרונים.
    if ($phone !== '') {
        $since = date('Y-m-d H:i:s', time() - 7 * 86400);
        $dup = $pdo->prepare('SELECT 1 FROM leads WHERE owner_user_id = ? AND phone = ? AND sector = ? AND created_at >= ? LIMIT 1');
        $dup->execute([$owner, $phone, $c['category'], $since]);
        if ($dup->fetch()) {
            wa_touch_group($jid, $group, false);
            json_out(['ok' => true, 'stored' => false, 'reason' => 'duplicate']);
        }
    }

    $note = 'ליד מקבוצת וואטסאפ' . ($group !== '' ? " «$group»" : '') . ' · דחיפות: ' . $c['urgency'];
    $contact = $c['contact_name'] ?: ($senderName ?: '');
    $pdo->prepare(
        "INSERT INTO leads (owner_user_id, lead_kind, company, contact, phone, sector, subject,
                            source_group, raw_message, urgency, source_url, status, notes)
         VALUES (?, 'request', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)"
    )->execute([
        $owner,
        $contact !== '' ? $contact : ($group !== '' ? "פונה מקבוצת $group" : 'פונה מקבוצה'),
        $contact ?: null,
        $phone ?: null,
        $c['category'],
        $c['summary'] ?: null,
        $group ?: null,
        mb_substr($text, 0, 1000),
        $c['urgency'],
        $phone !== '' ? 'https://wa.me/' . $phone : null,
        $note,
    ]);
    $leadId = last_id('leads');
    log_activity($leadId, $owner, 'wa_lead', ($group ?: 'קבוצה') . ': ' . ($c['summary'] ?: $c['category']));
    wa_touch_group($jid, $group, true);
    json_out(['ok' => true, 'stored' => true, 'lead_id' => $leadId, 'category' => $c['category'], 'urgency' => $c['urgency']]);
}

/** מעדכן חותמת-זמן אחרונה ומונה לידים לקבוצה (אם היא ברשימת המעקב). */
function wa_touch_group(string $jid, string $name, bool $gotLead): void
{
    $pdo = db();
    $where = $jid !== '' ? 'jid = ?' : 'name = ?';
    $val = $jid !== '' ? $jid : $name;
    if ($val === '') {
        return;
    }
    $inc = $gotLead ? ', lead_count = COALESCE(lead_count,0) + 1' : '';
    $pdo->prepare("UPDATE wa_groups SET last_seen_at = ?$inc, status = 'active' WHERE $where")
        ->execute([date('Y-m-d H:i:s'), $val]);
}

/* ------------------------------------------------- ניהול קבוצות (מנהל) */

function handle_list_groups(): void
{
    $u = require_admin();
    $st = db()->prepare('SELECT * FROM wa_groups WHERE owner_user_id = ? ORDER BY id DESC');
    $st->execute([(int) $u['id']]);
    json_out(['groups' => $st->fetchAll()]);
}

/**
 * הוספת קבוצות — ייבוא מהדבקה/אקסל. גוף: {items:[{name, invite?}]} או {text:"..."}.
 * כל שורה בטקסט: שם הקבוצה, ואם יש — קישור הזמנה (chat.whatsapp.com/...).
 */
function handle_add_groups(): void
{
    $u = require_admin();
    $in = body();
    $rows = [];
    if (!empty($in['items']) && is_array($in['items'])) {
        foreach ($in['items'] as $it) {
            $rows[] = ['name' => trim((string) ($it['name'] ?? '')), 'invite' => trim((string) ($it['invite'] ?? ''))];
        }
    } elseif (!empty($in['text'])) {
        foreach (preg_split('/\r?\n/', (string) $in['text']) as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            $invite = '';
            if (preg_match('~(https?://chat\.whatsapp\.com/\S+)~i', $line, $m)) {
                $invite = $m[1];
                $line = trim(str_replace($invite, '', $line), " \t,-|");
            }
            $rows[] = ['name' => $line !== '' ? $line : $invite, 'invite' => $invite];
        }
    }
    $rows = array_values(array_filter($rows, fn ($r) => $r['name'] !== '' || $r['invite'] !== ''));
    if (!$rows) {
        json_err('לא נמצאו קבוצות להוספה. הדביקי שם קבוצה בכל שורה (עם קישור הזמנה אם יש).');
    }
    $pdo = db();
    $added = 0;
    foreach ($rows as $r) {
        // דה-דופ לפי שם/קישור לאותה בעלים
        $ex = $pdo->prepare('SELECT 1 FROM wa_groups WHERE owner_user_id = ? AND (name = ? OR (? <> \'\' AND invite = ?)) LIMIT 1');
        $ex->execute([(int) $u['id'], $r['name'], $r['invite'], $r['invite']]);
        if ($ex->fetch()) {
            continue;
        }
        $pdo->prepare('INSERT INTO wa_groups (owner_user_id, name, invite, status) VALUES (?,?,?,?)')
            ->execute([(int) $u['id'], $r['name'] ?: $r['invite'], $r['invite'] ?: null, 'pending']);
        $added++;
    }
    log_activity(null, (int) $u['id'], 'wa_groups_add', "נוספו $added קבוצות");
    json_out(['ok' => true, 'added' => $added, 'total' => count($rows)]);
}

function handle_delete_group(int $id): void
{
    $u = require_admin();
    db()->prepare('DELETE FROM wa_groups WHERE id = ? AND owner_user_id = ?')->execute([$id, (int) $u['id']]);
    json_out(['ok' => true]);
}
