const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DB_PATH = path.join(__dirname, "curemindset.db");
const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    device_token TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS client_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_token TEXT NOT NULL REFERENCES patients(device_token),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS protocol_progress (
    device_token TEXT PRIMARY KEY REFERENCES patients(device_token),
    unlocked INTEGER NOT NULL DEFAULT 1,
    completed TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS grounding_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_token TEXT NOT NULL REFERENCES patients(device_token),
    score INTEGER NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_token TEXT NOT NULL REFERENCES patients(device_token),
    text TEXT NOT NULL,
    ai_reply TEXT,
    triggers TEXT NOT NULL DEFAULT '[]',
    patterns TEXT NOT NULL DEFAULT '[]',
    balance_alerts TEXT NOT NULL DEFAULT '[]',
    wins TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// patients table predates the CRM columns; existing on-disk DBs won't have them yet and
// node:sqlite has no "ADD COLUMN IF NOT EXISTS", so add each guarded against re-running.
const crmColumns = [
  "ALTER TABLE patients ADD COLUMN display_name TEXT",
  "ALTER TABLE patients ADD COLUMN status TEXT NOT NULL DEFAULT 'מאוזן'",
  "ALTER TABLE patients ADD COLUMN last_interaction_at TEXT",
  "ALTER TABLE patients ADD COLUMN last_summary TEXT",
];
for (const stmt of crmColumns) {
  try {
    db.exec(stmt);
  } catch {
    // column already exists
  }
}

function ensurePatient(deviceToken) {
  db.prepare("INSERT OR IGNORE INTO patients (device_token) VALUES (?)").run(deviceToken);
  db.prepare("INSERT OR IGNORE INTO protocol_progress (device_token) VALUES (?)").run(deviceToken);
}

module.exports = { db, ensurePatient };
