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

/** Create tables if they do not exist. Portable SQL (SQLite/MySQL). */
function migrate(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT    NOT NULL,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            role          TEXT    NOT NULL DEFAULT 'agent',
            access_code   TEXT,
            status        TEXT    NOT NULL DEFAULT 'active',
            created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT PRIMARY KEY,
            user_id    INTEGER NOT NULL,
            expires_at TEXT    NOT NULL,
            created_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS login_attempts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            email      TEXT NOT NULL,
            ip         TEXT,
            ok         INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leads (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
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
            subject        TEXT,
            status         TEXT    NOT NULL DEFAULT 'new',
            bounce_reason  TEXT,
            score          INTEGER DEFAULT 0,
            sent_at        TEXT,
            replied_at     TEXT,
            last_followup_at TEXT,
            notes          TEXT,
            created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    ");
    // Add owner_user_id to an older leads table that predates per-client scoping.
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN owner_user_id INTEGER'); } catch (Throwable $e) {}
    // Decision-maker fields for a lead (person's role + LinkedIn profile URL).
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN role TEXT'); } catch (Throwable $e) {}
    try { $pdo->exec('ALTER TABLE leads ADD COLUMN linkedin TEXT'); } catch (Throwable $e) {}
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
            status         TEXT NOT NULL DEFAULT 'active',
            created_at     TEXT NOT NULL DEFAULT (datetime('now'))
        )
    ");
    try { $pdo->exec('ALTER TABLE client_profiles ADD COLUMN wants_text TEXT'); } catch (Throwable $e) {}
    try { $pdo->exec('ALTER TABLE client_profiles ADD COLUMN agent_instructions TEXT'); } catch (Throwable $e) {}
    // Suppression list — addresses that must never be contacted again
    // (bounced, asked to be removed, or replied \"not relevant\").
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS suppressions (
            email      TEXT PRIMARY KEY,
            reason     TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    ");
    // Activity log — every action the system performs, so it is all visible.
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS activity (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id    INTEGER,
            user_id    INTEGER,
            action     TEXT NOT NULL,
            detail     TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
