<?php
/**
 * הטיימר של סוכני הלידים — רץ ברקע בתוך אותו שרת (start.sh) ומפעיל את כל
 * הסוכנים הפעילים פעם בשעה. בלי שירות נוסף ובלי עלות נוספת.
 */
declare(strict_types=1);

require __DIR__ . '/../api/helpers.php';
require __DIR__ . '/../api/hunter.php';

$every = (int) (getenv('HUNT_EVERY_SEC') ?: 3600);
$first = getenv('HUNT_FIRST_DELAY_SEC');
sleep($first === false ? 90 : (int) $first); // לתת לשרת לעלות קודם

while (true) {
    try {
        $agents = db()->query("SELECT * FROM agents WHERE kind = 'hunter' AND active = 1 ORDER BY last_run_at ASC")->fetchAll();
        foreach ($agents as $a) {
            $res = hunt_run_agent($a, microtime(true) + 240);
            fwrite(STDOUT, '[hunter] ' . date('Y-m-d H:i') . " {$a['name']}: $res\n");
        }
        if (!$agents) {
            fwrite(STDOUT, '[hunter] ' . date('Y-m-d H:i') . " אין סוכני לידים פעילים\n");
        }
    } catch (Throwable $e) {
        fwrite(STDOUT, '[hunter] שגיאה: ' . $e->getMessage() . "\n");
    }
    sleep($every);
}
