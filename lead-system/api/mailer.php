<?php
/**
 * תיבת הדואר של segevmkg@gmail.com — שליחה וקריאת תשובות, ישירות מול Gmail
 * (SMTP 465 / IMAP 993 עם סיסמת אפליקציה), בלי ספריות ובלי שירות נוסף.
 *
 * שליחה: רק אחרי שקטי אישרה את הנוסחים (SEND_APPROVED=1), רק לידים של סוכן
 * הלידים עם מייל אמיתי וטיוטה, אף פעם לכתובת שביקשה הסרה, בשעות עבודה,
 * בקצב איטי ועם תקרה יומית.
 * תשובות: "הסר" / "לא רלוונטי" → רשימת הסרה + הליד מוסר מכל הרשימות.
 * "תחזרו אליי" וכדומה → הליד מסומן "לחזור אליו" וקטי מקבלת מייל התראה.
 * כל תשובה אחרת → "ענו". החזרות (bounce) → "חזר" + רשימת הסרה.
 */
declare(strict_types=1);

function mail_cfg(): array
{
    static $c = null;
    if ($c === null) {
        $cfg = require __DIR__ . '/config.php';
        $user = $cfg['smtp_user'] ?: 'segevmkg@gmail.com';
        $c = [
            'user' => $user,
            'pass' => str_replace(' ', '', (string) $cfg['smtp_pass']),
            'from' => $cfg['smtp_from'] ?: $user,
            'name' => (getenv('SMTP_FROM_NAME') ?: '') ?: 'קטי שגב · SEGEV Master Marketing',
            'cap'  => max(1, (int) $cfg['daily_send_cap']),
            'approved' => getenv('SEND_APPROVED') === '1',
            'notify' => (string) (getenv('NOTIFY_EMAIL') ?: ''),
        ];
    }
    return $c;
}

function mail_ready(): bool
{
    return mail_cfg()['pass'] !== '';
}

function mail_state_get(string $k): ?string
{
    db()->exec('CREATE TABLE IF NOT EXISTS mail_state (k TEXT PRIMARY KEY, v TEXT)');
    $st = db()->prepare('SELECT v FROM mail_state WHERE k = ?');
    $st->execute([$k]);
    $v = $st->fetchColumn();
    return $v === false ? null : (string) $v;
}

function mail_state_set(string $k, string $v): void
{
    mail_state_get($k);
    db()->prepare('INSERT INTO mail_state (k, v) VALUES (?, ?) ON CONFLICT (k) DO UPDATE SET v = excluded.v')->execute([$k, $v]);
}

// ---------------------------------------------------------------- שליחה (SMTP)

function smtp_cmd($fp, ?string $line, string $expect): string
{
    if ($line !== null) {
        fwrite($fp, $line . "\r\n");
    }
    $resp = '';
    while (($l = fgets($fp, 2048)) !== false) {
        $resp .= $l;
        if (strlen($l) < 4 || $l[3] !== '-') {
            break;
        }
    }
    if (!str_starts_with($resp, $expect)) {
        throw new RuntimeException('SMTP: ' . trim($resp ?: 'אין תשובה'));
    }
    return $resp;
}

/** גוף HTML מימין לשמאל מתוך הטקסט (קישורים לחיצים). */
function mail_html(string $text): string
{
    $h = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
    $h = preg_replace('~(https?://[^\s<]+)~u', '<a href="$1">$1</a>', $h);
    $h = preg_replace('~(?<![/\w])(il\.linkedin\.com/[^\s<]+)~u', '<a href="https://$1">$1</a>', $h);
    return '<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#1f2937;text-align:right">'
        . nl2br($h) . '</div>';
}

