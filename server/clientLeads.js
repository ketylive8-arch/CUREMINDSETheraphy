// Multi-tenant lead console — per-client ("tenant") lead storage.
//
// Every row belongs to one account_id (a registered client). EVERY query and
// mutation here is scoped by account_id, so one client can never read or change
// another client's leads — the whole point of turning Kety's private cockpit
// into a product her clients each use on their own data.
//
// Reuses the existing `accounts` / `auth_sessions` auth (see auth.js): the API
// layer resolves account_id from the X-Auth-Token header and passes it in here.

const crypto = require("node:crypto");
const { db } = require("./db");

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS client_leads (
      id          TEXT PRIMARY KEY,
      account_id  TEXT NOT NULL,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL DEFAULT '',
      region      TEXT NOT NULL DEFAULT '',
      why         TEXT NOT NULL DEFAULT '',
      email       TEXT NOT NULL DEFAULT '',
      source_url  TEXT NOT NULL DEFAULT '',
      subject     TEXT NOT NULL DEFAULT '',
      body        TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'new',
      sent_at     TEXT,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_client_leads_acct ON client_leads(account_id);
  `);
}

const EDITABLE = ["name", "type", "region", "why", "email", "source_url", "subject", "body", "status", "sort_order", "sent_at"];

function rowToLead(r) {
  if (!r) return null;
  return {
    id: r.id, name: r.name, type: r.type, region: r.region, why: r.why,
    email: r.email, sourceUrl: r.source_url, subject: r.subject, body: r.body,
    status: r.status, sentAt: r.sent_at || "", order: r.sort_order, createdAt: r.created_at,
  };
}

function listLeads(accountId) {
  const rows = db
    .prepare("SELECT * FROM client_leads WHERE account_id = ? ORDER BY sort_order ASC, created_at ASC")
    .all(accountId);
  return rows.map(rowToLead);
}

function getLead(accountId, id) {
  return rowToLead(db.prepare("SELECT * FROM client_leads WHERE id = ? AND account_id = ?").get(id, accountId));
}

function createLead(accountId, data) {
  const d = data || {};
  const id = crypto.randomUUID();
  const maxRow = db.prepare("SELECT MAX(sort_order) AS m FROM client_leads WHERE account_id = ?").get(accountId);
  const order = Number.isFinite(d.order) ? d.order : ((maxRow && maxRow.m) || 0) + 1;
  const name = String(d.name || "").trim().slice(0, 200);
  if (!name) return { error: "שם הגוף חובה", status: 400 };
  db.prepare(
    `INSERT INTO client_leads (id, account_id, name, type, region, why, email, source_url, subject, body, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, accountId, name,
    String(d.type || "").slice(0, 120), String(d.region || "").slice(0, 120),
    String(d.why || "").slice(0, 2000), String(d.email || "").trim().slice(0, 200),
    String(d.sourceUrl || d.source_url || "").slice(0, 500), String(d.subject || "").slice(0, 300),
    String(d.body || "").slice(0, 8000), String(d.status || "new").slice(0, 20), order
  );
  return { lead: getLead(accountId, id) };
}

function updateLead(accountId, id, patch) {
  const existing = getLead(accountId, id);
  if (!existing) return { error: "לא נמצא", status: 404 };
  const map = { sourceUrl: "source_url", sentAt: "sent_at", order: "sort_order" };
  const sets = [], vals = [];
  for (const [k, v] of Object.entries(patch || {})) {
    const col = map[k] || k;
    if (!EDITABLE.includes(col)) continue;
    sets.push(`${col} = ?`);
    vals.push(col === "sort_order" ? Number(v) || 0 : (v == null ? "" : String(v).slice(0, 8000)));
  }
  if (!sets.length) return { lead: existing };
  // account_id in the WHERE keeps the write tenant-scoped even if an id is guessed.
  vals.push(id, accountId);
  db.prepare(`UPDATE client_leads SET ${sets.join(", ")} WHERE id = ? AND account_id = ?`).run(...vals);
  return { lead: getLead(accountId, id) };
}

function deleteLead(accountId, id) {
  const existing = getLead(accountId, id);
  if (!existing) return { error: "לא נמצא", status: 404 };
  db.prepare("DELETE FROM client_leads WHERE id = ? AND account_id = ?").run(id, accountId);
  return { ok: true };
}

function markSent(accountId, id, when) {
  return updateLead(accountId, id, { status: "sent", sentAt: when || new Date().toISOString() });
}

function stats(accountId) {
  const leads = listLeads(accountId);
  return {
    total: leads.length,
    sent: leads.filter((l) => l.status === "sent").length,
    ready: leads.filter((l) => l.status !== "sent" && l.email).length,
    needEmail: leads.filter((l) => l.status !== "sent" && !l.email).length,
  };
}

ensureSchema();

module.exports = { ensureSchema, listLeads, getLead, createLead, updateLead, deleteLead, markSent, stats };
