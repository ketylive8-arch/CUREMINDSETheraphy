// זריעת משתמשת בדיקה — יעל, בת 18, מתמודדת עם דחייה חברתית.
// רץ אוטומטית בעליית השרת רק אם מוגדר SEED_DEMO_USER=1 ב-Environment (ברנדר).
// אידמפוטנטי: אם החשבון כבר קיים — לא עושה כלום.
//
// פרטי התחברות לבדיקה:  yael@curemindset.test  /  test1234

const crypto = require("node:crypto");
const { db, ensurePatient } = require("./db");
const { hashPassword } = require("./auth");

const DEMO_EMAIL = "yael@curemindset.test";
const DEMO_PASSWORD = "test1234";

function seedDemoUser() {
  const existing = db.prepare("SELECT id FROM accounts WHERE email = ?").get(DEMO_EMAIL);
  if (existing) return { email: DEMO_EMAIL, password: DEMO_PASSWORD, already: true };

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO accounts (id, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)").run(
    id,
    DEMO_EMAIL,
    hashPassword(DEMO_PASSWORD),
    "יעל (משתמשת בדיקה)",
    null
  );
  ensurePatient(id);
  db.prepare("UPDATE patients SET display_name = ? WHERE device_token = ?").run("יעל (משתמשת בדיקה)", id);
  db.prepare("UPDATE patient_profile SET age_group = 'youth' WHERE device_token = ?").run(id);

  // ── היסטוריית שאלות ותשובות (כאילו יעל כבר שוחחה עם ה-AI) ──
  const checkins = [
    {
      text: "יש לי חבורה בכיתה ואני מרגישה שאף אחד לא באמת רוצה אותי שם. כל פעם שאני מנסה להצטרף לשיחה זה יוצא לי מוזר והם ממשיכים בלעדיי.",
      reply:
        "אני שומעת כמה זה כואב להרגיש בחוץ דווקא כשאת כן מנסה. זה לא אומר עלייך שום דבר רע — זה אומר שהמצב הזה טעון בשבילך. בואי ננסה משהו קטן: בפעם הבאה, במקום להיכנס לשיחה שכבר רצה, לפני זה קחי שלוש נשימות ותשימי יד על הלב. המשימה שלך היום: להגיד לעצמך משפט אחד טוב לפני שאת נכנסת לכיתה.",
      triggers: JSON.stringify([{ area: "חברתי", status: "דחייה נתפסת", intensity: "high", note: "תחושת חוסר שייכות בכיתה" }]),
      patterns: JSON.stringify([{ title: "פרשנות של דחייה", description: "מפרשת אירועים ניטרליים כדחייה אישית" }]),
      wins: JSON.stringify([{ title: "המשיכה לנסות", description: "למרות הקושי, יעל ממשיכה לנסות להשתלב" }]),
    },
    {
      text: "היום בכלל לא ניסיתי. ישבתי לבד בהפסקה כי פחדתי שאם אתקרב שוב ידחו אותי.",
      reply:
        "תודה שאת כנה איתי, זה אומץ בפני עצמו. הפחד להידחות שוב הוא הגיוני — הוא מנסה להגן עלייך. אבל שימי לב: הוא גם משאיר אותך לבד. בואי נזכור שהמוח שלנו לומד דרך חזרה. כל צעד קטן ובטוח מלמד אותו שאפשר אחרת. המשימה להיום: להגיד 'היי' לאדם אחד בלבד, בלי ציפייה לכלום.",
      triggers: JSON.stringify([{ area: "חברתי", status: "הימנעות", intensity: "medium", note: "נמנעת ממגע חברתי מתוך פחד" }]),
      patterns: JSON.stringify([{ title: "הימנעות מגוננת", description: "נמנעת ממצבים חברתיים כדי לא להיפגע" }]),
      wins: JSON.stringify([{ title: "כנות עצמית", description: "מסוגלת לזהות ולשתף את הפחד שלה" }]),
    },
    {
      text: "אמרתי היי לבחורה אחת מהכיתה והיא חייכה אליי וענתה. זה היה קטן אבל הרגשתי משהו טוב.",
      reply:
        "וואו יעל, זה בכלל לא קטן — זה ניצחון אמיתי! עשית בדיוק את הצעד שהכי הפחיד אותך, והמציאות הפתיעה אותך לטובה. זה בדיוק איך שהמוח בונה מסלול חדש: חוויה טובה אחת, ועוד אחת. בואי נעגן את זה — המשימה להיום: לכתוב את הרגע הזה ואיך הוא הרגיש בגוף, כדי שנוכל לחזור אליו.",
      triggers: JSON.stringify([]),
      patterns: JSON.stringify([{ title: "מסלול חדש נבנה", description: "חוויה חברתית חיובית מתחילה לאזן את דפוס הדחייה" }]),
      wins: JSON.stringify([
        { title: "יזמה קשר חברתי", description: "אמרה שלום ראשונה וקיבלה תגובה חמה" },
        { title: "זיהתה תחושה טובה", description: "הצליחה להרגיש ולתעד רגע חיובי" },
      ]),
    },
  ];
  const insCheckin = db.prepare(
    "INSERT INTO checkins (device_token, text, ai_reply, triggers, patterns, balance_alerts, wins, created_at) VALUES (?, ?, ?, ?, ?, '[]', ?, datetime('now', ?))"
  );
  checkins.forEach((c, i) => {
    const daysAgo = `-${checkins.length - i} days`;
    insCheckin.run(id, c.text, c.reply, c.triggers, c.patterns, c.wins, daysAgo);
  });

  // ── מדריך יומי / משימות סיום יום ──
  const tasks = [
    { title: "משפט עוגן לפני הכיתה", description: "לפני הכניסה לכיתה: שלוש נשימות, יד על הלב, ומשפט 'אני מספיקה כמו שאני'.", category: "breathing", completed: 1 },
    { title: "היי אחד ביום", description: "להגיד שלום לאדם אחד, בלי ציפייה לכלום — רק התרגול עצמו הוא ההצלחה.", category: "social", completed: 1 },
    { title: "יומן ניצחונות", description: "בסוף היום לכתוב רגע אחד קטן שהרגיש בו טוב, ואיך זה הרגיש בגוף.", category: "journaling", completed: 0 },
    { title: "מסגור מחדש", description: "לתפוס מחשבה של 'דוחים אותי' ולנסח אותה מחדש: 'זה לא הצליח הפעם, וזה בסדר'.", category: "mindfulness", completed: 0 },
  ];
  const insTask = db.prepare(
    "INSERT INTO daily_tasks (device_token, title, description, category, completed, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))"
  );
  tasks.forEach((t, i) => insTask.run(id, t.title, t.description, t.category, t.completed, `-${tasks.length - i} days`));

  // ── תזכורות ותרגולים באזור האישי ──
  const notes = [
    { message: "בוקר טוב יעל! זכרי את משפט העוגן לפני הכיתה היום. שלוש נשימות ואת שם.", type: "reminder" },
    { message: "כל הכבוד על ה'היי' אתמול — זה ניצחון אמיתי. מוכנה לצעד קטן נוסף היום?", type: "win" },
    { message: "אל תשכחי את יומן הניצחונות הערב. רגע אחד טוב מספיק.", type: "reminder" },
  ];
  const insNote = db.prepare("INSERT INTO notifications (device_token, message, type) VALUES (?, ?, ?)");
  notes.forEach((n) => insNote.run(id, n.message, n.type));

  // התקדמות בשלבים
  db.prepare("UPDATE protocol_progress SET unlocked = 3, completed = '[1,2]' WHERE device_token = ?").run(id);

  return { email: DEMO_EMAIL, password: DEMO_PASSWORD, already: false };
}

module.exports = { seedDemoUser, DEMO_EMAIL, DEMO_PASSWORD };
