const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const express = require("express");
const multer = require("multer");

const { db, getAgeGroup, getAccessStatus, getJourneyDay, scheduleEngagementNotifications,
  listPrograms, getProgram, enrollUser, getEnrollments, enrollmentTrialStatus, auditLog,
  getActiveEnrollment, growGateStatus, applyPaymentWebhook, cancelSubscription } = require("./db");
const { deviceTokenMiddleware } = require("./deviceToken");
const { buildDashboardData } = require("./resilience");
const { runBehavioralHealthCheck, NoApiKeyError } = require("./openai");
const { adminAuthMiddleware } = require("./adminAuth");
const { computeStatus, touchPatientActivity } = require("./crm");
const { retrieveKnowledge, knowledgeStats } = require("./knowledgeBase");
const { guidedReply } = require("./guidedReply");
const { registerAccount, loginAccount, upsertOAuthAccount, destroySession, createSessionForAccount, accountIdFromToken, accountSummary, hashPassword } = require("./auth");
const { smsConfigured, issueOtp, checkOtp, accountForOtp } = require("./otp");
const { notifyLead, notifyEmail } = require("./notify");

const app = express();
// Behind Render's proxy — needed so req.ip is the real client IP (consent log).
app.set("trust proxy", 1);
const PORT = process.env.PORT || 8731;
const STATIC_DIR = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MATERIAL_TYPES = new Set(["lesson", "audio", "worksheet", "summary", "other"]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).slice(0, 10)}`),
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

// Baseline hardening headers on every response.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

// ── Canonical host redirect ──
// Any *.onrender.com PAGE request is bounced (301) to the canonical domain so
// Google consolidates on ketysegev.com and old Render URLs stop serving a
// duplicate site. /api and /uploads are left untouched — Vercel proxies those
// to the Render backend and must reach it directly (no redirect loop).
app.use((req, res, next) => {
  const host = String(req.headers.host || "").toLowerCase();
  const isRenderHost = host.endsWith(".onrender.com");
  const isApiPath = req.path.startsWith("/api") || req.path.startsWith("/uploads");
  if (isRenderHost && !isApiPath && (req.method === "GET" || req.method === "HEAD")) {
    return res.redirect(301, `${SITE_URL}${req.originalUrl === "/" ? "" : req.originalUrl}`);
  }
  next();
});

// ── SEO: robots.txt + sitemap.xml (public, dynamic) ──
// SITE_URL should be the canonical public address once the domain is live.
const SITE_URL = (process.env.SITE_URL || "https://ketysegev.com").replace(/\/$/, "");
app.get("/robots.txt", (req, res) => {
  res
    .type("text/plain")
    .send(`User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});
