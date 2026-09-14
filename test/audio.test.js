"use strict";
// בדיקות לתור אישור האודיו (audioSeed + helpers). DB זמני. הרצה: node --test
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const TMP_DB = path.join(os.tmpdir(), `cm-audio-test-${process.pid}.db`);
process.env.DB_FILE = TMP_DB;

const dbmod = require("../server/db");
const { seedContent } = require("../server/contentSeed");
const { seedAudioCandidates } = require("../server/audioSeed");

before(() => { seedContent(); seedAudioCandidates(); });
after(() => { try { fs.rmSync(TMP_DB, { force: true }); } catch {} });

test("seed — מועמדי אודיו נכנסים כ-pending, ממופים ליחידות קיימות", () => {
  const pending = dbmod.listAudioCandidates("pending");
  assert.ok(pending.length >= 10, `לפחות 10 מועמדים (קיבלנו ${pending.length})`);
  // כל suggested_slug חייב להצביע על יחידה קיימת בקטלוג
  for (const c of pending) {
    assert.ok(dbmod.getContentModule(c.suggested_slug), `יחידה קיימת ל-${c.title}`);
    assert.equal(c.rights_status, "owned");
  }
});

test("approve — משייך אודיו ליחידה ומעדכן סטטוס", () => {
  const c = dbmod.listAudioCandidates("pending").find((x) => x.suggested_slug === "selfimage-inner-critic");
  assert.ok(c, "יש מועמד ל'הקול המבקר'");
  const r = dbmod.approveAudioCandidate(c.id, "kety");
  assert.equal(r.ok, true);
  const mod = dbmod.getContentModule("selfimage-inner-critic");
  assert.ok(mod.audioUrl && mod.audioUrl.includes("drive.google.com"), "audioUrl שויך ליחידה");
  assert.equal(dbmod.listAudioCandidates("approved").some((x) => x.id === c.id), true);
});

test("reject — מסמן נדחה, לא משייך", () => {
  const c = dbmod.listAudioCandidates("pending")[0];
  const r = dbmod.rejectAudioCandidate(c.id, "kety");
  assert.equal(r.ok, true);
  assert.equal(dbmod.listAudioCandidates("rejected").some((x) => x.id === c.id), true);
});

test("approve — מזהה לא קיים → 404", () => {
  const r = dbmod.approveAudioCandidate("nope-does-not-exist");
  assert.equal(r.status, 404);
});
