// Seeds the client console with a ready login account and ALL the leads the
// agent has located so far, split into clear categories — so when the owner
// logs in she immediately SEES everything inside the system (not in chat).
//
// Idempotent: the account is created once; leads are seeded only if the
// account has none yet. Safe to run on every startup.

const crypto = require("node:crypto");
const { db } = require("./db");
const { hashPassword } = require("./auth");
const clientLeads = require("./clientLeads");

// Ready login for the owner (change the password after first login).
const SEED_EMAIL = "segevmkg@gmail.com";
const SEED_PASSWORD = "Segev2026";
const SEED_NAME = "Segev Master Marketing";

const CAT_AMB = "CureMindset · הפצה / שגרירים צעירים";
const CAT_MED = "B2B · ציוד רפואי (מפיצים בחו\"ל)";
const CAT_HOTEL = "B2B · מלונות";

// name, type, region, category, why, email, sourceUrl
const LEADS = [
  // ---- CureMindset distribution / youth ambassadors ----
  ["מרכז הצעירים קריית ביאליק", "מרכז צעירים עירוני", "קריות", CAT_AMB, "מגיע ישירות לצעירי העיר — ערוץ לגיוס קבוצת שגרירים צעירים.", "career.ycb@gmail.com", "https://www.kolzchut.org.il/he/מרכז_צעירים_קריית_ביאליק"],
  ["עלם (ELEM)", "עמותת נוער", "ארצי/צפון", CAT_AMB, "עובדים עם נוער ומכירים את ההתמודדויות הרגשיות — ערוץ להגעה ולשגרירים.", "elem@elem.org.il", "https://www.elem.org.il/"],
  ["מועצת התלמידים והנוער הארצית — מחוז חיפה", "מועצת תלמידים ונוער", "חיפה", CAT_AMB, "חברי המועצה הם מנהיגי נוער נבחרים — שגרירים טבעיים.", "", "https://www.gov.il/he/departments/education"],
  ["מרכז צעירים קריית ים", "מרכז צעירים עירוני", "קריות", CAT_AMB, "מגיע לצעירי העיר; אפשר להקים קבוצת שגרירים.", "", "https://www.kolzchut.org.il/he/מרכז_צעירים_והון_אנושי_קריית_ים"],
  ["הנוער העובד והלומד — מרחב חיפה/קריות", "תנועת נוער", "חיפה/קריות", CAT_AMB, "המדריכים המתבגרים משפיעים ישירות על קבוצות החניכים.", "", "https://www.noal.co.il/"],
  ["המכבי הצעיר", "תנועת נוער", "חיפה/צפון", CAT_AMB, "מדריכים מתבגרים = שגרירים טבעיים בקבוצות.", "", "https://www.maccabitzair.org.il/"],
  ["עמותת נירים", "עמותת נוער", "צפון/גליל", CAT_AMB, "עובדים עם נוער — ערוץ להגעה ולשגרירים.", "", "https://www.kolzchut.org.il/he/נירים"],
  ["דרור בתי חינוך — קריית חיים", "עמותת נוער", "חיפה", CAT_AMB, "תוכנית המגיעה לנוער באזור חיפה.", "", "https://www.kolzchut.org.il/he/לילות_דרור_-_איתור_בני_נוער_בסיכון"],
  ["מערך המד\"צים — מחלקת נוער עיריית נהריה", "מנהיגות נוער (מד\"צים)", "נהריה", CAT_AMB, "קבוצת מנהיגות צעירה שמפיצה לבני גילה.", "", "https://www.nahariya.muni.il/"],
  ["יחידת הנוער — עיריית עכו", "יחידת נוער עירונית", "עכו", CAT_AMB, "מגיעה ישירות לבני הנוער בעיר.", "", "https://www.akko.org.il/"],
  ["תנועת הצופים — שבט בחיפה", "תנועת נוער", "חיפה", CAT_AMB, "הורי חניכים מתבגרים; מדריכים כשגרירים.", "", "https://www.zofim.org.il/"],
  ["בני עקיבא — סניף בקריות", "תנועת נוער", "קריות", CAT_AMB, "קומונרים ומדריכים צעירים מעבירים הלאה לחניכים.", "", "https://www.bneiakiva.org.il/"],

  // ---- B2B · medical devices (distributors abroad) ----
  ["Plas-Free (פלאס-פרי)", "ציוד רפואי — עצירת דימומים", "נצרת", CAT_MED, "סטארטאפ צעיר שצריך שווקים ומפיצים בחו\"ל.", "", "https://innovationisrael.org.il/"],
  ["BioBeat", "ציוד רפואי — ניטור לביש", "ישראל", CAT_MED, "מוצר מדף שמתאים להפצה בינלאומית.", "", "https://www.bio-beat.com/"],
  ["Discure Technologies", "ציוד רפואי — עמוד שדרה", "ישראל", CAT_MED, "טכנולוגיה חדשה שמחפשת חדירה לשוק.", "", "https://discuretech.com/"],
  ["Caps Medical", "ציוד רפואי — אבלציה", "ישראל", CAT_MED, "מכשור שמצריך מפיצים לפי מדינה.", "", "https://www.capsmedical.com/"],
  ["NanoVibronix", "ציוד רפואי — אולטרסאונד", "ישראל/ארה\"ב", CAT_MED, "כבר עובדים עם מפיצים — מרחיבים לשווקים חדשים.", "", "https://www.nanovibronix.com/"],

  // ---- B2B · hotels (the Isrotel-style pitch) ----
  ["רשת ישרוטל (Isrotel)", "רשת מלונות", "אילת/ארצי", CAT_HOTEL, "פניות רבות בערב/לילה/שבת — עובד דיגיטלי 24/7 שלא מפספס לידים.", "", "https://www.isrotel.co.il/"],
  ["רשת מלונות דן (Dan Hotels)", "רשת מלונות", "ארצי", CAT_HOTEL, "מענה מיידי לכל פנייה + רשימת המתנה לביטולים.", "", "https://www.danhotels.co.il/"],
  ["פתאל / לאונרדו (Fattal)", "רשת מלונות", "ארצי", CAT_HOTEL, "מאגר אורחים חוזרים ושיווק אוטומטי בזמנים שהם קובעים.", "", "https://www.fattal.co.il/"],
];

