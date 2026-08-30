// Storage: node-sqlite3-wasm — SQLite compiled to WebAssembly, PURE JavaScript.
// No native addon (so no ABI segfaults like better-sqlite3) and no built-in-module
// version requirement (so no "node:sqlite not found" like on older Node). It runs
// identically on ANY Node version Render picks — which is what finally makes the
// deploy stable. Uses in-memory storage; the app re-seeds on startup.
//
// A tiny adapter below re-exposes the exact prepare().run/get/all + exec() API that
// node:sqlite used, so none of the existing SQL across the codebase had to change.
const path = require("node:path");
const crypto = require("node:crypto");
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

  CREATE TABLE IF NOT EXISTS mood_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_token TEXT NOT NULL REFERENCES patients(device_token),
    anxiety INTEGER,
    mood TEXT,
    sleep INTEGER,
    note TEXT,
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

  CREATE TABLE IF NOT EXISTS client_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_token TEXT NOT NULL REFERENCES patients(device_token),
    title TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'רגשי',
    progress INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS consent_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT,
    email TEXT,
    consent_type TEXT NOT NULL DEFAULT 'terms_ai_medical',
    ip TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
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

  /* ═══ מודל המוצר: תוכניות, הרשמות ומסע רציף (מסמך "מסע המשתמש") ═══ */

  CREATE TABLE IF NOT EXISTS programs (
    program_id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    audience TEXT,                 -- teen | parent | adult | org
    age_group TEXT,                -- youth | adult
    duration TEXT,
    outcomes TEXT,                 -- JSON array
    module_ids TEXT,               -- JSON array
    audio_asset_ids TEXT,          -- JSON array
    preview_content TEXT,
    trial_hours INTEGER NOT NULL DEFAULT 72,
    price_display TEXT,
    billing_frequency TEXT,
    grow_product_id TEXT,
    status TEXT NOT NULL DEFAULT 'published',   -- draft | published | paused
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,          -- account id (server-verified identity)
    program_id TEXT NOT NULL REFERENCES programs(program_id),
    status TEXT NOT NULL DEFAULT 'trial_active', -- trial_active | trial_expired | subscribed | cancelled
    enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
    trial_started_at TEXT NOT NULL DEFAULT (datetime('now')),
    trial_ends_at TEXT NOT NULL,
    current_module_id TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    last_activity_at TEXT,
    completed_at TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'none', -- none | pending | active | cancelled
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_enroll_user ON enrollments(user_id);

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    enrollment_id TEXT REFERENCES enrollments(id),
    program_id TEXT,
    module_id TEXT,
    role TEXT NOT NULL,            -- user | assistant
    content TEXT NOT NULL,
    safety_flag TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id, enrollment_id);

  CREATE TABLE IF NOT EXISTS summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    enrollment_id TEXT REFERENCES enrollments(id),
    summary_text TEXT NOT NULL,
    source_conversation_id INTEGER,
    confirmed_by_user INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    enrollment_id TEXT REFERENCES enrollments(id),
    assessment_type TEXT NOT NULL,
    score INTEGER,
    score_version TEXT,
    inputs TEXT,
    explanation TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    enrollment_id TEXT REFERENCES enrollments(id),
    module_id TEXT NOT NULL,
    reason TEXT,
    source_assessment_id INTEGER,
    is_current INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS module_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    enrollment_id TEXT REFERENCES enrollments(id),
    module_id TEXT NOT NULL,
    asset_id TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    started_at TEXT,
    completed_at TEXT,
    reflection_text TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    enrollment_id TEXT REFERENCES enrollments(id),
    provider TEXT NOT NULL DEFAULT 'grow',
    provider_product_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | active | failed | cancelled
    trial_ends_at TEXT,
    first_charge_at TEXT,
    last_webhook_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata_redacted TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- אירועי webhook של ספק התשלום — מונע עיבוד כפול (idempotency) של אותו אירוע.
  CREATE TABLE IF NOT EXISTS webhook_events (
    event_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'grow',
    processed_at TEXT NOT NULL DEFAULT (datetime('now'))
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

// מקור אמת יחיד לאורך ההתנסות: בדיוק 72 שעות מרגע פתיחת החשבון/ה-enrollment.
// (TRIAL_HOURS מוגדר מטה — משמש כאן וב-enrollUser כדי שאין שני שעונים סותרים.)

// Access resolution: a redeemed code / active subscription wins; otherwise the
// automatic 72-hour trial that starts on first contact (ensurePatient / register).
// Server-authoritative: the client never decides accessStatus.
function getAccessStatus(deviceToken) {
  const row = db
    .prepare("SELECT trial_start_at, access_code, access_expires_at FROM patient_profile WHERE device_token = ?")
    .get(deviceToken);
  if (!row) return { status: "expired", daysLeft: 0, hoursLeft: 0 };

  if (row.access_code) {
    if (!row.access_expires_at) return { status: "code", daysLeft: null, hoursLeft: null };
    const msLeft = new Date(row.access_expires_at.replace(" ", "T") + "Z").getTime() - Date.now();
    if (msLeft > 0) return { status: "code", daysLeft: Math.ceil(msLeft / 86400000), hoursLeft: Math.ceil(msLeft / 3600000) };
  }

  if (row.trial_start_at) {
    const started = new Date(row.trial_start_at.replace(" ", "T") + "Z").getTime();
    const endsAt = started + TRIAL_HOURS * 3600000; // 72h exactly
    const msLeft = endsAt - Date.now();
    if (msLeft > 0) {
      return {
        status: "trial",
        daysLeft: Math.ceil(msLeft / 86400000),
        hoursLeft: Math.ceil(msLeft / 3600000),
        trialEndsAt: new Date(endsAt).toISOString(),
      };
    }
  }

  return { status: "expired", daysLeft: 0, hoursLeft: 0 };
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

/* ═══════════════════════════════════════════════════════════════════
   מודל המוצר — תוכניות, הרשמות ו-72 שעות ניסיון (server-side).
   ═══════════════════════════════════════════════════════════════════ */

const TRIAL_HOURS = 72;

function nowIso() { return new Date().toISOString().replace("T", " ").slice(0, 19); }
function genId(prefix) { return prefix + "_" + crypto.randomBytes(9).toString("hex"); }

// זריעת קטלוג התוכניות (מקור אמת יחיד בשרת). ניתן להרחבה מה-Back Office.
function seedPrograms() {
  const PROGRAMS = [
    { program_id: "prog_digital_adult", slug: "digital-adult", title: "המרחב האישי — מבוגרים", subtitle: "מאמן רגשי חכם בכף היד", description: "ליווי דיגיטלי יומי בשיטת CureMindset למבוגרים: שיחה, מודול, אודיו ותרגול.", audience: "adult", age_group: "adult", duration: "מתמשך", trial_hours: 72, price_display: "₪297 לחודש", billing_frequency: "monthly", grow_product_id: "grow_digital", module_ids: JSON.stringify(["conflict", "loyalty", "belonging"]) },
    { program_id: "prog_digital_teen", slug: "digital-teen", title: "המרחב האישי — נוער", subtitle: "מלווה דיגיטלי לגיל ההתבגרות", description: "ליווי יומי לנוער: שפה ישירה ואמפתית, מודולים וכלים מעשיים לחוסן וביטחון.", audience: "teen", age_group: "youth", duration: "מתמשך", trial_hours: 72, price_display: "₪297 לחודש", billing_frequency: "monthly", grow_product_id: "grow_digital", module_ids: JSON.stringify(["belonging", "motivation-map", "conflict"]) },
    { program_id: "prog_digital_parent", slug: "digital-parent", title: "המרחב האישי — הורים", subtitle: "ליווי להורה למתבגר", description: "ליווי דיגיטלי להורים: הבנת התהליך, גבולות פרטיות וכלים לתמיכה במתבגר.", audience: "parent", age_group: "adult", duration: "מתמשך", trial_hours: 72, price_display: "₪297 לחודש", billing_frequency: "monthly", grow_product_id: "grow_digital", module_ids: JSON.stringify(["loyalty", "conflict"]) },
  ];
  const ins = db.prepare(`INSERT OR IGNORE INTO programs
    (program_id, slug, title, subtitle, description, audience, age_group, duration, trial_hours, price_display, billing_frequency, grow_product_id, module_ids)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const p of PROGRAMS) ins.run(
    p.program_id, p.slug, p.title, p.subtitle, p.description, p.audience, p.age_group,
    p.duration, p.trial_hours, p.price_display, p.billing_frequency, p.grow_product_id, p.module_ids
  );
}
seedPrograms();

function auditLog(actorUserId, action, entityType, entityId, metadata) {
  try {
    db.prepare("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata_redacted) VALUES (?,?,?,?,?)")
      .run(actorUserId || null, action, entityType || null, entityId || null, metadata ? JSON.stringify(metadata) : null);
  } catch (e) { /* audit must never break a request */ }
}

function listPrograms() {
  return db.prepare("SELECT * FROM programs WHERE status = 'published' ORDER BY rowid").all();
}
function getProgram(idOrSlug) {
  return db.prepare("SELECT * FROM programs WHERE program_id = ? OR slug = ?").get(idOrSlug, idOrSlug) || null;
}

// יצירת/מציאת enrollment פעיל לתוכנית — לא דורס enrollment קודם, ומתחיל 72 שעות server-side.
function enrollUser(userId, programId) {
  const prog = getProgram(programId);
  if (!prog) return { error: "program_not_found" };
  const existing = db.prepare("SELECT * FROM enrollments WHERE user_id = ? AND program_id = ?").get(userId, prog.program_id);
  if (existing) return { enrollment: existing, created: false };
  const id = genId("enr");
  const started = nowIso();
  const ends = new Date(Date.now() + (prog.trial_hours || TRIAL_HOURS) * 3600 * 1000).toISOString().replace("T", " ").slice(0, 19);
  db.prepare(`INSERT INTO enrollments (id, user_id, program_id, status, trial_started_at, trial_ends_at, current_module_id)
    VALUES (?,?,?, 'trial_active', ?, ?, ?)`).run(id, userId, prog.program_id, started, ends, JSON.parse(prog.module_ids || "[]")[0] || null);
  auditLog(userId, "enroll", "enrollment", id, { programId: prog.program_id });
  return { enrollment: db.prepare("SELECT * FROM enrollments WHERE id = ?").get(id), created: true };
}

function getEnrollments(userId) {
  return db.prepare("SELECT * FROM enrollments WHERE user_id = ? ORDER BY enrolled_at DESC").all(userId);
}

// סטטוס ה-72 שעות מחושב אך ורק בצד השרת מ-trial_ends_at.
function enrollmentTrialStatus(enr) {
  if (!enr) return { status: "none", hoursLeft: 0 };
  if (enr.subscription_status === "active") return { status: "subscribed", hoursLeft: null };
  const ends = new Date(enr.trial_ends_at.replace(" ", "T") + "Z").getTime();
  const msLeft = ends - Date.now();
  if (msLeft > 0) return { status: "trial_active", hoursLeft: Math.ceil(msLeft / 3600000) };
  return { status: "trial_expired", hoursLeft: 0 };
}

/* ═══ תשלום Grow — שער server-side + webhook אידמפוטנטי ═══ */

// ה-enrollment הפעיל האחרון של המשתמש (או null).
function getActiveEnrollment(userId) {
  return getEnrollments(userId)[0] || null;
}

// החלטת שער התשלום — מחושבת אך ורק בשרת. checkout מותר רק כשה-trial נגמר.
// לעולם לא מחזיר checkoutUrl בזמן trial פעיל.
function growGateStatus(userId) {
  const access = getAccessStatus(userId); // device_token == accountId עבור חשבון רשום
  const enr = getActiveEnrollment(userId);
  if (enr && enr.subscription_status === "active") {
    return { allowed: false, state: "subscribed", reason: "already_subscribed" };
  }
  if (access.status === "code") {
    return { allowed: false, state: "code_access", reason: "has_access_code" };
  }
  if (access.status === "trial") {
    // עדיין בהתנסות — אסור להחזיר קישור תשלום.
    return { allowed: false, state: "trial_active", reason: "trial_not_ended", hoursLeft: access.hoursLeft };
  }
  // ה-trial נגמר — מותר להציג checkout עם תנאים מלאים.
  const prog = enr ? getProgram(enr.program_id) : null;
  return {
    allowed: true,
    state: "trial_expired",
    programId: enr ? enr.program_id : null,
    growProductId: prog ? prog.grow_product_id : null,
  };
}

// מעבד אירוע תשלום מאומת מהספק — אידמפוטנטי לפי event_id.
// מפעיל מנוי רק דרך כאן (webhook), לעולם לא לפי redirect בצד הלקוח.
function applyPaymentWebhook({ eventId, userId, enrollmentId, providerProductId, provider = "grow" }) {
  if (!eventId) return { ok: false, error: "missing_event_id" };
  const seen = db.prepare("SELECT 1 FROM webhook_events WHERE event_id = ?").get(eventId);
  if (seen) return { ok: true, duplicate: true }; // כבר עובד — לא לחייב/לשנות שוב
  db.prepare("INSERT INTO webhook_events (event_id, provider) VALUES (?, ?)").run(eventId, provider);

  const enr = enrollmentId
    ? db.prepare("SELECT * FROM enrollments WHERE id = ? AND user_id = ?").get(enrollmentId, userId)
    : getActiveEnrollment(userId);
  if (enr) {
    db.prepare("UPDATE enrollments SET subscription_status = 'active', status = 'subscribed', updated_at = datetime('now') WHERE id = ?").run(enr.id);
    db.prepare(`INSERT INTO subscriptions (user_id, enrollment_id, provider, provider_product_id, status, first_charge_at, last_webhook_at)
      VALUES (?,?,?,?, 'active', datetime('now'), datetime('now'))`).run(userId, enr.id, provider, providerProductId || null);
  }
  auditLog(userId, "subscription_active", "enrollment", enr ? enr.id : null, { provider, eventId });
  return { ok: true, duplicate: false, enrollmentId: enr ? enr.id : null };
}

module.exports = {
  db, ensurePatient, getAgeGroup, getAccessStatus, getJourneyDay, scheduleEngagementNotifications,
  // מודל המוצר:
  TRIAL_HOURS, listPrograms, getProgram, enrollUser, getEnrollments, enrollmentTrialStatus, auditLog,
  // תשלום:
  getActiveEnrollment, growGateStatus, applyPaymentWebhook,
};
