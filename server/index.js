const path = require("node:path");
const express = require("express");

const { db } = require("./db");
const { deviceTokenMiddleware } = require("./deviceToken");
const { buildDashboardData } = require("./resilience");
const { runBehavioralHealthCheck, NoApiKeyError } = require("./openai");

const app = express();
const PORT = process.env.PORT || 8731;
const STATIC_DIR = path.join(__dirname, "..");

app.use(express.json({ limit: "100kb" }));
app.use(express.static(STATIC_DIR));

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

app.use("/api", api);

app.listen(PORT, () => {
  console.log(`CureMindset server listening on http://localhost:${PORT}`);
});
