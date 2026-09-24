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

test("draft — הסוכן מכין פנייה מותאמת ומקדם ל-AWAITING_APPROVAL", () => {
  const c = le.createChannel({ name: "מרכז אופק", channelKind: "learning_center", oppType: "HOST", whyYes: "הרבה הורים בלחץ מבחנים", contactName: "דנה", status: "QUALIFIED", priority: "HIGH" });
  const r = le.generateDraft(c.channel.id);
  assert.ok(r.ok);
  assert.equal(r.draft.state, "draft");
  assert.match(r.draft.draftText, /שלום דנה/, "פנייה בשם איש הקשר");
  assert.match(r.draft.draftText, /לחץ לימודי/, "נוסח מותאם למרכז למידה");
  assert.equal(r.channel.status, "AWAITING_APPROVAL", "הערוץ עבר להמתנה לאישור");
});

test("draft — EVIDENCE אף פעם לא מקבל פנייה", () => {
  const c = le.createChannel({ name: "פוסט בפורום", channelKind: "other", oppType: "EVIDENCE" });
  assert.equal(le.generateDraft(c.channel.id).error, "evidence_not_lead");
});

test("draft — 'נשלח' מקדם את הערוץ ל-CONTACTED", () => {
  const c = le.createChannel({ name: "מועדון ספורט הצפון", channelKind: "sports_club", oppType: "HOST", whyYes: "מאמנים רואים לחץ", contactName: "רון" });
  const d = le.generateDraft(c.channel.id);
  const s = le.setDraftState(d.draft.id, "sent");
  assert.equal(s.draft.state, "sent");
  assert.equal(le.getChannel(c.channel.id).status, "CONTACTED");
});

test("briefing — נתונים אמיתיים בלבד, מקסימום 3 פעולות", () => {
  const empty = le.dailyBriefing();
  assert.ok(Array.isArray(empty.actions));
  assert.ok(empty.actions.length <= 3);
  assert.ok(empty.summary.total === le.listChannels().length);
});

/* ── Daily agent ── */
const agent = require("../server/leadEngine.js") && require("../server/leadAgent.js");

test("agent — ללא מפתח חיפוש: לא ממציא לידים, מתעד ריצה", async () => {
  delete process.env.GOOGLE_SEARCH_KEY;
  delete process.env.GOOGLE_SEARCH_CX;
  const before = le.listChannels().length;
  const r = await agent.runDailyAgent();
  assert.equal(r.ok, false);
  assert.equal(r.reason, "no_search_key");
  assert.equal(le.listChannels().length, before, "לא נוספו לידים מומצאים");
});

test("agent — חיפוש מדומה מוסיף לידים, ממפה קוד מעקב, ומייל נשלח", async () => {
  const fakeSearch = async (q) => ([
    { title: "מתנ\"ס בדיקה | אתר - סלוגן", link: "https://t-" + encodeURIComponent(q.slice(0, 3)) + ".org.il", snippet: "הרצאות להורים" },
  ]);
  let sent = null;
  const fakeEmail = async (to, subject, fields) => { sent = { to, subject, fields }; return { sent: true }; };
  const r = await agent.runDailyAgent({ searchFn: fakeSearch, emailFn: fakeEmail });
  assert.equal(r.ok, true);
  assert.ok(r.added >= 1, "נוסף לפחות ליד אחד");
  assert.ok(sent && /לידים חדשים/.test(sent.subject), "נשלח מייל סיכום");
  assert.equal(sent.to, "ketyse@gmail.com");
});

test("agent — ריצה שנייה באותו יום: כפילויות, בלי כפילים במאגר", async () => {
  const fakeSearch = async () => ([{ title: "גוף קבוע", link: "https://fixed.org.il", snippet: "" }]);
  const fakeEmail = async () => ({ sent: true });
  await agent.runDailyAgent({ searchFn: fakeSearch, emailFn: fakeEmail });
  const r2 = await agent.runDailyAgent({ searchFn: fakeSearch, emailFn: fakeEmail });
  assert.ok(r2.duplicates >= 1, "זוהתה כפילות");
});
