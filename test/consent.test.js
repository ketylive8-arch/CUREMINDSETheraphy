"use strict";
// בדיקות ל-ConsentRecord, Safety Check, ייצוא ומחיקת חשבון — דרך השרת האמיתי.
// הרצה: node --test test/consent.test.js
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const PORT = 8700 + (process.pid % 200);
const BASE = `http://127.0.0.1:${PORT}`;
const TMP_DB = path.join(os.tmpdir(), `cm-consent-test-${process.pid}.db`);
const DT = `consent-user-${Date.now()}`;
let srv;

const H = { "Content-Type": "application/json", "X-Device-Token": DT };
const post = (p, b) => fetch(`${BASE}${p}`, { method: "POST", headers: H, body: JSON.stringify(b) });
const get = (p) => fetch(`${BASE}${p}`, { headers: H });

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

test("GET /api/consent — מחזיר 9 סוגים, חובה, ומצב התחלתי ריק", async () => {
  const r = await get("/api/consent");
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.types.length, 9, "9 סוגי הסכמה");
  assert.ok(d.required.includes("platform_use") && d.required.includes("terms_privacy"));
  assert.equal(d.current.ai_use, false, "לא ניתנה הסכמה עדיין");
});

test("POST /api/consent — מתן הסכמות חובה מאפשר להמשיך", async () => {
  const r = await post("/api/consent", { consents: { platform_use: true, terms_privacy: true, ai_use: true } });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.canProceed, true);
  assert.equal(d.missingRequired.length, 0);
  assert.equal(d.current.ai_use, true);
});

test("POST /api/consent — ביטול הסכמת חובה חוסם המשך", async () => {
  await post("/api/consent", { consentType: "platform_use", granted: false });
  const r = await get("/api/consent");
  const d = await r.json();
  assert.equal(d.current.platform_use, false, "ההסכמה בוטלה (רשומה אחרונה קובעת)");
});

test("POST /api/consent — סוג לא תקין נדחה", async () => {
  const r = await post("/api/consent", { consentType: "not_a_real_type", granted: true });
  assert.equal(r.status, 400);
});

test("POST /api/safety/check — מצוקה → safe=false + מספרי חירום", async () => {
  const r = await post("/api/safety/check", { text: "אני רוצה למות" });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.safe, false);
  assert.match(d.reply, /1201/);
  assert.equal(d.safety.needsHumanSupport, true);
});

test("POST /api/safety/check — טקסט רגיל → safe=true", async () => {
  const r = await post("/api/safety/check", { text: "קצת לחוצה מהעבודה" });
  const d = await r.json();
  assert.equal(d.safe, true);
});

test("GET /api/account/export — מחזיר את נתוני המשתמשת עם הסכמות", async () => {
  const r = await get("/api/account/export");
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.userId, DT);
  assert.ok(Array.isArray(d.consents) && d.consents.length > 0, "כולל היסטוריית הסכמות");
});

test("POST /api/account/delete — דורש confirm; מוחק כשמאושר", async () => {
  const noConfirm = await post("/api/account/delete", {});
  assert.equal(noConfirm.status, 400, "בלי confirm — נחסם");
  const ok = await post("/api/account/delete", { confirm: true });
  assert.equal(ok.status, 200);
  const after = await (await get("/api/consent")).json();
  assert.equal(after.current.ai_use, false, "אחרי מחיקה — אין הסכמות");
});
