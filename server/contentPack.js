"use strict";
/**
 * server/contentPack.js — טוען את חבילת התוכן (pack-v1.json) למסד הנתונים.
 *
 * לפי מסמך "CureMindset — חבילת תוכן ומסמך דרישות" (סעיף 0.4):
 *   כל יחידה, הקלטה ותהליך נכנסים למאגר בסטטוס 'draft'.
 *   קטי מאשרת ל-'approved' מפאנל הניהול. שום דבר לא מוצג ללקוחה לפני אישור.
 *
 * הטעינה היא INSERT OR IGNORE — הרצה חוזרת לא דורסת פריטים קיימים ולא מבטלת
 * אישורים שקטי כבר נתנה. עדכון תוכן של פריט קיים נעשה במפורש דרך upsertFromPack.
 */
const fs = require("fs");
const path = require("path");
const { db } = require("./db");

const PACK_PATH = path.join(__dirname, "content", "pack-v1.json");

function ensureTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_pack_units (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT,
      stage INTEGER,
      type TEXT,
      minutes INTEGER,
      topics TEXT,          -- JSON array
      audience TEXT,        -- JSON array
      audio TEXT,           -- audio id or null
      sos INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',   -- draft / approved / archived
      data TEXT,            -- full unit JSON
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS content_pack_audio (
      id TEXT PRIMARY KEY,
      title TEXT,
      drive_file_id TEXT,
      drive_filename TEXT,
      topics TEXT,
      stage INTEGER,
      usage TEXT,
      transcript TEXT,      -- ממולא אחרי תמלול; null עד אז
      audio_url TEXT,       -- קישור מקומי/מאוחסן אחרי הורדה+המרה
      status TEXT DEFAULT 'draft',   -- draft / approved / excluded
      hold INTEGER DEFAULT 0,        -- 1 = טיוטה שמחכה להחלטת קטי
      data TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS content_pack_processes (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT,
      audience TEXT,
      topics TEXT,
      trial INTEGER DEFAULT 0,
      site_page TEXT,
      status TEXT DEFAULT 'draft',
      data TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_cp_units_status ON content_pack_units (status);
    CREATE INDEX IF NOT EXISTS idx_cp_proc_status ON content_pack_processes (status);
  `);
}

function readPack() {
  const raw = fs.readFileSync(PACK_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * טעינה ראשונית — לא דורסת. פריט שכבר קיים (לפי id) נשאר כמו שהוא,
 * כולל הסטטוס שקטי קבעה. מחזיר ספירה של מה שנוסף.
 */
function seedContentPack() {
  ensureTables();
  const pack = readPack();
  let units = 0, audio = 0, procs = 0;

  const uIns = db.prepare(`INSERT OR IGNORE INTO content_pack_units
    (id, slug, title, stage, type, minutes, topics, audience, audio, sos, status, data)
    VALUES (?,?,?,?,?,?,?,?,?,?, 'draft', ?)`);
  for (const u of pack.units || []) {
    const r = uIns.run(
      u.id, u.slug || null, u.title || null, u.stage || null, u.type || null,
      u.minutes || null, JSON.stringify(u.topics || []), JSON.stringify(u.audience || []),
      u.audio || null, u.sos ? 1 : 0, JSON.stringify(u)
    );
    units += r.changes || 0;
  }

  const aIns = db.prepare(`INSERT OR IGNORE INTO content_pack_audio
    (id, title, drive_file_id, drive_filename, topics, stage, usage, transcript, status, hold, data)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  for (const a of pack.audio || []) {
    const r = aIns.run(
      a.id, a.title || null, a.drive_file_id || null, a.drive_filename || null,
      JSON.stringify(a.topics || []), a.stage || null, a.usage || null,
      a.transcript || null, a.status || "draft", a.hold ? 1 : 0, JSON.stringify(a)
    );
    audio += r.changes || 0;
  }

  const pIns = db.prepare(`INSERT OR IGNORE INTO content_pack_processes
    (id, slug, title, audience, topics, trial, site_page, status, data)
    VALUES (?,?,?,?,?,?,?, 'draft', ?)`);
  for (const p of pack.processes || []) {
    const r = pIns.run(
      p.id, p.slug || null, p.title || null, JSON.stringify(p.audience || []),
      JSON.stringify(p.topics || []), p.trial ? 1 : 0, p.site_page || null, JSON.stringify(p)
    );
    procs += r.changes || 0;
  }

  return { units, audio, processes: procs, version: (pack.meta && pack.meta.version) || "1.0" };
}

/* ── עזרי אדמין (לשימוש פאנל הניהול של קטי) ── */

function listUnits(status) {
  const sql = status
    ? "SELECT id, slug, title, stage, type, topics, audience, audio, sos, status FROM content_pack_units WHERE status = ? ORDER BY id"
    : "SELECT id, slug, title, stage, type, topics, audience, audio, sos, status FROM content_pack_units ORDER BY id";
  const rows = status ? db.prepare(sql).all(status) : db.prepare(sql).all();
  return rows.map(mapRow);
}

function getUnit(id) {
  const row = db.prepare("SELECT * FROM content_pack_units WHERE id = ?").get(id);
  if (!row) return null;
  try { return JSON.parse(row.data); } catch { return mapRow(row); }
}

function listAudio(status) {
  const sql = status
    ? "SELECT id, title, drive_file_id, topics, stage, usage, transcript, audio_url, status, hold FROM content_pack_audio WHERE status = ? ORDER BY id"
    : "SELECT id, title, drive_file_id, topics, stage, usage, transcript, audio_url, status, hold FROM content_pack_audio ORDER BY id";
  const rows = status ? db.prepare(sql).all(status) : db.prepare(sql).all();
  return rows.map(mapRow);
}

function listProcesses(status) {
  const sql = status
    ? "SELECT id, slug, title, audience, topics, trial, site_page, status FROM content_pack_processes WHERE status = ? ORDER BY id"
    : "SELECT id, slug, title, audience, topics, trial, site_page, status FROM content_pack_processes ORDER BY id";
  const rows = status ? db.prepare(sql).all(status) : db.prepare(sql).all();
  return rows.map(mapRow);
}

function getProcess(idOrSlug) {
  const row = db.prepare("SELECT * FROM content_pack_processes WHERE id = ? OR slug = ?").get(idOrSlug, idOrSlug);
  if (!row) return null;
  try { return JSON.parse(row.data); } catch { return mapRow(row); }
}

const TABLE_BY_KIND = { unit: "content_pack_units", audio: "content_pack_audio", process: "content_pack_processes" };

/** קטי מאשרת/מארכבת פריט מפאנל הניהול. status חוקי: draft/approved/archived (excluded לאודיו). */
function setStatus(kind, id, status) {
  const table = TABLE_BY_KIND[kind];
  if (!table) throw new Error("unknown kind: " + kind);
  const allowed = ["draft", "approved", "archived", "excluded"];
  if (!allowed.includes(status)) throw new Error("invalid status: " + status);
  const r = db.prepare(`UPDATE ${table} SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
  return { changed: r.changes || 0 };
}

/** מעדכן שדה תמלול/קישור אודיו אחרי הורדה ותמלול. */
function setAudioMedia(id, { transcript, audio_url } = {}) {
  const r = db.prepare(
    "UPDATE content_pack_audio SET transcript = COALESCE(?, transcript), audio_url = COALESCE(?, audio_url), updated_at = datetime('now') WHERE id = ?"
  ).run(transcript || null, audio_url || null, id);
  return { changed: r.changes || 0 };
}

/** מחזיר רק תוכן מאושר — זה מה שמותר להציג ללקוחה. */
function approvedForClient() {
  return {
    units: listUnits("approved"),
    audio: listAudio("approved"),
    processes: listProcesses("approved"),
  };
}

function mapRow(row) {
  const out = { ...row };
  for (const k of ["topics", "audience"]) {
    if (typeof out[k] === "string") { try { out[k] = JSON.parse(out[k]); } catch { /* keep */ } }
  }
  if ("sos" in out) out.sos = !!out.sos;
  if ("hold" in out) out.hold = !!out.hold;
  if ("trial" in out) out.trial = !!out.trial;
  return out;
}

module.exports = {
  seedContentPack,
  listUnits, getUnit,
  listAudio, setAudioMedia,
  listProcesses, getProcess,
  setStatus,
  approvedForClient,
};