app.get("/sitemap.xml", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  // Single-page app: the canonical entry is "/". The blog lives on a separate host.
  const urls = [{ loc: "/", pri: "1.0" }];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url><loc>${SITE_URL}${u.loc}</loc><lastmod>${today}</lastmod>` +
          `<changefreq>weekly</changefreq><priority>${u.pri}</priority></url>`
      )
      .join("\n") +
    `\n</urlset>\n`;
  res.type("application/xml").send(body);
});

app.use(express.json({ limit: "100kb" }));
app.use(express.static(STATIC_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));

// Minimal in-memory rate limiter, keyed per device token + route. Protects the
// access-code redeem endpoint from brute-force guessing and caps AI-chat cost.
const rateBuckets = new Map();
function rateLimit(name, maxPerHour) {
  return (req, res, next) => {
    const key = `${name}:${req.deviceToken || req.ip}`;
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || now - bucket.start > 3600000) {
      bucket = { start: now, count: 0 };
      rateBuckets.set(key, bucket);
    }
    if (++bucket.count > maxPerHour) {
      return res.status(429).json({ error: "יותר מדי ניסיונות — נסי שוב מאוחר יותר" });
    }
    next();
  };
}

// ── נתיבים ציבוריים (בלי מזהה מכשיר): הרשמה לסדנאות + מאמרים מ-RSS ──
// רשומים לפני ה-router של /api כדי שלא יידרשו ל-X-Device-Token.

// ── אימות: הרשמה / התחברות / התנתקות (ציבורי, בלי מזהה מכשיר) ──
app.post("/api/auth/register", rateLimit("register", 15), async (req, res) => {
  const { email, password, fullName, phone, ref } = req.body || {};
  const result = registerAccount({ email, password, fullName, phone, ref });
  if (result.error) return res.status(result.status).json({ error: result.error });

  // תיעוד הסכמה מדעת (תנאי שימוש + הצהרת AI + אי-ייעוץ רפואי) עם חותמת זמן ו-IP.
  try {
    db.prepare("INSERT INTO consent_log (account_id, email, consent_type, ip, user_agent) VALUES (?, ?, ?, ?, ?)").run(
      result.accountId,
      result.email,
      "terms_ai_medical",
      String(req.ip || "").slice(0, 60),
      String(req.get("user-agent") || "").slice(0, 300)
    );
  } catch (e) {
    console.warn("[consent] log failed:", e.message);
  }

  // ── register → enrollment: יוצר enrollment אמיתי + מתחיל 72 שעות (server-side) ──
  // בחירת התוכנית מגיעה מדף התוכניות (slug/programId); אם חסרה — נגזרת מקבוצת הגיל.
  try {
    const ageGroup = ["youth", "teen", "adult", "parent"].includes(String(req.body.ageGroup))
      ? String(req.body.ageGroup) : "adult";
    // שמירת קבוצת הגיל בכרטיס (device_token == accountId עבור חשבון רשום).
    db.prepare("UPDATE patient_profile SET age_group = ? WHERE device_token = ?").run(
      ageGroup === "teen" ? "youth" : ageGroup, result.accountId
    );
    const slugFromAge = { youth: "digital-teen", teen: "digital-teen", parent: "digital-parent", adult: "digital-adult" };
    const wanted = String(req.body.slug || req.body.programId || slugFromAge[ageGroup] || "digital-adult");
    const prog = getProgram(wanted);
    if (prog) {
      enrollUser(result.accountId, prog.program_id); // יוצר enrollment + 72h + audit log (idempotent)
    }
  } catch (e) {
    console.warn("[enroll] register-time enrollment failed:", e.message);
  }

  // תשובות שאלון האבחון (Onboarding) — נשמרות בכרטיס הלקוח ומופיעות ב-CRM של קטי.
  const onboarding = typeof req.body.onboarding === "string" ? req.body.onboarding.slice(0, 300) : "";
  if (onboarding) {
    try {
      db.prepare("UPDATE patients SET last_summary = ? WHERE device_token = ?").run(onboarding, result.accountId);
    } catch (e) {
      console.warn("[onboarding] save failed:", e.message);
    }
  }

  // התראת מייל מיידית לקטי על לקוח/ה חדש/ה שנרשם/ה למערכת.
  notifyLead("לקוח/ה חדש/ה נרשם/ה למערכת", {
    "שם מלא": result.fullName,
    "אימייל": result.email,
    "טלפון": typeof phone === "string" ? phone : "",
    "מאבחון ראשוני": onboarding,
  }).then((r) => {
    if (r.error) console.warn("[notify] new-account email failed:", r.error);
  });

  // אם מוגדר ספק SMS ויש טלפון — דורשים אימות OTP לפני הנפקת טוקן.
  if (smsConfigured() && result.phone) {
    const sms = await issueOtp(result.accountId, result.phone);
    if (sms.sent) {
      const hint = String(result.phone).replace(/\D/g, "").slice(-4);
      return res.status(201).json({ needsOtp: true, email: result.email, phoneHint: hint });
    }
    // שליחת ה-SMS נכשלה — לא חוסמים את הלקוח: מנפיקים טוקן וממשיכים.
    console.warn("[otp] send failed, proceeding without verification:", sms.reason);
  }

  const token = createSessionForAccount(result.accountId);
  res.status(201).json({ token, fullName: result.fullName, email: result.email });
});

// אימות קוד ה-OTP שנשלח ב-SMS — מנפיק טוקן רק לאחר אימות מוצלח.
app.post("/api/auth/verify-otp", rateLimit("verify-otp", 20), (req, res) => {
  const { email, code } = req.body || {};
  if (typeof code !== "string" || !/^\d{4,8}$/.test(code.trim())) {
    return res.status(400).json({ error: "נא להזין את הקוד שקיבלת ב-SMS" });
  }
  const result = checkOtp(email, code);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const token = createSessionForAccount(result.accountId);
  res.json({ token, fullName: result.fullName, email: result.email });
});

// שליחה חוזרת של קוד אימות.
app.post("/api/auth/resend-otp", rateLimit("resend-otp", 8), async (req, res) => {
  const { email } = req.body || {};
  const acc = accountForOtp(email);
  if (!acc || !acc.phone) return res.status(400).json({ error: "לא נמצאה בקשת אימות" });
  if (!smsConfigured()) return res.status(503).json({ error: "שירות ה-SMS אינו זמין כרגע" });
  const sms = await issueOtp(acc.id, acc.phone);
  if (!sms.sent) return res.status(502).json({ error: "שליחת הקוד נכשלה, נסי שוב" });
  res.json({ ok: true });
});

app.post("/api/auth/login", rateLimit("login", 20), async (req, res) => {
  const { email, password } = req.body || {};
  const result = loginAccount({ email, password });
  if (result.error) return res.status(result.status).json({ error: result.error });

  // אם מוגדר ספק SMS והטלפון עדיין לא אומת — דורשים אימות לפני כניסה.
  if (smsConfigured() && result.phone && !result.phoneVerified) {
    const sms = await issueOtp(result.accountId, result.phone);
    if (sms.sent) {
      const hint = String(result.phone).replace(/\D/g, "").slice(-4);
      return res.json({ needsOtp: true, email: result.email, phoneHint: hint });
    }
    console.warn("[otp] login send failed, proceeding:", sms.reason);
  }

  const token = createSessionForAccount(result.accountId);
  res.json({ token, fullName: result.fullName, email: result.email });
});

app.post("/api/auth/logout", (req, res) => {
  destroySession(req.header("X-Auth-Token"));
  res.json({ ok: true });
});

// שמירת סיכום שאלון ההיכרות עבור משתמש מחובר — כשהשאלון בא אחרי ההרשמה
// (זרימת Curable: קודם נרשמים, ואז ממלאים את השאלון האישי).
app.post("/api/onboarding", (req, res) => {
  const accountId = accountIdFromToken(req.header("X-Auth-Token"));
  if (!accountId) return res.status(401).json({ error: "לא מחובר" });
  const onboarding = typeof (req.body && req.body.onboarding) === "string" ? req.body.onboarding.slice(0, 400) : "";
  if (onboarding) {
    try {
      db.prepare("UPDATE patients SET last_summary = ? WHERE device_token = ?").run(onboarding, accountId);
    } catch (e) {
      console.warn("[onboarding] save failed:", e.message);
    }
  }
  res.json({ ok: true });
});

// ── שכחתי סיסמה: קוד איפוס בן 6 ספרות למייל, ואז הגדרת סיסמה חדשה ──
const resetCodes = new Map(); // email -> { code, expires, tries }
app.post("/api/auth/forgot", rateLimit("forgot", 8), async (req, res) => {
  const email = String((req.body && req.body.email) || "").trim().toLowerCase().slice(0, 160);
  // תמיד מחזירים ok כדי לא לחשוף אילו מיילים רשומים.
  if (!email) return res.json({ ok: true });
  const acc = db.prepare("SELECT id, full_name FROM accounts WHERE email = ?").get(email);
  if (acc) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes.set(email, { code, expires: Date.now() + 15 * 60 * 1000, tries: 0 });
    if (process.env.RESET_DEBUG) console.log("[reset TEST] code for", email, "=", code);
    notifyEmail(email, "איפוס סיסמה · CureMindset", {
      "שלום": acc.full_name || "",
      "קוד האיפוס שלך": code,
      "בתוקף ל-": "15 דקות",
      "הערה": "אם לא ביקשת לאפס סיסמה — אפשר להתעלם מהמייל הזה.",
    }).then((r) => { if (r && r.error) console.warn("[reset] email failed:", r.error); });
  }
  res.json({ ok: true });
});
app.post("/api/auth/reset", rateLimit("reset", 12), (req, res) => {
  const email = String((req.body && req.body.email) || "").trim().toLowerCase().slice(0, 160);
  const code = String((req.body && req.body.code) || "").trim();
  const password = String((req.body && req.body.password) || "");
  if (password.length < 6) return res.status(400).json({ error: "הסיסמה חייבת להיות לפחות 6 תווים" });
  const entry = resetCodes.get(email);
  if (!entry || entry.expires < Date.now()) return res.status(400).json({ error: "הקוד פג תוקף — בקשי קוד חדש" });
  if (entry.tries >= 5) { resetCodes.delete(email); return res.status(429).json({ error: "יותר מדי ניסיונות — בקשי קוד חדש" }); }
  if (entry.code !== code) { entry.tries += 1; return res.status(400).json({ error: "קוד שגוי, נסי שוב" }); }
  const acc = db.prepare("SELECT id FROM accounts WHERE email = ?").get(email);
  if (!acc) return res.status(400).json({ error: "לא נמצא חשבון" });
  db.prepare("UPDATE accounts SET password_hash = ? WHERE id = ?").run(hashPassword(password), acc.id);
  resetCodes.delete(email);
  res.json({ ok: true });
});

// ── התחברות חברתית (OAuth) — Google / Facebook ──
// זרימה מלאה: (1) הלקוח מבקש כתובת התחלה; (2) הספק מחזיר code ל-callback;
// (3) מחליפים code ב-token, שולפים מייל+שם, יוצרים/מוצאים חשבון, מנפיקים טוקן
// ומפנים חזרה לאתר עם הטוקן. כשספק לא מוגדר — 501, והלקוח פשוט לא מציג את הכפתור.
const OAUTH_BASE = () => (process.env.SITE_URL || "https://ketysegev.com").replace(/\/$/, "");
const oauthStates = new Map(); // state -> expires (הגנת CSRF, תוקף קצר)
function makeState() {
  const s = require("node:crypto").randomBytes(16).toString("hex");
  oauthStates.set(s, Date.now() + 10 * 60 * 1000);
  return s;
}
function consumeState(s) {
  const exp = oauthStates.get(s);
  if (!exp) return false;
  oauthStates.delete(s);
  return exp > Date.now();
}
// ניקוי מצבים שפגו — כדי שהמפה לא תגדל לנצח.
setInterval(() => { const now = Date.now(); for (const [k, v] of oauthStates) if (v < now) oauthStates.delete(k); }, 15 * 60 * 1000).unref?.();

app.get("/api/auth/oauth/:provider", (req, res) => {
  const provider = String(req.params.provider || "").toLowerCase();
  const base = OAUTH_BASE();
  const state = makeState();
  if (provider === "google" && process.env.GOOGLE_CLIENT_ID) {
    const url =
      "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&scope=openid%20email%20profile" +
      `&client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(base + "/api/auth/oauth/google/callback")}` +
      `&state=${state}`;
    return res.json({ url });
  }
  if (provider === "facebook" && process.env.FACEBOOK_APP_ID) {
    const url =
      "https://www.facebook.com/v19.0/dialog/oauth?scope=email" +
      `&client_id=${encodeURIComponent(process.env.FACEBOOK_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(base + "/api/auth/oauth/facebook/callback")}` +
      `&state=${state}`;
    return res.json({ url });
  }
  return res.status(501).json({ error: "OAuth provider not configured", provider });
});

// מפנה חזרה לאתר עם הטוקן (או עם שגיאה קריאה) — הלקוח קולט ומתחבר.
function oauthRedirect(res, { token, name, error }) {
  const base = OAUTH_BASE();
  if (token) {
    return res.redirect(`${base}/?cm_oauth=${encodeURIComponent(token)}&cm_name=${encodeURIComponent(name || "")}`);
  }
  return res.redirect(`${base}/?cm_oauth_error=${encodeURIComponent(error || "login_failed")}`);
}

app.get("/api/auth/oauth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !consumeState(String(state || ""))) return oauthRedirect(res, { error: "פג תוקף — נסי שוב" });
    const base = OAUTH_BASE();
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: base + "/api/auth/oauth/google/callback",
        grant_type: "authorization_code",
      }),
    });
    const tok = await tokenResp.json();
    if (!tok.access_token) return oauthRedirect(res, { error: "ההתחברות נכשלה" });
    const infoResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    const info = await infoResp.json();
    if (!info.email) return oauthRedirect(res, { error: "לא התקבל מייל מהחשבון" });
    const acc = upsertOAuthAccount({ email: info.email, fullName: info.name });
    if (acc.error) return oauthRedirect(res, { error: acc.error });
    const token = createSessionForAccount(acc.accountId);
    return oauthRedirect(res, { token, name: acc.fullName });
  } catch (e) {
    console.warn("[oauth google]", (e && e.message) || e);
    return oauthRedirect(res, { error: "שגיאה בהתחברות" });
  }
});

app.get("/api/auth/oauth/facebook/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !consumeState(String(state || ""))) return oauthRedirect(res, { error: "פג תוקף — נסי שוב" });
    const base = OAUTH_BASE();
    const tokenResp = await fetch(
      "https://graph.facebook.com/v19.0/oauth/access_token?" +
        new URLSearchParams({
          code: String(code),
          client_id: process.env.FACEBOOK_APP_ID || "",
          client_secret: process.env.FACEBOOK_APP_SECRET || "",
          redirect_uri: base + "/api/auth/oauth/facebook/callback",
        }).toString()
    );
    const tok = await tokenResp.json();
    if (!tok.access_token) return oauthRedirect(res, { error: "ההתחברות נכשלה" });
    const infoResp = await fetch(
      "https://graph.facebook.com/me?fields=name,email&access_token=" + encodeURIComponent(tok.access_token)
    );
    const info = await infoResp.json();
    if (!info.email) return oauthRedirect(res, { error: "לא התקבל מייל מהחשבון" });
    const acc = upsertOAuthAccount({ email: info.email, fullName: info.name });
    if (acc.error) return oauthRedirect(res, { error: acc.error });
    const token = createSessionForAccount(acc.accountId);
    return oauthRedirect(res, { token, name: acc.fullName });
  } catch (e) {
    console.warn("[oauth facebook]", (e && e.message) || e);
    return oauthRedirect(res, { error: "שגיאה בהתחברות" });
  }
});

// פרטי החשבון המחובר — שם, קוד הפניה אישי (חבר מביא חבר) ומספר המוזמנים.
app.get("/api/auth/me", (req, res) => {
  const accountId = accountIdFromToken(req.header("X-Auth-Token"));
  if (!accountId) return res.status(401).json({ error: "לא מחובר" });
  const summary = accountSummary(accountId);
  if (!summary) return res.status(404).json({ error: "לא נמצא" });
  // שחזור המסע אחרי refresh/login: סטטוס גישה (72h server-side) + ה-enrollment הפעיל.
  const access = getAccessStatus(accountId); // device_token == accountId עבור חשבון רשום
  const enrollments = getEnrollments(accountId).map((e) => ({
    enrollmentId: e.id, programId: e.program_id, currentModuleId: e.current_module_id,
    trial: enrollmentTrialStatus(e),
  }));
  res.json({ ...summary, access, enrollments, activeEnrollment: enrollments[0] || null });
});

// ── Webhook תשלום (Grow) — מפעיל מנוי רק לאחר אימות חתימה, אידמפוטנטי ──
// סטטוס "paid" נקבע כאן בלבד, לעולם לא לפי redirect בצד הלקוח.
// חתימה: HMAC-SHA256 מעל `${eventId}:${userId}:${enrollmentId||""}` עם GROW_WEBHOOK_SECRET.
// (יש להתאים לסכמת החתימה האמיתית של Grow כשחשבון הספק יחובר.)
app.post("/api/webhooks/grow", (req, res) => {
  const secret = process.env.GROW_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "webhook_not_configured" });
  const { eventId, userId, enrollmentId, providerProductId, signature } = req.body || {};
  if (!eventId || !userId || !signature) return res.status(400).json({ error: "missing_fields" });
  const expected = crypto.createHmac("sha256", secret)
    .update(`${eventId}:${userId}:${enrollmentId || ""}`).digest("hex");
  const ok = signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) return res.status(401).json({ error: "bad_signature" });
  const result = applyPaymentWebhook({ eventId, userId, enrollmentId, providerProductId });
  if (!result.ok) return res.status(400).json(result);
  // אישור/קבלה ללקוח + התראה לקטי — רק בתשלום חדש (לא בכפילות webhook).
  if (!result.duplicate) {
    try {
      const acct = db.prepare("SELECT full_name, email FROM accounts WHERE id = ?").get(userId);
      if (acct?.email) {
        notifyEmail(acct.email, "אישור הצטרפות ותשלום · CureMindset", {
          "שם": acct.full_name || "",
          "סטטוס": "המנוי הופעל — ברוכה הבאה למסע המלא",
          "מדיניות החזר": "החזר כספי מלא תוך 15 יום מהיום, ללא שאלות",
          "קבלה רשמית": "קבלת מס נשלחת בנפרד מספק הסליקה (Grow)",
        }).catch(() => {});
      }
      notifyLead("תשלום חדש התקבל — CureMindset", { "שם": acct?.full_name || "", "אימייל": acct?.email || "" }).catch(() => {});
    } catch (e) {}
  }
  res.json({ ok: true, duplicate: !!result.duplicate });
});

app.post("/api/workshop-signup", (req, res) => {
  const { fullName, phone, email, workshop } = req.body || {};
  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    return res.status(400).json({ error: "נא למלא שם מלא" });
  }
  if (typeof phone !== "string" || phone.replace(/\D/g, "").length < 8) {
    return res.status(400).json({ error: "נא למלא מספר טלפון תקין" });
  }
  if (typeof workshop !== "string" || !workshop.trim()) {
    return res.status(400).json({ error: "נא לבחור סדנה" });
  }
  const cleanName = fullName.trim().slice(0, 120);
  const cleanPhone = phone.trim().slice(0, 30);
  const cleanEmail = typeof email === "string" ? email.trim().slice(0, 160) : null;
  const cleanWorkshop = workshop.trim().slice(0, 120);

  db.prepare("INSERT INTO workshop_signups (full_name, phone, email, workshop) VALUES (?, ?, ?, ?)").run(
    cleanName,
    cleanPhone,
    cleanEmail,
    cleanWorkshop
  );

  // התראת מייל מיידית לקטי (אם RESEND_API_KEY מוגדר). לא חוסם את התשובה למשתמש.
  notifyLead("ליד חדש מהאתר — הרשמה לסדנה", {
    "שם מלא": cleanName,
    "טלפון": cleanPhone,
    "אימייל": cleanEmail,
    "סדנה": cleanWorkshop,
  }).then((r) => {
    if (r.error) console.warn("[notify] workshop lead email failed:", r.error);
    else if (r.skipped) console.log("[notify] RESEND_API_KEY not set — lead saved to DB only");
  });

  res.status(201).json({ ok: true });
});

// ── /api/send-lead ──
// נקודת קצה ייעודית לשליחת פרטי ליד/נרשם ישירות למייל של קטי (ketyse@gmail.com).
// עוברת דרך notifyLead → Gmail(Nodemailer) / Resend / FormSubmit לפי מה שמוגדר.
// שימושי גם ל-Onboarding: שולח את שם, מייל, טלפון ותוצאות השאלון.
app.post("/api/send-lead", rateLimit("send-lead", 20), async (req, res) => {
  const b = req.body || {};
  const name = typeof b.fullName === "string" ? b.fullName.trim().slice(0, 120) : "";
  const email = typeof b.email === "string" ? b.email.trim().slice(0, 160) : "";
  const phone = typeof b.phone === "string" ? b.phone.trim().slice(0, 30) : "";
  const onboarding = typeof b.onboarding === "string" ? b.onboarding.trim().slice(0, 400) : "";
  const source = typeof b.source === "string" ? b.source.trim().slice(0, 60) : "Onboarding";
  if (!email && !phone) {
    return res.status(400).json({ error: "נא למלא מייל או טלפון" });
  }
  const r = await notifyLead("ליד חדש מהאתר — Onboarding", {
    "שם מלא": name || "—",
    "אימייל": email || "—",
    "טלפון": phone || "—",
    "תוצאות השאלון": onboarding || "—",
    "מקור": source,
  });
  // תמיד מחזיר ok ללקוח — כדי לא לחסום את חוויית ההרשמה גם אם ערוץ המייל לא מוגדר.
  if (r && r.error) console.warn("[notify] send-lead email failed:", r.error);
  res.status(202).json({ ok: true, delivered: !!(r && r.sent) });
});

// מאמרים: משיכה מערוץ ה-RSS של קטי (ARTICLES_RSS_URL ב-Environment ברנדר).
// פירסור מינימלי ללא תלויות + מטמון 30 דקות; אם אין כתובת או שיש תקלה — [].
let articlesCache = { at: 0, items: [] };

// מאמרים מקוריים של CureMindset — מוצגים כשהפיד של הבלוג ריק/לא זמין,
// כדי שדף המאמרים לעולם לא יהיה ריק. תוכן מקורי מבוסס שיטת קטי שגב.
const FALLBACK_ARTICLES = [
  {
    title: "חרדה אצל בני נוער — מה באמת קורה במוח, ואיך מרגיעים אותו",
    link: "https://ketysegev.blogspot.com/",
    pubDate: "",
    description: "חרדה אינה חולשה — היא מערכת התראה שלמדה לירות מוקדם מדי. בשיטת CureMindset עובדים עם ויסות מערכת העצבים (נשימה, עיגון גוף) לצד מסגור מחדש של המחשבה שמזינה את האזעקה, כדי להחזיר תחושת שליטה בהדרגה.",
  },
  {
    title: "דימוי עצמי נמוך: איך בונים ביטחון פנימי שמחזיק",
    link: "https://ketysegev.blogspot.com/",
    pubDate: "",
    description: "ביטחון עצמי אמיתי לא נבנה ממחמאות מבחוץ אלא מ'עוגן בית' פנימי — ערך עצמי, כבוד וביטחון קיומי. כאן מתרגלים לזהות את הקול המבקר, להפריד בינו לבין העובדות, ולבנות זהות של 'בוחר/ת' במקום 'נפגע/ת'.",
  },
  {
    title: "חוסן רגשי בתקופה לא יציבה — שלושה כלים מעשיים",
    link: "https://ketysegev.blogspot.com/",
    pubDate: "",
    description: "חוסן הוא מיומנות נלמדת, לא תכונה מולדת. שלושה כלים שאפשר לתרגל כבר היום: נשימת קופסה לוויסות מיידי, עוגן SOS לרגעי הצפה, ומיקרו-צעד אחד קטן שמחזיר תנועה קדימה גם כשהכל מרגיש תקוע.",
  },
];

function parseRssItems(xml) {
  const items = [];
  const itemRe = /<item[\s\S]*?<\/item>/g;
  const pick = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
    if (!m) return "";
    return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim();
  };
  for (const block of xml.match(itemRe) || []) {
    const title = pick(block, "title");
    const link = pick(block, "link");
    if (!title || !link) continue;
    items.push({ title, link, pubDate: pick(block, "pubDate"), description: pick(block, "description").slice(0, 300) });
    if (items.length >= 6) break;
  }
  return items;
}

app.get("/api/articles", async (req, res) => {
  // Default to Kety's Blogspot Atom/RSS feed so her posts appear automatically;
  // override with ARTICLES_RSS_URL on Render if the blog ever moves.
  const rssUrl = process.env.ARTICLES_RSS_URL || "https://ketysegev.blogspot.com/feeds/posts/default?alt=rss";
  if (!rssUrl) return res.json([]);
  if (Date.now() - articlesCache.at < 30 * 60 * 1000) return res.json(articlesCache.items);
  try {
    const r = await fetch(rssUrl, { headers: { "User-Agent": "CureMindset-Site/1.0" } });
    if (!r.ok) throw new Error(`RSS fetch failed: ${r.status}`);
    const items = parseRssItems(await r.text());
    // אם הבלוג ריק/לא נותן פריטים — מגישים את המאמרים המקוריים במקום דף ריק.
    const out = items.length ? items : FALLBACK_ARTICLES;
    articlesCache = { at: Date.now(), items: out };
    res.json(out);
  } catch (err) {
    console.error("articles rss failed:", err.message);
    res.json(articlesCache.items.length ? articlesCache.items : FALLBACK_ARTICLES);
  }
});

const api = express.Router();
api.use(deviceTokenMiddleware);

api.get("/progress", (req, res) => {
  const row = db.prepare("SELECT unlocked, completed FROM protocol_progress WHERE device_token = ?").get(req.deviceToken);
  res.json({ unlocked: row.unlocked, completed: JSON.parse(row.completed) });
});

api.put("/progress", (req, res) => {
  const { unlocked, completed } = req.body || {};
  if (!Number.isInteger(unlocked) || !Array.isArray(completed)) {
    return res.status(400).json({ error: "unlocked must be an int, completed must be an array" });
  }
  db.prepare("UPDATE protocol_progress SET unlocked = ?, completed = ?, updated_at = datetime('now') WHERE device_token = ?").run(
    unlocked,
    JSON.stringify(completed),
    req.deviceToken
  );
  res.json({ ok: true });
});

api.get("/sessions", (req, res) => {
  const rows = db.prepare("SELECT score, date FROM grounding_sessions WHERE device_token = ? ORDER BY date ASC").all(req.deviceToken);
  res.json(rows);
});

api.post("/sessions", (req, res) => {
  const { score, date } = req.body || {};
  if (!Number.isFinite(score)) {
    return res.status(400).json({ error: "score must be a number" });
  }
  const isoDate = typeof date === "string" ? date : new Date().toISOString();
  db.prepare("INSERT INTO grounding_sessions (device_token, score, date) VALUES (?, ?, ?)").run(req.deviceToken, score, isoDate);
  touchPatientActivity(req.deviceToken);
  res.status(201).json({ ok: true });
});

// מעקב יומי — רמת חרדה (1-10), מצב רוח, איכות שינה (1-10) והערה. בשביל הגרף.
api.get("/mood", (req, res) => {
  const rows = db
    .prepare("SELECT anxiety, mood, sleep, note, created_at FROM mood_logs WHERE device_token = ? ORDER BY created_at ASC")
    .all(req.deviceToken);
  res.json(rows);
});

api.post("/mood", (req, res) => {
  const b = req.body || {};
  const clamp = (v) => (Number.isFinite(v) ? Math.min(10, Math.max(1, Math.round(v))) : null);
  const anxiety = clamp(b.anxiety);
  const sleep = clamp(b.sleep);
  const mood = typeof b.mood === "string" ? b.mood.slice(0, 20) : null;
  const note = typeof b.note === "string" ? b.note.slice(0, 500) : null;
  if (anxiety == null && sleep == null && !mood && !note) {
    return res.status(400).json({ error: "יש למלא לפחות שדה אחד" });
  }
  db.prepare("INSERT INTO mood_logs (device_token, anxiety, mood, sleep, note) VALUES (?, ?, ?, ?, ?)").run(
    req.deviceToken, anxiety, mood, sleep, note
  );
  touchPatientActivity(req.deviceToken);
  res.status(201).json({ ok: true });
});

api.get("/dashboard", (req, res) => {
  const progressRow = db.prepare("SELECT unlocked, completed FROM protocol_progress WHERE device_token = ?").get(req.deviceToken);
  const progress = { unlocked: progressRow.unlocked, completed: JSON.parse(progressRow.completed) };
  const sessions = db.prepare("SELECT score, date FROM grounding_sessions WHERE device_token = ? ORDER BY date ASC").all(req.deviceToken);
  const checkinRows = db
    .prepare("SELECT triggers, patterns, balance_alerts, wins FROM checkins WHERE device_token = ? ORDER BY created_at DESC")
    .all(req.deviceToken);

  res.json(buildDashboardData(progress, sessions, checkinRows));
});

api.post("/checkin", rateLimit("checkin", 40), async (req, res) => {
  const { text, history } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  if (text.length > 4000) {
    return res.status(400).json({ error: "text is too long" });
  }

  // The paywall applies to the AI chat as well: day 15 with no code = locked.
  if (getAccessStatus(req.deviceToken).status === "expired") {
    return res.status(402).json({ error: "תקופת הניסיון הסתיימה — נדרש קוד גישה כדי להמשיך בליווי" });
  }

  try {
    const ageGroup = getAgeGroup(req.deviceToken);
    // RAG: שליפת הקטעים הרלוונטיים ממאגר הידע של קטי לפני הפנייה ל-AI
    const retrieved = retrieveKnowledge(text.trim());
    // פרופיל אישי מהאבחון בהרשמה — מחבר את התוכן למה שהמשתמש/ת הזינ/ה (דינמי, לא סטטי).
    let userProfile = "";
    try {
      const prow = db.prepare("SELECT last_summary FROM patients WHERE device_token = ?").get(req.deviceToken);
      userProfile = (prow && prow.last_summary) ? prow.last_summary : "";
    } catch (e) { /* אין פרופיל — ממשיכים בלי */ }

    // מנסים קודם את מנוע ה-AI המלא (OpenAI). אם אין מפתח / המפתח נדחה / אין קרדיט —
    // לא מפילים את הצ'אט: נופלים למנוע המקומי (guidedReply) בשיטת CureMindset. הצ'אט תמיד עונה.
    let result;
    try {
      result = await runBehavioralHealthCheck(text.trim(), ageGroup, getJourneyDay(req.deviceToken), retrieved, userProfile, Array.isArray(history) ? history : []);
    } catch (aiErr) {
      const m = String((aiErr && aiErr.message) || "");
      const reason =
        aiErr instanceof NoApiKeyError ? "no-key" :
        /\b401\b|invalid_api_key|Incorrect API key/i.test(m) ? "bad-key" :
        /\b429\b|insufficient_quota|exceeded your current quota|billing/i.test(m) ? "no-credit" : "ai-error";
      console.warn(`[checkin] OpenAI unavailable (${reason}) — using local guided engine.`);
      result = guidedReply(text.trim(), retrieved, userProfile);
    }

    const withIds = (items) => items.map((item) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...item }));
    const triggers = withIds(result.triggers);
    const patterns = withIds(result.patterns);
    const balanceAlerts = withIds(result.balanceAlerts);
    const wins = withIds(result.wins);

    db.prepare(
      `INSERT INTO checkins (device_token, text, ai_reply, triggers, patterns, balance_alerts, wins)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(req.deviceToken, text.trim(), result.reply, JSON.stringify(triggers), JSON.stringify(patterns), JSON.stringify(balanceAlerts), JSON.stringify(wins));
    touchPatientActivity(req.deviceToken);

    // Save the daily task if one was generated
    let savedTask = null;
    if (result.dailyTask) {
      const taskResult = db.prepare(
        "INSERT INTO daily_tasks (device_token, title, description, category) VALUES (?, ?, ?, ?)"
      ).run(req.deviceToken, result.dailyTask.title, result.dailyTask.description, result.dailyTask.category || "mindfulness");
      savedTask = { id: taskResult.lastInsertRowid, ...result.dailyTask, completed: false };
    }

    const progressRow = db.prepare("SELECT unlocked, completed FROM protocol_progress WHERE device_token = ?").get(req.deviceToken);
    const progress = { unlocked: progressRow.unlocked, completed: JSON.parse(progressRow.completed) };
    const sessions = db.prepare("SELECT score, date FROM grounding_sessions WHERE device_token = ? ORDER BY date ASC").all(req.deviceToken);
    const checkinRows = db
      .prepare("SELECT triggers, patterns, balance_alerts, wins FROM checkins WHERE device_token = ? ORDER BY created_at DESC")
      .all(req.deviceToken);

    res.json({ reply: result.reply, dailyTask: savedTask, dashboard: buildDashboardData(progress, sessions, checkinRows) });
  } catch (err) {
    // הגענו לכאן רק על תקלה אמיתית (למשל DB) — לא על כשל AI (שכבר טופל ע"י המנוע המקומי).
    console.error("checkin failed (non-AI):", err);
    res.status(502).json({ error: "אני כאן איתך 🌿 קרתה תקלה רגעית בשמירה — נסי שוב בעוד רגע.", reason: "server" });
  }
});

