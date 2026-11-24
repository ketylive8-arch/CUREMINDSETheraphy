<?php
/**
 * הטיימר של סוכני הלידים — רץ ברקע בתוך אותו שרת (start.sh), בלי שירות נוסף.
 * פעם ביום (20:00 שעון ישראל): קורא תשובות בתיבה (הסר / לחזור / ענו).
 * כל 10 דקות: שולח הצעה אחת מאושרת (בכפוף לתקרה).
 * פעם בשעה: כל הסוכנים הפעילים מחפשים עסקים חדשים.
 */
declare(strict_types=1);

require __DIR__ . '/../api/helpers.php';
require __DIR__ . '/../api/hunter.php';
require __DIR__ . '/../api/mailer.php';

$every = (int) (getenv('HUNT_EVERY_SEC') ?: 3600);
$tick = (int) (getenv('MAIL_TICK_SEC') ?: 600);
function say(string $m): void { fwrite(STDOUT, '[hunter] ' . date('Y-m-d H:i') . " $m\n"); fflush(STDOUT); }
say('הטיימר עלה · מסד נתונים: ' . (str_starts_with((string) getenv('DB_DSN'), 'pgsql') || getenv('DATABASE_URL') ? 'Postgres (קבוע)' : 'SQLite זמני — נמחק בכל עדכון'));
say('תיבת segevmkg: ' . (mail_ready() ? 'מחוברת' : 'לא מחוברת (חסרה סיסמת אפליקציה)') . ' · שליחה: ' . (mail_cfg()['approved'] ? 'מאושרת' : 'ממתינה לאישור של קטי') . ' · תקרה יומית: ' . mail_cfg()['cap']);
$first = getenv('HUNT_FIRST_DELAY_SEC');
sleep($first === false ? 90 : (int) $first); // לתת לשרת לעלות קודם

$lastHunt = 0;
$lastMailDay = '';
// שעת בדיקת התיבה (תשובות/הסרות/החזרות) — פעם ביום, שעון ישראל. ברירת מחדל 20:00.
$mailHour = (int) (getenv('MAIL_CHECK_HOUR') ?: 20);
while (true) {
    // בדיקת התיבה פעם ביום בלבד, מהשעה שנקבעה (ברירת מחדל 20:00 שעון ישראל).
    $nowIl = new DateTime('now', new DateTimeZone('Asia/Jerusalem'));
    $today = $nowIl->format('Y-m-d');
    if ((int) $nowIl->format('G') >= $mailHour && $lastMailDay !== $today) {
        $lastMailDay = $today;
        try {
            foreach (mail_check_replies() as $line) {
                say("תיבה: $line");
            }
        } catch (Throwable $e) {
            say('תיבה: ' . $e->getMessage());
        }
    }
    if (time() - $lastHunt >= $every) {
        $lastHunt = time();
        try {
            $agents = db()->query("SELECT * FROM agents WHERE kind = 'hunter' AND active = 1 ORDER BY last_run_at ASC")->fetchAll();
            foreach ($agents as $a) {
                say("{$a['name']}: מתחיל חיפוש");
                $res = hunt_run_agent($a, microtime(true) + 600);
                say("{$a['name']}: $res");
            }
            if (!$agents) {
                say('אין סוכני לידים פעילים');
            }
        } catch (Throwable $e) {
            say('שגיאה: ' . $e->getMessage());
        }
    }
    try {
        $sent = mail_send_next();
        if ($sent !== '') {
            say($sent);
        }
    } catch (Throwable $e) {
        say('שליחה: ' . $e->getMessage());
    }
    sleep($tick);
}
