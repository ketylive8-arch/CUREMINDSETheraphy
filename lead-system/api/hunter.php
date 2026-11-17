<?php
/**
 * סוכן ציד לידים — רץ לבד כל שעה (Render cron → POST /api/hunt/run).
 *
 * מאיפה הלידים: רישומי עסקים ציבוריים של OpenStreetMap (Overpass API) לפי סוג עסק ועיר.
 * מאיפה המייל: רק ממקור מאומת — מהרישום הציבורי של העסק, או מהאתר של העסק עצמו
 * (דף הבית / דף צור קשר). הכתובת שבה נמצא המייל נשמרת בליד. לא ממציאים ולא מנחשים:
 * כשאין מייל מפורסם — הליד נשמר בלי מייל (עם טלפון/אתר אם יש).
 *
 * כל סוכן שייך למנהלת שיצרה אותו, ולכל סוכן הוראות, הצעה, סוגי עסקים ואזורים משלו.
 */

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

/** סוגי עסקים קטנים → תגית ב-OpenStreetMap. */
const HUNT_CATEGORIES = [
    'מספרות'            => ['shop', 'hairdresser'],
    'קוסמטיקה וטיפוח'    => ['shop', 'beauty'],
    'מסעדות'            => ['amenity', 'restaurant'],
    'בתי קפה'           => ['amenity', 'cafe'],
    'מאפיות'            => ['shop', 'bakery'],
    'חנויות בגדים'       => ['shop', 'clothes'],
    'חנויות פרחים'       => ['shop', 'florist'],
    'אופטיקה'           => ['shop', 'optician'],
    'רואי חשבון'         => ['office', 'accountant'],
    'עורכי דין'          => ['office', 'lawyer'],
    'סוכני ביטוח'        => ['office', 'insurance'],
    'משרדי תיווך'        => ['office', 'estate_agent'],
    'רופאי שיניים'       => ['amenity', 'dentist'],
    'קליניקות'           => ['amenity', 'clinic'],
    'וטרינרים'           => ['amenity', 'veterinary'],
    'חדרי כושר וסטודיו'  => ['leisure', 'fitness_centre'],
    'מוסכים'            => ['shop', 'car_repair'],
    'חשמלאים'           => ['craft', 'electrician'],
    'אינסטלטורים'        => ['craft', 'plumber'],
    'מלונות'            => ['tourism', 'hotel'],
    'צימרים ואירוח'      => ['tourism', 'guest_house'],
    'חנויות מחשבים'      => ['shop', 'computer'],
];

const HUNT_MAX_NEW_PER_RUN = 12;   // לידים חדשים לסוכן בכל ריצה
const HUNT_TIME_BUDGET     = 45;   // שניות לכל ריצה (בתוך מגבלת הבקשה)
const HUNT_UA              = 'SegevMKG-LeadAgent/1.0 (+https://segev-mkg-leads.onrender.com)';

/* ------------------------------------------------------------------ HTTP */

/** GET/POST קטן. בבדיקות אפשר להחליף דרך $GLOBALS['HUNT_HTTP']. מחזיר [code, body, finalUrl]. */
function hunt_http(string $url, ?array $post = null, int $timeout = 10): array
{
    if (isset($GLOBALS['HUNT_HTTP']) && is_callable($GLOBALS['HUNT_HTTP'])) {
        return ($GLOBALS['HUNT_HTTP'])($url, $post);
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 4,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_USERAGENT      => HUNT_UA,
        CURLOPT_ENCODING       => '',
        CURLOPT_MAXFILESIZE    => 600000,
    ]);
    if ($post !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
    }
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $final = (string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);
    return [$code, is_string($body) ? substr($body, 0, 600000) : '', $final ?: $url];
}

/* ------------------------------------------------------------ discovery */