// ── Profile (age group + trial + assessment focus) ──
// מפרק את סיכום האבחון (last_summary) ל-אתגר/מטרה כדי שה-Dashboard יציג מיקוד אישי.
function parseAssessment(summary) {
  const s = String(summary || "");
  const grab = (label) => {
    const m = s.match(new RegExp(label + "\\s*:\\s*([^·]+)"));
    return m ? m[1].trim() : "";
  };
  return { name: grab("שם"), challenge: grab("אתגר"), impact: grab("השפעה"), goal: grab("מטרה") };
}
api.get("/profile", (req, res) => {
  const row = db.prepare("SELECT age_group, trial_start_at FROM patient_profile WHERE device_token = ?").get(req.deviceToken);
  let summary = "";
  try {
    const prow = db.prepare("SELECT last_summary FROM patients WHERE device_token = ?").get(req.deviceToken);
    summary = (prow && prow.last_summary) ? prow.last_summary : "";
  } catch (e) { /* אין פרופיל */ }
  res.json({
    ageGroup: row?.age_group || "adult",
    trialStartAt: row?.trial_start_at || null,
    assessment: summary ? parseAssessment(summary) : null,
  });
});

api.put("/profile", (req, res) => {
  const { ageGroup } = req.body || {};
  if (!["adult", "youth"].includes(ageGroup)) {
    return res.status(400).json({ error: "ageGroup must be adult or youth" });
  }
  db.prepare("UPDATE patient_profile SET age_group = ?, updated_at = datetime('now') WHERE device_token = ?").run(ageGroup, req.deviceToken);
  res.json({ ok: true, ageGroup });
});

