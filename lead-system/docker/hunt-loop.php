<?php
/**
 * הטיימר של סוכני הלידים — רץ ברקע בתוך אותו שרת (start.sh) ומפעיל את כל
 * הסוכנים הפעילים פעם בשעה. בלי שירות נוסף ובלי עלות נוספת.
 */
declare(strict_types=1);

require __DIR__ . '/../api/helpers.php';
require __DIR__ . '/../api/hunter.php';

$every = (int) (getenv('HUNT_EVERY_SEC') ?: 3600);
function say(string $m): void { fwrite(STDOUT, '[hunter] ' . date('Y-m-d H:i') . " $m\n"); fflush(STDOUT); }
say('הטיימר עלה · מסד נתונים: ' . (str_starts_with((string) getenv('DB_DSN'), 'pgsql') || getenv('DATABASE_URL') ? 'Postgres (קבוע)' : 'SQLite זמני — נמחק בכל עדכון'));
$first = getenv('HUNT_FIRST_DELAY_SEC');
sleep($first === false ? 90 : (int) $first); // לתת לשרת לעלות קודם

while (true) {
    try {
        $agents = db()->query("SELECT * FROM agents WHERE kind = 'hunter' AND active = 1 ORDER BY last_run_at ASC")->fetchAll();
        foreach ($agents as $a) {
            say("{$a['name']}: מתחיל חיפוש");
            $res = hunt_run_agent($a, microtime(true) + 240);
            say("{$a['name']}: $res");
        }
        if (!$agents) {
            say('אין סוכני לידים פעילים');
        }
    } catch (Throwable $e) {
        say('שגיאה: ' . $e->getMessage());
    }
    sleep($every);
}