/** עסקים מסוג מסוים בעיר מסוימת, מרישומי OpenStreetMap. */
function hunt_find_businesses(string $category, string $city, int $limit = 60): array
{
    [$k, $v] = HUNT_CATEGORIES[$category] ?? [null, null];
    if (!$k) {
        return [];
    }
    $sel = "[\"$k\"=\"$v\"]";
    $area = $city === 'כל הארץ'
        ? 'area["ISO3166-1"="IL"][admin_level=2]->.a;'
        : 'area["name"="' . str_replace('"', '', $city) . '"]["boundary"="administrative"]->.a;';
    $q = "[out:json][timeout:40];$area(nwr{$sel}[\"website\"](area.a);nwr{$sel}[\"contact:website\"](area.a);"
       . "nwr{$sel}[\"email\"](area.a);nwr{$sel}[\"contact:email\"](area.a););out tags center $limit;";
    [$code, $body] = hunt_http('https://overpass-api.de/api/interpreter', ['data' => $q], 50);
    if ($code !== 200) {
        throw new RuntimeException("מאגר העסקים לא ענה ($code)");
    }
    $json = json_decode($body, true);
    $out = [];
    foreach (($json['elements'] ?? []) as $el) {
        $t = $el['tags'] ?? [];
        $name = trim((string) ($t['name:he'] ?? $t['name'] ?? ''));
        if ($name === '') {
            continue;
        }
        $out[] = [
            'name'    => $name,
            'website' => hunt_norm_url((string) ($t['website'] ?? $t['contact:website'] ?? '')),
            'email'   => trim((string) ($t['email'] ?? $t['contact:email'] ?? '')),
            'phone'   => trim((string) ($t['phone'] ?? $t['contact:phone'] ?? '')),
            'osm'     => 'https://www.openstreetmap.org/' . ($el['type'] ?? 'node') . '/' . ($el['id'] ?? 0),
        ];
    }
    return $out;
}

function hunt_norm_url(string $u): string
{
    $u = trim($u);
    if ($u === '') {
        return '';
    }
    if (!preg_match('#^https?://#i', $u)) {
        $u = 'https://' . $u;
    }
    return filter_var($u, FILTER_VALIDATE_URL) ? $u : '';
}

function hunt_host(string $url): string
{
    $h = strtolower((string) parse_url($url, PHP_URL_HOST));
    return preg_replace('/^www\./', '', $h);
}

/* --------------------------------------------------------- email finding */

