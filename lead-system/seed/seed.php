<?php
/**
 * Seed the database with the admin user and the real lead data
 * (what was already sent from segevmkg + the 13 that bounced).
 * Run:  php lead-system/seed/seed.php
 * Idempotent: it only seeds when the leads table is empty.
 */

declare(strict_types=1);

require_once __DIR__ . '/../api/db.php';

$pdo = db();
$data = json_decode((string) file_get_contents(__DIR__ . '/seed-data.json'), true);

// --- Admin user ---------------------------------------------------------
$a = $data['admin'];
// In production the password comes from the ADMIN_PASSWORD env var so the
// public login secret is never the value committed to the repo.
$adminPassword = getenv('ADMIN_PASSWORD') ?: $a['password'];
$exists = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$exists->execute([$a['email']]);
if (!$exists->fetch()) {
    $st = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, role, access_code) VALUES (?,?,?,?,?)'
    );
    $st->execute([
        $a['name'],
        $a['email'],
        password_hash($adminPassword, PASSWORD_BCRYPT),
        $a['role'],
        'ADMIN',
    ]);
    echo "admin created: {$a['email']}\n";
} else {
    echo "admin already exists\n";
}

// --- Leads (only on first boot, when the table is empty) ----------------
$count = (int) $pdo->query('SELECT COUNT(*) c FROM leads')->fetch()['c'];
if ($count === 0) {
    $ins = $pdo->prepare(
        'INSERT INTO leads (company, email, sector, status, bounce_reason, sent_at)
         VALUES (:company,:email,:sector,:status,:bounce_reason,:sent_at)'
    );
    $n = 0;
    foreach ($data['leads'] as $l) {
        $ins->execute([
            ':company'       => $l['company'],
            ':email'         => $l['email'] ?? null,
            ':sector'        => $l['sector'] ?? null,
            ':status'        => $l['status'] ?? 'new',
            ':bounce_reason' => $l['bounce_reason'] ?? null,
            ':sent_at'       => $l['sent_at'] ?? null,
        ]);
        $n++;
    }
    echo "seeded $n leads\n";
} else {
    echo "leads already seeded ($count rows) — skipping insert\n";
}

// --- Aviation leads (קטגוריית חברות תעופה) — idempotent by company+contact
// נטענים לבעלות האדמין (קטי) עם איש קשר, תפקיד וקישור לינקדאין. מידע פומבי בלבד.
$avFile = __DIR__ . '/aviation-leads.json';
if (is_file($avFile)) {
    $aviation = json_decode((string) file_get_contents($avFile), true) ?: [];
    $adminRow = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $adminRow->execute([$a['email']]);
    $adminId = (int) ($adminRow->fetch()['id'] ?? 0);

    $exists = $pdo->prepare(
        "SELECT id FROM leads WHERE company = ? AND COALESCE(contact,'') = ?"
    );
    $insAv = $pdo->prepare(
        'INSERT INTO leads (owner_user_id, company, contact, role, linkedin, email, sector, city, website, notes, status)
         VALUES (:owner,:company,:contact,:role,:linkedin,:email,:sector,:city,:website,:notes,:status)'
    );
    $added = 0;
    foreach ($aviation as $l) {
        $company = (string) ($l['company'] ?? '');
        $contact = (string) ($l['contact'] ?? '');
        if ($company === '') continue;
        $exists->execute([$company, $contact]);
        if ($exists->fetch()) continue;
        $insAv->execute([
            ':owner'    => $adminId ?: null,
            ':company'  => $company,
            ':contact'  => $contact ?: null,
            ':role'     => $l['role'] ?? null,
            ':linkedin' => $l['linkedin'] ?? null,
            ':email'    => ($l['email'] ?? '') !== '' ? $l['email'] : null,
            ':sector'   => $l['sector'] ?? 'תעופה',
            ':city'     => $l['city'] ?? null,
            ':website'  => $l['website'] ?? null,
            ':notes'    => $l['notes'] ?? null,
            ':status'   => $l['status'] ?? 'new',
        ]);
        $added++;
    }
    echo "aviation leads: +$added new (" . count($aviation) . " in file)\n";
}

// --- Suppression + cleanup (runs on EVERY boot, idempotent) -------------
// Kety's rule: never contact anyone who bounced, asked to be removed, or
// replied "not relevant". We record them in the suppression list and delete
// them from the active leads so they can never be contacted again.
$suppressFile = __DIR__ . '/suppress-emails.json';
$suppress = is_file($suppressFile)
    ? (json_decode((string) file_get_contents($suppressFile), true) ?: [])
    : [];

