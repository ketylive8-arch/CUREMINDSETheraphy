const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const express = require("express");
const multer = require("multer");

const { db, getAgeGroup, getAccessStatus, getJourneyDay, scheduleEngagementNotifications } = require("./db");
const { deviceTokenMiddleware } = require("./deviceToken");
const { buildDashboardData } = require("./resilience");
const { runBehavioralHealthCheck, NoApiKeyError } = require("./openai");
const { adminAuthMiddleware } = require("./adminAuth");
const { computeStatus, touchPatientActivity } = require("./crm");
const { retrieveKnowledge, knowledgeStats } = require("./knowledgeBase");
const { registerAccount, loginAccount, destroySession, createSessionForAccount, accountIdFromToken, accountSummary } = require("./auth");
const { smsConfigured, issueOtp, checkOtp, accountForOtp } = require("./otp");
const { notifyLead } = require("./notify");

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

// פרטי החשבון המחובר — שם, קוד הפניה אישי (חבר מביא חבר) ומספר המוזמנים.
app.get("/api/auth/me", (req, res) => {
  const accountId = accountIdFromToken(req.header("X-Auth-Token"));
  if (!accountId) return res.status(401).json({ error: "לא מחובר" });
  const summary = accountSummary(accountId);
  if (!summary) return res.status(404).json({ error: "לא נמצא" });
  res.json(summary);
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

// מאמרים: משיכה מערוץ ה-RSS של קטי (ARTICLES_RSS_URL ב-Environment ברנדר).
// פירסור מינימלי ללא תלויות + מטמון 30 דקות; אם אין כתובת או שיש תקלה — [].
let articlesCache = { at: 0, items: [] };
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
    articlesCache = { at: Date.now(), items };
    res.json(items);
  } catch (err) {
    console.error("articles rss failed:", err.message);
    res.json(articlesCache.items);
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
  const { text } = req.body || {};
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
    const result = await runBehavioralHealthCheck(text.trim(), ageGroup, getJourneyDay(req.deviceToken), retrieved);

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
    if (err instanceof NoApiKeyError) {
      return res.status(503).json({ error: "מנוע ה-AI לא מחובר בשרת (חסר OPENAI_API_KEY).", reason: "no-key" });
    }
    const msg = String((err && err.message) || "");
    console.error("checkin failed:", err);
    // מזהים את סיבת הכשל מול OpenAI ומחזירים הודעה ברורה בעברית.
    if (/\b401\b|invalid_api_key|Incorrect API key/i.test(msg)) {
      return res.status(502).json({ error: "מפתח ה-AI שגוי או בוטל — יש לבדוק את OPENAI_API_KEY ב-Render.", reason: "bad-key" });
    }
    if (/\b429\b|insufficient_quota|exceeded your current quota|billing/i.test(msg)) {
      return res.status(502).json({ error: "לחשבון ה-OpenAI אין קרדיט/מכסה. יש להוסיף אמצעי תשלום ב-platform.openai.com → Billing.", reason: "no-credit" });
    }
    res.status(502).json({ error: "מנוע ה-AI לא הצליח להשיב כרגע. נסי שוב עוד רגע.", reason: "unknown" });
  }
});

// ── Profile (age group + trial) ──
api.get("/profile", (req, res) => {
  const row = db.prepare("SELECT age_group, trial_start_at FROM patient_profile WHERE device_token = ?").get(req.deviceToken);
  res.json({ ageGroup: row?.age_group || "adult", trialStartAt: row?.trial_start_at || null });
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
  res.json(getAccessStatus(req.deviceToken));
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

api.get("/materials", (req, res) => {
  const rows = db
    .prepare("SELECT id, title, type, url, notes, created_at FROM client_materials WHERE device_token = ? ORDER BY created_at DESC")
    .all(req.deviceToken);
  res.json(rows);
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
