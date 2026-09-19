// Distribution & Parent-Acquisition engine — Stage 0: CRM + Pipeline only.
//
// This is the "מנוע הפצה" from the approved spec. It does NOT search the web,
// send anything, or invent metrics. Stage 0 gives Kety a place to record the
// distribution channels she already knows (Audit-first), classify them, capture
// the Value Exchange ("why would they say yes?"), and move each one along a
// 15-stage pipeline by hand. Discovery / outreach / measurement come later.
//
// Storage follows the same SQLite adapter every other module uses (server/db.js).
// Tables are prefixed dist_* so they never collide with the clinical CRM.

const crypto = require("node:crypto");
const { db } = require("./db");

/* ═══════════════════════════════════════════════════════════════════
   Controlled vocabularies — single source of truth, exposed to the UI
   via /api/admin/dist/meta so dropdowns and labels never drift.
   ═══════════════════════════════════════════════════════════════════ */

// Channel kinds A–G from the spec. `code` is the tracking-ID prefix (LM001…).
const CHANNEL_KINDS = [
  { value: "parent_community", code: "PC", group: "A", label: "קהילת הורים" },
  { value: "employer",         code: "HR", group: "B", label: "מעסיק / HR / רווחה" },
  { value: "learning_center",  code: "LM", group: "C", label: "מרכז למידה / הכנה לבגרות" },
  { value: "sports_club",      code: "SP", group: "C", label: "מועדון / חוג ספורט" },
  { value: "enrichment",       code: "EN", group: "C", label: "מרכז העשרה / חוג נוער" },
  { value: "waiting_parent",   code: "WT", group: "D", label: "הורה ממתין בזמן פעילות" },
  { value: "parenting_center", code: "PH", group: "E", label: "מרכז הורות / משפחה / ספק סדנאות" },
  { value: "loyalty_network",  code: "CL", group: "F", label: "רשת / מועדון לקוחות" },
  { value: "mall_family",      code: "ML", group: "G", label: "קניון / מתחם משפחות" },
  { value: "other",            code: "OT", group: "-", label: "אחר" },
];

// Opportunity types — the mandatory separation. EVIDENCE is never a lead.
const OPP_TYPES = [
  { value: "AUDIENCE_OWNER", label: "בעל קהל הורים (ערך גבוה)" },
  { value: "DIST_PARTNER",   label: "שותף הפצה" },
  { value: "HOST",           label: "מקום שמארח פעילות" },
  { value: "REFERRER",       label: "מפנה (איש מקצוע)" },
  { value: "DIRECT_PARENT",  label: "הורה שהביע צורך (אישור חובה)" },
  { value: "EVIDENCE",       label: "הוכחת ביקוש — לא ליד" },
];

// The 15-stage pipeline, in order. `terminal` marks the end states.
const PIPELINE = [
  { value: "DISCOVERED",        label: "נמצא", terminal: false },
  { value: "VERIFIED",          label: "אומת", terminal: false },
  { value: "QUALIFIED",         label: "מתאים", terminal: false },
  { value: "OFFER_READY",       label: "הצעה מוכנה", terminal: false },
  { value: "DRAFT_READY",       label: "טיוטה מוכנה", terminal: false },
  { value: "AWAITING_APPROVAL", label: "ממתין לאישור קטי", terminal: false },
  { value: "CONTACTED",         label: "נשלחה פנייה", terminal: false },
  { value: "RESPONSE",          label: "התקבלה תגובה", terminal: false },
  { value: "INTERESTED",        label: "מתעניין", terminal: false },
  { value: "PILOT",             label: "פיילוט", terminal: false },
  { value: "DISTRIBUTING",      label: "מפיץ בפועל", terminal: false },
  { value: "LEADS_GENERATED",   label: "מייצר לידים", terminal: false },
  { value: "CLIENT",            label: "לקוח", terminal: true },
  { value: "LOST",              label: "אבוד", terminal: true },
  { value: "NOT_A_FIT",         label: "לא מתאים", terminal: true },
];

const PRIORITIES = [
  { value: "HIGH",   label: "עדיפות גבוהה" },
  { value: "MEDIUM", label: "עדיפות בינונית" },
  { value: "LOW",    label: "עדיפות נמוכה" },
];

