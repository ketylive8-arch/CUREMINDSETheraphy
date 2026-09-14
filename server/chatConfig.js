"use strict";
/**
 * server/chatConfig.js — תצורת ה-Guided Practice Companion (הבוט).
 * כפתורי פתיחה, כפתורי שליטה, disclaimer, וגזירת ציטוט מקור מתוצאות ה-RAG.
 * ה-AI אינו מטפל/מאבחן/חירום — כל זה נאכף כאן וב-safety.js וב-openai.js.
 */

// כפתורי פתיחה מוכנים (quick replies) — לפי מצבי הפעולה מהאפיון.
const STARTERS = [
  { id: "overwhelmed", label: "אני מוצפת עכשיו", mode: "sos" },
  { id: "cant-start", label: "קשה לי להתחיל", mode: "practice" },
  { id: "understand-pattern", label: "אני רוצה להבין דפוס", mode: "explain" },
  { id: "talk-to-child", label: "כלי לשיחה עם הילד/ה", mode: "parenting" },
  { id: "summarize-unit", label: "סכמי לי את היחידה", mode: "summary" },
];

// כפתורי שליטה שקיימים תמיד ליד כל תגובה.
const CONTROLS = [
  { id: "not-for-me", label: "לא מתאים לי", action: "reject" },
  { id: "need-human", label: "אני צריכה אדם", action: "human_support" },
];

const DISCLAIMER =
  'קטי הדיגיטלית היא מלווה לתרגול — לא מטפלת, לא מאבחנת, ולא שירות חירום. ' +
  'במצוקה מיידית: ער"ן 1201 · מד"א 101.';

// מיפוי קבצי מאגר הידע לכותרת ידידותית לציטוט (citation).
const KB_TITLES = {
  "00-shita-basis": "בסיס השיטה",
  "01-anxiety-protocol": "פרוטוקול חרדה",
  "02-neuroplasticity": "נוירופלסטיות",
  "03-vision-method": "שיטת החזון",
  "04-youth-modules": "מודולים לנוער",
  "05-anchor-home-protocol": "עוגן הבית",
  "06-identity-level-change": "שינוי רמת זהות",
  "07-future-pacing": "Future Pacing",
  "08-anxiety-strategy-elicitation": "מיפוי אסטרטגיית חרדה",
  "09-decision-making-4-rules": "קבלת החלטות",
  "10-youth-7-resilience-principles": "7 עקרונות חוסן לנוער",
  "11-values-beliefs-anchoring": "ערכים ואמונות",
  "12-youth-30day-motivation": "מוטיבציה לנוער",
  "13-three-stages-12-exercises": "שלושת השלבים",
  "14-alarm-model-day1": "מודל האזעקה",
  "15-case-betrayal-breakup-loss-of-self": "התמודדות עם אובדן",
  "16-cure-somatic-protection-shift": "CURE — שינוי סומטי",
  "17-cure-sensory-submodalities-method": "CURE — סאב-מודאליות",
  "18-cure-process-architecture": "ארכיטקטורת CURE",
};

function titleForFile(file) {
  const base = String(file || "").replace(/\.md$/, "").replace(/^.*\//, "");
  return KB_TITLES[base] || null;
}

/**
 * citationFor(retrieved) — מקבל את פלט retrieveKnowledge ([{file,text,score}])
 * ומחזיר ציטוט גלוי, או null אם אין מקור העובר סף (no-source).
 * סף שמרני: score>=0.5 כדי לא "להמציא" מקור.
 */
function citationFor(retrieved, minScore = 0.5) {
  if (!Array.isArray(retrieved) || !retrieved.length) return null;
  const top = retrieved.filter((r) => (r.score || 0) >= minScore)[0];
  if (!top) return null;
  const title = titleForFile(top.file);
  if (!title) return null;
  return { label: `מבוסס על: ${title}`, source: title, score: top.score };
}

module.exports = { STARTERS, CONTROLS, DISCLAIMER, citationFor, titleForFile };