// ── Access (14-day trial + personal access codes) ──
api.get("/access", (req, res) => {
  const status = getAccessStatus(req.deviceToken);
  // תזכורת מייל חד-פעמית כשנותרו ≤24 שעות בהתנסות (נשלחת פעם אחת בלבד, מוגן ע"י audit).
  try {
    if (req.accountId && status.status === "trial" && status.hoursLeft != null && status.hoursLeft <= 24) {
      const already = db.prepare("SELECT 1 FROM audit_logs WHERE actor_user_id = ? AND action = 'trial_reminder_sent' LIMIT 1").get(req.accountId);
      if (!already) {
        const acct = db.prepare("SELECT full_name, email FROM accounts WHERE id = ?").get(req.accountId);
        db.prepare("INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata_redacted) VALUES (?,?,?,?,?)")
          .run(req.accountId, "trial_reminder_sent", "account", req.accountId, "{}");
        if (acct?.email) {
          notifyEmail(acct.email, "ההתנסות שלך מסתיימת מחר · CureMindset", {
            "שם": acct.full_name || "",
            "מה קורה עכשיו": "נותר יום אחרון בהתנסות. אפשר להמשיך את המסע המלא — או פשוט להמשיך לדבר איתי.",
            "3 ימים חינם": "בלי כרטיס אשראי · ביטול בכל עת · החזר מלא תוך 15 יום",
          }).catch(() => {});
        }
      }
    }
  } catch (e) { /* תזכורת היא bonus — לעולם לא מפילה את /access */ }
  res.json(status);
});

