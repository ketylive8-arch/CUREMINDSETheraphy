<?php
/**
 * Segev MKG · Lead System — configuration
 * ----------------------------------------
 * All settings read from environment variables with safe defaults so the
 * system runs out of the box in development and is production-ready when the
 * real values are supplied (DB, SMTP sending source, app secret).
 */

declare(strict_types=1);

// Load a local .env file if present (simple KEY=VALUE parser, no dependency).
(function (): void {
    $envFile = __DIR__ . '/../.env';
    if (!is_file($envFile)) {
        return;
    }
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v, " \t\"'");
        if (getenv($k) === false) {
            putenv("$k=$v");
            $_ENV[$k] = $v;
        }
    }
})();

if (!function_exists('env')) {
    function env(string $key, ?string $default = null): ?string
    {
        $v = getenv($key);
        return $v === false ? $default : $v;
    }
}

/**
 * Accept a single DATABASE_URL (the form Render/Heroku provide:
 * postgres://user:pass@host:port/dbname) and translate it into the PDO DSN +
 * user + pass the app uses. This lets the Postgres connection be wired with
 * one env var. Explicit DB_DSN/DB_USER/DB_PASS still win if set.
 */
(function (): void {
    $url = getenv('DATABASE_URL');
    if ($url === false || $url === '' || getenv('DB_DSN') !== false) {
        return;
    }
    $p = parse_url($url);
    if (!$p || empty($p['host'])) {
        return;
    }
    $scheme = $p['scheme'] ?? 'postgres';
    if (!in_array($scheme, ['postgres', 'postgresql', 'pgsql'], true)) {
        return;
    }
    $host = $p['host'];
    $port = $p['port'] ?? 5432;
    $dbname = ltrim($p['path'] ?? '', '/');
    // External Render hostnames (…render.com) need SSL; the internal host does not.
    $ssl = str_contains($host, '.') ? ';sslmode=require' : '';
    putenv("DB_DSN=pgsql:host=$host;port=$port;dbname=$dbname$ssl");
    if (isset($p['user'])) {
        putenv('DB_USER=' . urldecode($p['user']));
    }
    if (isset($p['pass'])) {
        putenv('DB_PASS=' . urldecode($p['pass']));
    }
})();

return [
    // Application
    'app_name'    => 'Segev MKG · מערכת לידים',
    'app_secret'  => env('APP_SECRET', 'dev-secret-change-me'),
    'session_ttl' => 60 * 60 * 24 * 7, // 7 days

    // Database — SQLite by default (zero-config). Set DB_DSN for MySQL/Postgres.
    // MySQL example: mysql:host=localhost;dbname=segev_leads;charset=utf8mb4
    'db_dsn'      => env('DB_DSN', 'sqlite:' . realpath(__DIR__ . '/..') . '/data/leads.db'),
    'db_user'     => env('DB_USER', ''),
    'db_pass'     => env('DB_PASS', ''),

    // Sending source (מקור לשליחה) — SMTP. Inactive until credentials are set.
    // For segevmkg@gmail.com: host=smtp.gmail.com port=465 user=segevmkg@gmail.com
    // pass=<Google App Password>. No credentials => the system never sends, it
    // only queues/drafts and says so clearly in the UI.
    'smtp_host'   => env('SMTP_HOST', ''),
    'smtp_port'   => (int) env('SMTP_PORT', '465'),
    'smtp_user'   => env('SMTP_USER', ''),
    'smtp_pass'   => env('SMTP_PASS', ''),
    'smtp_from'   => env('SMTP_FROM', 'segevmkg@gmail.com'),
    'smtp_from_name' => env('SMTP_FROM_NAME', 'Kety Segev'),

    // Daily sending cap (safety for cold outreach from a Gmail account).
    'daily_send_cap' => (int) env('DAILY_SEND_CAP', '30'),

    // Fixed, locked business signature (never altered).
    'signature' => "בברכה,\nKety Segev\nSegev Master Marketing Solution\n054-230-6016\nhttps://bit.ly/m/segevmastermkg",
];
