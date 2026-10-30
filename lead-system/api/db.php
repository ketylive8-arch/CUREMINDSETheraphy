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
            company        TEXT    NOT NULL,
            email          TEXT,
            sector         TEXT,
            city           TEXT,
            website        TEXT,
            source_url     TEXT,
            contact        TEXT,
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
