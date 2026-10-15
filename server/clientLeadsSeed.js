// Seeds the lead SYSTEM (Segev MKG B2B lead product) with every B2B lead we
// located — split into clear categories. This system is SEPARATE from the
// CureMindset website/coaching: it holds business leads only (medical-device
// distributors, hotels, and any segment the owner adds), never website content.
//
// Idempotent: the owner account is created once; an account's leads are seeded
// only when it has none. Safe to run on every startup.

const crypto = require("node:crypto");
const { db } = require("./db");
const { hashPassword } = require("./auth");
const clientLeads = require("./clientLeads");

// Ready login for the owner (change the password after first login).
const SEED_EMAIL = "segevmkg@gmail.com";
const SEED_PASSWORD = "Segev2026";
const SEED_NAME = "Segev Master Marketing";

const CAT_MED = "מפיצים · ציוד רפואי (חו\"ל)";
const CAT_HOTEL = "מלונות";

// name, type, region, category, why, email, sourceUrl
const LEADS = [
  // ───── מפיצים / חברות מדיקל (צריכים מפיצים/שווקים בחו"ל) ─────
  ["Plas-Free (פלאס-פרי)", "ציוד רפואי — עצירת דימומים", "נצרת", CAT_MED, "סטארטאפ צעיר שצריך שווקים ומפיצים בחו\"ל.", "", "https://innovationisrael.org.il/"],
  ["BioBeat", "ציוד רפואי — ניטור לביש", "ישראל", CAT_MED, "מוצר מדף שמתאים להפצה בינלאומית.", "", "https://www.bio-beat.com/"],
  ["Discure Technologies", "ציוד רפואי — עמוד שדרה", "ישראל", CAT_MED, "טכנולוגיה חדשה שמחפשת חדירה לשוק.", "", "https://discuretech.com/"],
  ["Caps Medical", "ציוד רפואי — אבלציה", "ישראל", CAT_MED, "מכשור שמצריך מפיצים לפי מדינה.", "", "https://www.capsmedical.com/"],
  ["NanoVibronix", "ציוד רפואי — אולטרסאונד", "ישראל/ארה\"ב", CAT_MED, "כבר עובדים עם מפיצים — מרחיבים לשווקים חדשים.", "", "https://www.nanovibronix.com/"],

  // ───── מלונות — עם מייל ציבורי מאומת ✅ ─────
  ["מלון טרוול הוטלס", "רשת מלונות", "מטולה / גשר הזיו", CAT_HOTEL, "פניות רבות בערב/לילה/שבת — עובד דיגיטלי 24/7 שלא מפספס לידים.", "reservation@travelhotels.co.il", "https://www.travelhotels.co.il/"],
  ["מלון אמירי הגליל", "מלון בוטיק", "אמירים, גליל עליון", CAT_HOTEL, "בוטיק קטן — מענה מיידי לכל פנייה שומר על כל הזמנה.", "office@amirey-hagalil.com", "https://www.amirey-hagalil.com/"],
  ["מלונות אלבי (Albi)", "רשת בוטיק", "ירושלים / ת\"א", CAT_HOTEL, "מאגר אורחים חוזרים + שיווק אוטומטי בזמנים שהם קובעים.", "info@albihotels.com", "https://albihotels.com/he/"],
  ["מלון Almond / C-Hotels", "מלון בוטיק", "אזור ירושלים", CAT_HOTEL, "מענה מיידי + רשימת המתנה לביטולים.", "info@c-hotels.co.il", "https://c-hotels.co.il/almond-hotel/"],
  ["מלון Jewel תל אביב", "מלון בוטיק", "תל אביב", CAT_HOTEL, "פניות בלילה — סוכן AI עונה תוך שניות.", "jeweltlv@rl-hotel.co.il", "https://jeweltlv.com/he/contact-us/"],
  ["רשת מלונות אטלס (Atlas)", "רשת בוטיק", "ת\"א / ארצי", CAT_HOTEL, "הרבה מלונות — מערכת לידים אחת לכל הרשת.", "Contact-res@atlashotels.co.il", "https://www.atlas.co.il/"],

  // ───── מלונות — דרך עמוד צור-קשר (לאימות מייל) 🔎 ─────
  ["מלון גליליון", "מלון בצפון", "גליל עליון", CAT_HOTEL, "מלון משפחות — הרבה פניות בסופ\"ש.", "", "https://galilion.co.il/"],
  ["מלון כפר גלעדי", "מלון בצפון", "גליל עליון", CAT_HOTEL, "מלון ותיק — מענה 24/7 ישמור הזמנות.", "", "https://www.giladi-hotel.co.il/"],
  ["רשת מלונות פרימה (Prima)", "רשת מלונות", "ארצי", CAT_HOTEL, "רשת גדולה — אוטומציה חוצת-מלונות.", "", "https://www.prima-hotels-israel.com/contact-us"],
  ["רשת מלונות רימונים (Rimonim)", "רשת מלונות", "ארצי", CAT_HOTEL, "רשת ארצית — מערכת לידים מרכזית.", "", "https://www.rimonim.com/"],
  ["מלון מנדלי", "מלון בוטיק", "תל אביב", CAT_HOTEL, "בוטיק עירוני — מענה מהיר מנצח מתחרים.", "", "https://www.mendelistreethotel.co.il/contact-us"],
  ["רשת מלונות בראון (Brown)", "רשת בוטיק", "ת\"א / ירושלים", CAT_HOTEL, "קהל צעיר דיגיטלי — וואטסאפ 24/7.", "", "https://www.brownhotels.com/"],
  ["מלונות VERT (ים המלח / אילת)", "רשת מלונות", "ים המלח / אילת", CAT_HOTEL, "יעד נופש — פניות מסביב לשעון.", "", "https://www.afi-hotels.co.il/contact-us"],
  ["הרודס בוטיק אילת (Herods)", "מלון בוטיק", "אילת", CAT_HOTEL, "מלון יוקרה — שירות אישי 24/7.", "", "https://www.herods.co.il/contact-us/"],
  ["מלון עין גדי בוטיק", "מלון בוטיק", "ים המלח", CAT_HOTEL, "אגף בוטיק חדש — מענה מיידי לפניות.", "", "https://www.ein-gedi.co.il/"],
  ["מלון קיימא (Kayma)", "מלון בוטיק", "עין בוקק, ים המלח", CAT_HOTEL, "בוטיק רגוע — כל ליד נספר.", "", "https://www.isrotel.co.il/isrotel-hotels/dead-sea-hotels/kayma/"],
  ["רשת ישרוטל (Isrotel)", "רשת מלונות", "אילת / ארצי", CAT_HOTEL, "פניות רבות בלילה/שבת — עובד דיגיטלי 24/7.", "", "https://www.isrotel.co.il/"],
  ["רשת מלונות דן (Dan)", "רשת מלונות", "ארצי", CAT_HOTEL, "מענה מיידי + רשימת המתנה לביטולים.", "", "https://www.danhotels.co.il/"],
  ["פתאל / לאונרדו (Fattal)", "רשת מלונות", "ארצי", CAT_HOTEL, "מאגר אורחים חוזרים ושיווק אוטומטי.", "", "https://www.fattal.co.il/"],
];

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

// Seed the full B2B lead set into ANY account that has none yet — so a client
// who registers immediately gets a working, populated system (not empty).
function seedAccountLeads(accountId) {
  clientLeads.ensureSchema();
  if (clientLeads.listLeads(accountId).length) return 0;
  let n = 0;
  for (const [name, type, region, category, why, email, sourceUrl] of LEADS) {
    const isHotel = category === CAT_HOTEL;
    const subject = isHotel ? "כמה לקוחות נשמטים לכם בלילה" : "כמה מפיצים טובים נשמטים לכם בלילה";
    const body = bizBody(name, isHotel ? "hotel" : "med");
    const r = clientLeads.createLead(accountId, { name, type, region, category, why, email, sourceUrl, subject, body, order: n + 1 });
    if (r.lead) n++;
  }
  return n;
}

function seed() {
  clientLeads.ensureSchema();
  const accountId = ensureAccount();
  const seeded = seedAccountLeads(accountId);
  return { accountId, seeded, total: clientLeads.listLeads(accountId).length };
}

module.exports = { seed, seedAccountLeads, SEED_EMAIL, SEED_PASSWORD };
