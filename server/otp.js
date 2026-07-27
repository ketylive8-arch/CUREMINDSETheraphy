// אימות מספר טלפון בקוד חד-פעמי (OTP) שנשלח ב-SMS.
//
// עיצוב מכוון: התהליך "נדלק" אוטומטית ברגע שמוגדר ספק SMS (Twilio) דרך
// משתני הסביבה. כל עוד אין ספק מוגדר — ההרשמה עובדת כרגיל בלי אימות, כדי
// שאף לקוח לא ייחסם. אין צורך לשנות קוד כדי להפעיל: רק להוסיף את המפתחות.
//
// משתני סביבה נדרשים להפעלה (Twilio):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM  (מספר/Sender מאושר)

const crypto = require("node:crypto");
const { db } = require("./db");

const OTP_TTL_MS = 10 * 60 * 1000; // הקוד תקף ל-10 דקות
const MAX_ATTEMPTS = 5;

function smsConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM
  );
}

// נרמול מספר ישראלי/מקומי ל-E.164 (‎+972…) — מיטבי, לא נכשל על קלט חריג.
function toE164(raw) {
  let d = String(raw || "").trim();
  if (d.startsWith("+")) return d.replace(/[^\d+]/g, "");
  d = d.replace(/\D/g, "");
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("972")) return "+" + d;
  if (d.startsWith("0")) return "+972" + d.slice(1);
  if (d.length >= 9 && d.length <= 10) return "+972" + d.replace(/^0/, "");
  return "+" + d;
}

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function hashCode(code) {
  return crypto.createHash("sha256").update(String(code).trim()).digest("hex");
}

// שליחת SMS דרך Twilio. מחזיר { sent, reason? }, לעולם לא זורק.
async function sendSms(phone, body) {
  if (!smsConfigured()) return { sent: false, reason: "sms-not-configured" };
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const to = toE164(phone);
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return { sent: false, reason: `twilio ${r.status}: ${t.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: String((e && e.message) || e) };
  }
}

// יצירה + שמירה + שליחה של קוד לחשבון. מחזיר { sent, reason? }.
async function issueOtp(accountId, phone) {
  const code = generateCode();
  const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();
  db.prepare("UPDATE accounts SET otp_hash = ?, otp_expires = ?, otp_attempts = 0 WHERE id = ?").run(
    hashCode(code),
    expires,
    accountId
  );
  const body = `קוד האימות שלך ל-CureMindset: ${code}\nהקוד תקף ל-10 דקות.`;
  return sendSms(phone, body);
}

// אימות קוד שהוקש לפי אימייל. מחזיר { ok, accountId, fullName, email } או { error, status }.
function checkOtp(email, code) {
  const normEmail = String(email || "").trim().toLowerCase();
  const row = db
    .prepare("SELECT id, otp_hash, otp_expires, otp_attempts, full_name FROM accounts WHERE email = ?")
    .get(normEmail);
  if (!row || !row.otp_hash) return { error: "לא נמצאה בקשת אימות פעילה", status: 400 };
  if (row.otp_attempts >= MAX_ATTEMPTS) return { error: "יותר מדי ניסיונות. בקשי קוד חדש", status: 429 };
  if (!row.otp_expires || new Date(row.otp_expires).getTime() < Date.now()) {
    return { error: "הקוד פג תוקף. בקשי קוד חדש", status: 400 };
  }
  if (hashCode(code) !== row.otp_hash) {
    db.prepare("UPDATE accounts SET otp_attempts = otp_attempts + 1 WHERE id = ?").run(row.id);
    return { error: "קוד שגוי, נסי שוב", status: 401 };
  }
  db.prepare(
    "UPDATE accounts SET phone_verified = 1, otp_hash = NULL, otp_expires = NULL, otp_attempts = 0 WHERE id = ?"
  ).run(row.id);
  return { ok: true, accountId: row.id, fullName: row.full_name, email: normEmail };
}

// שליפת חשבון + הטלפון שלו לפי אימייל (לצורך שליחה חוזרת של קוד).
function accountForOtp(email) {
  const normEmail = String(email || "").trim().toLowerCase();
  return db.prepare("SELECT id, phone, full_name FROM accounts WHERE email = ?").get(normEmail) || null;
}

module.exports = { smsConfigured, issueOtp, checkOtp, accountForOtp, toE164 };
