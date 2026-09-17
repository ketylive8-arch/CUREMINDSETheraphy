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

module.exports = {
  listChannels, getChannel, createChannel, updateChannel, deleteChannel,
  pipelineStats, meta,
  CHANNEL_KINDS, OPP_TYPES, PIPELINE, PRIORITIES, OFFER_MODELS, METRIC_STATUS,
};
