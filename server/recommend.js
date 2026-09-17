// ── שלב B: מנוע ההתאמה ─────────────────────────────────────────────────────
// עכשיו כשיש למערכת תמונה קלינית (שלב A), הקומפניון בוחר בעצמו את התרגול/הצעד
// הנכון *לרגע הזה* — לפי מגמת החרדה, שעת השיא, הטריגר החוזר, ומה שכבר עזר בפועל.
// לא רשימה קבועה: המלצה אחת, מדויקת, עם נימוק אנושי בעברית ו-CTA לפעולה.
//
// מודול טהור: מקבל את הפרופיל הקליני (מ-clinicalProfile.js) + הקשר, מחזיר אובייקט המלצה.

// קטלוג מיקרו-תרגולים — קצרים, מבוססי-שיטה, מקוטלגים לפי הצורך הקליני שהם עונים עליו.
const PRACTICES = {
  grounding_now: {
    title: "קרקוע מהיר — 60 שניות",
    description: "חמש נשימות איטיות, כף יד על הלב, ומשפט: \"אני כאן, ברגע הזה, ואני בטוח/ה\". זה מרגיע את מערכת העצבים תוך דקה.",
    category: "breathing",
    targetStage: 5,
    ctaLabel: "בואי נתרגל יחד",
  },
  evening_winddown: {
    title: "ריטואל הרגעה לפני השינה",
    description: "עשר דקות לפני המיטה: אור עמום, נשימה 4-7-8, ושחרור מודע של מה שקרה היום. אתה/את מלמד/ת את הגוף שהלילה בטוח.",
    category: "mindfulness",
    targetStage: 5,
    ctaLabel: "לתרגול הערב",
  },
  morning_anchor: {
    title: "עוגן בוקר",
    description: "לפני שהיום מתחיל — נשימה עמוקה אחת ומשפט כוונה: \"היום אני בוחר/ת איך להגיב\". דקה שמכתיבה את הטון.",
    category: "mindfulness",
    targetStage: 5,
    ctaLabel: "להתחיל את הבוקר",
  },
  social_boundary: {
    title: "כלל בית אחד",
    description: "כתוב/כתבי משפט אחד: \"הדבר שלא נכנס לי יותר הביתה הוא ___\". הצבת גבול קטן היא שריר שמתחזק בכל פעם.",
    category: "journaling",
    targetStage: 5,
    ctaLabel: "לכתוב את הגבול שלי",
  },
  reframe_thought: {
    title: "סגירת מחשבה טורדנית",
    description: "בחר/י מחשבה אחת שחוזרת, כתוב/כתבי אותה, וסמן/י לעצמך \"סגורה להיום\". המוח לומד שאפשר להניח.",
    category: "journaling",
    targetStage: 5,
    ctaLabel: "לשחרר מחשבה",
  },
  wins_journal: {
    title: "יומן ניצחונות קטנים",
    description: "שלושה דברים שעשית טוב היום — קטנים ככל שיהיו. זה מאמן את המוח לזהות את הטוב, לא רק את האיום.",
    category: "journaling",
    targetStage: 5,
    ctaLabel: "לרשום ניצחון",
  },
  movement_release: {
    title: "שחרור דרך תנועה",
    description: "שתי דקות של תנועה חופשית — מתיחה, ריקוד, הליכה. הגוף משחרר את מה שהמילים לא תמיד מצליחות.",
    category: "movement",
    targetStage: 5,
    ctaLabel: "לזוז ולשחרר",
  },
  connect_reach: {
    title: "רגע של חיבור",
    description: "שלח/י הודעה קצרה לאדם אחד שאכפת לך ממנו. חיבור אנושי הוא אחד המווסתים החזקים ביותר של חרדה.",
    category: "social",
    targetStage: 5,
    ctaLabel: "ליצור קשר",
  },
  checkin_gentle: {
    title: "צ'ק-אין קצר איתי",
    description: "רק כמה מילים על איך את/ה מרגיש/ה עכשיו. אני כאן, בלי שיפוט — וכל שיתוף מחדד את הליווי שלך.",
    category: "mindfulness",
    targetStage: 5,
    ctaLabel: "לפתוח צ'ק-אין",
  },
};

// מיפוי קטגוריה → מפתח מיקרו-תרגול, לחיזוק "מה שכבר עוזר".
const CATEGORY_TO_PRACTICE = {
  breathing: "grounding_now",
  mindfulness: "checkin_gentle",
  journaling: "wins_journal",
  movement: "movement_release",
  social: "connect_reach",
};

function pick(key, reason, priority) {
  return { ...PRACTICES[key], key, reason, priority };
}

