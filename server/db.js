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

  -- שלב C: יומן התראות קליניות — כל התראה שנוצרה (הידרדרות/נטישה/ציון דרך).
  -- משמש גם לדדופ יומי (לא לספם את המשתמש/ת) וגם כפיד לדשבורד של קטי (שלב D).
  CREATE TABLE IF NOT EXISTS clinical_alert_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_token TEXT NOT NULL REFERENCES patients(device_token),
    kind TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    therapist_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
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

  -- ConsentRecord: הסכמה גרנולרית לכל סוג (9 סוגים), עם גרסה וחותמות זמן.
  -- שורה חדשה לכל שינוי מצב (grant/revoke) — היסטוריה מלאה, לא עדכון-במקום.
  CREATE TABLE IF NOT EXISTS consent_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    consent_type TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    granted INTEGER NOT NULL DEFAULT 1,
    granted_at TEXT,
    revoked_at TEXT,
    source TEXT,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_consent_records_user ON consent_records (user_id, consent_type);

  -- ContentSource: מקור תוכן מאושר (בסיס ה-RAG והציטוטים). לא מפרסמים בלי אישור אנושי.
  CREATE TABLE IF NOT EXISTS content_sources (
    source_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    creator TEXT,
    url_path TEXT,
    source_type TEXT,           -- method / lesson / audio / article
    rights_status TEXT,         -- owned / licensed / public-principle
    topic TEXT,
    audience TEXT,
    sensitivity TEXT,           -- low / medium / high
    approved_by TEXT,
    approved_at TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'draft' -- draft / review / published / archived
  );

  -- ContentModule: יחידת תוכן שהמשתמשת חווה. מקושרת למקורות מאושרים.
  CREATE TABLE IF NOT EXISTS content_modules (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    audience TEXT,              -- adult / parent / youth / all
    topic TEXT,
    objective TEXT,
    duration_min INTEGER,
    format TEXT,                -- text / audio / practice / mixed
    explanation TEXT,
    exercise TEXT,
    audio_url TEXT,
    transcript TEXT,           -- חלופת טקסט מלאה לאודיו (נגישות)
    reflection TEXT,
    reward TEXT,
    safety_note TEXT,
    next_step TEXT,
    source_ids TEXT,           -- JSON array של source_id
    sensitivity TEXT DEFAULT 'low',
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'published',
    sort_order INTEGER DEFAULT 0,
    needs_content_review INTEGER DEFAULT 1 -- 1 = ממתין לתוכן/אישור של קטי (TODO)
  );
  CREATE INDEX IF NOT EXISTS idx_content_modules_topic ON content_modules (topic, audience);

  -- תור אישור אודיו: הקלטות של קטי (Drive/Spotify/SoundCloud) שהותאמו ליחידות תוכן.
  -- pending עד שקטי מאשרת (מאזינה ומוודאת התאמה) — לא מתפרסם אוטומטית.
  CREATE TABLE IF NOT EXISTS audio_candidates (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,        -- drive / spotify / soundcloud
    external_id TEXT,              -- Drive fileId / track id
    title TEXT NOT NULL,
    view_url TEXT,
    mime TEXT,
    suggested_slug TEXT,          -- היחידה המומלצת
    topic TEXT,
    match_note TEXT,              -- למה הותאם
    rights_status TEXT DEFAULT 'owned',
    status TEXT NOT NULL DEFAULT 'pending', -- pending / approved / rejected
    approved_by TEXT,
    approved_at TEXT,
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

// ── ConsentRecord (הסכמה גרנולרית) ─────────────────────────────────────────
// 9 סוגי ההסכמה מהאפיון. שמות יציבים — ה-UI והבדיקות נשענים עליהם.
const CONSENT_TYPES = [
  "platform_use",              // 1. שימוש בפלטפורמה
  "intake_storage",            // 2. שמירת תשובות intake
  "ai_use",                    // 3. שימוש ב-AI
  "ai_conversation_storage",   // 4. שמירת שיחות AI
  "personalization",           // 5. התאמה אישית
  "notifications",             // 6. notifications
  "professional_share",        // 7. שיתוף עם איש מקצוע
  "guardian_share",            // 8. שיתוף עם הורה/אפוטרופוס
  "terms_privacy",             // 9. תנאי שימוש ופרטיות
];

// ההסכמות שהן חובה כדי להשתמש בפלטפורמה (השאר אופציונליות).
const REQUIRED_CONSENTS = ["platform_use", "terms_privacy"];

function recordConsent(userId, consentType, granted, { version = "1.0", source = "app", ip = null } = {}) {
  if (!userId || !CONSENT_TYPES.includes(consentType)) {
    return { error: "invalid consent type", status: 400 };
  }
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO consent_records (user_id, consent_type, version, granted, granted_at, revoked_at, source, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(userId, consentType, version, granted ? 1 : 0, granted ? now : null, granted ? null : now, source, ip ? String(ip).slice(0, 60) : null);
  auditLog(userId, granted ? "consent_granted" : "consent_revoked", "consent", consentType, { version });
  return { ok: true, consentType, granted: !!granted, at: now };
}

// המצב הנוכחי לכל סוג = הרשומה האחרונה. מחזיר מפה { type: boolean }.
function currentConsents(userId) {
  const rows = db.prepare(
    `SELECT consent_type, granted FROM consent_records
     WHERE user_id = ? AND id IN (
       SELECT MAX(id) FROM consent_records WHERE user_id = ? GROUP BY consent_type
     )`
  ).all(userId, userId);
  const map = {};
  for (const t of CONSENT_TYPES) map[t] = false;
  for (const r of rows) map[r.consent_type] = !!r.granted;
  return map;
}

function hasConsent(userId, consentType) {
  return currentConsents(userId)[consentType] === true;
}

// ── ייצוא ומחיקה של נתוני משתמשת (זכות פרטיות) ──────────────────────────────
function exportUserData(userId) {
  const out = { exportedAt: new Date().toISOString(), userId };
  const safeAll = (sql, ...args) => { try { return db.prepare(sql).all(...args); } catch { return []; } };
  const safeGet = (sql, ...args) => { try { return db.prepare(sql).get(...args) || null; } catch { return null; } };
  out.account = safeGet("SELECT id, email, full_name, phone, created_at FROM accounts WHERE id = ?", userId);
  out.profile = safeGet("SELECT * FROM patient_profile WHERE device_token = ?", userId);
  out.consents = safeAll("SELECT consent_type, granted, granted_at, revoked_at, version FROM consent_records WHERE user_id = ? ORDER BY id", userId);
  out.checkins = safeAll("SELECT text, created_at FROM checkins WHERE device_token = ? ORDER BY created_at", userId);
  out.conversations = safeAll("SELECT role, text, created_at FROM conversations WHERE device_token = ? ORDER BY created_at", userId);
  out.moodLogs = safeAll("SELECT * FROM mood_logs WHERE device_token = ? ORDER BY created_at", userId);
  return out;
}

function deleteUserAccount(userId) {
  const tables = [
    ["checkins", "device_token"], ["conversations", "device_token"], ["mood_logs", "device_token"],
    ["grounding_sessions", "device_token"], ["daily_tasks", "device_token"], ["module_progress", "device_token"],
    ["protocol_progress", "device_token"], ["recommendations", "device_token"], ["patient_profile", "device_token"],
    ["patients", "device_token"], ["enrollments", "user_id"], ["subscriptions", "user_id"],
    ["consent_records", "user_id"], ["consent_log", "account_id"], ["auth_sessions", "account_id"],
    ["accounts", "id"],
  ];
  let removed = 0;
  for (const [t, col] of tables) {
    try { const r = db.prepare(`DELETE FROM ${t} WHERE ${col} = ?`).run(userId); removed += (r.changes || 0); } catch { /* טבלה/עמודה לא קיימת */ }
  }
  auditLog(userId, "account_deleted", "account", userId, { rows: removed });
  return { ok: true, rowsRemoved: removed };
}

// ── ContentModule (קטלוג תוכן) ──────────────────────────────────────────────
function mapModuleRow(r) {
  if (!r) return null;
  let sourceIds = [];
  try { sourceIds = JSON.parse(r.source_ids || "[]"); } catch { sourceIds = []; }
  return {
    slug: r.slug, title: r.title, audience: r.audience, topic: r.topic,
    objective: r.objective, durationMin: r.duration_min, format: r.format,
    explanation: r.explanation, exercise: r.exercise,
    audioUrl: r.audio_url || null, transcript: r.transcript,
    reflection: r.reflection, reward: r.reward, safetyNote: r.safety_note,
    nextStep: r.next_step, sourceIds, sensitivity: r.sensitivity,
    version: r.version, status: r.status, needsContentReview: !!r.needs_content_review,
  };
}

// רשימת יחידות מפורסמות, סינון אופציונלי לפי audience/topic.
// audience "all" תמיד נכלל; youth רואה youth+all, וכן הלאה.
function listContentModules({ audience, topic } = {}) {
  let rows = db.prepare("SELECT * FROM content_modules WHERE status = 'published' ORDER BY topic, sort_order").all();
  if (audience) rows = rows.filter((r) => r.audience === audience || r.audience === "all");
  if (topic) rows = rows.filter((r) => r.topic === topic);
  return rows.map(mapModuleRow);
}

// יחידה בודדת + ציטוטי המקור (לתצוגת citation בצ׳אט/שיעור).
function getContentModule(slug) {
  const mod = mapModuleRow(db.prepare("SELECT * FROM content_modules WHERE slug = ?").get(slug));
  if (!mod) return null;
  mod.sources = (mod.sourceIds || []).map((id) => {
    const s = db.prepare("SELECT source_id, title, source_type, rights_status, status FROM content_sources WHERE source_id = ?").get(id);
    return s ? { id: s.source_id, title: s.title, type: s.source_type, rightsStatus: s.rights_status, status: s.status } : { id, title: id };
  });
  return mod;
}

function listContentModuleTopics() {
  return db.prepare("SELECT DISTINCT topic FROM content_modules WHERE status = 'published' ORDER BY topic").all().map((r) => r.topic);
}

// ── תור אישור אודיו ─────────────────────────────────────────────────────────
function listAudioCandidates(status) {
  const rows = status
    ? db.prepare("SELECT * FROM audio_candidates WHERE status = ? ORDER BY topic, title").all(status)
    : db.prepare("SELECT * FROM audio_candidates ORDER BY status, topic, title").all();
  return rows;
}

// אישור מועמד → משייך את האודיו ליחידה (audio_url) ומעדכן פורמט. לא מוחק את הטקסט.
function approveAudioCandidate(id, approvedBy = "kety") {
  const c = db.prepare("SELECT * FROM audio_candidates WHERE id = ?").get(id);
  if (!c) return { error: "not found", status: 404 };
  db.prepare("UPDATE audio_candidates SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?")
    .run(approvedBy, new Date().toISOString(), id);
  if (c.suggested_slug) {
    // מסמנים את היחידה כ'audio זמין'; ה-view_url הוא מועמד — הנגשה לנגן בפועל דורשת אירוח (ראו הערה).
    db.prepare("UPDATE content_modules SET audio_url = ?, format = 'mixed' WHERE slug = ?").run(c.view_url || "", c.suggested_slug);
  }
  auditLog(approvedBy, "audio_approved", "audio_candidate", id, { slug: c.suggested_slug });
  return { ok: true, slug: c.suggested_slug };
}

function rejectAudioCandidate(id, by = "kety") {
  const r = db.prepare("UPDATE audio_candidates SET status = 'rejected', approved_by = ?, approved_at = ? WHERE id = ?")
    .run(by, new Date().toISOString(), id);
  return r.changes ? { ok: true } : { error: "not found", status: 404 };
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

// ביטול מנוי ביוזמת הלקוח — מסמן canceled ומחזיר האם זכאי/ת להחזר מלא (עד 15 יום מהחיוב הראשון).
function cancelSubscription(userId, enrollmentId) {
  const enr = enrollmentId
    ? db.prepare("SELECT * FROM enrollments WHERE id = ? AND user_id = ?").get(enrollmentId, userId)
    : getActiveEnrollment(userId);
  if (!enr) return { ok: false, error: "no_active_enrollment" };
  db.prepare("UPDATE enrollments SET subscription_status = 'cancelled', status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(enr.id);
  db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE enrollment_id = ? AND status = 'active'").run(enr.id);
  // זכאות להחזר מלא: תוך 15 יום מהחיוב הראשון.
  const sub = db.prepare("SELECT first_charge_at FROM subscriptions WHERE enrollment_id = ? ORDER BY id DESC LIMIT 1").get(enr.id);
  let refundEligible = false, daysSinceCharge = null;
  if (sub && sub.first_charge_at) {
    const charged = new Date(String(sub.first_charge_at).replace(" ", "T") + "Z").getTime();
    daysSinceCharge = Math.floor((Date.now() - charged) / 86400000);
    refundEligible = daysSinceCharge <= 15;
  }
  auditLog(userId, "subscription_cancelled", "enrollment", enr.id, { refundEligible, daysSinceCharge });
  return { ok: true, enrollmentId: enr.id, refundEligible, daysSinceCharge };
}

module.exports = {
  db, ensurePatient, getAgeGroup, getAccessStatus, getJourneyDay, scheduleEngagementNotifications,
  cancelSubscription,
  // מודל המוצר:
  TRIAL_HOURS, listPrograms, getProgram, enrollUser, getEnrollments, enrollmentTrialStatus, auditLog,
  // תשלום:
  getActiveEnrollment, growGateStatus, applyPaymentWebhook,
  // הסכמות + פרטיות:
  CONSENT_TYPES, REQUIRED_CONSENTS, recordConsent, currentConsents, hasConsent,
  exportUserData, deleteUserAccount,
  // קטלוג תוכן:
  listContentModules, getContentModule, listContentModuleTopics,
  // תור אישור אודיו:
  listAudioCandidates, approveAudioCandidate, rejectAudioCandidate,
};