// The 7 offer models — tested in a pilot, never assumed. Nullable until chosen.
const OFFER_MODELS = [
  { value: "FREE_VALUE",       label: "1 · ערך חינם (כלי/בדיקה קצרה)" },
  { value: "MINI_ACTIVITY",    label: "2 · פעילות קצרה 15–30 דק'" },
  { value: "WORKSHOP",         label: "3 · סדנה להורים" },
  { value: "DIGITAL_RESOURCE", label: "4 · מדריך/וידאו/כלי דיגיטלי" },
  { value: "BENEFIT",          label: "5 · הטבה לקהל השותף" },
  { value: "PAID_WORKSHOP",    label: "6 · פעילות בתשלום" },
  { value: "LEAD_FUNNEL",      label: "7 · QR/לינק להצעת CureMindset" },
];

// Metric provenance — enforces the "no invented metrics" rule everywhere a
// number appears (audience size). Default UNKNOWN, never a made-up figure.
const METRIC_STATUS = [
  { value: "VERIFIED", label: "מאומת" },
  { value: "ESTIMATE", label: "הערכה" },
  { value: "UNKNOWN",  label: "לא ידוע" },
];

const VALUES = {
  kind: new Set(CHANNEL_KINDS.map((k) => k.value)),
  opp: new Set(OPP_TYPES.map((o) => o.value)),
  status: new Set(PIPELINE.map((s) => s.value)),
  priority: new Set(PRIORITIES.map((p) => p.value)),
  offer: new Set(OFFER_MODELS.map((m) => m.value)),
  metric: new Set(METRIC_STATUS.map((m) => m.value)),
};
const KIND_BY_VALUE = Object.fromEntries(CHANNEL_KINDS.map((k) => [k.value, k]));

/* ═══════════════════════════════════════════════════════════════════
   Schema
   ═══════════════════════════════════════════════════════════════════ */