function smtp_send(string $to, string $subject, string $text): string
{
    $c = mail_cfg();
    $fp = @stream_socket_client('ssl://smtp.gmail.com:465', $errno, $err, 20);
    if (!$fp) {
        throw new RuntimeException("SMTP: אין חיבור ($err)");
    }
    stream_set_timeout($fp, 30);
    $msgId = '<' . bin2hex(random_bytes(8)) . '.' . time() . '@segevmkg.leads>';
    try {
        smtp_cmd($fp, null, '220');
        smtp_cmd($fp, 'EHLO segev-mkg-leads', '250');
        smtp_cmd($fp, 'AUTH LOGIN', '334');
        smtp_cmd($fp, base64_encode($c['user']), '334');
        smtp_cmd($fp, base64_encode($c['pass']), '235');
        smtp_cmd($fp, "MAIL FROM:<{$c['from']}>", '250');
        smtp_cmd($fp, "RCPT TO:<$to>", '25');
        smtp_cmd($fp, 'DATA', '354');
        $b = 'b' . bin2hex(random_bytes(6));
        $enc = fn (string $s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
        $msg = implode("\r\n", [
            'From: ' . $enc($c['name']) . " <{$c['from']}>",
            "To: <$to>",
            'Subject: ' . $enc($subject),
            'Date: ' . date(DATE_RFC2822),
            "Message-ID: $msgId",
            'MIME-Version: 1.0',
            "List-Unsubscribe: <mailto:{$c['from']}?subject=%D7%94%D7%A1%D7%A8>",
            "Content-Type: multipart/alternative; boundary=\"$b\"",
            '',
            "--$b",
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            chunk_split(base64_encode($text)),
            "--$b",
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            chunk_split(base64_encode(mail_html($text))),
            "--$b--",
            '.',
        ]);
        smtp_cmd($fp, $msg, '250');
        smtp_cmd($fp, 'QUIT', '221');
    } finally {
        fclose($fp);
    }
    return $msgId;
}

/** שעות עבודה בישראל: א׳–ה׳ 09:00–18:00, ו׳ 09:00–13:00. */
function mail_business_hours(): bool
{
    $t = new DateTime('now', new DateTimeZone('Asia/Jerusalem'));
    $d = (int) $t->format('w'); // 0 = ראשון
    $h = (int) $t->format('G');
    return ($d <= 4 && $h >= 9 && $h < 18) || ($d === 5 && $h >= 9 && $h < 13);
}

function mail_sent_today(): int
{
    $st = db()->prepare("SELECT COUNT(*) FROM activity WHERE action = 'sent' AND created_at >= ?");
    $st->execute([gmdate('Y-m-d 00:00:00', time() - 3 * 3600)]);
    return (int) $st->fetchColumn();
}

/** שולח הצעה אחת (הבאה בתור). מחזיר תיאור קצר ללוג, או '' אם אין מה לשלוח. */
function mail_send_next(): string
{
    $c = mail_cfg();
    if (!mail_ready() || !$c['approved']) {
        return '';
    }
    if (!mail_business_hours()) {
        return '';
    }
    if (mail_sent_today() >= $c['cap']) {
        return '';
    }
    $lead = db()->query(
        "SELECT l.* FROM leads l
          WHERE l.status = 'new' AND l.agent_id IS NOT NULL AND l.email IS NOT NULL AND l.email <> ''
            AND l.draft IS NOT NULL AND l.draft <> '' AND l.subject IS NOT NULL AND l.subject <> ''
            AND NOT EXISTS (SELECT 1 FROM suppressions s WHERE LOWER(s.email) = LOWER(l.email))
            AND NOT EXISTS (SELECT 1 FROM leads o WHERE LOWER(o.email) = LOWER(l.email) AND o.id <> l.id AND o.status <> 'new')
          ORDER BY l.id ASC LIMIT 1"
    )->fetch();
    if (!$lead) {
        return '';
    }
    $to = strtolower(trim((string) $lead['email']));
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        db()->prepare("UPDATE leads SET status = 'bounced', bounce_reason = ? WHERE id = ?")->execute(['כתובת לא תקינה', $lead['id']]);
        return "דילוג: כתובת לא תקינה ({$lead['company']})";
    }
    try {
        smtp_send($to, (string) $lead['subject'], (string) $lead['draft']);
    } catch (Throwable $e) {
        log_activity((int) $lead['id'], null, 'send_failed', $e->getMessage());
        return "שליחה נכשלה ל-{$lead['company']}: " . $e->getMessage();
    }
    db()->prepare("UPDATE leads SET status = 'sent', sent_at = ?, updated_at = ? WHERE id = ?")
        ->execute([gmdate('Y-m-d H:i:s'), gmdate('Y-m-d H:i:s'), $lead['id']]);
    log_activity((int) $lead['id'], null, 'sent', "{$lead['company']} · $to");
    return "נשלחה הצעה ל-{$lead['company']} ($to)";
}

