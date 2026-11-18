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
    // חברות, משרדים ונותני שירות
    'חברות ומשרדים'          => ['office', 'company'],
    'יועצים עסקיים'          => ['office', 'consulting'],
    'משרדי פרסום ושיווק'      => ['office', 'advertising_agency'],
    'רואי חשבון'             => ['office', 'accountant'],
    'עורכי דין'              => ['office', 'lawyer'],
    'סוכני ביטוח'            => ['office', 'insurance'],
    'משרדי תיווך'            => ['office', 'estate_agent'],
    // מטפלים מכל הסוגים
    'פסיכותרפיסטים'          => ['healthcare', 'psychotherapist'],
    'יועצים ומטפלים רגשיים'   => ['healthcare', 'counselling'],
    'מטפלים (קליניקה פרטית)'  => ['office', 'therapist'],
    'רפואה משלימה'           => ['healthcare', 'alternative'],
    'פיזיותרפיסטים'          => ['healthcare', 'physiotherapist'],
    'קלינאי תקשורת'          => ['healthcare', 'speech_therapist'],
    'מרפאים בעיסוק'          => ['healthcare', 'occupational_therapist'],
    'קליניקות'               => ['amenity', 'clinic'],
    'רופאי שיניים'           => ['amenity', 'dentist'],
    'קוסמטיקה וטיפוח'         => ['shop', 'beauty'],
    'מספרות'                 => ['shop', 'hairdresser'],
    'חדרי כושר וסטודיו'       => ['leisure', 'fitness_centre'],
    // אירוח
    'צימרים'                 => ['tourism', 'chalet'],
    'בתי הארחה'              => ['tourism', 'guest_house'],
    'מלונות'                 => ['tourism', 'hotel'],
    // חנויות
    'חנויות בגדים'            => ['shop', 'clothes'],
    'חנויות מתנות'            => ['shop', 'gift'],
    'תכשיטים'                => ['shop', 'jewelry'],
    'חנויות פרחים'            => ['shop', 'florist'],
    'אופטיקה'                => ['shop', 'optician'],
    'מסעדות'                 => ['amenity', 'restaurant'],
    'בתי קפה'                => ['amenity', 'cafe'],
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
        CURLOPT_IPRESOLVE      => CURL_IPRESOLVE_V4,
    ]);
    if ($post !== null) {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
    }
    $body = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $final = (string) curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $err = curl_error($ch);
    curl_close($ch);
    if ($code === 0 && $err !== '') {
        $GLOBALS['HUNT_LAST_ERR'] = substr($err, 0, 120);
    }
    return [$code, is_string($body) ? substr($body, 0, 600000) : '', $final ?: $url];
}

/* ------------------------------------------------------------ discovery */

/** מסגרת גאוגרפית לערים נפוצות (דרום, מערב, צפון, מזרח) — שאילתה קלה ומהירה במקום חיפוש לפי שם. */
const HUNT_CITY_BBOX = [
    'חיפה'          => [32.74, 34.95, 32.84, 35.07],
    'קריית מוצקין'  => [32.825, 35.065, 32.85, 35.095],
    'קריית ביאליק'  => [32.82, 35.07, 32.85, 35.11],
    'קריית אתא'     => [32.78, 35.08, 32.82, 35.13],
    'קריית ים'      => [32.84, 35.06, 32.86, 35.085],
    'נשר'           => [32.75, 35.02, 32.78, 35.06],
    'טירת כרמל'     => [32.745, 34.95, 32.775, 34.985],
    'עכו'           => [32.90, 35.06, 32.94, 35.10],
    'נהריה'         => [32.99, 35.08, 33.03, 35.12],
    'תל אביב'       => [32.03, 34.74, 32.15, 34.85],
    'ירושלים'       => [31.72, 35.13, 31.85, 35.26],
    'באר שבע'       => [31.21, 34.74, 31.29, 34.84],
    'ראשון לציון'   => [31.94, 34.73, 32.01, 34.83],
    'נתניה'         => [32.27, 34.83, 32.36, 34.90],
    'פתח תקווה'     => [32.06, 34.85, 32.12, 34.92],
];