/* ═══ מודל המוצר: תוכניות, enrollment ו-72 שעות (מסע המשתמש) ═══ */

// קטלוג התוכניות הציבורי (לדף התוכניות / דפי הפרטים).
api.get("/programs", (req, res) => {
  res.json(listPrograms().map((p) => ({
    programId: p.program_id, slug: p.slug, title: p.title, subtitle: p.subtitle,
    description: p.description, audience: p.audience, ageGroup: p.age_group,
    duration: p.duration, trialHours: p.trial_hours, priceDisplay: p.price_display,
    billingFrequency: p.billing_frequency, moduleIds: JSON.parse(p.module_ids || "[]"),
  })));
});

api.get("/programs/:slug", (req, res) => {
  const p = getProgram(req.params.slug);
  if (!p) return res.status(404).json({ error: "program_not_found" });
  res.json({ programId: p.program_id, slug: p.slug, title: p.title, subtitle: p.subtitle,
    description: p.description, audience: p.audience, ageGroup: p.age_group, duration: p.duration,
    trialHours: p.trial_hours, priceDisplay: p.price_display, billingFrequency: p.billing_frequency,
    moduleIds: JSON.parse(p.module_ids || "[]") });
});

// בחירת תוכנית → enrollment עם programId + התחלת 72 שעות בשרת. דורש חשבון מאומת.
api.post("/enroll", rateLimit("enroll", 20), (req, res) => {
  if (!req.accountId) return res.status(401).json({ error: "יש להתחבר או להירשם כדי להתחיל תוכנית" });
  const programId = String(req.body?.programId || req.body?.slug || "").trim();
  if (!programId) return res.status(400).json({ error: "programId is required" });
  const r = enrollUser(req.accountId, programId);
  if (r.error) return res.status(404).json({ error: r.error });
  res.json({ enrollmentId: r.enrollment.id, programId: r.enrollment.program_id,
    created: r.created, trial: enrollmentTrialStatus(r.enrollment) });
});

