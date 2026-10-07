// Daily lead agent — runs on the server (Render cron), on its own, every morning.
//
// What it does, once a day:
//   1. Searches the PUBLIC web (Google Programmable Search) for distribution
//      channels in Kety's area — places that already hold parents of teens.
//   2. Records the new ones in the CRM (dist_channels) as DISCOVERED, de-duped.
//   3. Emails Kety a short Hebrew summary of what it found.
//
// It never sends outreach, never scrapes closed groups, never collects minors'
// data, and never invents a place or a contact. No search key configured →
// it records a run noting that and sends nothing (it does not fabricate leads).
//
// Run manually:  node server/leadAgent.js
// Render cron:   node server/leadAgent.js   (schedule e.g. every weekday 06:00)

const leadEngine = require("./leadEngine");
const { notifyEmail } = require("./notify");

const LEAD_TO = process.env.LEAD_AGENT_EMAIL || "ketyse@gmail.com";

// Kety's area (from CLAUDE.md) and the channel categories worth scanning.
const CITIES = ["חיפה", "קריות", "נשר", "טירת כרמל", "עכו", "נהריה", "קריית טבעון", "קריית אתא", "קריית ביאליק"];

const CATEGORIES = [
  { kind: "parent_community", why: "קהילה שמחפשת תוכן איכותי להורים למתבגרים", q: (c) => [`מתנ"ס ${c} הרצאות להורים`, `קהילת הורים ${c}`] },
  { kind: "learning_center", why: "ערך משלים להורים סביב לחץ לימודי וביטחון עצמי", q: (c) => [`מרכז למידה ${c} תיכון`, `הכנה לבגרות ${c}`] },
  { kind: "sports_club", why: "כלים להורים על ההתמודדות הרגשית של בני נוער", q: (c) => [`מועדון ספורט נוער ${c}`, `חוג נוער ${c}`] },
  { kind: "parenting_center", why: "משלים לסדנאות ההורות שהם כבר מציעים", q: (c) => [`מרכז הורות ומשפחה ${c}`, `סדנאות להורים ${c}`] },
  { kind: "employer", why: "הטבת רווחה להורים שהם עובדים בארגון", q: (c) => [`רווחת עובדים חברה ${c}`, `מועדון הטבות עובדים ${c}`] },
  { kind: "enrichment", why: "ערך רגשי להורים מעבר לחוג עצמו", q: (c) => [`מרכז העשרה נוער ${c}`] },
];

// Deterministic daily rotation: one category per day, spread across several
// cities so a run can reach ~12–15 leads without repeating yesterday's focus.
function pickFocus(date = new Date()) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const cat = CATEGORIES[dayOfYear % CATEGORIES.length];
  const start = dayOfYear % CITIES.length;
  const cities = [0, 1, 2, 3, 4, 5].map((i) => CITIES[(start + i) % CITIES.length]);
  const plan = cities.map((city) => ({ city, q: cat.q(city)[0] }));
  return { cat, city: cities[0], cities, plan, queries: plan.map((p) => p.q) };
}

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// Trim noisy search titles ("שם | אתר - סלוגן") down to a usable org name.
function cleanName(title) {
  return String(title || "").split(/[|\-–—:·]/)[0].trim().slice(0, 120);
}

// Google Programmable Search JSON API. Returns [{title, link, snippet}].
// Needs GOOGLE_SEARCH_KEY + GOOGLE_SEARCH_CX. Returns null if not configured.
async function googleSearch(query, { key, cx } = {}) {
  key = key || process.env.GOOGLE_SEARCH_KEY;
  cx = cx || process.env.GOOGLE_SEARCH_CX;
  if (!key || !cx) return null;
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&num=5&lr=lang_iw&gl=il`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Google Search ${resp.status}`);
  const data = await resp.json();
  return (data.items || []).map((it) => ({ title: it.title, link: it.link, snippet: it.snippet }));
}

