// Per-patient CRM status — a one-line text status only, no scores/percentages/graphs.
// Priority: red (active high-intensity trigger in the most recent checkin) > yellow
// (no activity 3+ days) > green (default, in balance).

const { db } = require("./db");

const STATUS_GREEN = "באיזון";
const STATUS_YELLOW_PREFIX = "לא תרגלה/תרגל מעל";
const STATUS_RED = "טריגר פעיל בעוצמה גבוהה";

function daysSince(isoString) {
  if (!isoString) return null;
  const then = new Date(isoString.replace(" ", "T") + "Z").getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

function latestCheckinSummary(deviceToken) {
  const row = db
    .prepare("SELECT triggers, wins, created_at FROM checkins WHERE device_token = ? ORDER BY created_at DESC LIMIT 1")
    .get(deviceToken);
  if (!row) return null;
  let triggers = [];
  let wins = [];
  try {
    triggers = JSON.parse(row.triggers || "[]");
  } catch {}
  try {
    wins = JSON.parse(row.wins || "[]");
  } catch {}
  return { triggers, wins, createdAt: row.created_at };
}

function computeStatus(deviceToken) {
  const latest = latestCheckinSummary(deviceToken);
  const hasHighIntensityTrigger = (latest?.triggers || []).some(
    (t) => t && (t.intensity === "high" || t.severity === "high" || /גבוה/.test(t.intensity || t.severity || ""))
  );

  if (hasHighIntensityTrigger) {
    return { status: STATUS_RED, color: "red" };
  }

  const patientRow = db.prepare("SELECT last_interaction_at FROM patients WHERE device_token = ?").get(deviceToken);
  const idleDays = daysSince(patientRow?.last_interaction_at);
  if (idleDays !== null && idleDays >= 3) {
    return { status: `${STATUS_YELLOW_PREFIX} ${idleDays} ימים`, color: "yellow" };
  }

  if (latest?.wins?.length) {
    return { status: "באיזון והתקדמות", color: "green" };
  }

  return { status: STATUS_GREEN, color: "green" };
}

function summarizeForCrm(deviceToken) {
  const latest = latestCheckinSummary(deviceToken);
  if (!latest) return null;
  const parts = [];
  if (latest.triggers.length) parts.push(`טריגרים: ${latest.triggers.map((t) => t.label || t.title || t.text).filter(Boolean).join(", ")}`);
  if (latest.wins.length) parts.push(`הצלחות: ${latest.wins.map((w) => w.title || w.text).filter(Boolean).join(", ")}`);
  return parts.join(" · ") || null;
}

// Called after any patient-facing write (checkin, grounding session) so the CRM
// dashboard reflects the change as soon as the therapist refreshes the patient list.
// The patient just interacted, so idle-days can never apply here — only red (active
// high-intensity trigger) vs. green is relevant; idle-yellow is computed live by
// computeStatus() whenever the admin list is rendered, based on last_interaction_at.
function touchPatientActivity(deviceToken) {
  const latest = latestCheckinSummary(deviceToken);
  const hasHighIntensityTrigger = (latest?.triggers || []).some(
    (t) => t && (t.intensity === "high" || t.severity === "high" || /גבוה/.test(t.intensity || t.severity || ""))
  );
  const status = hasHighIntensityTrigger ? STATUS_RED : latest?.wins?.length ? "באיזון והתקדמות" : STATUS_GREEN;
  const summary = summarizeForCrm(deviceToken);
  db.prepare("UPDATE patients SET last_interaction_at = datetime('now'), status = ?, last_summary = ? WHERE device_token = ?").run(
    status,
    summary,
    deviceToken
  );
}

module.exports = { computeStatus, touchPatientActivity };