/** מיילים שמופיעים בפועל בעמוד (mailto וטקסט), אחרי סינון זבל. */
function hunt_emails_in(string $html): array
{
    $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $html = str_ireplace(['[at]', '(at)', ' at '], ['@', '@', '@'], $html);
    preg_match_all('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $html, $m);
    $out = [];
    foreach (array_unique($m[0]) as $e) {
        $e = strtolower(trim($e, '.'));
        if (preg_match('/\.(png|jpe?g|gif|webp|svg|css|js)$/', $e)
            || preg_match('/(example\.|sentry|wixpress|noreply|no-reply|domain\.com|email\.com|yourmail|@2x)/', $e)
            || !filter_var($e, FILTER_VALIDATE_EMAIL)) {
            continue;
        }
        $out[] = $e;
    }
    return array_values(array_unique($out));
}

/** בוחר את המייל הכי שייך לעסק: קודם באותו דומיין כמו האתר, אחר כך תיבה כללית (gmail וכו'). */
function hunt_pick_email(array $emails, string $site): ?string
{
    $host = hunt_host($site);
    foreach ($emails as $e) {
        if ($host && str_ends_with(substr($e, strpos($e, '@') + 1), $host)) {
            return $e;
        }
    }
    foreach ($emails as $e) {
        if (preg_match('/@(gmail|walla|yahoo|hotmail|outlook|012|bezeqint|netvision)\./', $e)) {
            return $e;
        }
    }
    return null; // מייל של דומיין זר (למשל של בונה האתר) — לא לוקחים
}

/** מחפש מייל באתר העסק: דף הבית, ואז עד 2 דפי "צור קשר". מחזיר [email, pageUrl] או [null, null]. */
function hunt_email_from_site(string $site): array
{
    [$code, $html, $final] = hunt_http($site, null, 10);
    if ($code < 200 || $code >= 400 || $html === '') {
        return [null, null];
    }
    $e = hunt_pick_email(hunt_emails_in($html), $final);
    if ($e) {
        return [$e, $final];
    }
    preg_match_all('/href=["\']([^"\']+)["\']/i', $html, $m);
    $links = [];
    foreach ($m[1] as $href) {
        $h = urldecode($href);
        if (preg_match('/(contact|צור|קשר|about|אודות)/iu', $h) && !preg_match('/^(mailto|tel|javascript|#)/i', $h)) {
            $links[] = str_starts_with($h, 'http') ? $h : rtrim($final, '/') . '/' . ltrim($h, '/');
        }
    }
    foreach (array_slice(array_values(array_unique($links)), 0, 2) as $page) {
        if (hunt_host($page) !== hunt_host($final)) {
            continue;
        }
        [$c2, $h2, $f2] = hunt_http($page, null, 8);
        if ($c2 >= 200 && $c2 < 400) {
            $e = hunt_pick_email(hunt_emails_in($h2), $final);
            if ($e) {
                return [$e, $f2];
            }
        }
    }
    return [null, null];
}

/* ----------------------------------------------------------------- offer */

/** ההצעה של הסוכן, מותאמת לעסק: {שם העסק} {תחום} {עיר} {אתר}. */
function hunt_fill(string $tpl, array $lead): string
{
    return strtr($tpl, [
        '{שם העסק}' => $lead['company'], '{תחום}' => $lead['sector'],
        '{עיר}' => $lead['city'], '{אתר}' => $lead['website'] ?: '',
        '{וואטסאפ}' => 'https://wa.me/' . (env('REPLY_WHATSAPP', '972542306016') ?? '972542306016'),
    ]);
}

/* ------------------------------------------------------------------- run */

function hunt_list(?string $csv): array
{
    return array_values(array_filter(array_map('trim', preg_split('/[,\n]+/u', (string) $csv) ?: [])));
}

/** ריצה אחת של סוכן. מחזיר סיכום טקסטואלי. */
function hunt_run_agent(array $agent, float $deadline): string
{
    $pdo = db();
    $cats = array_values(array_filter(hunt_list($agent['targets']), fn ($c) => isset(HUNT_CATEGORIES[$c])));
    $cities = hunt_list($agent['area']) ?: ['חיפה'];
    if (!$cats) {
        return 'לא נבחרו סוגי עסקים';
    }
    $combos = [];
    foreach ($cats as $c) {
        foreach ($cities as $city) {
            $combos[] = [$c, $city];
        }
    }
    $cursor = (int) ($agent['hunt_cursor'] ?? 0);
    $owner = (int) $agent['owner_user_id'];
    $new = 0; $withEmail = 0; $checked = 0; $notes = [];

    for ($i = 0; $i < count($combos) && $new < HUNT_MAX_NEW_PER_RUN && microtime(true) < $deadline; $i++) {
        [$cat, $city] = $combos[($cursor + $i) % count($combos)];
        try {
            $found = hunt_find_businesses($cat, $city);
        } catch (Throwable $e) {
            $notes[] = "$cat/$city: " . $e->getMessage();
            continue;
        }
        foreach ($found as $b) {
            if ($new >= HUNT_MAX_NEW_PER_RUN || microtime(true) >= $deadline) {
                break;
            }
            $host = $b['website'] ? hunt_host($b['website']) : '';
            $dup = $pdo->prepare('SELECT 1 FROM leads WHERE owner_user_id = ? AND (company = ? OR (? <> \'\' AND website LIKE ?)) LIMIT 1');
            $dup->execute([$owner, $b['name'], $host, '%' . $host . '%']);
            if ($dup->fetch()) {
                continue;
            }
            $checked++;
            $email = null; $src = $b['osm']; $how = 'רישום ציבורי (OpenStreetMap)';
            if ($b['email'] && filter_var($b['email'], FILTER_VALIDATE_EMAIL)) {
                $email = strtolower($b['email']);
            } elseif ($b['website']) {
                [$email, $page] = hunt_email_from_site($b['website']);
                if ($email) {
                    $src = $page; $how = 'אתר העסק';
                }
            }
            if ($email) {
                $sup = $pdo->prepare('SELECT 1 FROM suppressions WHERE email = ?');
                $sup->execute([$email]);
                if ($sup->fetch()) {
                    continue; // ביקשו הסרה / חזר בעבר — לא פונים שוב
                }
            }
            $lead = ['company' => $b['name'], 'sector' => $cat, 'city' => $city, 'website' => $b['website']];
            $note = "נמצא ע\"י הסוכן «{$agent['name']}»" . ($email ? " · המייל מ{$how}" : ' · לא נמצא מייל מפורסם');
            $pdo->prepare(
                'INSERT INTO leads (owner_user_id, agent_id, company, email, sector, city, website, source_url, phone, subject, draft, notes, status)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,\'new\')'
            )->execute([
                $owner, (int) $agent['id'], $b['name'], $email, $cat, $city, $b['website'] ?: null, $src,
                $b['phone'] ?: null, hunt_fill((string) ($agent['subject'] ?? ''), $lead) ?: null,
                hunt_fill((string) ($agent['offer'] ?? ''), $lead) ?: null, $note,
            ]);
            log_activity(last_id('leads'), $owner, 'agent_found', "{$agent['name']}: {$b['name']}" . ($email ? " · $email" : ''));
            $new++;
            if ($email) {
                $withEmail++;
            }
        }
    }
    $summary = "נבדקו $checked עסקים · $new לידים חדשים · $withEmail עם מייל מאומת" . ($notes ? ' · ' . implode('; ', array_slice($notes, 0, 2)) : '');
    $pdo->prepare('UPDATE agents SET hunt_cursor = ?, last_run_at = ?, last_action_at = ?, last_result = ?, found_total = COALESCE(found_total,0) + ?, status = ? WHERE id = ?')
        ->execute([($cursor + max(1, $i)) % max(1, count($combos)), date('Y-m-d H:i:s'), date('Y-m-d H:i:s'), $summary, $new, 'connected', (int) $agent['id']]);
    return $summary;
}

/** כל הסוכנים הפעילים. נקרא מה-cron. */
function handle_hunt_run(): void
{
    db(); // טוען את ההגדרות (env)
    $secret = (string) (env('HUNT_SECRET', '') ?? '');
    $given = (string) ($_SERVER['HTTP_X_HUNT_SECRET'] ?? $_GET['secret'] ?? '');
    if ($secret === '' || !hash_equals($secret, $given)) {
        json_err('forbidden', 403);
    }
    @set_time_limit(120);
    $deadline = microtime(true) + HUNT_TIME_BUDGET;
    $agents = db()->query("SELECT * FROM agents WHERE kind = 'hunter' AND active = 1 ORDER BY last_run_at ASC")->fetchAll();
    $out = [];
    foreach ($agents as $a) {
        if (microtime(true) >= $deadline) {
            break;
        }
        $out[] = ['agent' => $a['name'], 'result' => hunt_run_agent($a, $deadline)];
    }
    json_out(['ok' => true, 'ran' => $out]);
}

/** "הרץ עכשיו" מלוח הבקרה. */
function handle_run_agent_now(int $id): void
{
    $u = require_admin();
    $st = db()->prepare("SELECT * FROM agents WHERE id = ? AND owner_user_id = ? AND kind = 'hunter'");
    $st->execute([$id, (int) $u['id']]);
    $a = $st->fetch();
    if (!$a) {
        json_err('סוכן לא נמצא', 404);
    }
    @set_time_limit(120);
    json_out(['ok' => true, 'result' => hunt_run_agent($a, microtime(true) + HUNT_TIME_BUDGET)]);
}

/** עדכון ההגדרות והתוכן של סוכן: מה לעשות, ההצעה, סוגי עסקים, אזורים, פעיל. */
function handle_update_agent(int $id): void
{
    $u = require_admin();
    $in = body();
    $fields = [];
    $args = [];
    foreach (['name', 'instructions', 'offer', 'subject', 'targets', 'area'] as $f) {
        if (array_key_exists($f, $in)) {
            $fields[] = "$f = ?";
            $args[] = trim((string) $in[$f]);
        }
    }
    if (array_key_exists('active', $in)) {
        $fields[] = 'active = ?';
        $args[] = $in['active'] ? 1 : 0;
    }
    if (!$fields) {
        json_err('אין מה לעדכן');
    }
    $args[] = $id;
    $args[] = (int) $u['id'];
    db()->prepare('UPDATE agents SET ' . implode(', ', $fields) . ' WHERE id = ? AND owner_user_id = ?')->execute($args);
    log_activity(null, (int) $u['id'], 'update_agent', (string) $id);
    json_out(['ok' => true]);
}

function handle_hunt_categories(): void
{
    require_admin();
    json_out(['categories' => array_keys(HUNT_CATEGORIES)]);
}