db.exec(`
  CREATE TABLE IF NOT EXISTS dist_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_code TEXT UNIQUE,          -- LM001, HR002 … (tracking id)
    name TEXT NOT NULL,
    channel_kind TEXT NOT NULL DEFAULT 'other',   -- A–G enum
    opp_type TEXT NOT NULL DEFAULT 'AUDIENCE_OWNER',
    audience TEXT,                     -- who their audience is
    has_teen_parents INTEGER NOT NULL DEFAULT 0,  -- includes parents of teens?
    ages TEXT,                         -- age range if known
    audience_size INTEGER,             -- nullable — never guessed
    audience_size_status TEXT NOT NULL DEFAULT 'UNKNOWN', -- VERIFIED/ESTIMATE/UNKNOWN
    distribution_method TEXT,          -- newsletter / QR / app / coupon …
    why_yes TEXT,                      -- Value Exchange — required by the UI
    offer_model TEXT,                  -- 1–7 or null
    qr_link TEXT,                      -- unique QR/link for this channel
    contact_name TEXT,
    contact_role TEXT,
    email_public TEXT,
    phone_public TEXT,
    website TEXT,
    region TEXT,
    source_url TEXT,                   -- where the info came from
    checked_at TEXT,                   -- date verified
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    priority_reason TEXT,              -- the mandatory WHY
    measurable INTEGER NOT NULL DEFAULT 0, -- can we measure the funnel?
    status TEXT NOT NULL DEFAULT 'DISCOVERED',
    notes TEXT,
    dedup_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_dist_channels_status ON dist_channels (status);
  CREATE INDEX IF NOT EXISTS idx_dist_channels_dedup ON dist_channels (dedup_hash);

  -- Outreach drafts. Stage 0 creates the table; the UI for it arrives in Stage 2.
  -- Every row is DRAFT → approved → sent. Nothing is ever sent automatically.
  CREATE TABLE IF NOT EXISTS dist_outreach (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL REFERENCES dist_channels(id) ON DELETE CASCADE,
    body_type TEXT,                    -- employer / learning_center / …
    offer_model TEXT,
    channel_medium TEXT DEFAULT 'email', -- email / whatsapp / linkedin
    draft_text TEXT,
    state TEXT NOT NULL DEFAULT 'draft', -- draft / approved / sent
    approved_by TEXT,
    approved_at TEXT,
    sent_at TEXT,
    reply_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Experiments / pilots + their measured funnel. Numbers only, filled from
  -- real tracking — never seeded with fake data.
  CREATE TABLE IF NOT EXISTS dist_experiments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER NOT NULL REFERENCES dist_channels(id) ON DELETE CASCADE,
    offer TEXT,
    distribution TEXT,
    tracking_id TEXT,
    entries INTEGER,
    completions INTEGER,
    leads INTEGER,
    calls INTEGER,
    clients INTEGER,
    status TEXT NOT NULL DEFAULT 'planned', -- planned / running / done
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

/* ═══════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════ */

function normalize(str) {
  return String(str || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Stable dedup key from name + website/email so the same body isn't recorded twice.
function dedupHash(name, website, email) {
  const key = normalize(name) + "|" + normalize(website) + "|" + normalize(email);
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 16);
}

// Next tracking code for a channel kind, e.g. LM001, LM002 … Zero-padded, unique.
function nextChannelCode(kind) {
  const prefix = (KIND_BY_VALUE[kind] || KIND_BY_VALUE.other).code;
  const rows = db.prepare("SELECT channel_code FROM dist_channels WHERE channel_code LIKE ?").all(prefix + "%");
  let max = 0;
  for (const r of rows) {
    const n = parseInt(String(r.channel_code).slice(prefix.length), 10);
    if (Number.isInteger(n) && n > max) max = n;
  }
  return prefix + String(max + 1).padStart(3, "0");
}

function clampStr(v, len) {
  return typeof v === "string" ? v.trim().slice(0, len) : null;
}

function toInt(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = parseInt(v, 10);
  return Number.isInteger(n) ? n : null;
}

function mapRow(r) {
  if (!r) return null;
  const kind = KIND_BY_VALUE[r.channel_kind] || KIND_BY_VALUE.other;
  return {
    id: r.id,
    channelCode: r.channel_code,
    name: r.name,
    channelKind: r.channel_kind,
    channelKindLabel: kind.label,
    channelGroup: kind.group,
    oppType: r.opp_type,
    audience: r.audience,
    hasTeenParents: !!r.has_teen_parents,
    ages: r.ages,
    audienceSize: r.audience_size,
    audienceSizeStatus: r.audience_size_status,
    distributionMethod: r.distribution_method,
    whyYes: r.why_yes,
    offerModel: r.offer_model,
    qrLink: r.qr_link,
    contactName: r.contact_name,
    contactRole: r.contact_role,
    emailPublic: r.email_public,
    phonePublic: r.phone_public,
    website: r.website,
    region: r.region,
    sourceUrl: r.source_url,
    checkedAt: r.checked_at,
    priority: r.priority,
    priorityReason: r.priority_reason,
    measurable: !!r.measurable,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   CRUD
   ═══════════════════════════════════════════════════════════════════ */

function listChannels({ status, priority, kind } = {}) {
  let rows = db.prepare("SELECT * FROM dist_channels ORDER BY updated_at DESC").all();
  if (status && VALUES.status.has(status)) rows = rows.filter((r) => r.status === status);
  if (priority && VALUES.priority.has(priority)) rows = rows.filter((r) => r.priority === priority);
  if (kind && VALUES.kind.has(kind)) rows = rows.filter((r) => r.channel_kind === kind);
  return rows.map(mapRow);
}

function getChannel(id) {
  return mapRow(db.prepare("SELECT * FROM dist_channels WHERE id = ?").get(id));
}

function createChannel(input = {}) {
  const name = clampStr(input.name, 200);
  if (!name) return { error: "name_required", status: 400 };

  const channelKind = VALUES.kind.has(input.channelKind) ? input.channelKind : "other";
  const oppType = VALUES.opp.has(input.oppType) ? input.oppType : "AUDIENCE_OWNER";

  // Value Exchange discipline: no clear "why would they say yes" → forced LOW.
  const whyYes = clampStr(input.whyYes, 600);
  let priority = VALUES.priority.has(input.priority) ? input.priority : "MEDIUM";
  if (!whyYes) priority = "LOW";

  const website = clampStr(input.website, 300);
  const email = clampStr(input.emailPublic, 200);
  const hash = dedupHash(name, website, email);
  const dup = db.prepare("SELECT id, channel_code, name FROM dist_channels WHERE dedup_hash = ?").get(hash);
  if (dup) return { error: "duplicate", status: 409, existing: { id: dup.id, code: dup.channel_code, name: dup.name } };

  const code = nextChannelCode(channelKind);
  const stmt = db.prepare(`INSERT INTO dist_channels
    (channel_code, name, channel_kind, opp_type, audience, has_teen_parents, ages,
     audience_size, audience_size_status, distribution_method, why_yes, offer_model,
     qr_link, contact_name, contact_role, email_public, phone_public, website, region,
     source_url, checked_at, priority, priority_reason, measurable, status, notes, dedup_hash)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const info = stmt.run(
    code, name, channelKind, oppType,
    clampStr(input.audience, 300), input.hasTeenParents ? 1 : 0, clampStr(input.ages, 60),
    toInt(input.audienceSize), VALUES.metric.has(input.audienceSizeStatus) ? input.audienceSizeStatus : "UNKNOWN",
    clampStr(input.distributionMethod, 300), whyYes,
    VALUES.offer.has(input.offerModel) ? input.offerModel : null,
    clampStr(input.qrLink, 300), clampStr(input.contactName, 200), clampStr(input.contactRole, 120),
    email, clampStr(input.phonePublic, 60), website, clampStr(input.region, 120),
    clampStr(input.sourceUrl, 500), clampStr(input.checkedAt, 30),
    priority, clampStr(input.priorityReason, 400), input.measurable ? 1 : 0,
    VALUES.status.has(input.status) ? input.status : "DISCOVERED",
    clampStr(input.notes, 2000), hash
  );
  return { ok: true, channel: getChannel(info.lastInsertRowid) };
}

