"use strict";
// בדיקות למנוע ההפצה (server/leadEngine.js) — שלב 0: CRM + Pipeline.
// DB זמני, לא נוגע ב-DB האמיתי. הרצה: node --test
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { test, after } = require("node:test");
const assert = require("node:assert/strict");

const TMP_DB = path.join(os.tmpdir(), `cm-leadengine-test-${process.pid}.db`);
process.env.DB_FILE = TMP_DB;

const le = require("../server/leadEngine");

after(() => { try { fs.rmSync(TMP_DB, { force: true }); } catch {} });

test("meta — אוצר המילים המבוקר מלא ותקין", () => {
  const m = le.meta();
  assert.equal(m.pipeline.length, 15, "15 שלבי pipeline");
  assert.equal(m.offerModels.length, 7, "7 מודלי הצעה");
  assert.equal(m.priorities.length, 3, "3 עדיפויות");
  assert.ok(m.oppTypes.some((o) => o.value === "EVIDENCE"), "EVIDENCE קיים");
});

test("create — מזהה מעקב לפי סוג ערוץ + ברירת מחדל DISCOVERED", () => {
  const r = le.createChannel({
    name: "מרכז למידה אופק", channelKind: "learning_center", oppType: "HOST",
    whyYes: "ערך נוסף להורים סביב לחץ לימודי", hasTeenParents: true,
    region: "חיפה", measurable: true, priority: "HIGH",
  });
  assert.ok(r.ok, "נוצר בהצלחה");
  assert.equal(r.channel.channelCode, "LM001", "מזהה LM001");
  assert.equal(r.channel.status, "DISCOVERED");
  assert.equal(r.channel.priority, "HIGH");
});

test("Value Exchange — ללא why_yes העדיפות מאולצת ל-LOW", () => {
  const r = le.createChannel({ name: "קהילת הורים לגליל", channelKind: "parent_community", priority: "HIGH" });
  assert.ok(r.ok);
  assert.equal(r.channel.priority, "LOW", "בלי Value Exchange → LOW");
  assert.equal(r.channel.channelCode, "PC001");
});

test("dedup — אותו שם+אימייל נחסם עם 409", () => {
  le.createChannel({ name: "עמותת נוער", emailPublic: "hi@amuta.example" });
  const dup = le.createChannel({ name: "עמותת נוער", emailPublic: "hi@amuta.example" });
  assert.equal(dup.error, "duplicate");
  assert.equal(dup.status, 409);
  assert.ok(dup.existing && dup.existing.code, "מחזיר את הרשומה הקיימת");
});

test("update — קידום שלב ב-pipeline + אכיפת enum", () => {
  const c = le.createChannel({ name: "מועדון ספורט", channelKind: "sports_club", whyYes: "כלים להורים" });
  const up = le.updateChannel(c.channel.id, { status: "AWAITING_APPROVAL" });
  assert.equal(up.channel.status, "AWAITING_APPROVAL");
  const bad = le.updateChannel(c.channel.id, { status: "NONSENSE" });
  assert.equal(bad.channel.status, "AWAITING_APPROVAL", "סטטוס לא חוקי נדחה בשקט");
});

test("stats — ספירה אמיתית בלבד, בלי המצאה", () => {
  const s = le.pipelineStats();
  assert.equal(s.total, le.listChannels().length);
  assert.equal(typeof s.awaitingApproval, "number");
  assert.ok(s.byStatus.CLIENT === 0, "אין לקוחות מומצאים");
});

test("delete — הסרה מחזירה not_found לרשומה שלא קיימת", () => {
  const c = le.createChannel({ name: "רשת מועדון", channelKind: "loyalty_network" });
  assert.ok(le.deleteChannel(c.channel.id).ok);
  assert.equal(le.deleteChannel(999999).error, "not_found");
});