$supIns = $pdo->prepare(
    'INSERT INTO suppressions (email, reason) VALUES (?, ?) ON CONFLICT (email) DO NOTHING'
);
foreach ($suppress as $s) {
    $email = strtolower(trim((string) ($s['email'] ?? '')));
    if ($email !== '') {
        $supIns->execute([$email, $s['reason'] ?? null]);
    }
}

// Remove every lead that bounced.
$removedBounced = $pdo->exec("DELETE FROM leads WHERE status = 'bounced'");

// Remove every lead whose address is on the suppression list.
$removedSuppressed = 0;
$del = $pdo->prepare('DELETE FROM leads WHERE lower(email) = ?');
foreach ($pdo->query('SELECT email FROM suppressions')->fetchAll() as $row) {
    $del->execute([strtolower($row['email'])]);
    $removedSuppressed += $del->rowCount();
}

$remaining = (int) $pdo->query('SELECT COUNT(*) c FROM leads')->fetch()['c'];
echo "cleanup: removed {$removedBounced} bounced + {$removedSuppressed} suppressed; {$remaining} active leads remain\n";

// סוכן לידים ראשון — כדי שהמערכת תתחיל לחפש לבד מיד. נוצר פעם אחת בלבד;
// את התוכן, ההצעה, סוגי העסקים והערים קטי משנה מהמסך "חיבורי סוכנים".
$hasHunter = (int) $pdo->query("SELECT COUNT(*) c FROM agents WHERE kind = 'hunter'")->fetch()['c'];
$adminQ = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$adminQ->execute([$a['email']]);
$ownerId = (int) ($adminQ->fetch()['id'] ?? 0);
if (!$hasHunter && $ownerId) {
    $pdo->prepare(
        "INSERT INTO agents (owner_user_id, name, platform, permissions, kind, instructions, subject, offer, targets, area, active, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,1,'connected')"
    )->execute([
        $ownerId, 'סוכן עסקים קטנים', 'סוכן פנימי', 'read_write', 'hunter',
        'לחפש עסקים קטנים מקומיים עם אתר או מייל מפורסם, שיכולים להרוויח מסוכן AI שעונה ללקוחות. לא רשתות גדולות.',
        'סוכן AI שעונה ללקוחות של {שם העסק} 24/7',
        "שלום {שם העסק},\n\nראיתי את העסק שלכם ב{עיר}. אנחנו בונים לעסקים קטנים סוכן AI שעונה ללקוחות בוואטסאפ ובאתר 24/7, קובע תורים ואוסף פניות — גם כשאתם עסוקים.\n\nאשמח להראות לכם הדגמה קצרה — אפשר לכתוב לנו ישר בוואטסאפ: {וואטסאפ}\n\nקטי שגב · Segev MKG · 054-230-6016",
        'חברות ומשרדים, יועצים עסקיים, משרדי פרסום ושיווק, רואי חשבון, סוכני ביטוח, פסיכותרפיסטים, יועצים ומטפלים רגשיים, מטפלים (קליניקה פרטית), רפואה משלימה, פיזיותרפיסטים, קליניקות, קוסמטיקה וטיפוח, צימרים, בתי הארחה, מלונות, חנויות בגדים, חנויות מתנות, תכשיטים',
        'חיפה, קריית מוצקין, קריית ביאליק, קריית אתא, קריית ים, נשר, טירת כרמל',
    ]);
    echo "lead hunter agent created\n";
}

// ההצעה הראשונה עודכנה: תשובות מגיעות לבוט בוואטסאפ 054-230-6016. מעדכנים רק אם לא שונתה ידנית.
$pdo->prepare("UPDATE agents SET offer = ? WHERE kind = 'hunter' AND offer = ?")->execute([
    "שלום {שם העסק},\n\nראיתי את העסק שלכם ב{עיר}. אנחנו בונים לעסקים קטנים סוכן AI שעונה ללקוחות בוואטסאפ ובאתר 24/7, קובע תורים ואוסף פניות — גם כשאתם עסוקים.\n\nאשמח להראות לכם הדגמה קצרה — אפשר לכתוב לנו ישר בוואטסאפ: {וואטסאפ}\n\nקטי שגב · Segev MKG · 054-230-6016",
    "שלום {שם העסק},\n\nראיתי את העסק שלכם ב{עיר}. אנחנו בונים לעסקים קטנים סוכן AI שעונה ללקוחות בוואטסאפ ובאתר 24/7, קובע תורים ואוסף פניות — גם כשאתם עסוקים.\n\nאשמח לשלוח הדגמה קצרה. מתי נוח לדבר?\n\nקטי שגב · Segev MKG",
]);

