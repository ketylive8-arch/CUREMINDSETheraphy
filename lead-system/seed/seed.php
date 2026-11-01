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

// --- Suppression + cleanup (runs on EVERY boot, idempotent) -------------
// Kety's rule: never contact anyone who bounced, asked to be removed, or
// replied "not relevant". We record them in the suppression list and delete
// them from the active leads so they can never be contacted again.
$suppressFile = __DIR__ . '/suppress-emails.json';
$suppress = is_file($suppressFile)
    ? (json_decode((string) file_get_contents($suppressFile), true) ?: [])
    : [];

$supIns = $pdo->prepare(
    'INSERT OR IGNORE INTO suppressions (email, reason) VALUES (?, ?)'
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
