"use strict";
// בדיקות לשכבת הבטיחות של ה-AI (server/safety.js).
// הרצה: node --test
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { detectCrisis, safetyResponse } = require("../server/safety");

test("detectCrisis מזהה ביטויי פגיעה עצמית / אובדנות", () => {
  const positives = [
    "אני רוצה למות",
    "לא רוצה לחיות יותר",
    "חשבתי לפגוע בעצמי",
    "אין לי טעם לחיות",
    "אובדני",
    "I want to kill myself",
    "end my life",
  ];
  for (const t of positives) {
    assert.equal(detectCrisis(t).crisis, true, `היה צריך לזהות מצוקה: "${t}"`);
  }
});

test("detectCrisis לא מפעיל false-positive על שפה יומיומית", () => {
  const negatives = [
    "אני מת מצחוק",
    "מת עליך אחותי",
    "אני בלחץ מהמבחן מחר",
    "היה לי יום קשה בעבודה",
    "אני עייף היום",
    "",
    "   ",
  ];
  for (const t of negatives) {
    assert.equal(detectCrisis(t).crisis, false, `לא היה צריך לזהות מצוקה: "${t}"`);
  }
});

test("safetyResponse מחזיר מספרי חירום ומבנה בטיחות תקין", () => {
  const r = safetyResponse("adult");
  assert.match(r.reply, /1201/, 'חייב להכיל את מספר ער"ן 1201');
  assert.match(r.reply, /101/, 'חייב להכיל את מספר מד"א 101');
  assert.equal(r.safety.safetyLevel, "crisis");
  assert.equal(r.safety.needsHumanSupport, true);
  assert.ok(Array.isArray(r.safety.resources) && r.safety.resources.length >= 2);
});

test("safetyResponse לנוער כולל פנייה למבוגר", () => {
  const r = safetyResponse("youth");
  assert.match(r.reply, /מבוגר/, "גרסת הנוער צריכה לעודד פנייה למבוגר");
});
