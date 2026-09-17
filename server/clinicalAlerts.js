// ── שלב C: מערכת התראות קלינית ─────────────────────────────────────────────
// מזהה מגמות (הידרדרות / שיפור / נטישה) ומתערבת *בזמן*: מייצרת "נגיעה" עדינה
// למשתמש/ת (נודניק חם, לא מפחיד) ומזינה פיד התראות לקטי (שלב D). בנוי מעל
// התמונה הקלינית (שלב A) — מה שה-CRM הישן, שמסתכל רק על הצ'ק-אין האחרון, לא תופס.

const { db } = require("./db");

// ── הערכת התראות מתוך הפרופיל הקליני ───────────────────────────────────────
// severity: high (דורש התייחסות) · medium (מעקב) · positive (ציון דרך).
// clientNudge = הטקסט העדין שרואה המשתמש/ת. therapistNote = מה שרואה קטי.
function evaluateAlerts(profile) {
  const alerts = [];
  const anx = (profile && profile.anxiety) || {};
  const risk = (profile && profile.risk) || {};
  const eng = (profile && profile.engagement) || {};
  const triggers = (profile && profile.topTriggers) || [];
  const topTrigger = triggers[0] && triggers[0].label;

  // הידרדרות: מגמת עלייה בחרדה או רמה גבוהה עקבית.
  if (risk.level === "attention" || (anx.recentAvg != null && anx.recentAvg >= 7.5)) {
    alerts.push({
      kind: "high_anxiety",
      severity: "high",
      clientNudge: "שמתי לב שהתקופה עמוסה יותר 🤍 בוא/י ניקח 60 שניות של קרקוע יחד — אני כאן.",
      therapistNote: `רמת חרדה גבוהה${anx.recentAvg != null ? ` (${anx.recentAvg}/10)` : ""}${topTrigger ? ` · טריגר מוביל: ${topTrigger}` : ""}.`,
    });
  } else if (anx.direction === "worsening") {
    alerts.push({
      kind: "worsening",
      severity: "medium",
      clientNudge: "התקופה קצת עולה במדרון 🌿 זה בסדר — בוא/י נחזור לכלי שהכי עוזר לך.",
      therapistNote: `מגמת עלייה בחרדה${anx.changePercent != null ? ` (${anx.changePercent}%+)` : ""}.`,
    });
  }

  // נטישה: סיכון לנשירה.
  if (eng.daysSinceActive != null && eng.daysSinceActive >= 6) {
    alerts.push({
      kind: "dropout_high",
      severity: "high",
      clientNudge: "מתגעגע/ת אליך פה 💛 שבוע בלי קשר — בוא/י נתחיל ממש קטן, רק צ'ק-אין אחד.",
      therapistNote: `${eng.daysSinceActive} ימים ללא פעילות — סיכון נשירה.`,
    });
  } else if (eng.daysSinceActive != null && eng.daysSinceActive >= 4) {
    alerts.push({
      kind: "dropout",
      severity: "medium",
      clientNudge: "לא התראינו כמה ימים 🌱 בלי לחץ — רגע קצר של צ'ק-אין מחזיר אותנו למסלול.",
      therapistNote: `${eng.daysSinceActive} ימים ללא פעילות.`,
    });
  }

  // שיפור / ציוני דרך — התראה חיובית (חיזוק, לא אזעקה).
  if (anx.direction === "improving" && anx.changePercent != null && anx.changePercent <= -20) {
    alerts.push({
      kind: "improvement",
      severity: "positive",
      clientNudge: `החרדה שלך ירדה ב-${Math.abs(anx.changePercent)}% מתחילת המסע 🎉 זה שלך — המשך/י ככה!`,
      therapistNote: `שיפור מובהק — ירידה של ${Math.abs(anx.changePercent)}% בחרדה.`,
    });
  }
  if ([7, 14, 30].includes(eng.streak)) {
    alerts.push({
      kind: `streak_${eng.streak}`,
      severity: "positive",
      clientNudge: `${eng.streak} ימים ברצף! 🔥 עקביות היא הכוח האמיתי — גאה בך.`,
      therapistNote: `ציון דרך: ${eng.streak} ימים ברצף.`,
    });
  }

  return alerts;
}

// ── התערבות בזמן: הזרקת "נגיעה" עדינה למשתמש/ת, עם מניעת ספאם ──────────────
// יוצר התראה במערכת ההודעות רק אם אותו סוג לא נוצר היום כבר. מתעד ל-clinical_alert_log
// כדי שגם קטי תראה את הפיד (שלב D) וכדי לדדפ.
function recordAndNudge(deviceToken, profile) {
  const alerts = evaluateAlerts(profile);
  const created = [];
  for (const a of alerts) {
    // דדופ יומי לפי סוג ההתראה.
    const existing = db
      .prepare("SELECT 1 FROM clinical_alert_log WHERE device_token = ? AND kind = ? AND date(created_at) = date('now') LIMIT 1")
      .get(deviceToken, a.kind);
    if (existing) continue;

    db.prepare(
      "INSERT INTO clinical_alert_log (device_token, kind, severity, therapist_note) VALUES (?, ?, ?, ?)"
    ).run(deviceToken, a.kind, a.severity, a.therapistNote || "");

    // נגיעה למשתמש/ת רק כשיש טקסט מתאים; סוג ההודעה קובע איקון/צבע בצד לקוח.
    if (a.clientNudge) {
      const notifType = a.severity === "positive" ? "win" : "care";
      db.prepare("INSERT INTO notifications (device_token, message, type) VALUES (?, ?, ?)").run(deviceToken, a.clientNudge, notifType);
    }
    created.push(a);
  }
  return created;
}

// פיד ההתראות של מטופל/ת אחד/ת לקטי (שלב D).
function recentAlertsForPatient(deviceToken, limit = 20) {
  return db
    .prepare("SELECT kind, severity, therapist_note, created_at FROM clinical_alert_log WHERE device_token = ? ORDER BY created_at DESC LIMIT ?")
    .all(deviceToken, limit);
}

module.exports = { evaluateAlerts, recordAndNudge, recentAlertsForPatient };