/** שרתי Overpass ציבוריים — אם אחד עמוס, עוברים לבא. */
const HUNT_OVERPASS = [
    // מראות של אותו מאגר; הראשי חוסם לפעמים את כתובות השרת (תור ארוך לכל כתובת)
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.osm.jp/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
];

/** עסקים מסוג מסוים בעיר מסוימת, מרישומי OpenStreetMap. */
function hunt_find_businesses(string $category, string $city, int $limit = 60): array
{
    [$k, $v] = HUNT_CATEGORIES[$category] ?? [null, null];
    if (!$k) {
        return [];
    }
    $sel = "[\"$k\"=\"$v\"]";
    if (isset(HUNT_CITY_BBOX[$city])) {
        $scope = '(' . implode(',', HUNT_CITY_BBOX[$city]) . ')';
        $q = "[out:json][timeout:50];(nwr{$sel}[\"website\"]$scope;nwr{$sel}[\"contact:website\"]$scope;"
           . "nwr{$sel}[\"email\"]$scope;nwr{$sel}[\"contact:email\"]$scope;);out tags center $limit;";
    } else {
        $area = $city === 'כל הארץ'
            ? 'area["ISO3166-1"="IL"][admin_level=2]->.a;'
            : 'area["name"="' . str_replace('"', '', $city) . '"]["boundary"="administrative"]->.a;';
        $q = "[out:json][timeout:40];$area(nwr{$sel}[\"website\"](area.a);nwr{$sel}[\"contact:website\"](area.a);"
           . "nwr{$sel}[\"email\"](area.a);nwr{$sel}[\"contact:email\"](area.a););out tags center $limit;";
    }
    $last = 0;
    $json = null;
    static $good = null;
    $servers = $good ? array_values(array_unique(array_merge([$good], HUNT_OVERPASS))) : HUNT_OVERPASS;
    foreach ($servers as $server) {
        // GET (כמו דפדפן) — חלק מהשרתים מעדיפים את זה על POST
        // השרתים הציבוריים עמוסים: תשובה לוקחת לפעמים 30–50 שניות, אז מחכים מספיק
        [$code, $body] = hunt_http($server . '?data=' . rawurlencode($q), null, 35);
        $last = $code;
        if ($code === 200 && is_array($json = json_decode($body, true))) {
            $good = $server;
            break;
        }
        $json = null;
    }
    if ($json === null) {
        // גיבוי: מנוע החיפוש של OpenStreetMap (Nominatim) — אותו מאגר ציבורי, ממשק אחר
        $alt = hunt_find_nominatim($k, $v, $city);
        if ($alt !== null) {
            return $alt;
        }
        throw new RuntimeException('מאגר העסקים לא ענה (גיבוי: ' . ($GLOBALS['HUNT_NOMI_CODE'] ?? '-') . "; ראשי: $last" . (!empty($GLOBALS['HUNT_LAST_ERR']) ? ': ' . $GLOBALS['HUNT_LAST_ERR'] : '') . ')');
    }
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

/** גיבוי: Nominatim (חיפוש OpenStreetMap) עם הפרטים הנוספים של כל עסק (אתר, מייל, טלפון). */
function hunt_find_nominatim(string $k, string $v, string $city): ?array
{
    $bb = HUNT_CITY_BBOX[$city] ?? null;
    $qs = ['q' => str_replace('_', ' ', $v), 'format' => 'jsonv2', 'extratags' => 1, 'limit' => 50, 'accept-language' => 'he'];
    if ($bb) {
        $qs['viewbox'] = "{$bb[1]},{$bb[2]},{$bb[3]},{$bb[0]}";
        $qs['bounded'] = 1;
    } else {
        $qs['q'] .= ' ' . $city;
        $qs['countrycodes'] = 'il';
    }
    [$code, $body] = hunt_http('https://nominatim.openstreetmap.org/search?' . http_build_query($qs), null, 25);
    $GLOBALS['HUNT_NOMI_CODE'] = $code;
    $rows = $code === 200 ? json_decode($body, true) : null;
    if (!is_array($rows)) {
        return null;
    }
    $out = [];
    foreach ($rows as $r) {
        if (($r['category'] ?? '') !== $k || ($r['type'] ?? '') !== $v) {
            continue; // רק עסקים מהסוג המבוקש
        }
        $t = $r['extratags'] ?? [];
        $name = trim((string) ($r['name'] ?? ''));
        $site = hunt_norm_url((string) ($t['website'] ?? $t['contact:website'] ?? ''));
        $mail = trim((string) ($t['email'] ?? $t['contact:email'] ?? ''));
        if ($name === '' || ($site === '' && $mail === '')) {
            continue;
        }
        $out[] = [
            'name' => $name, 'website' => $site, 'email' => $mail,
            'phone' => trim((string) ($t['phone'] ?? $t['contact:phone'] ?? '')),
            'osm' => 'https://www.openstreetmap.org/' . ($r['osm_type'] ?? 'node') . '/' . ($r['osm_id'] ?? 0),
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

/* ------------------------------------------------- חיפוש ברשת (כל האינטרנט) */

/** אתרים שאינם אתר של עסק: רשתות חברתיות, אינדקסים, חדשות, ממשלה. מהם לוקחים רק מייל שמופיע בתוצאה עצמה. */
const HUNT_NOT_BUSINESS_SITE = '/(facebook|instagram|linkedin|tiktok|youtube|twitter|x\.com|wikipedia|google|b144|d\.co\.il|zap\.co\.il|easy\.co\.il|midrag|rest\.co\.il|ynet|mako|walla\.co\.il|haaretz|maariv|calcalist|themarker|bizportal|globes|gov\.il|ac\.il|muni\.il|kolzchut|booking\.com|tripadvisor|airbnb|zimmer|tzimer|wix\.com|bing\.com|duckduckgo|yad2|waze|moovit|doctorsil|infomed|hamakor)/i';

/** תוצאות חיפוש (כותרת, קישור, תקציר) — DuckDuckGo, ואם לא ענה אז Bing. */
function hunt_search(string $q): array
{
    $out = [];
    [$code, $html] = hunt_http('https://html.duckduckgo.com/html/', ['q' => $q, 'kl' => 'il-he'], 15);
    if ($code === 200 && preg_match_all('~<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?class="result__snippet"[^>]*>(.*?)</(?:a|div)>~s', $html, $m, PREG_SET_ORDER)) {
        foreach ($m as $r) {
            $u = html_entity_decode($r[1]);
            if (preg_match('~[?&]uddg=([^&]+)~', $u, $um)) {
                $u = urldecode($um[1]);
            }
            $out[] = ['url' => $u, 'title' => hunt_clean($r[2]), 'snippet' => hunt_clean($r[3])];
        }
    }
    if (!$out) {
        [$code, $html] = hunt_http('https://www.bing.com/search?' . http_build_query(['q' => $q, 'cc' => 'IL', 'setlang' => 'he', 'count' => 30]), null, 15);
        if ($code === 200 && preg_match_all('~<li class="b_algo".*?<h2[^>]*><a[^>]+href="([^"]+)"[^>]*>(.*?)</a>.*?<p[^>]*>(.*?)</p>~s', $html, $m, PREG_SET_ORDER)) {
            foreach ($m as $r) {
                $out[] = ['url' => html_entity_decode($r[1]), 'title' => hunt_clean($r[2]), 'snippet' => hunt_clean($r[3])];
            }
        }
    }
    $GLOBALS['HUNT_SEARCH_CODE'] = $code;
    return $out;
}

/** ניקוי רווחים בטוח: אתר עם קידוד שבור לא מפיל את הריצה. */
function hunt_squash(?string $t): string
{
    $t = (string) $t;
    if (!mb_check_encoding($t, 'UTF-8')) {
        $t = mb_convert_encoding($t, 'UTF-8', 'UTF-8, Windows-1255, ISO-8859-8');
    }
    return trim((string) preg_replace('/\s+/u', ' ', $t));
}

function hunt_clean(string $h): string
{
    return hunt_squash(html_entity_decode(strip_tags($h), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
}

/** שם העסק מתוך כותרת התוצאה: החלק הראשון לפני | / - / – / · */
function hunt_title_name(string $title, string $host): string
{
    $parts = array_values(array_filter(array_map('trim', preg_split('/\s[|\-–·:]\s|\s\|\s?/u', $title))));
    $n = $parts[0] ?? '';
    if ($n === '' || mb_strlen($n) > 45) {
        $n = $host;
    }
    return $n;
}

/** עסקים מסוג מסוים בעיר, מחיפוש ברשת: אתרי עסקים, ומיילים שמופיעים בתוצאות (כולל רשתות חברתיות ואינדקסים). */
function hunt_find_web(string $category, string $city): array
{
    $queries = [
        "$category ב$city צור קשר",
        "\"$category\" \"$city\" \"@gmail.com\" OR \"@walla.co.il\" OR \"@hotmail.com\"",
    ];
    $out = [];
    $seen = [];
    $raw = 0;
    foreach ($queries as $q) {
        $res = hunt_search($q);
        $raw += count($res);
        foreach ($res as $r) {
            $url = hunt_norm_url($r['url']);
            if ($url === '') {
                continue;
            }
            $host = hunt_host($url);
            $isSite = !preg_match(HUNT_NOT_BUSINESS_SITE, $host);
            $emails = hunt_emails_in($r['title'] . ' ' . $r['snippet']);
            $email = $isSite ? hunt_pick_email($emails, $url) : (array_values(array_filter($emails, fn ($e) => preg_match('/@(gmail|walla|yahoo|hotmail|outlook|012|bezeqint|netvision)\./', $e) || !preg_match(HUNT_NOT_BUSINESS_SITE, $e)))[0] ?? null);
            if (!$isSite && !$email) {
                continue; // עמוד ברשת חברתית / אינדקס בלי מייל גלוי — אין מה לקחת
            }
            $key = $isSite ? $host : $email;
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = 1;
            preg_match('/0(?:[23489]|5\d|7\d)-?\d{7}/', $r['snippet'], $pm);
            $out[] = [
                'name'    => hunt_title_name($r['title'], $host),
                'website' => $isSite ? (parse_url($url, PHP_URL_SCHEME) . '://' . parse_url($url, PHP_URL_HOST)) : '',
                'email'   => $email ?: '',
                'phone'   => $pm[0] ?? '',
                'osm'     => $url,
                'how'     => $email ? 'תוצאת חיפוש ברשת (' . $host . ')' : '',
            ];
        }
    }
    if ($raw === 0) {
        throw new RuntimeException('מנוע החיפוש לא החזיר תוצאות (קוד ' . ($GLOBALS['HUNT_SEARCH_CODE'] ?? 0) . ')');
    }
    return $out;
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

/** מה צוות סוכני AI יעשה אצל כל סוג עסק — נכנס להצעה במקום {הצוות} ו-{הכאב}. */
const HUNT_ANGLES = [
    'therapy' => [
        'pain' => 'פניות של מטופלים מגיעות בערב ובלילה, באמצע טיפול, וחלק מהן הולכות לאיבוד',
        'team' => "• סוכנת קבלה שעונה לפניות בחום 24/7 ומבינה מה הפונה צריך\n• סוכן תורים שקובע, מזכיר ומפחית ביטולים\n• סוכן מעקב ששולח תזכורת עדינה למי שהתעניין ולא קבע",
    ],
    'lodging' => [
        'pain' => 'אורחים שואלים על זמינות ומחירים בכל שעה, ומי שלא מקבל תשובה מהר מזמין במקום אחר',
        'team' => "• סוכן הזמנות שעונה על זמינות, מחירים ושאלות 24/7\n• סוכן שמכין את האורח לפני ההגעה (הגעה, חניה, צ'ק-אין)\n• סוכן שמבקש ביקורת אחרי השהייה ומחזיר אורחים לעונה הבאה",
    ],
    'office' => [
        'pain' => 'לידים שנכנסים לא מקבלים מענה מהיר, והפולואפים נשכחים בין כל המשימות',
        'team' => "• סוכן שעונה לכל ליד תוך דקה ומבין את הצורך\n• סוכן שמכין טיוטת הצעת מחיר או סיכום פגישה\n• סוכן פולואפ שמזכיר ללקוח ולכם מה הצעד הבא",
    ],
    'professional' => [
        'pain' => 'אותן שאלות חוזרות כל יום, ואיסוף מסמכים ומועדים מלקוחות לוקח המון זמן',
        'team' => "• סוכן שעונה לשאלות הנפוצות של הלקוחות בשמך\n• סוכן שאוסף מסמכים ופרטים מלקוחות לפני שהם מגיעים אליך\n• סוכן שמזכיר מועדים ותשלומים",
    ],
    'beauty' => [
        'pain' => 'קביעת תורים בוואטסאפ גוזלת זמן באמצע עבודה, ולקוחות ותיקים לא חוזרים מעצמם',
        'team' => "• סוכן תורים שקובע ומזכיר לבד\n• סוכן שמחזיר לקוחות ותיקים עם הודעה אישית בזמן הנכון\n• סוכן שעונה על מחירים, טיפולים ושעות 24/7",
    ],
    'shop' => [
        'pain' => 'לקוחות שואלים על מלאי, מחירים ושעות פתיחה, ומחכים לתשובה',
        'team' => "• סוכן שעונה על מלאי, מחירים ושעות 24/7\n• סוכן שאוסף הזמנות ומעביר אליך מסודר\n• סוכן ששולח מבצעים ועדכונים ללקוחות קבועים",
    ],
    'food' => [
        'pain' => 'הזמנות שולחנות ושאלות על התפריט מגיעות בשעות הכי עמוסות',
        'team' => "• סוכן שמזמין שולחנות ועונה על תפריט ושעות\n• סוכן שאוסף הזמנות לאירועים\n• סוכן שמבקש ביקורת ומחזיר לקוחות",
    ],
];

const HUNT_CAT_ANGLE = [
    'פסיכותרפיסטים' => 'therapy', 'יועצים ומטפלים רגשיים' => 'therapy', 'מטפלים (קליניקה פרטית)' => 'therapy',
    'רפואה משלימה' => 'therapy', 'פיזיותרפיסטים' => 'therapy', 'קלינאי תקשורת' => 'therapy', 'מרפאים בעיסוק' => 'therapy',
    'קליניקות' => 'therapy', 'רופאי שיניים' => 'therapy',
    'צימרים' => 'lodging', 'בתי הארחה' => 'lodging', 'מלונות' => 'lodging',
    'חברות ומשרדים' => 'office', 'יועצים עסקיים' => 'office', 'משרדי פרסום ושיווק' => 'office', 'משרדי תיווך' => 'office',
    'רואי חשבון' => 'professional', 'עורכי דין' => 'professional', 'סוכני ביטוח' => 'professional',
    'קוסמטיקה וטיפוח' => 'beauty', 'מספרות' => 'beauty', 'חדרי כושר וסטודיו' => 'beauty',
    'חנויות בגדים' => 'shop', 'חנויות מתנות' => 'shop', 'תכשיטים' => 'shop', 'חנויות פרחים' => 'shop', 'אופטיקה' => 'shop',
    'מסעדות' => 'food', 'בתי קפה' => 'food',
];

/** ההצעה של הסוכן, מותאמת לעסק: {שם העסק} {תחום} {עיר} {אתר} {וואטסאפ} {הכאב} {הצוות}. */
function hunt_fill(string $tpl, array $lead): string
{
    $angle = HUNT_ANGLES[HUNT_CAT_ANGLE[$lead['sector']] ?? 'office'];
    return strtr($tpl, [
        '{שם העסק}' => $lead['company'], '{תחום}' => $lead['sector'],
        '{עיר}' => $lead['city'], '{אתר}' => $lead['website'] ?: '',
        '{וואטסאפ}' => 'https://wa.me/' . ((getenv('REPLY_WHATSAPP') ?: '') ?: '972542306016'),
        '{הכאב}' => $angle['pain'], '{הצוות}' => $angle['team'],
        '{מהאתר}' => !empty($lead['about']) ? "ראיתי באתר שלכם: \u{201C}{$lead['about']}\u{201D}" : '',
    ]);
}

/** אחרי המילוי: שורות ריקות כפולות (למשל כשאין משפט מהאתר) מצטמצמות. */
function hunt_tidy(string $t): string
{
    return trim((string) preg_replace("/\n{3,}/", "\n\n", $t));
}

/** משפט אחד אמיתי מהאתר של העסק: תיאור האתר (meta description), אם הוא קצר ובעברית. */
function hunt_site_about(string $site): string
{
    if ($site === '') {
        return '';
    }
    [$code, $html] = hunt_http($site, null, 8);
    if ($code < 200 || $code >= 400) {
        return '';
    }
    if (!preg_match('/<meta[^>]+(?:name|property)=["\'](?:og:)?description["\'][^>]*content=["\']([^"\']{20,220})["\']/iu', $html, $m)
        && !preg_match('/<meta[^>]+content=["\']([^"\']{20,220})["\'][^>]*(?:name|property)=["\'](?:og:)?description["\']/iu', $html, $m)) {
        return '';
    }
    $d = hunt_squash(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    // רק תיאור בעברית, בלי כתובות ומספרי טלפון
    if (!preg_match('/\p{Hebrew}{3,}/u', $d) || preg_match('/(https?:|www\.|\d{3}-?\d{7})/u', $d)) {
        return '';
    }
    $d = rtrim($d, ' .|-–');
    return mb_strlen($d) > 160 ? rtrim(mb_substr($d, 0, 157)) . '…' : $d;
}

/**
 * סוגי ההצעות של הסוכן. נשמר כ-JSON: [{name, types[], subject, text}]. הצעה ישנה (טקסט אחד)
 * נקראת כהצעה אחת לכל סוגי העסקים.
 */
function hunt_offers(array $agent): array
{
    $raw = (string) ($agent['offer'] ?? '');
    $j = json_decode($raw, true);
    if (is_array($j) && $j && isset($j[0]['text'])) {
        return array_values(array_filter($j, fn ($o) => trim((string) ($o['text'] ?? '')) !== ''));
    }
    return $raw === '' ? [] : [['name' => 'הצעה', 'types' => [], 'subject' => (string) ($agent['subject'] ?? ''), 'text' => $raw]];
}

/** ההצעה שהכי מתאימה לסוג העסק: קודם הצעה שסומנה לסוג הזה, אחר כך הצעה כללית. */
function hunt_pick_offer(array $offers, string $cat): ?array
{
    foreach ($offers as $o) {
        if (in_array($cat, (array) ($o['types'] ?? []), true)) {
            return $o;
        }
    }
    foreach ($offers as $o) {
        if (empty($o['types'])) {
            return $o;
        }
    }
    return $offers[0] ?? null;
}

/**
 * כשיש מפתח Claude בשרת (ANTHROPIC_API_KEY) — מתאים את ההצעה לעסק הספציפי לפי מה שכתוב באתר שלו.
 * בלי מפתח — ההצעה המותאמת לפי סוג העסק נשארת כמו שהיא.
 */
function hunt_ai_personalize(string $text, array $lead, string $siteText): string
{
    $key = (string) (env('ANTHROPIC_API_KEY', '') ?? '');
    if ($key === '' || $siteText === '') {
        return $text;
    }
    $prompt = "זו הצעה שקטי שגב (Segev MKG) שולחת לבעל עסק קטן. התאימי אותה לעסק הזה בלבד, בעברית, בלי להמציא עובדות.\n"
        . "מותר להוסיף משפט אחד שמראה שקראנו את האתר שלהם (רק דבר שכתוב בו). שמרי על המבנה, הקישורים והחתימה. עד 140 מילים.\n"
        . "מחזירים רק את נוסח ההודעה.\n\nהעסק: {$lead['company']} · {$lead['sector']} · {$lead['city']}\n"
        . "מהאתר שלהם:\n" . mb_substr($siteText, 0, 1500) . "\n\nההצעה:\n$text";
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => ['content-type: application/json', 'x-api-key: ' . $key, 'anthropic-version: 2023-06-01'],
        CURLOPT_POSTFIELDS => json_encode(['model' => env('HUNT_MODEL', 'claude-sonnet-4-6'), 'max_tokens' => 700,
            'messages' => [['role' => 'user', 'content' => $prompt]]], JSON_UNESCAPED_UNICODE),
    ]);
    $res = json_decode((string) curl_exec($ch), true);
    curl_close($ch);
    $out = trim((string) ($res['content'][0]['text'] ?? ''));
    return $out !== '' ? $out : $text;
}

/** טקסט קריא מדף הבית (כותרת, תיאור, פסקאות ראשונות) — לצורך ההתאמה האישית. */
function hunt_site_text(string $site): string
{
    if ($site === '') {
        return '';
    }
    [$code, $html] = hunt_http($site, null, 8);
    if ($code < 200 || $code >= 400) {
        return '';
    }
    $html = (string) preg_replace('#<(script|style|noscript)[^>]*>.*?</\1>#si', ' ', (string) $html);
    $text = hunt_squash(html_entity_decode(strip_tags((string) $html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    return mb_substr($text, 0, 2000);
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
        // מקור 1: מאגר העסקים הציבורי (OpenStreetMap). אם לא ענה פעם אחת בריצה — לא מחכים לו שוב.
        $found = [];
        if (empty($osmDown)) {
            try {
                $found = hunt_find_businesses($cat, $city);
            } catch (Throwable $e) {
                $osmDown = true;
                $notes[] = "מאגר: " . $e->getMessage();
            }
        }
        // מקור 2: חיפוש בכל הרשת — אתרי עסקים, רשתות חברתיות ואינדקסים (רק מייל שמופיע בפועל)
        if (microtime(true) < $deadline - 30) {
            try {
                $found = array_merge($found, hunt_find_web($cat, $city));
            } catch (Throwable $e) {
                $notes[] = "חיפוש ברשת: " . $e->getMessage();
            }
        }
        foreach ($found as $b) {
            if ($new >= HUNT_MAX_NEW_PER_RUN || microtime(true) >= $deadline) {
                break;
            }
            try { // עסק אחד בעייתי לא עוצר את כל הריצה
            $host = $b['website'] ? hunt_host($b['website']) : '';
            $dup = $pdo->prepare('SELECT 1 FROM leads WHERE owner_user_id = ? AND (company = ? OR (? <> \'\' AND website LIKE ?)) LIMIT 1');
            $dup->execute([$owner, $b['name'], $host, '%' . $host . '%']);
            if ($dup->fetch()) {
                continue;
            }
            $checked++;
            $email = null; $src = $b['osm']; $how = ($b['how'] ?? '') ?: 'רישום ציבורי (OpenStreetMap)';
            if ($b['email'] && filter_var($b['email'], FILTER_VALIDATE_EMAIL)) {
                $email = strtolower($b['email']);
            } elseif ($b['website']) {
                [$email, $page] = hunt_email_from_site($b['website']);
                if ($email) {
                    $src = $page; $how = 'אתר העסק';
                }
            }
            if ($email) {
                $sup = $pdo->prepare('SELECT 1 FROM suppressions WHERE LOWER(email) = ?');
                $sup->execute([$email]);
                if ($sup->fetch()) {
                    continue; // ביקשו הסרה / חזר בעבר — לא פונים שוב
                }
            }
            $lead = ['company' => $b['name'], 'sector' => $cat, 'city' => $city, 'website' => $b['website'],
                     'about' => $email && $b['website'] && microtime(true) < $deadline - 15 ? hunt_site_about((string) $b['website']) : ''];
            // ההצעה: הסוג שהכי מתאים לעסק, מותאם לתחום ולשם העסק (ולאתר שלו, אם יש מפתח Claude)
            $offer = hunt_pick_offer(hunt_offers($agent), $cat);
            $subject = $offer ? hunt_tidy(hunt_fill((string) ($offer['subject'] ?? ''), $lead)) : '';
            $draft = $offer ? hunt_tidy(hunt_fill((string) $offer['text'], $lead)) : '';
            if ($draft !== '' && $email && microtime(true) < $deadline - 20) {
                $draft = hunt_ai_personalize($draft, $lead, hunt_site_text((string) $b['website']));
            }

            $note = "נמצא ע\"י הסוכן «{$agent['name']}»" . ($email ? " · המייל מ{$how}" : ' · לא נמצא מייל מפורסם');
            if ($offer && !empty($offer['name'])) {
                $note .= " · הצעה: {$offer['name']}";
            }
            $pdo->prepare(
                'INSERT INTO leads (owner_user_id, agent_id, company, email, sector, city, website, source_url, phone, subject, draft, notes, status)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,\'new\')'
            )->execute([
                $owner, (int) $agent['id'], $b['name'], $email, $cat, $city, $b['website'] ?: null, $src,
                $b['phone'] ?: null, $subject ?: null, $draft ?: null, $note,
            ]);
            log_activity(last_id('leads'), $owner, 'agent_found', "{$agent['name']}: {$b['name']}" . ($email ? " · $email" : ''));
            $new++;
            if ($email) {
                $withEmail++;
            }
            } catch (Throwable $e) {
                $notes[] = ($b['name'] ?? '?') . ': ' . $e->getMessage();
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

/**
 * דוח יומי לצוות הסוכנים (מרכז הפיקוד קורא אותו): מה הסוכנים מצאו ב-24 השעות האחרונות.
 * GET /api/hunt/report?key=… — מפתח קריאה בלבד, נגזר מ-HUNT_SECRET (לא מאפשר להריץ או לשנות).
 */
function hunt_report_key(): string
{
    db();
    return substr(hash('sha256', (string) env('HUNT_SECRET', '') . '|report'), 0, 24);
}

function handle_hunt_report(): void
{
    if ((string) env('HUNT_SECRET', '') === '' || !hash_equals(hunt_report_key(), (string) ($_GET['key'] ?? ''))) {
        json_err('forbidden', 403);
    }
    $pdo = db();
    $since = date('Y-m-d H:i:s', time() - 86400);
    $lines = ['דוח סוכני הלידים · ' . date('d.m.Y H:i'), ''];
    foreach ($pdo->query("SELECT * FROM agents WHERE kind = 'hunter' ORDER BY id")->fetchAll() as $a) {
        $st = $pdo->prepare('SELECT company, email, phone, sector, city, source_url FROM leads WHERE agent_id = ? AND created_at >= ? ORDER BY id DESC');
        $st->execute([(int) $a['id'], $since]);
        $rows = $st->fetchAll();
        $withEmail = count(array_filter($rows, fn ($r) => !empty($r['email'])));
        $lines[] = "סוכן: {$a['name']} · " . ((int) $a['active'] ? 'פעיל' : 'מושהה');
        $lines[] = 'ריצה אחרונה: ' . ($a['last_run_at'] ?: 'עוד לא רץ') . ' · ' . ($a['last_result'] ?: '');
        $lines[] = '24 שעות אחרונות: ' . count($rows) . " לידים חדשים, $withEmail עם מייל מאומת.";
        foreach (array_slice($rows, 0, 40) as $r) {
            $lines[] = "- {$r['company']} · {$r['sector']} · {$r['city']} · " . ($r['email'] ?: 'אין מייל מפורסם') . ($r['phone'] ? " · {$r['phone']}" : '') . " · מקור: {$r['source_url']}";
        }
        $lines[] = '';
    }
    header('Content-Type: text/plain; charset=utf-8');
    echo implode("\n", $lines);
    exit;
}