// "התוכניות שלי" + שחזור מסע: כל enrollment עם סטטוס 72 השעות המחושב בשרת.
api.get("/my-enrollments", (req, res) => {
  if (!req.accountId) return res.json({ enrollments: [] });
  const rows = getEnrollments(req.accountId).map((e) => {
    const prog = getProgram(e.program_id);
    return { enrollmentId: e.id, programId: e.program_id, slug: prog ? prog.slug : null,
      title: prog ? prog.title : e.program_id, status: e.status, currentModuleId: e.current_module_id,
      progressPercent: e.progress_percent, trial: enrollmentTrialStatus(e) };
  });
  res.json({ enrollments: rows });
});

// ── שער התשלום (Grow) — server-side בלבד ──
// מחזיר קישור checkout אך ורק כשה-trial נגמר. בזמן trial מחזיר 403 חוסם.
// אסור להסתמך על הסתרת כפתור בצד הלקוח — ההחלטה כאן.
api.get("/checkout", (req, res) => {
  if (!req.accountId) return res.status(401).json({ error: "נדרשת התחברות" });
  const gate = growGateStatus(req.accountId);
  if (!gate.allowed) {
    // trial פעיל / מנוי קיים / קוד — לא מחזירים checkout URL.
    return res.status(403).json({
      allowed: false, state: gate.state, reason: gate.reason,
      hoursLeft: gate.hoursLeft ?? null,
      message: gate.state === "trial_active"
        ? "התוכנית בתשלום תיפתח בסיום 72 שעות ההתנסות."
        : "אין צורך בתשלום כרגע.",
    });
  }
  const prog = gate.programId ? getProgram(gate.programId) : null;
  const growBase = process.env.GROW_CHECKOUT_URL || null; // מוגדר רק כשחשבון Grow מחובר
  const checkoutUrl = growBase && gate.growProductId ? `${growBase}?product=${encodeURIComponent(gate.growProductId)}&ref=${encodeURIComponent(req.accountId)}` : null;
  res.json({
    allowed: true, state: gate.state, programId: gate.programId,
    // תנאים גלויים לפני checkout (מחיר, מטבע, תדירות, מה כלול, חיוב ראשון, ביטול, מדיניות).
    pricing: {
      price: prog ? prog.price_display : "₪297 לחודש",
      currency: "ILS",
      billingFrequency: prog ? prog.billing_frequency : "monthly",
      firstChargeAt: "מיד עם ההצטרפות (בתום ההתנסות)",
      includes: ["גישה מלאה למלווה CureMindset", "כל המודולים והאודיו", "מעקב התקדמות והיסטוריה", "ליווי מתמשך"],
      cancellationPolicy: "ניתן לבטל בכל עת מאזור החשבון; החיוב מפסיק ממחזור החיוב הבא.",
      refundPolicy: "התחייבות שקט נפשי: החזר כספי מלא תוך 15 יום מהחיוב הראשון, ללא שאלות.",
      termsUrl: "/terms", privacyUrl: "/privacy",
    },
    checkoutUrl, // null אם Grow עדיין לא חובר — הלקוח לא יקבל קישור מזויף
    checkoutReady: !!checkoutUrl,
  });
});

// ── ביטול מנוי ביוזמת הלקוח + זכאות להחזר מלא (15 יום) ──
api.post("/cancel-subscription", rateLimit("cancel-sub", 10), (req, res) => {
  if (!req.accountId) return res.status(401).json({ error: "נדרשת התחברות" });
  const result = cancelSubscription(req.accountId, req.body?.enrollmentId || null);
  if (!result.ok) return res.status(400).json({ error: result.error === "no_active_enrollment" ? "לא נמצא מנוי פעיל לביטול." : result.error });
  // מודיעים לקטי על ביטול (כדי לטפל בהחזר דרך Grow אם רלוונטי).
  try {
    const acct = db.prepare("SELECT full_name, email FROM accounts WHERE id = ?").get(req.accountId);
    notifyLead("ביטול מנוי — CureMindset", {
      "שם": acct?.full_name || "", "אימייל": acct?.email || "",
      "זכאי/ת להחזר מלא": result.refundEligible ? "כן (בתוך 15 יום)" : "לא (חלף חלון 15 הימים)",
      "ימים מהחיוב הראשון": result.daysSinceCharge == null ? "—" : String(result.daysSinceCharge),
    }).catch(() => {});
  } catch (e) {}
  res.json({
    ok: true,
    refundEligible: result.refundEligible,
    message: result.refundEligible
      ? "המנוי בוטל. את/ה בתוך חלון 15 הימים — מגיע לך החזר כספי מלא, ונטפל בו בהקדם."
      : "המנוי בוטל. החיוב יפסק ממחזור החיוב הבא.",
  });
});

api.post("/access/redeem", rateLimit("redeem", 10), (req, res) => {
  const code = String(req.body?.code || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ error: "code is required" });

  const row = db.prepare("SELECT code, plan, months, redeemed_by FROM access_codes WHERE code = ?").get(code);
  if (!row) return res.status(404).json({ error: "קוד לא נמצא — בדקי שהקלדת נכון" });
  if (row.redeemed_by && row.redeemed_by !== req.deviceToken) {
    return res.status(409).json({ error: "הקוד הזה כבר נוצל" });
  }

  const expiresAt = row.months
    ? db.prepare("SELECT datetime('now', ?) AS t").get(`+${row.months} months`).t
    : null;
  db.prepare("UPDATE access_codes SET redeemed_by = ?, redeemed_at = datetime('now') WHERE code = ?").run(req.deviceToken, code);
  db.prepare("UPDATE patient_profile SET access_code = ?, access_expires_at = ?, updated_at = datetime('now') WHERE device_token = ?").run(
    code,
    expiresAt,
    req.deviceToken
  );
  db.prepare("INSERT INTO notifications (device_token, message, type) VALUES (?, ?, 'win')").run(
    req.deviceToken,
    "ברוכה הבאה! הקוד האישי שלך הופעל והגישה למערכת פתוחה 🌿"
  );
  res.json({ ok: true, ...getAccessStatus(req.deviceToken) });
});