// Main entry. `searchFn(query)` is injectable for testing; defaults to Google.
// Returns a full run report (§19); never throws.
async function runDailyAgent({ searchFn = googleSearch, emailFn = notifyEmail, now = new Date() } = {}) {
  const { cat, plan, queries } = pickFocus(now);

  // §12/§18 — Audit-first: review what's already in the CRM before searching.
  const audit = leadEngine.dailyBriefing();

  // No search provider configured — record the run honestly and stop. No fabrication.
  if (!process.env.GOOGLE_SEARCH_KEY || !process.env.GOOGLE_SEARCH_CX) {
    if (searchFn === googleSearch) {
      leadEngine.recordAgentRun({ queries, note: "no_search_key" });
      return { ok: false, reason: "no_search_key", queries, audit };
    }
  }

  let found = 0, added = 0, duplicates = 0;
  const newLeads = [];
  const seen = new Set();
  let failures = 0; // §11 credit-saving: stop after 2 consecutive search failures.

  for (const step of plan) {
    if (failures >= 2) break;           // §11 — stop, don't keep burning searches
    if (added >= 15) break;             // enough quality leads for one day
    let results = [];
    try { results = (await searchFn(step.q)) || []; failures = 0; }
    catch (e) { failures++; continue; }
    for (const r of results) {
      found++;
      const name = cleanName(r.title);
      const site = hostname(r.link);
      if (!name || seen.has(site || name)) continue;
      seen.add(site || name);
      const res = leadEngine.createChannel({
        name,
        channelKind: cat.kind,
        oppType: "AUDIENCE_OWNER",
        region: step.city,
        whyYes: cat.why,
        website: r.link,
        sourceUrl: r.link,
        audienceSizeStatus: "UNKNOWN",
        priority: "MEDIUM",
        status: "DISCOVERED",
        notes: r.snippet ? String(r.snippet).slice(0, 300) : null,
      });
      if (res.ok) { added++; newLeads.push({ ...res.channel, snippet: r.snippet }); }
      else if (res.error === "duplicate") duplicates++;
    }
  }

  // Build and send the Hebrew summary email. Each lead carries goal + offer (§2).
  let emailed = false;
  const dateStr = now.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
  if (added > 0) {
    const fields = {};
    newLeads.slice(0, 15).forEach((l, i) => {
      fields[`ליד ${i + 1} · ${l.channelCode}`] =
        `${l.name} (${l.channelKindLabel}, ${l.region}). למה שיגיד כן: ${l.whyYes}. מטרה: שיחת היכרות / שת"פ הפצה. מה מציעים: כלי דיגיטלי חינמי להורים (מודל 4). מקור: ${l.website || l.sourceUrl || ""}`;
    });
    fields["מה עכשיו"] = "בחרי מספרים והשיבי לי — ואכין לך הודעות פנייה מוכנות.";
    const r = await emailFn(LEAD_TO, `הסוכן שלך · לידים חדשים · ${dateStr}`, fields);
    emailed = !!(r && r.sent);
  } else {
    const r = await emailFn(LEAD_TO, `הסוכן שלך · ${dateStr}`, {
      "עדכון": `סרקתי היום ${queries.length} חיפושים (${cat.kind}) ולא נמצאו מקומות חדשים שעוד לא במאגר. אמשיך מחר עם קטגוריה ואזור אחרים.`,
    });
    emailed = !!(r && r.sent);
  }

  leadEngine.recordAgentRun({ queries, found, added, duplicates, emailed, note: cat.kind });

  // §19 — full run output.
  const output = {
    whatMovedForward: added > 0 ? `נוספו ${added} ערוצים חדשים (${cat.kind}).` : "לא נוספו ערוצים חדשים היום.",
    bestOpportunities: leadEngine.listChannels({ priority: "HIGH" }).slice(0, 5).map((c) => ({ code: c.channelCode, name: c.name })),
    draftsReady: (audit.summary && audit.summary.awaitingApproval) || 0,
    tests: leadEngine.listExperiments().filter((e) => e.status !== "done").length,
    measurement: leadEngine.funnelReport(),
    nextActions: audit.actions || [],
    searchUsage: { queries: queries.length, failures },
  };
  return { ok: true, queries, found, added, duplicates, emailed, output };
}

// §16 — weekly learning email (for a weekly Render cron / routine).
async function runWeeklyLearning({ emailFn = notifyEmail, now = new Date() } = {}) {
  const w = leadEngine.weeklyLearning(now);
  const dateStr = now.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
  const fields = w.insufficientData
    ? { "סיכום שבועי": "אין עדיין מספיק נתונים לשבוע הזה. ככל שייכנסו ערוצים ופעולות — הסיכום יתמלא." }
    : {
        "נוספו השבוע": String(w.addedThisWeek),
        'נמצאו ע"י הסוכן': String(w.foundByAgent),
        "הגיבו / מתעניינים": String(w.responded),
        "בפיילוט": String(w.pilots),
        "מפיצים בפועל": String(w.distributing),
        "לקוחות": String(w.clients),
        "תקועים (נשלחה פנייה בלי תגובה)": String(w.stuckContacted),
        "משפך מדיד": w.funnel.hasData ? `${w.funnel.totals.leads} לידים · ${w.funnel.totals.clients} לקוחות` : "אין מספיק נתונים",
      };
  const r = await emailFn(LEAD_TO, `הסוכן שלך · סיכום שבועי · ${dateStr}`, fields);
  return { ok: true, emailed: !!(r && r.sent), weekly: w };
}

module.exports = { runDailyAgent, runWeeklyLearning, pickFocus, cleanName, hostname, googleSearch, CITIES, CATEGORIES };

// CLI: `node server/leadAgent.js`
if (require.main === module) {
  runDailyAgent()
    .then((r) => { console.log("[leadAgent]", JSON.stringify(r)); process.exit(0); })
    .catch((e) => { console.error("[leadAgent] fatal", e); process.exit(1); });
}