// Partial update. Only known fields are touched; unknown keys ignored.
const EDITABLE = {
  name: (v) => clampStr(v, 200),
  audience: (v) => clampStr(v, 300),
  ages: (v) => clampStr(v, 60),
  distributionMethod: (v) => clampStr(v, 300),
  whyYes: (v) => clampStr(v, 600),
  qrLink: (v) => clampStr(v, 300),
  contactName: (v) => clampStr(v, 200),
  contactRole: (v) => clampStr(v, 120),
  emailPublic: (v) => clampStr(v, 200),
  phonePublic: (v) => clampStr(v, 60),
  website: (v) => clampStr(v, 300),
  region: (v) => clampStr(v, 120),
  sourceUrl: (v) => clampStr(v, 500),
  checkedAt: (v) => clampStr(v, 30),
  priorityReason: (v) => clampStr(v, 400),
  notes: (v) => clampStr(v, 2000),
};
const COLUMN = {
  name: "name", audience: "audience", ages: "ages", distributionMethod: "distribution_method",
  whyYes: "why_yes", qrLink: "qr_link", contactName: "contact_name", contactRole: "contact_role",
  emailPublic: "email_public", phonePublic: "phone_public", website: "website", region: "region",
  sourceUrl: "source_url", checkedAt: "checked_at", priorityReason: "priority_reason", notes: "notes",
  channelKind: "channel_kind", oppType: "opp_type", offerModel: "offer_model",
  audienceSize: "audience_size", audienceSizeStatus: "audience_size_status",
  priority: "priority", status: "status", hasTeenParents: "has_teen_parents", measurable: "measurable",
};