// ── הבחירה: מדרג את הצורך הקליני הדחוף ביותר ומחזיר המלצה תואמת ──────────────
function buildRecommendation(profile, { ageGroup = "adult", hour = new Date().getHours() } = {}) {
  const anx = (profile && profile.anxiety) || {};
  const risk = (profile && profile.risk) || {};
  const peak = (profile && profile.peakTimes) || {};
  const triggers = (profile && profile.topTriggers) || [];
  const helps = (profile && profile.whatHelps && profile.whatHelps.helpfulCategories) || [];
  const eng = (profile && profile.engagement) || {};

  const candidates = [];

  // 1. עדיפות עליונה — מצוקה עכשיו: חרדה גבוהה או מגמת עלייה ⇒ קרקוע מיידי.
  if (risk.level === "attention" || anx.direction === "worsening" || (anx.recentAvg != null && anx.recentAvg >= 7)) {
    candidates.push(pick("grounding_now", "שמתי לב שהתקופה עמוסה יותר — בוא/י ניקח רגע להרגיע את הגוף לפני הכל.", 100));
  }

  // 2. נטישה — לא היינו בקשר: הזמנה עדינה חזרה.
  if (eng.daysSinceActive != null && eng.daysSinceActive >= 3) {
    candidates.push(pick("checkin_gentle", `לא התראינו כבר ${eng.daysSinceActive} ימים. בלי לחץ — אפילו רגע קצר מחזיר אותנו למסלול.`, 80));
  }

  // 3. שעת שיא מותאמת-זמן: אם עכשיו קרוב לשעת השיא הקשה של המשתמש/ת.
  const nowPart = hour >= 5 && hour <= 11 ? "morning" : hour >= 12 && hour <= 16 ? "noon" : hour >= 17 && hour <= 21 ? "evening" : "night";
  if (peak.dominant && peak.dominant === nowPart) {
    if (nowPart === "night" || nowPart === "evening") candidates.push(pick("evening_winddown", "אלו השעות שנוטות להיות מאתגרות עבורך — בוא/י נרכך אותן יחד.", 70));
    else if (nowPart === "morning") candidates.push(pick("morning_anchor", "הבקרים נוטים להיות עמוסים אצלך — נתחיל את היום מעוגן.", 70));
  }

  // 4. טריגר חוזר: מכוונים תרגול לנושא שחוזר הכי הרבה.
  const topTrigger = triggers[0] && String(triggers[0].label || "");
  if (topTrigger) {
    if (/חבר|יחס|זוג|משפח|גבול|אנשים|חברת/.test(topTrigger)) candidates.push(pick("social_boundary", `"${topTrigger}" חוזר אצלך — נתרגל הצבת גבול קטן ובריא.`, 60));
    else if (/מחשב|דאג|טורד|ראש|לחזור|אובססי/.test(topTrigger)) candidates.push(pick("reframe_thought", `"${topTrigger}" חוזר אצלך — ננסה לשחרר מחשבה אחת שתופסת מקום.`, 60));
    else if (/שינה|לילה|עייפ/.test(topTrigger)) candidates.push(pick("evening_winddown", `"${topTrigger}" עולה אצלך — ריטואל ערב עדין יכול לעזור.`, 60));
    else if (/עבוד|לחץ|עומס|זמן/.test(topTrigger)) candidates.push(pick("movement_release", `"${topTrigger}" מעמיס עליך — שחרור קצר דרך הגוף מוריד מתח.`, 55));
  }

  // 5. חיזוק מה שעובד: אם יש קטגוריה שכבר עזרה — נבנה עליה.
  if (helps[0] && CATEGORY_TO_PRACTICE[helps[0].category]) {
    candidates.push(pick(CATEGORY_TO_PRACTICE[helps[0].category], `ראיתי שתרגולי ${helps[0].label} עוזרים לך בפועל — נחזור למה שעובד בשבילך.`, 40));
  }

  // 6. ברירת מחדל לפי מגמה חיובית / התחלה.
  if (anx.direction === "improving") candidates.push(pick("wins_journal", "את/ה בכיוון הנכון — בוא/י נחזק את זה עם יומן ניצחונות קטן.", 30));
  candidates.push(pick("checkin_gentle", "רגע קצר של צ'ק-אין תמיד מקרב אותנו צעד.", 10));

  candidates.sort((a, b) => b.priority - a.priority);
  const chosen = candidates[0];

  return {
    key: chosen.key,
    title: chosen.title,
    description: chosen.description,
    category: chosen.category,
    reason: chosen.reason,
    ctaLabel: chosen.ctaLabel,
    targetStage: chosen.targetStage,
    basedOn: {
      anxietyDirection: anx.direction || null,
      riskLevel: risk.level || null,
      peakTime: peak.label || null,
      topTrigger: topTrigger || null,
    },
  };
}

module.exports = { buildRecommendation, PRACTICES };
