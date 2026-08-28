// ── שלב A: פרופיל קליני חכם ──────────────────────────────────────────────
// מנוע צד-שרת שלומד מכל הנתונים של המשתמש/ת (צ'ק-אין, מצב-רוח, משימות, תרגולים)
// ומזקק אותם ל"תמונה קלינית" חכמה: מגמת חרדה, שעות שיא, טריגרים חוזרים, מה עוזר,
// מעורבות, ורמת סיכון. זהו הבסיס שכל שאר האינטליגנציה (התאמה, התראות, דשבורד) נשען עליו.
//
// חשוב: מודול טהור וללא תלויות — מקבל שורות DB גולמיות ומחזיר אובייקט מובנה + תובנות
// בעברית. לא שובר כלום קיים; רק מוסיף שכבת חוכמה מעל הנתונים שכבר נאספים.

// עוזרים בסיסיים ------------------------------------------------------------
function average(list) {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function safeParse(json) {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
// תאריך SQLite ("YYYY-MM-DD HH:MM:SS" ב-UTC) או ISO → אובייקט Date.
function toDate(s) {
  if (!s) return null;
  const iso = typeof s === "string" && s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") + "Z" : s;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
function dayKey(d) {
  return d ? d.toISOString().slice(0, 10) : null;
}

// חלוקת שעות היום לארבעה חלקים קליניים -------------------------------------
function partOfDay(hour) {
  if (hour >= 5 && hour <= 11) return "morning";
  if (hour >= 12 && hour <= 16) return "noon";
  if (hour >= 17 && hour <= 21) return "evening";
  return "night";
}
const PART_LABEL = {
  morning: "בוקר",
  noon: "צהריים",
  evening: "ערב",
  night: "לילה",
};

// תיוג טריגר לצורך ספירת תדירות (area מ-AI, title/label מהמנוע המקומי) --------
function triggerLabel(item) {
  if (!item || typeof item !== "object") return null;
  const raw = item.area || item.title || item.label || item.note || item.text || "";
  const s = String(raw).trim();
  return s ? s.slice(0, 60) : null;
}

// ── מגמת חרדה: השוואת מחצית ראשונה מול אחרונה ──────────────────────────────
function anxietyTrend(moodLogs) {
  const series = moodLogs
    .map((m) => ({ v: Number(m.anxiety), at: toDate(m.created_at) }))
    .filter((m) => Number.isFinite(m.v) && m.at);
  if (series.length < 2) {
    return { direction: "unknown", changePercent: null, recentAvg: series.length ? round1(series[series.length - 1].v) : null, points: series.length };
  }
  const mid = Math.floor(series.length / 2);
  const firstAvg = average(series.slice(0, mid).map((s) => s.v));
  const secondAvg = average(series.slice(mid).map((s) => s.v));
  const recentAvg = round1(average(series.slice(-5).map((s) => s.v)));
  let changePercent = null;
  if (firstAvg > 0) changePercent = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  // חרדה = ערך נמוך יותר טוב. ירידה משמעותית = שיפור.
  let direction = "stable";
  if (changePercent !== null) {
    if (changePercent <= -10) direction = "improving";
    else if (changePercent >= 10) direction = "worsening";
  }
  return { direction, changePercent, recentAvg, points: series.length };
}

// ── שעות שיא: מתי החרדה הכי גבוהה / מתי פונים אלינו ────────────────────────
function peakTimes(moodLogs, checkins) {
  const buckets = { morning: 0, noon: 0, evening: 0, night: 0 };
  const weighted = { morning: 0, noon: 0, evening: 0, night: 0 };
  for (const m of moodLogs) {
    const d = toDate(m.created_at);
    if (!d) continue;
    const p = partOfDay(d.getHours());
    buckets[p] += 1;
    const a = Number(m.anxiety);
    if (Number.isFinite(a)) weighted[p] += a;
  }
  for (const c of checkins) {
    const d = toDate(c.created_at);
    if (!d) continue;
    // צ'ק-אין = רגע שבו המשתמש/ת בחר/ה לפנות; משקל קל לזמן הפנייה.
    weighted[partOfDay(d.getHours())] += 3;
  }
  const entries = Object.entries(weighted);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (total === 0) return { dominant: null, label: null, distribution: buckets };
  entries.sort((a, b) => b[1] - a[1]);
  const [dominant] = entries[0];
  return { dominant, label: PART_LABEL[dominant], distribution: buckets };
}

// ── טריגרים חוזרים: הנפוצים ביותר לאורך כל הצ'ק-אינים ─────────────────────
function topTriggers(checkins, cap = 3) {
  const counts = new Map();
  for (const c of checkins) {
    const seenInThis = new Set();
    for (const t of safeParse(c.triggers)) {
      const label = triggerLabel(t);
      if (!label || seenInThis.has(label)) continue;
      seenInThis.add(label);
      const prev = counts.get(label) || { label, count: 0, intensity: [] };
      prev.count += 1;
      if (t.intensity) prev.intensity.push(t.intensity);
      counts.set(label, prev);
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, cap)
    .map((t) => ({ label: t.label, count: t.count }));
}

// ── מה עוזר: ניצחונות מהצ'ק-אין + קטגוריות משימות שהושלמו ──────────────────
const CATEGORY_LABEL = {
  breathing: "נשימה",
  journaling: "כתיבה",
  movement: "תנועה",
  social: "חיבור חברתי",
  mindfulness: "מיינדפולנס",
};
function whatHelps(checkins, tasks) {
  const wins = [];
  for (const c of checkins) {
    for (const w of safeParse(c.wins)) {
      const title = w && (w.title || w.label);
      if (title) wins.push(String(title).slice(0, 80));
    }
    if (wins.length >= 5) break;
  }
  const catCounts = new Map();
  for (const t of tasks) {
    if (Number(t.completed) === 1) {
      const c = t.category || "mindfulness";
      catCounts.set(c, (catCounts.get(c) || 0) + 1);
    }
  }
  const helpfulCategories = [...catCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => ({ category: cat, label: CATEGORY_LABEL[cat] || cat, count }));
  return { wins: [...new Set(wins)].slice(0, 4), helpfulCategories };
}

// ── מעורבות: רצף, ימים פעילים, פעילות אחרונה ──────────────────────────────
function engagement(moodLogs, checkins, tasks) {
  const allDates = new Set();
  const addDay = (s) => {
    const k = dayKey(toDate(s));
    if (k) allDates.add(k);
  };
  moodLogs.forEach((m) => addDay(m.created_at));
  checkins.forEach((c) => addDay(c.created_at));
  const sorted = [...allDates].sort();
  const lastActiveKey = sorted[sorted.length - 1] || null;

  // רצף ימים רצופים עד היום/אתמול.
  let streak = 0;
  if (lastActiveKey) {
    const today = dayKey(new Date());
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    if (lastActiveKey === today || lastActiveKey === yesterday) {
      streak = 1;
      let cursor = new Date(lastActiveKey + "T00:00:00Z");
      for (;;) {
        cursor = new Date(cursor.getTime() - 86400000);
        if (allDates.has(dayKey(cursor))) streak += 1;
        else break;
      }
    }
  }
  const lastActive = toDate(lastActiveKey);
  const daysSinceActive = lastActive ? Math.floor((Date.now() - lastActive.getTime()) / 86400000) : null;
  const tasksCompleted = tasks.filter((t) => Number(t.completed) === 1).length;

  return {
    activeDays: allDates.size,
    checkinCount: checkins.length,
    streak,
    daysSinceActive,
    lastActive: lastActiveKey,
    tasksCompleted,
    tasksTotal: tasks.length,
  };
}

// ── רמת סיכון קלינית: הבסיס להתראות (שלב C) ────────────────────────────────
// calm / watch / attention — נגזרת ממגמה, רמת חרדה עדכנית, ונטישה.
function riskLevel(trend, eng) {
  let score = 0;
  const reasons = [];
  if (trend.direction === "worsening") {
    score += 2;
    reasons.push(`מגמת עלייה בחרדה${trend.changePercent != null ? ` (${trend.changePercent}%+)` : ""}`);
  }
  if (trend.recentAvg != null && trend.recentAvg >= 7) {
    score += 2;
    reasons.push(`רמת חרדה עדכנית גבוהה (${trend.recentAvg}/10)`);
  } else if (trend.recentAvg != null && trend.recentAvg >= 5.5) {
    score += 1;
    reasons.push(`רמת חרדה בינונית (${trend.recentAvg}/10)`);
  }
  if (eng.daysSinceActive != null && eng.daysSinceActive >= 4) {
    score += 2;
    reasons.push(`${eng.daysSinceActive} ימים ללא פעילות`);
  } else if (eng.daysSinceActive != null && eng.daysSinceActive >= 2) {
    score += 1;
  }
  let level = "calm";
  if (score >= 4) level = "attention";
  else if (score >= 2) level = "watch";
  return { level, score, reasons };
}

// ── תובנות בעברית: השכבה ה"מדברת" — משפטים קליניים אנושיים ─────────────────
function buildInsights(trend, peaks, triggers, helps, eng, risk) {
  const out = [];
  if (trend.direction === "improving") {
    out.push({ tone: "positive", text: `החרדה שלך במגמת ירידה${trend.changePercent != null ? ` — ${Math.abs(trend.changePercent)}% פחות מתחילת המסע` : ""}. הכיוון נכון, ממשיכים.` });
  } else if (trend.direction === "worsening") {
    out.push({ tone: "care", text: "בתקופה האחרונה רמת החרדה עלתה מעט. זה קורה, וזה בדיוק הזמן להישען על הכלים — אני כאן." });
  } else if (trend.direction === "stable" && trend.recentAvg != null) {
    out.push({ tone: "neutral", text: `רמת החרדה שלך יציבה סביב ${trend.recentAvg}/10. יציבות היא בסיס טוב לצמיחה.` });
  }
  if (peaks.label) {
    out.push({ tone: "neutral", text: `שעות ה${peaks.label} נראות המאתגרות ביותר עבורך — כדאי לתזמן תרגול קצר דווקא אז.` });
  }
  if (triggers.length) {
    const names = triggers.map((t) => t.label).join(", ");
    out.push({ tone: "neutral", text: `הנושא שחוזר אצלך הכי הרבה: ${names}. זיהוי הדפוס הוא חצי מהדרך.` });
  }
  if (helps.helpfulCategories.length) {
    const best = helps.helpfulCategories[0];
    out.push({ tone: "positive", text: `מה שהכי עוזר לך בפועל: תרגולי ${best.label}. נבנה על מה שכבר עובד בשבילך.` });
  }
  if (eng.streak >= 3) {
    out.push({ tone: "positive", text: `${eng.streak} ימים ברצף של נוכחות בתהליך — עקביות היא הכוח האמיתי. 🔥` });
  } else if (eng.daysSinceActive != null && eng.daysSinceActive >= 3) {
    out.push({ tone: "care", text: `לא התראינו כבר ${eng.daysSinceActive} ימים. בלי לחץ — אפילו רגע קטן של צ'ק-אין מחזיר אותנו למסלול.` });
  }
  if (!out.length) {
    out.push({ tone: "neutral", text: "אנחנו ממש בתחילת הדרך — ככל שתשתפי/תשתף יותר, התמונה שלך תתחדד ואוכל ללוות מדויק יותר." });
  }
  return out;
}

// ── ה-API הראשי: מרכיב את כל התמונה הקלינית ────────────────────────────────
function buildClinicalProfile({ moodLogs = [], checkins = [], tasks = [], journeyDay = 1 } = {}) {
  const trend = anxietyTrend(moodLogs);
  const peaks = peakTimes(moodLogs, checkins);
  const triggers = topTriggers(checkins);
  const helps = whatHelps(checkins, tasks);
  const eng = engagement(moodLogs, checkins, tasks);
  const risk = riskLevel(trend, eng);
  const insights = buildInsights(trend, peaks, triggers, helps, eng, risk);

  const dataPoints = moodLogs.length + checkins.length;
  // ככל שיש יותר נתונים, כך התמונה בשלה יותר — לשקיפות מול המשתמש/ת ומול קטי.
  const maturity = dataPoints >= 12 ? "high" : dataPoints >= 4 ? "medium" : "low";

  return {
    journeyDay,
    maturity,
    dataPoints,
    anxiety: trend,
    peakTimes: peaks,
    topTriggers: triggers,
    whatHelps: helps,
    engagement: eng,
    risk,
    insights,
    generatedAt: new Date().toISOString(),
  };
}

// גרסה דחוסה להזרקה לתוך ה-prompt של ה-AI — כדי שהתשובות יתייחסו לתמונה הקלינית.
function profileToPromptContext(profile) {
  if (!profile) return "";
  const p = [];
  if (profile.anxiety && profile.anxiety.direction !== "unknown") {
    const dir = { improving: "בירידה", worsening: "בעלייה", stable: "יציבה" }[profile.anxiety.direction] || "";
    p.push(`מגמת חרדה: ${dir}${profile.anxiety.recentAvg != null ? ` (עדכני ${profile.anxiety.recentAvg}/10)` : ""}`);
  }
  if (profile.peakTimes && profile.peakTimes.label) p.push(`שעת שיא: ${profile.peakTimes.label}`);
  if (profile.topTriggers && profile.topTriggers.length) p.push(`טריגרים חוזרים: ${profile.topTriggers.map((t) => t.label).join(", ")}`);
  if (profile.whatHelps && profile.whatHelps.helpfulCategories.length) p.push(`עוזר בפועל: ${profile.whatHelps.helpfulCategories.map((c) => c.label).join(", ")}`);
  if (profile.engagement && profile.engagement.streak >= 2) p.push(`רצף: ${profile.engagement.streak} ימים`);
  if (profile.risk && profile.risk.level !== "calm") p.push(`דגל קליני: ${profile.risk.level === "attention" ? "דורש תשומת לב" : "מעקב"}`);
  return p.length ? `תמונה קלינית מצטברת של המשתמש/ת — ${p.join(" · ")}.` : "";
}

module.exports = { buildClinicalProfile, profileToPromptContext };