function updateChannel(id, patch = {}) {
  const existing = db.prepare("SELECT * FROM dist_channels WHERE id = ?").get(id);
  if (!existing) return { error: "not_found", status: 404 };

  const sets = [];
  const args = [];
  const put = (col, val) => { sets.push(`${col} = ?`); args.push(val); };

  for (const [key, fn] of Object.entries(EDITABLE)) {
    if (key in patch) put(COLUMN[key], fn(patch[key]));
  }
  // Enums + typed fields, each validated.
  if ("channelKind" in patch && VALUES.kind.has(patch.channelKind)) put("channel_kind", patch.channelKind);
  if ("oppType" in patch && VALUES.opp.has(patch.oppType)) put("opp_type", patch.oppType);
  if ("offerModel" in patch) put("offer_model", VALUES.offer.has(patch.offerModel) ? patch.offerModel : null);
  if ("status" in patch && VALUES.status.has(patch.status)) put("status", patch.status);
  if ("priority" in patch && VALUES.priority.has(patch.priority)) put("priority", patch.priority);
  if ("audienceSize" in patch) put("audience_size", toInt(patch.audienceSize));
  if ("audienceSizeStatus" in patch && VALUES.metric.has(patch.audienceSizeStatus)) put("audience_size_status", patch.audienceSizeStatus);
  if ("hasTeenParents" in patch) put("has_teen_parents", patch.hasTeenParents ? 1 : 0);
  if ("measurable" in patch) put("measurable", patch.measurable ? 1 : 0);

  // Keep the Value-Exchange rule consistent on edits too.
  const nextWhy = "whyYes" in patch ? clampStr(patch.whyYes, 600) : existing.why_yes;
  if (!nextWhy) put("priority", "LOW");

  if (!sets.length) return { ok: true, channel: mapRow(existing), unchanged: true };
  put("updated_at", new Date().toISOString().replace("T", " ").slice(0, 19));
  args.push(id);
  db.prepare(`UPDATE dist_channels SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  return { ok: true, channel: getChannel(id) };
}

function deleteChannel(id) {
  const r = db.prepare("DELETE FROM dist_channels WHERE id = ?").run(id);
  return r.changes ? { ok: true } : { error: "not_found", status: 404 };
}

/* ═══════════════════════════════════════════════════════════════════
   Real counts only — no invented metrics. Empty pipeline → zeros, and the
   UI shows INSUFFICIENT DATA where a rate would need data we don't have.
   ═══════════════════════════════════════════════════════════════════ */

function pipelineStats() {
  const total = db.prepare("SELECT COUNT(*) AS c FROM dist_channels").get().c;
  const byStatus = {};
  for (const s of PIPELINE) byStatus[s.value] = 0;
  for (const r of db.prepare("SELECT status, COUNT(*) AS c FROM dist_channels GROUP BY status").all()) {
    if (r.status in byStatus) byStatus[r.status] = r.c;
  }
  const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const r of db.prepare("SELECT priority, COUNT(*) AS c FROM dist_channels GROUP BY priority").all()) {
    if (r.priority in byPriority) byPriority[r.priority] = r.c;
  }
  const awaitingApproval = byStatus.AWAITING_APPROVAL || 0;
  const distributing = byStatus.DISTRIBUTING || 0;
  const clients = byStatus.CLIENT || 0;
  const measurable = db.prepare("SELECT COUNT(*) AS c FROM dist_channels WHERE measurable = 1").get().c;
  return { total, byStatus, byPriority, awaitingApproval, distributing, clients, measurable };
}

function meta() {
  return {
    channelKinds: CHANNEL_KINDS,
    oppTypes: OPP_TYPES,
    pipeline: PIPELINE,
    priorities: PRIORITIES,
    offerModels: OFFER_MODELS,
    metricStatus: METRIC_STATUS,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   Outreach drafts — the agent PREPARES a message; Kety reviews, edits,
   and sends it herself. Nothing is ever sent automatically. Drafts are
   deterministic templates (no external AI needed), tailored to the body
   type, in Kety's warm, non-spammy voice.
   ═══════════════════════════════════════════════════════════════════ */

function greeting(contactName) {
  return contactName && contactName.trim() ? `שלום ${contactName.trim()}` : "שלום רב";
}
const SIGN = "\n\nבברכה,\nקטי שגב · CureMindset";
const VALUE_LINE = (why) => (why && why.trim() ? `\n\nחשבתי עליכם במיוחד כי ${why.trim()}.` : "");

// One template per body type. {g}=greeting, filled at build time.
function draftTemplate(channel) {
  const g = greeting(channel.contactName);
  const intro =
    "שמי קטי שגב, מאמנת מנטלית שעובדת עם בני נוער והורים בתחומי החוסן הרגשי, החרדה, הפחדים והביטחון העצמי.";
  const byKind = {
    employer:
      `${g},\n\n${intro}\n\nחלק גדול מהעובדים אצלכם הם הורים למתבגרים — וגיל ההתבגרות מביא איתו לא מעט לחץ, גם לילד וגם להורה. אשמח להציע לכם פעילות קצרה או כלי דיגיטלי להורים כחלק מהטבת הרווחה לעובדים: משהו שנותן ערך אמיתי בבית, לא עוד הרצאה כללית.`,
    learning_center:
      `${g},\n\n${intro}\n\nהרבה מההורים שמגיעים אליכם מתמודדים עם לחץ לימודי, חרדת מבחנים וירידה בביטחון העצמי אצל הילד. אשמח להציע לכם כלי משלים להורים — קצר ופרקטי — שנותן להם דרך לתמוך בילד גם רגשית, לצד הלמידה.`,
    sports_club:
      `${g},\n\n${intro}\n\nהמאמנים אצלכם רואים מקרוב את ההתמודדות הרגשית של בני הנוער — לחץ, ביטחון עצמי, התמודדות עם כישלון. אשמח להציע פעילות קצרה או תוכן להורים שנותן להם כלים ללוות את הילד גם ברגעים האלה.`,
    enrichment:
      `${g},\n\n${intro}\n\nלקהל ההורים שמגיע אליכם יש עניין אמיתי בהתפתחות הרגשית של הילד, לא רק בחוג עצמו. אשמח להציע פעילות קצרה או כלי דיגיטלי להורים בנושא חוסן וביטחון עצמי אצל מתבגרים.`,
    parent_community:
      `${g},\n\n${intro}\n\nאשמח לתרום לקהילה תוכן שימושי או פעילות קצרה סביב נושאים שמעסיקים כל הורה למתבגר — חרדה, ביטחון עצמי, לחץ והתמודדות. בלי מכירה, פשוט ערך אמיתי לחברי הקהילה.`,
    parenting_center:
      `${g},\n\n${intro}\n\nאתם כבר מציעים להורים ליווי וסדנאות. אשמח להיות שותפה — כמרצה או עם פעילות/כלי בתחום החוסן הרגשי והביטחון העצמי של מתבגרים — משהו שתוכלו להציע ללקוחות שלכם.`,
    loyalty_network:
      `${g},\n\n${intro}\n\nאשמח להציע לחברי המועדון שלכם הטבה בעלת ערך: כלי דיגיטלי או פעילות קצרה להורים למתבגרים בנושא חרדה, ביטחון וחוסן רגשי. הטבה שנותנת ערך אמיתי בבית.`,
    waiting_parent:
      `${g},\n\n${intro}\n\nבזמן שהילד בפעילות אצלכם, ההורה ממתין — וזה זמן מצוין לתת לו ערך. אשמח להציע פעילות קצרה להורים (15–30 דק') בנושא חוסן וביטחון עצמי אצל מתבגרים.`,
    mall_family:
      `${g},\n\n${intro}\n\nאשמח להציע פעילות קצרה או תוכן למשפחות סביב מועדי מפתח (חזרה לבית הספר, תקופת מבחנים, מעבר לחטיבה/תיכון) — "מתנה להורה" שנותנת ערך אמיתי ומחברת את המשפחות אליכם.`,
    other:
      `${g},\n\n${intro}\n\nאשמח לבחון יחד דרך לשתף פעולה ולתת ערך לקהל ההורים שלכם בתחום החוסן הרגשי, החרדה והביטחון העצמי של מתבגרים.`,
  };
  // A direct parent who asked for help publicly gets a gentle, non-salesy note.
  if (channel.oppType === "DIRECT_PARENT") {
    return `${g},\n\nקראתי מה שכתבת, וזה נגע בי. שמי קטי שגב, אני מאמנת מנטלית שמלווה בני נוער והורים סביב חרדה, ביטחון עצמי והתמודדות רגשית.\n\nאם בא לך, אשמח פשוט לדבר — בלי התחייבות — ולראות אם יש כאן משהו שאני יכולה לעזור בו.${SIGN}`;
  }
  const base = byKind[channel.channelKind] || byKind.other;
  const cta =
    "\n\nאם זה מעניין, אשמח לתאם שיחה קצרה כדי להתאים את זה בדיוק לקהל שלכם.";
  return base + VALUE_LINE(channel.whyYes) + cta + SIGN;
}

function mapDraftRow(r) {
  if (!r) return null;
  return {
    id: r.id, channelId: r.channel_id, bodyType: r.body_type, offerModel: r.offer_model,
    channelMedium: r.channel_medium, draftText: r.draft_text, state: r.state,
    approvedBy: r.approved_by, approvedAt: r.approved_at, sentAt: r.sent_at,
    replyAt: r.reply_at, createdAt: r.created_at,
  };
}

// Prepare (or return the latest) draft for a channel. EVIDENCE is not a lead,
// so it never gets an outreach draft.
function generateDraft(channelId, { regenerate = false, medium = "email" } = {}) {
  const channel = getChannel(channelId);
  if (!channel) return { error: "not_found", status: 404 };
  if (channel.oppType === "EVIDENCE") return { error: "evidence_not_lead", status: 400 };

  if (!regenerate) {
    const latest = db.prepare("SELECT * FROM dist_outreach WHERE channel_id = ? ORDER BY id DESC LIMIT 1").get(channelId);
    if (latest && latest.state === "draft") return { ok: true, draft: mapDraftRow(latest), channel };
  }

  const text = draftTemplate(channel);
  const info = db.prepare(
    `INSERT INTO dist_outreach (channel_id, body_type, offer_model, channel_medium, draft_text, state)
     VALUES (?,?,?,?,?, 'draft')`
  ).run(channelId, channel.channelKind, channel.offerModel || null, medium, text);

  // Move the channel to "waiting for Kety's approval" if it's earlier in the pipeline.
  const order = PIPELINE.findIndex((s) => s.value === channel.status);
  const awaitingIdx = PIPELINE.findIndex((s) => s.value === "AWAITING_APPROVAL");
  if (order >= 0 && order < awaitingIdx) {
    db.prepare("UPDATE dist_channels SET status = 'AWAITING_APPROVAL', updated_at = datetime('now') WHERE id = ?").run(channelId);
  }
  return { ok: true, draft: mapDraftRow(db.prepare("SELECT * FROM dist_outreach WHERE id = ?").get(info.lastInsertRowid)), channel: getChannel(channelId) };
}

function listDrafts(channelId) {
  return db.prepare("SELECT * FROM dist_outreach WHERE channel_id = ? ORDER BY id DESC").all(channelId).map(mapDraftRow);
}

// State transitions Kety controls. 'sent' also advances the channel to CONTACTED
// and stamps the time — she sends the message herself, then marks it here.
function setDraftState(id, state, { editedText } = {}) {
  if (!["draft", "approved", "sent"].includes(state)) return { error: "bad_state", status: 400 };
  const row = db.prepare("SELECT * FROM dist_outreach WHERE id = ?").get(id);
  if (!row) return { error: "not_found", status: 404 };
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  if (typeof editedText === "string" && editedText.trim()) {
    db.prepare("UPDATE dist_outreach SET draft_text = ? WHERE id = ?").run(editedText.trim().slice(0, 4000), id);
  }
  if (state === "approved") {
    db.prepare("UPDATE dist_outreach SET state = 'approved', approved_by = 'kety', approved_at = ? WHERE id = ?").run(now, id);
  } else if (state === "sent") {
    db.prepare("UPDATE dist_outreach SET state = 'sent', sent_at = ? WHERE id = ?").run(now, id);
    db.prepare("UPDATE dist_channels SET status = 'CONTACTED', updated_at = datetime('now') WHERE id = ?").run(row.channel_id);
  } else {
    db.prepare("UPDATE dist_outreach SET state = 'draft' WHERE id = ?").run(id);
  }
  return { ok: true, draft: mapDraftRow(db.prepare("SELECT * FROM dist_outreach WHERE id = ?").get(id)) };
}

/* ═══════════════════════════════════════════════════════════════════
   Daily Manager — the agent reviews the CRM (Audit-first) and returns the
   1–3 actions that move a lead forward TODAY. Real data only; an empty CRM
   returns a single "add your channels" action, never invented opportunities.
   ═══════════════════════════════════════════════════════════════════ */

function channelsWithOpenDraft() {
  const set = new Set();
  for (const r of db.prepare("SELECT DISTINCT channel_id FROM dist_outreach WHERE state IN ('draft','approved')").all()) set.add(r.channel_id);
  return set;
}

function dailyBriefing() {
  const channels = listChannels();
  const withDraft = channelsWithOpenDraft();
  const actions = [];
  const ref = (c) => ({ channelId: c.id, channelCode: c.channelCode, channelName: c.name });

  const isActive = (c) => !["CLIENT", "LOST", "NOT_A_FIT", "EVIDENCE"].includes(c.status) && c.oppType !== "EVIDENCE";
  const active = channels.filter(isActive);

  // 1) Drafts waiting for Kety's approval — highest priority.
  const awaiting = active.filter((c) => c.status === "AWAITING_APPROVAL" && withDraft.has(c.id));
  if (awaiting.length) {
    actions.push({
      type: "approve",
      text: awaiting.length === 1 ? "הכנתי פנייה אחת שמחכה לאישור שלך." : `הכנתי ${awaiting.length} פניות שמחכות לאישור שלך.`,
      items: awaiting.slice(0, 3).map(ref),
    });
  }

  // 2) Qualified, has a contact, no draft yet → ready for the agent to prepare.
  const readyToDraft = active.filter(
    (c) => ["QUALIFIED", "OFFER_READY", "DRAFT_READY"].includes(c.status) && c.contactName && !withDraft.has(c.id)
  );
  if (readyToDraft.length && actions.length < 3) {
    actions.push({
      type: "draft",
      text: `${readyToDraft.length === 1 ? "גוף אחד מוכן" : `${readyToDraft.length} גופים מוכנים`} להכנת פנייה — יש להם איש קשר.`,
      items: readyToDraft.slice(0, 3).map(ref),
    });
  }

  // 3) High-priority opportunities still early in the pipeline → verify/qualify.
  const toQualify = active.filter((c) => c.priority === "HIGH" && ["DISCOVERED", "VERIFIED"].includes(c.status));
  if (toQualify.length && actions.length < 3) {
    actions.push({
      type: "qualify",
      text: toQualify.length === 1 ? "הזדמנות אחת בעדיפות גבוהה ממתינה לאימות." : `${toQualify.length} הזדמנויות בעדיפות גבוהה ממתינות לאימות.`,
      items: toQualify.slice(0, 3).map(ref),
    });
  }

  // 4) Qualified but missing a contact → find one.
  const needContact = active.filter((c) => ["QUALIFIED", "OFFER_READY"].includes(c.status) && !c.contactName);
  if (needContact.length && actions.length < 3) {
    actions.push({
      type: "contact",
      text: `${needContact.length === 1 ? "גוף אחד מתאים אבל חסר" : `${needContact.length} גופים מתאימים אבל חסר להם`} איש קשר.`,
      items: needContact.slice(0, 3).map(ref),
    });
  }

  if (!channels.length) {
    actions.push({
      type: "empty",
      text: "המאגר עדיין ריק. הוסיפי את הגופים שכבר יש לך גישה אליהם — ומשם אתחיל לעבוד בשבילך.",
      items: [],
    });
  } else if (!actions.length) {
    actions.push({ type: "idle", text: "אין פעולה דחופה כרגע. אפשר להוסיף גופים חדשים או להתקדם עם קיימים.", items: [] });
  }

  const summary = {
    total: channels.length,
    active: active.length,
    awaitingApproval: awaiting.length,
    readyToDraft: readyToDraft.length,
    needContact: needContact.length,
  };
  return { generatedAt: new Date().toISOString(), summary, actions: actions.slice(0, 3) };
}

module.exports = {
  listChannels, getChannel, createChannel, updateChannel, deleteChannel,
  pipelineStats, meta,
  generateDraft, listDrafts, setDraftState, dailyBriefing,
  CHANNEL_KINDS, OPP_TYPES, PIPELINE, PRIORITIES, OFFER_MODELS, METRIC_STATUS,
};
