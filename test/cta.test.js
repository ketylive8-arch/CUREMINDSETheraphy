"use strict";
// חוזה ה-CTA (סעיף 11A): כפתור מוצר לא מוביל לוואטסאפ כברירת מחדל.
// נכשל אם CTA ראשי של מוצר מחזיר wa.me. הרצה: node --test
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const WORKSHOPS = ["workshop-inner-compass.html", "workshop-cure-teens.html", "workshop-organizations.html"];

test("עמודי הסדנאות: אף כפתור primary לא מוביל לוואטסאפ", () => {
  for (const f of WORKSHOPS) {
    const html = read(f);
    assert.equal(/class="btn primary" href="https:\/\/wa\.me/.test(html), false, `${f}: primary → wa.me`);
    assert.equal(/class="cta-top" href="https:\/\/wa\.me/.test(html), false, `${f}: cta-top → wa.me`);
  }
});

test("עמודי הסדנאות: ה-CTA הראשי מוביל ל-Calendly (שיחה/שריון אמיתי)", () => {
  for (const f of WORKSHOPS) {
    const html = read(f);
    assert.match(html, /class="cta-top" href="https:\/\/calendly\.com/, `${f}: cta-top → calendly`);
    assert.match(html, /class="btn primary" href="https:\/\/calendly\.com/, `${f}: hero primary → calendly`);
  }
});

test("עמודי הסדנאות: טופס הליד נשלח לשרת (/api/send-lead), לא לוואטסאפ", () => {
  for (const f of WORKSHOPS) {
    const html = read(f);
    assert.match(html, /fetch\('\/api\/send-lead'/, `${f}: form posts to /api/send-lead`);
    assert.equal(/window\.open\([^)]*wa\.me/.test(html), false, `${f}: form must not open wa.me on submit`);
  }
});

test("דף הבית: כפתור 'ניסיון חינם' בניווט פותח את המערכת (onEnterApp), לא וואטסאפ", () => {
  const app = read("app.js");
  // כפתור ה-CTA של הניווט משתמש ב-onEnterApp
  assert.match(app, /onClick=\{onEnterApp\} size="md">\s*\{CONTENT\.nav\.cta\}/, "nav CTA (desktop) → onEnterApp");
  assert.match(app, /onEnterApp\(\); \}\} className="w-full">\s*\{CONTENT\.nav\.cta\}/, "nav CTA (mobile) → onEnterApp");
});