// ── Journey summary: everything the client did, for the end-of-trial page ──
api.get("/journey-summary", (req, res) => {
  const token = req.deviceToken;
  const journeyDay = getJourneyDay(token);
  const access = getAccessStatus(token);

  const checkins = db.prepare("SELECT COUNT(*) AS n FROM checkins WHERE device_token = ?").get(token).n;
  const groundings = db.prepare("SELECT COUNT(*) AS n, AVG(score) AS avg FROM grounding_sessions WHERE device_token = ?").get(token);
  const tasksDone = db.prepare("SELECT COUNT(*) AS n FROM daily_tasks WHERE device_token = ? AND completed = 1").get(token).n;
  const tasksTotal = db.prepare("SELECT COUNT(*) AS n FROM daily_tasks WHERE device_token = ?").get(token).n;
  const progressRow = db.prepare("SELECT completed FROM protocol_progress WHERE device_token = ?").get(token);
  const stagesCompleted = progressRow ? JSON.parse(progressRow.completed).length : 0;

  // Latest AI-extracted wins and patterns across all checkins (newest first, deduped)
  const rows = db.prepare("SELECT wins, patterns FROM checkins WHERE device_token = ? ORDER BY created_at DESC LIMIT 10").all(token);
  const collect = (field, cap) => {
    const seen = new Set();
    const out = [];
    for (const r of rows) {
      let items = [];
      try { items = JSON.parse(r[field] || "[]"); } catch {}
      for (const it of items) {
        const key = it.title || it.text || JSON.stringify(it);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(it);
        if (out.length >= cap) return out;
      }
    }
    return out;
  };

  res.json({
    journeyDay: Math.min(journeyDay, 14),
    accessStatus: access.status,
    stats: {
      checkins,
      groundingSessions: groundings.n,
      avgRelief: groundings.avg ? Math.round(groundings.avg) : null,
      tasksDone,
      tasksTotal,
      stagesCompleted,
    },
    wins: collect("wins", 5),
    patterns: collect("patterns", 4),
  });
});

// ── Daily tasks ──
api.get("/tasks", (req, res) => {
  const rows = db.prepare(
    "SELECT id, title, description, category, completed, created_at FROM daily_tasks WHERE device_token = ? ORDER BY created_at DESC LIMIT 20"
  ).all(req.deviceToken);
  res.json(rows);
});

api.post("/tasks/:id/complete", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "invalid task id" });
  const task = db.prepare("SELECT device_token FROM daily_tasks WHERE id = ?").get(id);
  if (!task || task.device_token !== req.deviceToken) return res.status(404).json({ error: "not found" });
  db.prepare("UPDATE daily_tasks SET completed = 1, completed_at = datetime('now') WHERE id = ?").run(id);
  // Give a win notification
  db.prepare("INSERT INTO notifications (device_token, message, type) VALUES (?, ?, 'win')").run(
    req.deviceToken, "כל הכבוד! השלמת את המשימה היומית שלך 🌟 כל צעד קטן הוא ניצחון אמיתי."
  );
  res.json({ ok: true });
});

// ── Notifications ──
api.get("/notifications", (req, res) => {
  const rows = db.prepare(
    "SELECT id, message, type, read, created_at FROM notifications WHERE device_token = ? ORDER BY created_at DESC LIMIT 30"
  ).all(req.deviceToken);
  res.json(rows);
});

api.post("/notifications/:id/read", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: "invalid id" });
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND device_token = ?").run(id, req.deviceToken);
  res.json({ ok: true });
});

api.post("/notifications/read-all", (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE device_token = ?").run(req.deviceToken);
  res.json({ ok: true });
});

// ערכת הכלים הבסיסית של CureMindset — זמינה לכל משתמש/ת מהרגע הראשון (לפי מפרט העיצוב §5.6).
// כלים טקסטואליים עם הוראות מלאות; כלי אודיו מסומנים "בקרוב" עד שיועלה אודיו אמיתי (בלי נגן מזויף).
const DEFAULT_TOOLS = [
  { id: "tool-box-breath", title: "נשימת קופסה", type: "exercise", url: null, notes: "שאיפה 4 שניות · החזקה 4 · נשיפה 4 · החזקה 4. חוזרים 3 פעמים. מרגיע את מערכת העצבים תוך פחות מדקה." },
  { id: "tool-sos-anchor", title: "עוגן SOS", type: "exercise", url: null, notes: "יד על הלב, נשימה עמוקה, ואומרים בשקט: \"אני כאן, אני בטוח/ה\". עוגן מהיר לרגעי הצפה." },
  { id: "tool-air-journal", title: "יומן רגעי אוויר", type: "exercise", url: null, notes: "כותבים בחופשיות 3 דקות — בלי לתקן, בלי לשפוט. פורק את העומס ומפנה מקום." },
  { id: "tool-micro-step", title: "מיקרו-צעד", type: "exercise", url: null, notes: "בוחרים פעולה אחת קטנה שאפשר לעשות ב-2 דקות ומבצעים אותה עכשיו. תנועה קטנה שוברת תקיעות." },
  { id: "tool-home-anchor", title: "עוגן הבית (אודיו מודרך)", type: "audio", url: null, notes: "תרגול מונחה לבניית מרחב פנימי בטוח. האודיו יתווסף בקרוב." },
  { id: "tool-future-pacing", title: "Future Pacing (אודיו מודרך)", type: "audio", url: null, notes: "דמיון מודרך לתסריט עתידי מיטיב. האודיו יתווסף בקרוב." },
];

api.get("/materials", (req, res) => {
  const rows = db
    .prepare("SELECT id, title, type, url, notes, created_at FROM client_materials WHERE device_token = ? ORDER BY created_at DESC")
    .all(req.deviceToken);
  // הכלים האישיים שקטי הקצתה מופיעים ראשונים; ערכת הכלים הבסיסית תמיד זמינה אחריהם.
  res.json([...rows, ...DEFAULT_TOOLS]);
});

// ── Personal goals ("היעדים שלי") — the client's whole-person targets + progress ──
const GOAL_AREAS = ["רגשי", "ביטחון עצמי", "חרדה / לחץ", "דחיינות", "מערכות יחסים", "קריירה / לימודים", "בריאות ורווחה"];

api.get("/goals", (req, res) => {
  const rows = db
    .prepare("SELECT id, title, area, progress, status, created_at, updated_at FROM client_goals WHERE device_token = ? ORDER BY created_at ASC")
    .all(req.deviceToken);
  res.json({ goals: rows, areas: GOAL_AREAS });
});

api.post("/goals", (req, res) => {
  const title = String(req.body?.title || "").trim().slice(0, 140);
  const area = GOAL_AREAS.includes(req.body?.area) ? req.body.area : GOAL_AREAS[0];
  if (title.length < 2) return res.status(400).json({ error: "נא לנסח יעד קצר וברור" });
  const count = db.prepare("SELECT COUNT(*) AS c FROM client_goals WHERE device_token = ? AND status = 'active'").get(req.deviceToken).c;
  if (count >= 5) return res.status(409).json({ error: "אפשר עד 5 יעדים פעילים — סיימי או מחקי יעד קיים" });
  const info = db.prepare("INSERT INTO client_goals (device_token, title, area) VALUES (?, ?, ?)").run(req.deviceToken, title, area);
  touchPatientActivity(req.deviceToken);
  res.status(201).json({ id: info.lastInsertRowid, title, area, progress: 0, status: "active" });
});

api.put("/goals/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT id FROM client_goals WHERE id = ? AND device_token = ?").get(id, req.deviceToken);
  if (!row) return res.status(404).json({ error: "יעד לא נמצא" });
  const fields = [];
  const vals = [];
  if (req.body?.progress != null) {
    const p = Math.max(0, Math.min(100, Math.round(Number(req.body.progress) || 0)));
    fields.push("progress = ?"); vals.push(p);
    fields.push("status = ?"); vals.push(p >= 100 ? "done" : "active");
  }
  if (typeof req.body?.status === "string" && ["active", "done", "archived"].includes(req.body.status)) {
    fields.push("status = ?"); vals.push(req.body.status);
  }
  if (!fields.length) return res.status(400).json({ error: "אין מה לעדכן" });
  fields.push("updated_at = datetime('now')");
  db.prepare(`UPDATE client_goals SET ${fields.join(", ")} WHERE id = ?`).run(...vals, id);
  touchPatientActivity(req.deviceToken);
  const updated = db.prepare("SELECT id, title, area, progress, status FROM client_goals WHERE id = ?").get(id);
  res.json(updated);
});

api.delete("/goals/:id", (req, res) => {
  db.prepare("DELETE FROM client_goals WHERE id = ? AND device_token = ?").run(Number(req.params.id), req.deviceToken);
  res.json({ ok: true });
});

