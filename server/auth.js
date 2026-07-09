// אימות מטופלים — הרשמה והתחברות עם מייל וסיסמה.
// הסיסמאות נשמרות מוצפנות (scrypt + salt אקראי) — לעולם לא בטקסט גלוי.
// מזהה החשבון (account.id) משמש גם כמזהה המטופל, כך שכל הנתונים הקיימים
// (שיחות, משימות, ניסיון) נקשרים אוטומטית לחשבון ונשמרים בין התחברויות.

const crypto = require("node:crypto");
const { db, ensurePatient } = require("./db");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, "hex");
  return known.length === derived.length && crypto.timingSafeEqual(known, derived);
}

function createSession(accountId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO auth_sessions (token, account_id) VALUES (?, ?)").run(token, accountId);
  return token;
}

function accountIdFromToken(token) {
  if (!token || typeof token !== "string") return null;
  const row = db.prepare("SELECT account_id FROM auth_sessions WHERE token = ?").get(token);
  return row ? row.account_id : null;
}

function destroySession(token) {
  if (token) db.prepare("DELETE FROM auth_sessions WHERE token = ?").run(token);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// יוצר חשבון חדש + פרופיל מטופל + מתחיל את שעון 14 ימי הניסיון.
function registerAccount({ email, password, fullName, phone }) {
  const normEmail = String(email || "").trim().toLowerCase();
  const name = String(fullName || "").trim();
  if (!EMAIL_RE.test(normEmail)) return { error: "כתובת מייל לא תקינה", status: 400 };
  if (typeof password !== "string" || password.length < 6) return { error: "סיסמה חייבת להכיל לפחות 6 תווים", status: 400 };
  if (name.length < 2) return { error: "נא למלא שם מלא", status: 400 };
  if (db.prepare("SELECT 1 FROM accounts WHERE email = ?").get(normEmail)) {
    return { error: "כתובת המייל כבר רשומה — נסי להתחבר", status: 409 };
  }

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO accounts (id, email, password_hash, full_name, phone) VALUES (?, ?, ?, ?, ?)").run(
    id,
    normEmail,
    hashPassword(password),
    name.slice(0, 120),
    phone ? String(phone).slice(0, 30) : null
  );
  ensurePatient(id);
  // מקשר את השם לכרטיס המטופל כדי שיופיע ב-CRM של קטי
  db.prepare("UPDATE patients SET display_name = ? WHERE device_token = ?").run(name.slice(0, 120), id);

  return { accountId: id, token: createSession(id), fullName: name, email: normEmail };
}

function loginAccount({ email, password }) {
  const normEmail = String(email || "").trim().toLowerCase();
  const row = db.prepare("SELECT id, password_hash, full_name FROM accounts WHERE email = ?").get(normEmail);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return { error: "מייל או סיסמה שגויים", status: 401 };
  }
  ensurePatient(row.id);
  return { accountId: row.id, token: createSession(row.id), fullName: row.full_name, email: normEmail };
}

module.exports = { registerAccount, loginAccount, destroySession, accountIdFromToken, hashPassword };
