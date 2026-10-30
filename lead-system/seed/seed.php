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
$exists = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$exists->execute([$a['email']]);
if (!$exists->fetch()) {
    $st = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, role, access_code) VALUES (?,?,?,?,?)'
    );
    $st->execute([
        $a['name'],
        $a['email'],
        password_hash($a['password'], PASSWORD_BCRYPT),
        $a['role'],
        'ADMIN',
    ]);
    echo "admin created: {$a['email']}\n";
} else {
    echo "admin already exists\n";
}

// --- Leads --------------------------------------------------------------
$count = (int) $pdo->query('SELECT COUNT(*) c FROM leads')->fetch()['c'];
if ($count > 0) {
    echo "leads already seeded ($count rows) — skipping\n";
    exit;
}

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
