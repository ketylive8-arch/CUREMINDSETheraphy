// Per-tenant BUSINESS PROFILE — the short "business consultant" questionnaire a
// client fills on first login (business name, field, who they target, what they
// offer, tone). From it we build their outreach email template, so the system
// works for ANY client's business, not just CureMindset.
//
// One row per account_id (the registered tenant). Scoped by account_id like the
// leads, so one client can never see another's profile.

const { db } = require("./db");

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_profile_biz (
      account_id    TEXT PRIMARY KEY,
      business_name TEXT NOT NULL DEFAULT '',
      field         TEXT NOT NULL DEFAULT '',
      audience      TEXT NOT NULL DEFAULT '',
      offer         TEXT NOT NULL DEFAULT '',
      goal          TEXT NOT NULL DEFAULT '',
      tone          TEXT NOT NULL DEFAULT 'חם ואישי',
      contact       TEXT NOT NULL DEFAULT '',
      onboarded     INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // The owner can edit & save their own outreach wording — added to existing DBs.
  for (const c of [
    "ALTER TABLE client_profile_biz ADD COLUMN tpl_subject TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE client_profile_biz ADD COLUMN tpl_body TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE client_profile_biz ADD COLUMN answers TEXT NOT NULL DEFAULT '{}'",
  ]) { try { db.exec(c); } catch (e) { /* column exists */ } }
}

function rowToProfile(r) {
  if (!r) return null;
  return {
    businessName: r.business_name, field: r.field, audience: r.audience,
    offer: r.offer, goal: r.goal, tone: r.tone, contact: r.contact,
    tplSubject: r.tpl_subject || "", tplBody: r.tpl_body || "",
    answers: (function () { try { return JSON.parse(r.answers || "{}"); } catch (e) { return {}; } })(),
    onboarded: !!r.onboarded, updatedAt: r.updated_at,
  };
}

function getProfile(accountId) {
  return rowToProfile(db.prepare("SELECT * FROM client_profile_biz WHERE account_id = ?").get(accountId));
}

function saveProfile(accountId, data) {
  ensureSchema();
  const d = data || {};
  const clip = (v, n) => String(v == null ? "" : v).trim().slice(0, n);
  const vals = {
    business_name: clip(d.businessName, 160),
    field: clip(d.field, 160),
    audience: clip(d.audience, 300),
    offer: clip(d.offer, 600),
    goal: clip(d.goal, 300),
    tone: clip(d.tone, 60) || "חם ואישי",
    contact: clip(d.contact, 200),
  };
  if (!vals.business_name) return { error: "שם העסק חובה", status: 400 };
  const existing = getProfile(accountId);
  const answers = JSON.stringify(Object.assign({}, existing && existing.answers, (d.answers && typeof d.answers === "object") ? d.answers : {}));
  if (existing) {
    db.prepare(
      `UPDATE client_profile_biz SET business_name=?, field=?, audience=?, offer=?, goal=?, tone=?, contact=?, answers=?, onboarded=1, updated_at=datetime('now') WHERE account_id=?`
    ).run(vals.business_name, vals.field, vals.audience, vals.offer, vals.goal, vals.tone, vals.contact, answers, accountId);
  } else {
    db.prepare(
      `INSERT INTO client_profile_biz (account_id, business_name, field, audience, offer, goal, tone, contact, answers, onboarded)
       VALUES (?,?,?,?,?,?,?,?,?,1)`
    ).run(accountId, vals.business_name, vals.field, vals.audience, vals.offer, vals.goal, vals.tone, vals.contact, answers);
  }
  return { profile: getProfile(accountId) };
}

// Save the owner's own edited outreach wording (subject + body). Empty strings
// clear it and fall back to the auto-generated template.
function saveTemplate(accountId, subject, body) {
  ensureSchema();
  if (!db.prepare("SELECT 1 FROM client_profile_biz WHERE account_id = ?").get(accountId)) {
    return { error: "מלא קודם את פרטי העסק", status: 400 };
  }
  db.prepare("UPDATE client_profile_biz SET tpl_subject=?, tpl_body=?, updated_at=datetime('now') WHERE account_id=?")
    .run(String(subject || "").slice(0, 300), String(body || "").slice(0, 8000), accountId);
  return { profile: getProfile(accountId) };
}

// Build a ready outreach email (subject + body) FROM the client's business TO a
// prospect in their field. Uses the owner's edited wording when they saved one,
// otherwise composes it from the questionnaire. Pure template, always works.
function buildTemplate(profile) {
  const p = profile || {};
  if ((p.tplSubject && p.tplSubject.trim()) || (p.tplBody && p.tplBody.trim())) {
    return { subject: p.tplSubject || "", body: p.tplBody || "", custom: true };
  }
  const biz = p.businessName || "העסק שלנו";
  const offer = p.offer || "שירות שעוזר לעסקים כמוכם לצמוח";
  const audience = p.audience || "עסקים בתחום";
  const goal = p.goal || "להגדיל פניות ולסגור יותר";
  const contact = p.contact || "";
  const subject = `הצעה קצרה מ-${biz}` + (p.field ? ` · ל${p.field}` : "");
  const body =
    `שלום [שם הגוף],\n\n` +
    `שמי ${biz}. אנחנו עובדים עם ${audience}, ועוזרים ${goal}.\n\n` +
    `${offer}\n\n` +
    `חשבתי עליכם כי זה בדיוק מתאים למה שאתם עושים — ואשמח ל-10 דקות שיחה קצרה כדי לבדוק אם זה רלוונטי, בלי עלות ובלי התחייבות.\n\n` +
    `שווה לכם? ענו "כן" ואחזור עם שני מועדים.\n\n` +
    `בברכה,\n${biz}` + (contact ? `\n${contact}` : "");
  return { subject, body };
}

ensureSchema();

module.exports = { ensureSchema, getProfile, saveProfile, saveTemplate, buildTemplate };
