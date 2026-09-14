"use strict";
// בדיקות לקטלוג התוכן (ContentModule) — דרך השרת האמיתי. הרצה: node --test
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const PORT = 8900 + (process.pid % 200);
const BASE = `http://127.0.0.1:${PORT}`;
const TMP_DB = path.join(os.tmpdir(), `cm-content-test-${process.pid}.db`);
const DT = `content-user-${Date.now()}`;
let srv;
const get = (p) => fetch(`${BASE}${p}`, { headers: { "X-Device-Token": DT } });

async function waitReady(ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(`${BASE}/`); if (r.status < 500) return; } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server not ready");
}

before(async () => {
  try { fs.rmSync(TMP_DB, { force: true }); } catch {}
  srv = spawn(process.execPath, [path.join(__dirname, "..", "server", "index.js")], {
    env: { ...process.env, PORT: String(PORT), DB_FILE: TMP_DB }, stdio: "ignore",
  });
  await waitReady();
});
after(() => { if (srv) srv.kill("SIGKILL"); try { fs.rmSync(TMP_DB, { force: true }); } catch {} });

test("GET /api/content/modules — מחזיר קטלוג עם 10 נושאים", async () => {
  const r = await get("/api/content/modules");
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.ok(d.count >= 16, `צפויות לפחות 16 יחידות למבוגר (קיבלנו ${d.count})`);
  assert.equal(d.topics.length, 10, "10 נושאים");
});

test("GET /api/content/modules?topic=anxiety — סינון לפי נושא", async () => {
  const r = await get("/api/content/modules?topic=anxiety");
  const d = await r.json();
  assert.ok(d.modules.length >= 2, "לפחות 2 יחידות חרדה");
  assert.ok(d.modules.every((m) => m.topic === "anxiety"));
});

test("כל יחידה כוללת את שדות החובה מהאפיון", async () => {
  const d = await (await get("/api/content/modules")).json();
  for (const m of d.modules) {
    for (const f of ["title", "objective", "durationMin", "explanation", "exercise", "transcript", "reflection", "safetyNote", "nextStep"]) {
      assert.ok(m[f] !== undefined && m[f] !== null && m[f] !== "", `יחידה ${m.slug} חסרה ${f}`);
    }
    assert.ok(m.needsContentReview === true, "מסומן לאישור תוכן של קטי (TODO)");
  }
});

test("GET /api/content/modules/:slug — יחידה בודדת עם ציטוטי מקור", async () => {
  const r = await get("/api/content/modules/anxiety-alarm");
  assert.equal(r.status, 200);
  const m = await r.json();
  assert.equal(m.slug, "anxiety-alarm");
  assert.ok(Array.isArray(m.sources) && m.sources.length >= 1, "חייב ציטוט מקור");
  assert.ok(m.sources[0].title, "לציטוט יש כותרת");
});

test("GET /api/content/modules/:slug — לא קיים → 404", async () => {
  const r = await get("/api/content/modules/does-not-exist");
  assert.equal(r.status, 404);
});

test("יחידות נוער מסוננות החוצה למבוגר (audience gating)", async () => {
  const adult = await (await get("/api/content/modules?audience=adult")).json();
  assert.ok(!adult.modules.some((m) => m.audience === "youth"), "מבוגר לא רואה יחידות נוער");
  const youth = await (await get("/api/content/modules?audience=youth")).json();
  assert.ok(youth.modules.some((m) => m.audience === "youth"), "נוער רואה יחידות נוער");
});