function ambBody(name) {
  return (
    "שלום רב,\n\n" +
    "שמי קטי שגב, מאמנת מנטלית שעובדת עם בני נוער בתחומי החוסן הרגשי, חרדה חברתית, פחדים וביטחון עצמי.\n\n" +
    "אני מפתחת תוכנית «שגרירים צעירים»: בני נוער מקבלים כלים פשוטים להתמודדות ומשתפים אותם עם חברים לגילם — כך המסר מגיע לצעירים בשפה שלהם.\n\n" +
    "חשבתי עליכם כי אתם מגיעים ישירות לצעירים ויכולים לחבר אותי לקבוצת שגרירים.\n\n" +
    "אשמח לשיחה קצרה כדי לבדוק אם זה מתאים — בלי עלות ובלי התחייבות.\n\n" +
    "בברכה,\nקטי שגב · CureMindset · ketysegev.com"
  );
}
function bizBody(name, kind) {
  const pain = kind === "hotel"
    ? "פתחתם מבצע והוא עובד יופי ואז מתחילות להגיע הפניות בערב ובלילה ובשבת\n\nמישהי יושבת בשתיים בלילה מתכננת חופשה וכותבת לכם כשכל המשפחה כבר ישנה\n\nבבוקר עונים על חלק מהפניות והחלק השני כבר הזמין במקום אחר"
    : "אתם פוגשים מפיץ מבטיח בתערוכה בחו\"ל שולחים לו חומר אחרי ואז שקט\n\nהפניות מחו\"ל מגיעות בלילה בגלל הפרשי השעות בשפה אחרת ועד שעונים הם כבר דיברו עם מתחרה";
  return (
    "שלום " + name + ",\n\n" +
    (kind === "hotel" ? "יש משהו שכל מי שמנהל מלון מכיר מקרוב\n\n" : "יש משהו שכל חברת מכשור רפואי שמייצאת מכירה\n\n") +
    pain + "\n\n" +
    "בדיוק בשביל זה אני מתקינה סוכן AI — עובד דיגיטלי שעובד 24/7 — עם מערכת לידים מלאה\n\n" +
    "הוא עונה לכל פנייה תוך שניות בוואטסאפ ובמייל בטון שאתם קובעים, עוקב ומזכיר עד שהליד נסגר, ובכל בוקר שולח דוח קצר\n\n" +
    "העלות שלו בערך כמו הוצאה חודשית קטנה, בלי משכורת בלי ימי מחלה ובלי חופשות\n\n" +
    "שווה לכם עשר דקות? ענו עם כן ואחזור אליכם עם שני מועדים לשיחת היכרות קצרה\n\n" +
    "בברכה,\nקטי שגב\nSegev Master Marketing Solution\nוואטסאפ: 054-230-6016\nלינקדאין: https://il.linkedin.com/in/ketysegev\n\n" +
    "קיבלת את המייל הזה פעם אחת בלבד. אם אינך מעוניין השב הסר."
  );
}

function ensureAccount() {
  const existing = db.prepare("SELECT id FROM accounts WHERE email = ?").get(SEED_EMAIL);
  if (existing) return existing.id;
  const id = crypto.randomUUID();
  db.prepare("INSERT INTO accounts (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)").run(
    id, SEED_EMAIL, hashPassword(SEED_PASSWORD), SEED_NAME
  );
  return id;
}

function seed() {
  clientLeads.ensureSchema();
  const accountId = ensureAccount();
  const existing = clientLeads.listLeads(accountId);
  if (existing.length) return { accountId, seeded: 0, total: existing.length };
  let n = 0;
  for (const [name, type, region, category, why, email, sourceUrl] of LEADS) {
    const isHotel = category === CAT_HOTEL;
    const isMed = category === CAT_MED;
    const subject = category === CAT_AMB
      ? "שגרירים צעירים · שת\"פ עם CureMindset (קטי שגב)"
      : (isHotel ? "כמה לקוחות נשמטים לכם בלילה" : "כמה מפיצים טובים נשמטים לכם בלילה");
    const body = category === CAT_AMB ? ambBody(name) : bizBody(name, isHotel ? "hotel" : "med");
    const r = clientLeads.createLead(accountId, { name, type, region, category, why, email, sourceUrl, subject, body, order: n + 1 });
    if (r.lead) n++;
  }
  return { accountId, seeded: n, total: n };
}

module.exports = { seed, SEED_EMAIL, SEED_PASSWORD };
