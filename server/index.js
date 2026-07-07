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

const app = express();
const PORT = process.env.PORT || 8731;
const STATIC_DIR = path.join(__dirname, "..");
const UPLOADS_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MATERIAL_TYPES = new Set(["audio", "worksheet", "summary", "other"]);

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
      return res.status(503).json({ error: "OPENAI_API_KEY is not configured on the server" });
    }
    console.error("checkin failed:", err);
    res.status(502).json({ error: "Failed to reach OpenAI" });
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

  res.json({
    deviceToken: patient.device_token,
    displayName: patient.display_name,
    status,
    statusColor: color,
    createdAt: patient.created_at,
    checkins,
    sessions,
    materials,
  });
});

admin.post("/patients/:token/materials", upload.single("file"), (req, res) => {
  const token = req.params.token;
  const patient = db.prepare("SELECT device_token FROM patients WHERE device_token = ?").get(token);
  if (!patient) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: "Patient not found" });
  }

  const { title, type, notes } = req.body || {};
  if (typeof title !== "string" || !title.trim() || !MATERIAL_TYPES.has(type) || !req.file) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "title, a valid type, and file are required" });
  }

  const url = `/uploads/${req.file.filename}`;
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

app.listen(PORT, () => {
  console.log(`CureMindset server listening on http://localhost:${PORT}`);
});
