// Storage: node-sqlite3-wasm — SQLite compiled to WebAssembly, PURE JavaScript.
// No native addon (so no ABI segfaults like better-sqlite3) and no built-in-module
// version requirement (so no "node:sqlite not found" like on older Node). It runs
// identically on ANY Node version Render picks — which is what finally makes the
// deploy stable. Uses in-memory storage; the app re-seeds on startup.
//
// A tiny adapter below re-exposes the exact prepare().run/get/all + exec() API that
// node:sqlite used, so none of the existing SQL across the codebase had to change.
const path = require("node:path");
const { Database } = require("node-sqlite3-wasm");

// Persist to a real SQLite file. On a persistent disk (set DB_FILE, e.g.
// /data/curemindset.db) the data survives restarts AND redeploys — that's what
// makes returning clients "remembered". Without a disk it still survives while the
// instance is awake (much better than :memory:, which reset on every sleep).
const DB_PATH = process.env.DB_FILE || path.join(__dirname, "curemindset.db");
const rawDb = new Database(DB_PATH);

// node-sqlite3-wasm takes bind params as an array; the codebase calls .run(a, b, c)
// with spread args (node:sqlite style). Normalize both forms to an array.
function toArgs(params) {
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params;
}

const db = {
  exec: (sql) => rawDb.exec(sql),
  prepare: (sql) => ({
    run: (...params) => rawDb.run(sql, toArgs(params)),
    get: (...params) => rawDb.get(sql, toArgs(params)) ?? undefined,
    all: (...params) => rawDb.all(sql, toArgs(params)),
  }),
};

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

  CREATE TABLE IF NOT EXISTS daily_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_token TEXT NOT NULL REFERENCES patients(device_token),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'mindfulness',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_token TEXT NOT NULL REFERENCES patients(device_token),
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'reminder',
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patient_profile (
    device_token TEXT PRIMARY KEY REFERENCES patients(device_token),
    age_group TEXT NOT NULL DEFAULT 'adult',
    trial_start_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workshop_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    workshop TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS access_codes (
    code TEXT PRIMARY KEY,
    plan TEXT NOT NULL DEFAULT 'digital',
    note TEXT,
    months INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    redeemed_by TEXT REFERENCES patients(device_token),
    redeemed_at TEXT
  );
`);

// patients table predates the CRM columns; existing on-disk DBs won't have them yet and
// node:sqlite has no "ADD COLUMN IF NOT EXISTS", so add each guarded against re-running.
const crmColumns = [
  "ALTER TABLE patients ADD COLUMN display_name TEXT",
  "ALTER TABLE patients ADD COLUMN status TEXT NOT NULL DEFAULT 'מאוזן'",
  "ALTER TABLE patients ADD COLUMN last_interaction_at TEXT",
  "ALTER TABLE patients ADD COLUMN last_summary TEXT",
  "ALTER TABLE patient_profile ADD COLUMN access_code TEXT",
  "ALTER TABLE patient_profile ADD COLUMN access_expires_at TEXT",
  // אימות טלפון ב-SMS (OTP) — נוסף לחשבונות קיימים בלי לשבור אותם.
  "ALTER TABLE accounts ADD COLUMN phone_verified INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE accounts ADD COLUMN otp_hash TEXT",
  "ALTER TABLE accounts ADD COLUMN otp_expires TEXT",
  "ALTER TABLE accounts ADD COLUMN otp_attempts INTEGER NOT NULL DEFAULT 0",
  // חבר מביא חבר — קוד הפניה אישי + מי הזמין את החשבון.
  "ALTER TABLE accounts ADD COLUMN ref_code TEXT",
  "ALTER TABLE accounts ADD COLUMN referred_by TEXT",
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
  db.prepare("INSERT OR IGNORE INTO patient_profile (device_token, trial_start_at) VALUES (?, datetime('now'))").run(deviceToken);
}

const TRIAL_DAYS = 14;

// Access resolution: a redeemed code wins (unlimited unless it carries an expiry);
// otherwise the automatic 14-day trial that starts on first contact (ensurePatient).
function getAccessStatus(deviceToken) {
  const row = db
    .prepare("SELECT trial_start_at, access_code, access_expires_at FROM patient_profile WHERE device_token = ?")
    .get(deviceToken);
  if (!row) return { status: "expired", daysLeft: 0 };

  if (row.access_code) {
    if (!row.access_expires_at) return { status: "code", daysLeft: null };
    const msLeft = new Date(row.access_expires_at.replace(" ", "T") + "Z").getTime() - Date.now();
    if (msLeft > 0) return { status: "code", daysLeft: Math.ceil(msLeft / 86400000) };
  }

  if (row.trial_start_at) {
    const started = new Date(row.trial_start_at.replace(" ", "T") + "Z").getTime();
    const msLeft = started + TRIAL_DAYS * 86400000 - Date.now();
    if (msLeft > 0) return { status: "trial", daysLeft: Math.ceil(msLeft / 86400000) };
  }

  return { status: "expired", daysLeft: 0 };
}

// Day 1 is the first day of the trial; keeps counting past 14 for subscribers
// so the AI knows the client moved into the maintenance phase.
function getJourneyDay(deviceToken) {
  const row = db.prepare("SELECT trial_start_at FROM patient_profile WHERE device_token = ?").get(deviceToken);
  if (!row?.trial_start_at) return 1;
  const started = new Date(row.trial_start_at.replace(" ", "T") + "Z").getTime();
  return Math.max(1, Math.floor((Date.now() - started) / 86400000) + 1);
}

function getAgeGroup(deviceToken) {
  const row = db.prepare("SELECT age_group FROM patient_profile WHERE device_token = ?").get(deviceToken);
  return row?.age_group || "adult";
}

function scheduleEngagementNotifications(deviceToken) {
  const msgs = [
    "היי! זה הזמן לצ'ק-אין יומי שלך. מה עובר עליך היום? 🌿",
    "זכרת את המשימה שקיבלת היום? גם צעד קטן חשוב 💛",
    "שלום! אנחנו ביחד בתהליך. איך אתה/את מרגיש/ה עכשיו?",
    "יום שלישי לניסיון החינם — איך הולך? כנסי לצ'ק-אין ✨",
    "שבוע ראשון הסתיים! זה הישג אמיתי. בואי נמשיך 🌱",
  ];
  const stmt = db.prepare("INSERT INTO notifications (device_token, message, type) VALUES (?, ?, 'reminder')");
  msgs.forEach((m) => stmt.run(deviceToken, m));
}

module.exports = { db, ensurePatient, getAgeGroup, getAccessStatus, getJourneyDay, scheduleEngagementNotifications };