/** מייל פנימי לקטי (התראה), לא ללקוח. */
function mail_notify(string $subject, string $text): void
{
    $to = mail_cfg()['notify'];
    if ($to === '' || !mail_ready()) {
        return;
    }
    try {
        smtp_send($to, $subject, $text);
    } catch (Throwable $e) {
        // התראה שלא נשלחה לא עוצרת את הטיפול בתשובה
    }
}

// ---------------------------------------------------------------- תשובות (IMAP)

final class Imap
{
    private $fp;
    private int $n = 0;

    public function __construct(string $user, string $pass)
    {
        $this->fp = @stream_socket_client('ssl://imap.gmail.com:993', $errno, $err, 20);
        if (!$this->fp) {
            throw new RuntimeException("IMAP: אין חיבור ($err)");
        }
        stream_set_timeout($this->fp, 40);
        fgets($this->fp);
        $this->cmd('LOGIN ' . $this->q($user) . ' ' . $this->q($pass));
    }

    private function q(string $s): string
    {
        return '"' . addcslashes($s, '"\\') . '"';
    }

    /** שולח פקודה ומחזיר את כל התשובה (כולל literals). */
    public function cmd(string $c): string
    {
        $tag = 'A' . (++$this->n);
        fwrite($this->fp, "$tag $c\r\n");
        $out = '';
        while (($l = fgets($this->fp, 65536)) !== false) {
            if (preg_match('/\{(\d+)\}\r\n$/', $l, $m)) {
                $out .= $l;
                $need = (int) $m[1];
                while ($need > 0 && ($chunk = fread($this->fp, min(65536, $need))) !== false && $chunk !== '') {
                    $out .= $chunk;
                    $need -= strlen($chunk);
                }
                continue;
            }
            if (str_starts_with($l, "$tag ")) {
                if (!str_starts_with($l, "$tag OK")) {
                    throw new RuntimeException('IMAP: ' . trim($l));
                }
                return $out;
            }
            $out .= $l;
        }
        throw new RuntimeException('IMAP: החיבור נסגר');
    }

    public function close(): void
    {
        try { $this->cmd('LOGOUT'); } catch (Throwable $e) {}
        fclose($this->fp);
    }
}

