/* מייצר content-catalog.json סטטי מתוך seed התוכן — כדי שעמוד /program יציג
 * את היחידות תמיד (גם בלי backend). מריץ: node scripts/gen-content-json.js */
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// למנוע תופעת לוואי על ה-DB האמיתי: מפנים ל-DB זמני לפני require.
process.env.DB_FILE = path.join(os.tmpdir(), `cm-genjson-${process.pid}.db`);
const { MODULES } = require("../server/contentSeed");

const TOPIC_LABELS = {
  anxiety: "חרדה", stress: "לחץ והצפה", self_image: "דימוי עצמי", confidence: "ביטחון עצמי",
  procrastination: "דחיינות", addiction: "התנהגויות ממכרות", regulation: "ויסות רגשי",
  youth: "נוער", parenting: "הורות", communication: "תקשורת",
};

const modules = MODULES.map((m) => ({
  slug: m.slug, title: m.title, topic: m.topic, topicLabel: TOPIC_LABELS[m.topic] || m.topic,
  audience: m.audience, objective: m.objective, durationMin: m.duration_min,
  explanation: m.explanation, exercise: m.exercise, transcript: m.transcript,
  reflection: m.reflection, reward: m.reward, safetyNote: m.safety_note, nextStep: m.next_step,
}));

const topics = [...new Set(modules.map((m) => m.topic))].map((t) => ({ topic: t, label: TOPIC_LABELS[t] || t }));
const out = { generatedAt: new Date().toISOString(), topics, count: modules.length, modules };

fs.writeFileSync(path.join(__dirname, "..", "content-catalog.json"), JSON.stringify(out, null, 2), "utf8");
try { fs.rmSync(process.env.DB_FILE, { force: true }); } catch {}
console.log(`content-catalog.json — ${modules.length} modules, ${topics.length} topics`);
