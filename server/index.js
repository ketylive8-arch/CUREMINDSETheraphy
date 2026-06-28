const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const express = require("express");
const multer = require("multer");

const { db } = require("./db");
const { deviceTokenMiddleware } = require("./deviceToken");
const { buildDashboardData } = require("./resilience");
const { runBehavioralHealthCheck, NoApiKeyError } = require("./openai");
const { adminAuthMiddleware } = require("./adminAuth");
const { computeStatus, touchPatientActivity } = require("./crm");

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

app.use(express.json({ limit: "100kb" }));
app.use(express.static(STATIC_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));

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

api.post("/checkin", async (req, res) => {
  const { text } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  if (text.length > 4000) {
    return res.status(400).json({ error: "text is too long" });
  }

  try {
    const result = await runBehavioralHealthCheck(text.trim());

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

    const progressRow = db.prepare("SELECT unlocked, completed FROM protocol_progress WHERE device_token = ?").get(req.deviceToken);
    const progress = { unlocked: progressRow.unlocked, completed: JSON.parse(progressRow.completed) };
    const sessions = db.prepare("SELECT score, date FROM grounding_sessions WHERE device_token = ? ORDER BY date ASC").all(req.deviceToken);
    const checkinRows = db
      .prepare("SELECT triggers, patterns, balance_alerts, wins FROM checkins WHERE device_token = ? ORDER BY created_at DESC")
      .all(req.deviceToken);

    res.json({ reply: result.reply, dashboard: buildDashboardData(progress, sessions, checkinRows) });
  } catch (err) {
    if (err instanceof NoApiKeyError) {
      return res.status(503).json({ error: "OPENAI_API_KEY is not configured on the server" });
    }
    console.error("checkin failed:", err);
    res.status(502).json({ error: "Failed to reach OpenAI" });
  }
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
