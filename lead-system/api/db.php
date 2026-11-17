<?php
/**
 * Database connection + schema migration (PDO).
 * Works on SQLite (default) and MySQL/Postgres (set DB_DSN).
 */

declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $cfg = require __DIR__ . '/config.php';
    $pdo = new PDO($cfg['db_dsn'], $cfg['db_user'] ?: null, $cfg['db_pass'] ?: null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    if (str_starts_with($cfg['db_dsn'], 'sqlite:')) {
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');
    }
    migrate($pdo);
    return $pdo;
}

/** Which PDO driver is active: 'sqlite' or 'pgsql'. */
function db_driver(): string
{
    return db()->getAttribute(PDO::ATTR_DRIVER_NAME);
}

/**
 * Last inserted id — portable across SQLite and Postgres.
 * Postgres needs the sequence name ("<table>_id_seq", created by BIGSERIAL).
 */
function last_id(string $table): int
{
    $pdo = db();
    if ($pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql') {
        return (int) $pdo->lastInsertId($table . '_id_seq');
    }
    return (int) $pdo->lastInsertId();
}

/** Create tables if they do not exist. Portable SQL (SQLite + Postgres). */
function migrate(PDO $pdo): void
{
    $pg = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql';
    // Auto-incrementing primary key, and a "created_at" text default, per driver.
    $pk  = $pg ? 'BIGSERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $now = $pg
        ? "TEXT NOT NULL DEFAULT to_char(now(),'YYYY-MM-DD HH24:MI:SS')"
        : "TEXT NOT NULL DEFAULT (datetime('now'))";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id            $pk,
            name          TEXT    NOT NULL,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            role          TEXT    NOT NULL DEFAULT 'agent',
            access_code   TEXT,
            status        TEXT    NOT NULL DEFAULT 'active',
            created_at    $now
        )
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT PRIMARY KEY,
            user_id    INTEGER NOT NULL,
            expires_at TEXT    NOT NULL,
            created_at $now
        )
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS login_attempts (
            id         $pk,
            email      TEXT NOT NULL,
            ip         TEXT,
            ok         INTEGER NOT NULL DEFAULT 0,
            created_at $now
        )
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leads (
            id             $pk,
            owner_user_id  INTEGER,
            company        TEXT    NOT NULL,
            email          TEXT,
            sector         TEXT,
            city           TEXT,
            website        TEXT,
            source_url     TEXT,
            contact        TEXT,
            role           TEXT,
            linkedin       TEXT,
            phone          TEXT,
            subject        TEXT,
            status         TEXT    NOT NULL DEFAULT 'new',
            bounce_reason  TEXT,
            score          INTEGER DEFAULT 0,
            sent_at        TEXT,
            replied_at     TEXT,
            last_followup_at TEXT,
            notes          TEXT,
            created_at     $now,
            updated_at     $now
        )
    ");
    // Add owner_user_id to an older leads table that predates per-client scoping.
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN owner_user_id INTEGER'); } catch (Throwable $e) {}
    // Decision-maker fields for a lead (person's role + LinkedIn profile URL).
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN role TEXT'); } catch (Throwable $e) {}
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN linkedin TEXT'); } catch (Throwable $e) {}
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN phone TEXT'); } catch (Throwable $e) {}
    // Client profile — each registered client's business + what leads they want.
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS client_profiles (
            user_id        INTEGER PRIMARY KEY,
            business_name  TEXT,
            business_type  TEXT,
            target_sectors TEXT,
            regions        TEXT,
            goal           TEXT,
            wants_text     TEXT,
            agent_instructions TEXT,
            daily_time     TEXT,
            daily_enabled  INTEGER DEFAULT 0,
            status         TEXT NOT NULL DEFAULT 'active',
            created_at     $now
        )
    ");
    try { $pdo->exec('ALTER TABLE client_profiles ADD COLUMN wants_text TEXT'); } catch (Throwable $e) {}
    try { $pdo->exec('ALTER TABLE client_profiles ADD COLUMN agent_instructions TEXT'); } catch (Throwable $e) {}
    // Daily leads schedule: the client can ask to receive fresh leads every day
    // at a chosen time (HH:MM). daily_enabled toggles it on.
    try { $pdo->exec('ALTER TABLE client_profiles ADD COLUMN daily_time TEXT'); } catch (Throwable $e) {}
    try { $pdo->exec('ALTER TABLE client_profiles ADD COLUMN daily_enabled INTEGER DEFAULT 0'); } catch (Throwable $e) {}
    // API keys — let AI agents (Make/n8n/Dify) authenticate without the admin
    // password. The full key is shown once; only a hash + prefix are stored.
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS api_keys (
            id            $pk,
            owner_user_id INTEGER,
            name          TEXT NOT NULL,
            prefix        TEXT NOT NULL,
            key_hash      TEXT NOT NULL,
            permissions   TEXT NOT NULL DEFAULT 'read',
            created_at    $now,
            last_used_at  TEXT,
            revoked       INTEGER NOT NULL DEFAULT 0
        )
    ");
    // Connected AI agents — a registry the admin manages from the hub.
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS agents (
            id             $pk,
            owner_user_id  INTEGER,
            name           TEXT NOT NULL,
            platform       TEXT,
            permissions    TEXT NOT NULL DEFAULT 'read',
            webhook_url    TEXT,
            status         TEXT NOT NULL DEFAULT 'disconnected',
            last_action_at TEXT,
            created_at     $now
        )
    ");
    // סוכני ציד לידים: סוג, תוכן (מה לעשות + ההצעה), יעדים, ומצב ריצה.
    foreach ([
        "kind TEXT DEFAULT 'external'", 'instructions TEXT', 'offer TEXT', 'subject TEXT', 'targets TEXT', 'area TEXT',
        'active INTEGER DEFAULT 0', 'hunt_cursor INTEGER DEFAULT 0', 'last_run_at TEXT', 'last_result TEXT', 'found_total INTEGER DEFAULT 0',
    ] as $col) {
        try { $pdo->exec("ALTER TABLE agents ADD COLUMN $col"); } catch (Throwable $e) {}
    }
    // מאיזה סוכן הגיע הליד, וטיוטת ההצעה המותאמת לעסק.
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN agent_id INTEGER'); } catch (Throwable $e) {}
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN draft TEXT'); } catch (Throwable $e) {}
    // Suppression list — addresses that must never be contacted again
    // (bounced, asked to be removed, or replied \"not relevant\").
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS suppressions (
            email      TEXT PRIMARY KEY,
            reason     TEXT,
            created_at $now
        )
    ");
    // Activity log — every action the system performs, so it is all visible.
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS activity (
            id         $pk,
            lead_id    INTEGER,
            user_id    INTEGER,
            action     TEXT NOT NULL,
            detail     TEXT,
            created_at $now
        )
    ");
}

function log_activity(?int $leadId, ?int $userId, string $action, string $detail = ''): void
{
    $st = db()->prepare(
        'INSERT INTO activity (lead_id, user_id, action, detail) VALUES (?,?,?,?)'
    );
    $st->execute([$leadId, $userId, $action, $detail]);
}
