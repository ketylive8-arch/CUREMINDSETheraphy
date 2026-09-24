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

// Deterministic daily rotation so the agent varies its focus and doesn't repeat.
function pickFocus(date = new Date()) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const cat = CATEGORIES[dayOfYear % CATEGORIES.length];
  const city = CITIES[dayOfYear % CITIES.length];
  return { cat, city, queries: cat.q(city).slice(0, 2) };
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
// Returns a summary object; never throws.
async function runDailyAgent({ searchFn = googleSearch, emailFn = notifyEmail, now = new Date() } = {}) {
  const { cat, city, queries } = pickFocus(now);

  // No search provider configured — record the run honestly and stop. No fabrication.
  if (!process.env.GOOGLE_SEARCH_KEY || !process.env.GOOGLE_SEARCH_CX) {
    if (searchFn === googleSearch) {
      leadEngine.recordAgentRun({ queries, note: "no_search_key" });
      return { ok: false, reason: "no_search_key", queries };
    }
  }

  let found = 0, added = 0, duplicates = 0;
  const newLeads = [];
  const seen = new Set();

  try {
    for (const q of queries) {
      let results = [];
      try { results = (await searchFn(q)) || []; } catch (e) { continue; }
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
          region: city,
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
  } catch (e) {
    leadEngine.recordAgentRun({ queries, found, added, duplicates, note: `error: ${String((e && e.message) || e).slice(0, 160)}` });
    return { ok: false, reason: "error", error: String((e && e.message) || e) };
  }

  // Build and send the Hebrew summary email.
  let emailed = false;
  const dateStr = now.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
  if (added > 0) {
    const fields = {};
    newLeads.slice(0, 5).forEach((l, i) => {
      fields[`ליד ${i + 1} · ${l.channelCode}`] =
        `${l.name} (${l.channelKindLabel}, ${l.region}) — למה שיגיד כן: ${l.whyYes}. מקור: ${l.website || l.sourceUrl || ""}`;
    });
    fields["מה עכשיו"] = "היכנסי למנוע ההפצה, בחרי ליד ולחצי 'הכנת פנייה' — או השיבי לי איזה מספר לפתח.";
    const r = await emailFn(LEAD_TO, `הסוכן שלך · לידים חדשים · ${dateStr}`, fields);
    emailed = !!(r && r.sent);
  } else {
    const r = await emailFn(LEAD_TO, `הסוכן שלך · ${dateStr}`, {
      "עדכון": `סרקתי היום ${queries.length} חיפושים (${cat.kind}, ${city}) ולא נמצאו מקומות חדשים שעוד לא במאגר. אמשיך מחר עם קטגוריה ואזור אחרים.`,
    });
    emailed = !!(r && r.sent);
  }

  leadEngine.recordAgentRun({ queries, found, added, duplicates, emailed, note: `${cat.kind} · ${city}` });
  return { ok: true, queries, found, added, duplicates, emailed };
}

module.exports = { runDailyAgent, pickFocus, cleanName, hostname, googleSearch, CITIES, CATEGORIES };

// CLI: `node server/leadAgent.js`
if (require.main === module) {
  runDailyAgent()
    .then((r) => { console.log("[leadAgent]", JSON.stringify(r)); process.exit(0); })
    .catch((e) => { console.error("[leadAgent] fatal", e); process.exit(1); });
}