/** מפענח כותרת MIME (=?UTF-8?B?...?=). */
function mime_header(string $s): string
{
    return function_exists('iconv_mime_decode') ? (string) @iconv_mime_decode($s, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8') : $s;
}

/** הטקסט הקריא הראשון מתוך הודעה גולמית (text/plain, אחרת HTML בלי תגיות). */
function mime_text(string $raw): string
{
    [$head, $body] = array_pad(preg_split("/\r?\n\r?\n/", $raw, 2), 2, '');
    $head = preg_replace("/\r?\n[ \t]+/", ' ', $head);
    $type = preg_match('/^Content-Type:\s*([^;\r\n]+)(.*)$/im', $head, $m) ? strtolower(trim($m[1])) : 'text/plain';
    if (str_starts_with($type, 'multipart/') && preg_match('/boundary="?([^";\r\n]+)"?/i', $m[2] ?? '', $bm)) {
        $parts = explode('--' . $bm[1], $body);
        $html = '';
        foreach ($parts as $p) {
            if (trim($p) === '' || str_starts_with($p, '--')) {
                continue;
            }
            $t = mime_text(ltrim($p, "\r\n"));
            if ($t !== '' && !str_contains($p, 'text/html')) {
                return $t;
            }
            $html = $html ?: $t;
        }
        return $html;
    }
    $cte = preg_match('/^Content-Transfer-Encoding:\s*(\S+)/im', $head, $em) ? strtolower($em[1]) : '';
    if ($cte === 'base64') {
        $body = (string) base64_decode(preg_replace('/\s+/', '', $body));
    } elseif ($cte === 'quoted-printable') {
        $body = quoted_printable_decode($body);
    }
    if (preg_match('/charset="?([\w-]+)/i', $m[2] ?? '', $cm) && !in_array(strtolower($cm[1]), ['utf-8', 'us-ascii'], true)) {
        $body = (string) @mb_convert_encoding($body, 'UTF-8', $cm[1]);
    }
    if (str_starts_with($type, 'text/html')) {
        $body = html_entity_decode(strip_tags(preg_replace('~<(br|/p|/div)[^>]*>~i', "\n", $body)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    return str_starts_with($type, 'text/') ? trim($body) : '';
}

/** רק מה שהפונה כתב עכשיו — בלי הציטוט של המייל המקורי (שבו כתוב "להסרה השיבו הסר"). */
function reply_own_text(string $t): string
{
    $out = [];
    foreach (preg_split('/\r?\n/', $t) as $line) {
        $l = trim(preg_replace('/[\x{200E}\x{200F}\x{202A}-\x{202E}]/u', '', $line));
        if (str_starts_with($l, '>')
            || preg_match('/^(On .+wrote:?|בתאריך .+|ב-.+ (כתב|כתבה|כתב\/ה)|-{2,} ?(Original|Forwarded|הודעה)|From:|מאת:|Sent from|נשלח מ)/iu', $l)
            || str_contains($l, 'להסרה השיבו')) {
            break;
        }
        $out[] = $l;
    }
    return trim(implode("\n", $out));
}

function reply_kind(string $own): string
{
    $t = mb_strtolower($own);
    if (preg_match('/(^|[^\p{L}])(הסר|הסרה|הסירו|תסירו|להסיר|הסירי|תסירי|הורידו|תורידו|remove|unsubscribe|stop)([^\p{L}]|$)/u', $t)
        || preg_match('/לא\s+(רלוונטי|רלבנטי|מעוניין|מעוניינת|מעונין|מעוניינים)|אל\s+(תשלחו|תפנו|תשלחי)|די\s+לשלוח/u', $t)) {
        return 'remove';
    }
    if (preg_match('/(תחזר|חזרו אלי|תחזרי|תתקשר|להתקשר|התקשרי|צלצל|טלפון|שיחה|לדבר|נדבר|מתי נוח|זמינה? ב|זמינים ב|אשמח|מעוניין|מעוניינת|מעונין|פרטים נוספים|יותר פרטים|\d{2,3}-?\d{7})/u', $t)) {
        return 'callback';
    }
    return 'replied';
}

/** קורא תשובות חדשות בתיבה ומעדכן את המערכת. מחזיר שורות ללוג. */
function mail_check_replies(): array
{
    if (!mail_ready()) {
        return [];
    }
    $c = mail_cfg();
    $log = [];
    $im = new Imap($c['user'], $c['pass']);
    try {
        $im->cmd('SELECT INBOX');
        $last = (int) (mail_state_get('imap_last_uid') ?? 0);
        $crit = $last > 0 ? 'UID ' . ($last + 1) . ':*' : 'SINCE ' . date('d-M-Y', time() - 21 * 86400);
        preg_match('/\* SEARCH([\d ]*)/', $im->cmd("UID SEARCH $crit"), $m);
        $uids = array_values(array_filter(array_map('intval', preg_split('/\s+/', trim($m[1] ?? ''))), fn ($u) => $u > $last));
        foreach (array_slice($uids, 0, 40) as $uid) {
            $raw = $im->cmd("UID FETCH $uid (BODY.PEEK[]<0.60000>)"); // PEEK: לא מסמן כנקרא אצל קטי
            $raw = preg_replace('/^\*[^\r\n]*\{\d+\}\r\n/', '', $raw);
            $line = handle_reply_message($raw);
            if ($line !== '') {
                $log[] = $line;
            }
            mail_state_set('imap_last_uid', (string) $uid);
        }
        if (!$uids && $last === 0) {
            preg_match('/UIDNEXT (\d+)/', $im->cmd('STATUS INBOX (UIDNEXT)'), $nm);
            if (!empty($nm[1])) {
                mail_state_set('imap_last_uid', (string) ((int) $nm[1] - 1));
            }
        }
    } finally {
        $im->close();
    }
    return $log;
}

function suppress_everywhere(string $email, string $reason): void
{
    $email = strtolower(trim($email));
    $pdo = db();
    $exists = $pdo->prepare('SELECT 1 FROM suppressions WHERE LOWER(email) = ?');
    $exists->execute([$email]);
    if (!$exists->fetchColumn()) {
        $pdo->prepare('INSERT INTO suppressions (email, reason) VALUES (?, ?)')->execute([$email, $reason]);
    }
    $pdo->prepare("UPDATE leads SET status = 'removed', updated_at = ? WHERE LOWER(email) = ?")->execute([gmdate('Y-m-d H:i:s'), $email]);
}

function handle_reply_message(string $raw): string
{
    [$head] = preg_split("/\r?\n\r?\n/", $raw, 2);
    $head = preg_replace("/\r?\n[ \t]+/", ' ', $head);
    $from = preg_match('/^From:\s*(.+)$/im', $head, $fm) ? mime_header(trim($fm[1])) : '';
    $subject = preg_match('/^Subject:\s*(.+)$/im', $head, $sm) ? mime_header(trim($sm[1])) : '';
    $addr = preg_match('/<([^>]+@[^>]+)>/', $from, $am) ? $am[1] : (preg_match('/[\w.+-]+@[\w.-]+\.\w+/', $from, $am2) ? $am2[0] : '');
    $addr = strtolower($addr);
    $text = mime_text($raw);

    // החזרה (bounce): מסמנים את הנמען שחזר
    if (preg_match('/mailer-daemon|postmaster/i', $addr)) {
        preg_match_all('/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/', $text, $all);
        foreach (array_unique(array_map('strtolower', $all[0])) as $e) {
            $st = db()->prepare("SELECT id, company FROM leads WHERE LOWER(email) = ? AND status = 'sent'");
            $st->execute([$e]);
            foreach ($st->fetchAll() as $l) {
                db()->prepare("UPDATE leads SET status = 'bounced', bounce_reason = ? WHERE id = ?")->execute(['המייל חזר', $l['id']]);
                suppress_everywhere($e, 'bounced');
                log_activity((int) $l['id'], null, 'bounced', "{$l['company']} · $e");
                return "חזר: {$l['company']} ($e)";
            }
        }
        return '';
    }
    if ($addr === '' || $addr === mail_cfg()['user']) {
        return '';
    }
    $st = db()->prepare("SELECT * FROM leads WHERE LOWER(email) = ? ORDER BY id DESC");
    $st->execute([$addr]);
    $leads = $st->fetchAll();
    $own = reply_own_text($text);
    $kind = reply_kind($own . ' ' . $subject);
    // "הסר" מכל אחד — גם ממי שלא במערכת — נכנס לרשימת ההסרה
    if ($kind === 'remove') {
        suppress_everywhere($addr, 'ביקש/ה הסרה');
        foreach ($leads as $l) {
            log_activity((int) $l['id'], null, 'removed', "ביקש/ה הסרה · $addr");
        }
        return "הוסר מכל הרשימות: $addr";
    }
    if (!$leads) {
        return '';
    }
    $l = $leads[0];
    $now = gmdate('Y-m-d H:i:s');
    $note = trim(((string) $l['notes']) . "\n[" . date('d.m') . "] תשובה: " . mb_substr($own, 0, 400));
    $status = $kind === 'callback' ? 'callback' : 'replied';
    db()->prepare('UPDATE leads SET status = ?, replied_at = ?, updated_at = ?, notes = ? WHERE id = ?')
        ->execute([$status, $now, $now, $note, $l['id']]);
    log_activity((int) $l['id'], null, $status === 'callback' ? 'callback_request' : 'replied', "{$l['company']}: " . mb_substr($own, 0, 160));
    if ($status === 'callback') {
        mail_notify("📞 {$l['company']} ביקשו שתחזרי אליהם", "{$l['company']} ({$l['city']}) ענו על ההצעה:\n\n$own\n\nמייל: $addr" . ($l['phone'] ? "\nטלפון: {$l['phone']}" : '') . "\n\nהליד מסומן במערכת \"לחזור אליו\".");
        return "ביקשו לחזור: {$l['company']}";
    }
    mail_notify("✉️ {$l['company']} ענו על ההצעה", "$own\n\nמייל: $addr");
    return "ענו: {$l['company']}";
}
