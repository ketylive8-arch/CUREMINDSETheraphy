"use strict";
/**
 * server/safety.js — שכבת בטיחות קשיחה לעוזר ה-AI.
 *
 * מטרה: זיהוי סימני פגיעה עצמית / אובדנות / סכנה מיידית *בצד השרת*, לפני שמריצים
 * מנוע AI כלשהו — ולהחזיר הודעת בטיחות עם מספרי חירום אמיתיים בישראל.
 * זו הגנה בעומק (defense-in-depth) בנוסף להנחיות הפרומפט, לא במקומן.
 *
 * עיקרון: מוטב false-positive (הפניה לעזרה כשלא צריך) מ-false-negative.
 * עם זאת, הדפוסים נבחרו כביטויים ברורים כדי לא לתפוס "מת מצחוק" / "מת עליך".
 */

// ביטויים בעברית שמעידים על סיכון ממשי (phrase-based כדי לצמצם false positives).
const HE_PATTERNS = [
  /אובדני|אובדנ(ות|יים)/,
  /להתאבד|מתאבד(ת)?|התאבדות/,
  /רוצ(ה|ה כבר|ה פשוט)?\s*למות/,
  /לא\s*רוצ(ה|ה יותר)?\s*לחיות/,
  /נמאס\s*לי\s*לחיות/,
  /אין\s*לי\s*(סיבה|בשביל מה|טעם)\s*לחיות/,
  /לשים\s*סוף\s*ל(חיי|חיים|כל\s*זה)/,
  /לגמור\s*עם\s*(החיים|הכל|עצמי)/,
  /לפגוע\s*בעצמ(י|ה)|פגיעה\s*עצמית/,
  /לחתוך\s*את\s*עצמ(י|ה)|חתכתי\s*את\s*עצמ/,
  /בלעתי\s*כדורים|לבלוע\s*כדורים|מנת\s*יתר/,
  /לא\s*רוצ(ה)?\s*להיות\s*פה\s*יותר/,
  /(רוצה|מתכננ(ת)?)\s*לפגוע\s*ב/,     // סכנה לאחר
];

// כמה ביטויים באנגלית (למקרה של הקלדה מעורבת).
const EN_PATTERNS = [
  /suicid|kill myself|end my life|want to die|self.?harm|hurt myself|cut myself/i,
];

/**
 * detectCrisis(text) → { crisis: boolean }
 */
function detectCrisis(text) {
  const t = String(text || "");
  if (!t.trim()) return { crisis: false };
  const hit =
    HE_PATTERNS.some((re) => re.test(t)) || EN_PATTERNS.some((re) => re.test(t));
  return { crisis: hit };
}

const RESOURCES = [
  { name: 'ער"ן — עזרה ראשונה נפשית, 24/7', action: "חייגי 1201", tel: "1201" },
  { name: 'סה"ר — סיוע והקשבה בצ׳אט אנונימי', action: "sahar.org.il", url: "https://www.sahar.org.il/" },
  { name: "מצב חירום או סכנה מיידית — מד\"א", action: "חייגי 101", tel: "101" },
];

/**
 * safetyResponse(ageGroup) → הודעת בטיחות + מבנה safety.
 * לא מריצים AI ולא שומרים ניתוח צ׳ק-אין רגיל במצב הזה.
 */
function safetyResponse(ageGroup = "adult") {
  const isYouth = ageGroup === "youth";
  const opener = isYouth
    ? "עצרי רגע. מה שכתבת נשמע ממש כבד, ואני לא רוצה שתישארי עם זה לבד."
    : "עצרי רגע. מה שכתבת נשמע כמו כאב אמיתי וכבד, ואני לא רוצה שתישארי איתו לבד.";

  const bridge =
    "אני כלי לתרגול ואני לא איש מקצוע — וברגע כזה הכי חשוב לדבר עכשיו עם אדם אמיתי שיכול להיות איתך:";

  const lines = RESOURCES.map((r) => `• ${r.name}: ${r.action}`);
  if (isYouth) {
    lines.push("• יש מבוגר/ת שאת סומכת עליו/ה? זה הרגע לספר. את לא צריכה להתמודד עם זה לבד.");
  }

  const closer = isYouth
    ? "את יקרה, ומגיעה לך תמיכה אנושית. אני כאן כשתחזרי — אבל קודם, פני לאחד מהמקומות האלה. 🤍"
    : "את יקרה, ומגיע לך שמישהו יהיה איתך בזה. אני כאן כשתחזרי — אבל קודם, פני לאחד מהמקומות האלה. 🤍";

  const reply = [opener, "", bridge, ...lines, "", closer].join("\n");

  return {
    reply,
    safety: {
      safetyLevel: "crisis",
      needsHumanSupport: true,
      resources: RESOURCES,
    },
  };
}

module.exports = { detectCrisis, safetyResponse, RESOURCES };