// --- Therapist CRM (admin) routes — Basic Auth gated, never mixed with the
// patient-facing device-token API below. Mounted before "/api" so its requests
// never reach the device-token middleware (Express matches prefixes in order).
const admin = express.Router();
admin.use(adminAuthMiddleware);

// ── Access codes: the therapist generates a personal code after payment and
// sends it to the client (WhatsApp/מייל); the client redeems it in the member area.
admin.get("/codes", (req, res) => {
  const rows = db
    .prepare("SELECT code, plan, note, months, created_at, redeemed_by, redeemed_at FROM access_codes ORDER BY created_at DESC LIMIT 100")
    .all();
  res.json(rows);
});

admin.post("/codes", (req, res) => {
  const { plan = "digital", note = "", months = null } = req.body || {};
  const monthsInt = months === null || months === "" ? null : parseInt(months, 10);
  if (monthsInt !== null && (!Number.isInteger(monthsInt) || monthsInt < 1 || monthsInt > 36)) {
    return res.status(400).json({ error: "months must be 1-36 or empty" });
  }
  // Unambiguous alphabet (no O/0, I/1) so codes survive being read aloud over the phone.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    const pick = () => alphabet[crypto.randomInt(alphabet.length)];
    code = `CM-${pick()}${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
  } while (db.prepare("SELECT 1 FROM access_codes WHERE code = ?").get(code));

  db.prepare("INSERT INTO access_codes (code, plan, note, months) VALUES (?, ?, ?, ?)").run(code, String(plan), String(note), monthsInt);
  res.json({ code, plan, note, months: monthsInt });
});

// נרשמות לסדנאות — מוצג בפאנל באזור הניהול של קטי
admin.get("/signups", (req, res) => {
  const rows = db
    .prepare("SELECT id, full_name, phone, email, workshop, created_at FROM workshop_signups ORDER BY created_at DESC LIMIT 200")
    .all();
  res.json(rows);
});

// מצב מאגר הידע: אילו קבצים טעונים, כמה קטעים, ובדיקת שליפה ("מה יישלף לשאלה X?")
admin.get("/knowledge", (req, res) => {
  const files = knowledgeStats();
  const test = typeof req.query.q === "string" && req.query.q.trim() ? retrieveKnowledge(req.query.q.trim()) : null;
  res.json({ files, test });
});

// סטטוס ה-AI — האם GPT מלא פעיל, או שהמערכת רצה במנוע המקומי (ולמה).
admin.get("/ai-status", async (req, res) => {
  try {
    const { aiStatus } = require("./openai");
    res.json(await aiStatus());
  } catch (e) {
    console.warn("[ai-status] check failed:", (e && e.message) || e); // פרטים בלוג השרת בלבד
    res.json({ configured: false, working: false, reason: "בדיקת מנוע ה-AI נכשלה כרגע. נסי שוב עוד רגע." });
  }
});

admin.get("/patients", (req, res) => {
  const patients = db.prepare("SELECT device_token, display_name, last_interaction_at FROM patients ORDER BY created_at DESC").all();
  const result = patients.map((p) => {
    const { status, color } = computeStatus(p.device_token);
    return {
      deviceToken: p.device_token,
      displayName: p.display_name,
      status,
      statusColor: color,
      lastInteractionAt: p.last_interaction_at,
    };
  });
  res.json(result);
});

admin.patch("/patients/:token", (req, res) => {
  const { displayName } = req.body || {};
  if (typeof displayName !== "string" || !displayName.trim()) {
    return res.status(400).json({ error: "displayName is required" });
  }
  const result = db
    .prepare("UPDATE patients SET display_name = ? WHERE device_token = ?")
    .run(displayName.trim().slice(0, 200), req.params.token);
  if (result.changes === 0) return res.status(404).json({ error: "Patient not found" });
  res.json({ ok: true });
});

admin.get("/patients/:token", (req, res) => {
  const token = req.params.token;
  const patient = db.prepare("SELECT device_token, display_name, last_interaction_at, created_at FROM patients WHERE device_token = ?").get(token);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const { status, color } = computeStatus(token);
  const checkins = db
    .prepare(
      "SELECT id, text, ai_reply, triggers, patterns, balance_alerts, wins, created_at FROM checkins WHERE device_token = ? ORDER BY created_at DESC"
    )
    .all(token)
    .map((row) => ({
      id: row.id,
      text: row.text,
      aiReply: row.ai_reply,
      triggers: JSON.parse(row.triggers || "[]"),
      patterns: JSON.parse(row.patterns || "[]"),
      balanceAlerts: JSON.parse(row.balance_alerts || "[]"),
      wins: JSON.parse(row.wins || "[]"),
      createdAt: row.created_at,
    }));
  const sessions = db.prepare("SELECT score, date FROM grounding_sessions WHERE device_token = ? ORDER BY date DESC").all(token);
  const materials = db
    .prepare("SELECT id, title, type, url, notes, created_at FROM client_materials WHERE device_token = ? ORDER BY created_at DESC")
    .all(token);
  const goals = db
    .prepare("SELECT id, title, area, progress, status, created_at FROM client_goals WHERE device_token = ? ORDER BY created_at ASC")
    .all(token);
  const moodLogs = db
    .prepare("SELECT anxiety, mood, sleep, note, created_at FROM mood_logs WHERE device_token = ? ORDER BY created_at ASC")
    .all(token);

  res.json({
    deviceToken: patient.device_token,
    displayName: patient.display_name,
    status,
    statusColor: color,
    createdAt: patient.created_at,
    checkins,
    sessions,
    materials,
    goals,
    moodLogs,
  });
});

admin.post("/patients/:token/materials", upload.single("file"), (req, res) => {
  const token = req.params.token;
  const patient = db.prepare("SELECT device_token FROM patients WHERE device_token = ?").get(token);
  if (!patient) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: "Patient not found" });
  }

  const { title, type, notes, link } = req.body || {};
  // A "lesson" is text/link micro-content — no file required (body goes in notes).
  const isLesson = type === "lesson";
  if (typeof title !== "string" || !title.trim() || !MATERIAL_TYPES.has(type) || (!req.file && !isLesson)) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "נדרש שם, סוג תקין, וקובץ (או תוכן לשיעור)" });
  }

  const url = req.file
    ? `/uploads/${req.file.filename}`
    : typeof link === "string"
    ? link.trim().slice(0, 500)
    : "";
  db.prepare("INSERT INTO client_materials (device_token, title, type, url, notes) VALUES (?, ?, ?, ?, ?)").run(
    token,
    title.trim().slice(0, 200),
    type,
    url,
    typeof notes === "string" ? notes.trim().slice(0, 1000) : null
  );
  res.status(201).json({ ok: true });
});

admin.delete("/materials/:id", (req, res) => {
  const material = db.prepare("SELECT url FROM client_materials WHERE id = ?").get(req.params.id);
  if (!material) return res.status(404).json({ error: "Material not found" });
  db.prepare("DELETE FROM client_materials WHERE id = ?").run(req.params.id);
  const filePath = path.join(UPLOADS_DIR, path.basename(material.url));
  fs.unlink(filePath, () => {});
  res.json({ ok: true });
});

app.use("/api/admin", admin);
app.use("/api", api);

// זריעת משתמשת בדיקה (יעל) — רצה תמיד בעליית השרת, אידמפוטנטי (נוצר רק אם לא קיים).
// כך יעל זמינה מיד בכל שירות, בלי צורך להגדיר שום משתנה סביבה.
try {
  const { seedDemoUser } = require("./seed");
  const r = seedDemoUser();
  console.log(r.already ? `Demo user already exists: ${r.email}` : `Seeded demo user: ${r.email} / ${r.password}`);
} catch (e) {
  console.error("demo seed failed:", e.message);
}

// Clean deep-link routes. The public site is one clean marketing app served
// from index.html; /workshops and /dashboard are entry points into it, and
// /admin opens the password-gated Back-Office (its data APIs require Basic Auth).
app.get(["/workshops", "/dashboard"], (req, res) => res.sendFile(path.join(STATIC_DIR, "index.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(STATIC_DIR, "admin.html")));

app.listen(PORT, () => {
  console.log(`CureMindset server listening on http://localhost:${PORT}`);
});