// עדכון יעדים (בקשת קטי): בלי מוסכים ועבודות כפיים — חברות, יועצים, מטפלים, אירוח וחנויות.
$pdo->prepare("UPDATE agents SET targets = ? WHERE kind = 'hunter' AND targets = ?")->execute([
    'חברות ומשרדים, יועצים עסקיים, משרדי פרסום ושיווק, רואי חשבון, סוכני ביטוח, פסיכותרפיסטים, יועצים ומטפלים רגשיים, מטפלים (קליניקה פרטית), רפואה משלימה, פיזיותרפיסטים, קליניקות, קוסמטיקה וטיפוח, צימרים, בתי הארחה, מלונות, חנויות בגדים, חנויות מתנות, תכשיטים',
    'מספרות, קוסמטיקה וטיפוח, רואי חשבון, עורכי דין, סוכני ביטוח, משרדי תיווך, רופאי שיניים, קליניקות, חדרי כושר וסטודיו, מוסכים',
]);

// סוגי ההצעות של סוכן העסקים הקטנים (בקשת קטי): צוות סוכני AI שבעל העסק מנהל בעצמו.
// מעדכנים רק אם ההצעה עדיין ברירת המחדל הקודמת (טקסט אחד שלא נערך).
$defaultOffers = file_get_contents(__DIR__ . '/default-offers.json');
$pdo->prepare("UPDATE agents SET offer = ?, subject = ? WHERE kind = 'hunter' AND offer NOT LIKE '[%' AND offer LIKE ?")->execute([
    json_encode(json_decode($defaultOffers, true), JSON_UNESCAPED_UNICODE),
    json_decode($defaultOffers, true)[0]['subject'],
    'שלום {שם העסק},%אנחנו בונים לעסקים קטנים סוכן AI%',
]);

// נוסחים חדשים (17.11, קטי: קודם הצגה ופתיח מושך, ומבצע סוף שנה). מחליפים רק אם ההצעות עדיין ברירת המחדל הקודמת.
$prevDefaults = json_decode(file_get_contents(__DIR__ . '/default-offers.prev.json'), true);
$newDefaults = json_decode(file_get_contents(__DIR__ . '/default-offers.json'), true);
foreach ($pdo->query("SELECT id, offer FROM agents WHERE kind = 'hunter'")->fetchAll() as $ag) {
    if (json_decode((string) $ag['offer'], true) == $prevDefaults) {
        $pdo->prepare('UPDATE agents SET offer = ?, subject = ? WHERE id = ?')
            ->execute([json_encode($newDefaults, JSON_UNESCAPED_UNICODE), $newDefaults[0]['subject'], (int) $ag['id']]);
    }
}

// נוסחים בסגנון שקטי אישרה במייל (15.11): פתיח מהאתר, הצגה, "הסוד הקטן", חיסכון בזמן ובכסף, חודש ניסיון.
$prev2 = json_decode(file_get_contents(__DIR__ . '/default-offers.prev2.json'), true);
foreach ($pdo->query("SELECT id, offer FROM agents WHERE kind = 'hunter'")->fetchAll() as $ag) {
    if (json_decode((string) $ag['offer'], true) == $prev2) {
        $pdo->prepare('UPDATE agents SET offer = ?, subject = ? WHERE id = ?')
            ->execute([json_encode($newDefaults, JSON_UNESCAPED_UNICODE), $newDefaults[0]['subject'], (int) $ag['id']]);
    }
}

// הוראת קטי (25.11): כל מייל נגמר ב"זוהי הצעה חד פעמית... השיבו הסר ותוסרו מרשימת התפוצה".
$prev3 = json_decode(file_get_contents(__DIR__ . '/default-offers.prev3.json'), true);
foreach ($pdo->query("SELECT id, offer FROM agents WHERE kind = 'hunter'")->fetchAll() as $ag) {
    if (json_decode((string) $ag['offer'], true) == $prev3) {
        $pdo->prepare('UPDATE agents SET offer = ?, subject = ? WHERE id = ?')
            ->execute([json_encode($newDefaults, JSON_UNESCAPED_UNICODE), $newDefaults[0]['subject'], (int) $ag['id']]);
    }
}
