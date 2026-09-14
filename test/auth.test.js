"use strict";
// בדיקות ל-auth ולוולידציה (server/auth.js).
// משתמש ב-DB זמני כדי לא לגעת ב-DB האמיתי. הרצה: node --test
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

// חובה לפני require('../server/db'): מפנה את ה-DB לקובץ זמני.
const TMP_DB = path.join(os.tmpdir(), `cm-auth-test-${process.pid}.db`);
process.env.DB_FILE = TMP_DB;

const { hashPassword, registerAccount, loginAccount, createSessionForAccount, accountIdFromToken, destroySession } = require("../server/auth");

after(() => { try { fs.rmSync(TMP_DB, { force: true }); } catch (e) {} });

test("hashPassword — לא שומר טקסט גלוי, פורמט salt:hash, כל קריאה שונה", () => {
  const a = hashPassword("s3cret-pass");
  const b = hashPassword("s3cret-pass");
  assert.notEqual(a, "s3cret-pass", "אסור לשמור סיסמה בטקסט גלוי");
  assert.match(a, /^[0-9a-f]+:[0-9a-f]+$/, "פורמט salt:hash");
  assert.notEqual(a, b, "salt אקראי — שני hash שונים לאותה סיסמה");
});

test("login — סיסמה נכונה מצליחה, שגויה נכשלת עם הודעה גנרית", () => {
  const email = `login-${Date.now()}@example.com`;
  registerAccount({ email, password: "goodpass", fullName: "מיה" });
  const ok = loginAccount({ email, password: "goodpass" });
  assert.ok(ok.accountId, "התחברות תקינה");
  const bad = loginAccount({ email, password: "wrongpass" });
  assert.equal(bad.status, 401);
  // כלל אבטחה: שגיאה זהה למייל לא-קיים ולסיסמה שגויה — לא חושפת אם המייל רשום.
  const noUser = loginAccount({ email: "nobody@example.com", password: "whatever" });
  assert.equal(noUser.status, 401);
  assert.equal(bad.error, noUser.error, "הודעת שגיאה זהה — לא חושפת אם המייל קיים");
});

test("registerAccount — ולידציה: מייל לא תקין", () => {
  const r = registerAccount({ email: "not-an-email", password: "123456", fullName: "דנה" });
  assert.equal(r.status, 400);
  assert.match(r.error, /מייל/);
});

test("registerAccount — ולידציה: סיסמה קצרה מדי", () => {
  const r = registerAccount({ email: "a@b.com", password: "123", fullName: "דנה" });
  assert.equal(r.status, 400);
  assert.match(r.error, /סיסמה/);
});

test("registerAccount — ולידציה: שם חסר", () => {
  const r = registerAccount({ email: "a@b.com", password: "123456", fullName: "" });
  assert.equal(r.status, 400);
});

test("registerAccount — הרשמה תקינה ומניעת כפילות", () => {
  const email = `user-${Date.now()}@example.com`;
  const ok = registerAccount({ email, password: "123456", fullName: "יעל כהן" });
  assert.ok(ok.accountId, "צריך להחזיר accountId");
  assert.equal(ok.email, email);
  const dup = registerAccount({ email, password: "123456", fullName: "יעל כהן" });
  assert.equal(dup.status, 409, "מייל כפול צריך להחזיר 409");
});

test("session token — סיבוב יצירה/אימות/מחיקה", () => {
  const acc = registerAccount({ email: `sess-${Date.now()}@example.com`, password: "123456", fullName: "רוני" });
  const token = createSessionForAccount(acc.accountId);
  assert.equal(accountIdFromToken(token), acc.accountId);
  destroySession(token);
  assert.equal(accountIdFromToken(token), null, "אחרי logout הטוקן לא תקף");
  assert.equal(accountIdFromToken("bogus"), null);
});
