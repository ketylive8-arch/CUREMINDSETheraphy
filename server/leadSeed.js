// Seed the distribution CRM with the real leads the agent has already found,
// so the dashboard shows real content on first login instead of an empty table.
// Idempotent: createChannel de-dupes, so re-running on every deploy is safe.
// These are all PUBLIC organizations found via web search — nothing invented;
// contact details are left for Kety to verify ("לאימות").

const leadEngine = require("./leadEngine");

const SEED_LEADS = [
  {
    name: "רשת המתנ\"סים חיפה", channelKind: "parent_community", oppType: "AUDIENCE_OWNER",
    region: "חיפה", hasTeenParents: true, whyYes: "42 מרכזים קהילתיים שמחפשים כל הזמן תוכן והרצאות איכותיות להורים",
    offerModel: "WORKSHOP", priority: "HIGH", sourceUrl: "https://www.haifa.muni.il/culture/community-centers/",
    notes: "רשת מתנ\"סים עירונית — הרצאות וסדנאות להורים בקהילה. איש קשר לאימות מול הסניף הקרוב.",
  },
  {
    name: "מרכז הכשרה, הדרכה וטיפול משפחתי", channelKind: "parenting_center", oppType: "HOST",
    region: "חיפה", hasTeenParents: true, whyYes: "עוסקים בדיוק בקשיי גיל ההתבגרות — חוסן וביטחון עצמי משלימים את מה שהם מציעים",
    offerModel: "WORKSHOP", priority: "MEDIUM", phonePublic: "04-8621986",
    sourceUrl: "https://mishpaha.org.il/", notes: "רח' גולומב 21, חיפה.",
  },
  {
    name: "סדנאות להורים למתבגרים — עיריית נהריה", channelKind: "parent_community", oppType: "AUDIENCE_OWNER",
    region: "נהריה", hasTeenParents: true, whyYes: "גוף ציבורי שכבר מפעיל סדנאות להורים ומחפש מרצים ותכנים",
    offerModel: "WORKSHOP", priority: "MEDIUM", sourceUrl: "https://www.nahariya.muni.il/",
    notes: "איש קשר לאימות מול אגף החינוך/רווחה.",
  },
  {
    name: "רשת קידום — סניף קריות", channelKind: "learning_center", oppType: "HOST",
    region: "קריית ביאליק", hasTeenParents: true, whyYes: "ההורים אצלם בלחץ בגרויות — כלי על חרדת מבחנים וביטחון עצמי משלים להם",
    offerModel: "DIGITAL_RESOURCE", priority: "HIGH", sourceUrl: "https://www.study.co.il/",
    notes: "מגדלי קריון, קריית ביאליק.",
  },
  {
    name: "רשת אנקורי — סניף קריות", channelKind: "learning_center", oppType: "HOST",
    region: "קריית ביאליק", hasTeenParents: true, whyYes: "אותו קהל הורים בתקופת בגרויות, ערך רגשי משלים ללימודי",
    offerModel: "DIGITAL_RESOURCE", priority: "MEDIUM", sourceUrl: "https://www.study.co.il/",
    notes: "דרך עכו, קריית ביאליק.",
  },
  {
    name: "לימוד נעים — רשת מורים פרטיים", channelKind: "learning_center", oppType: "DIST_PARTNER",
    region: "קריות", hasTeenParents: true, whyYes: "פלטפורמה שמגיעה להרבה הורים דרך מורים — יכולים להפיץ כלי/תוכן לכל הרשת",
    offerModel: "LEAD_FUNNEL", priority: "HIGH", website: "https://www.limudnaim.co.il/",
    sourceUrl: "https://www.limudnaim.co.il/", notes: "הפצה רחבה דרך רשת המורים וההורים.",
  },
  {
    name: "עלם (ELEM) — סניף חיפה", channelKind: "other", oppType: "AUDIENCE_OWNER",
    region: "חיפה", hasTeenParents: true, whyYes: "עמותה שעובדת עם נוער והורים; תוכן חוסן וביטחון עצמי רלוונטי לקהל שלהם",
    offerModel: "WORKSHOP", priority: "MEDIUM", sourceUrl: "https://www.elem.org.il/branch/חיפה/",
    notes: "עמותת נוער. איש קשר לאימות.",
  },
  {
    name: "מרכז ההעשרה לנוער — אוניברסיטת חיפה", channelKind: "enrichment", oppType: "HOST",
    region: "חיפה", hasTeenParents: true, whyYes: "מגיעים לקבוצות נוער והורים — אפשר להציע מפגש חוסן/ביטחון עצמי",
    offerModel: "WORKSHOP", priority: "MEDIUM", sourceUrl: "https://range.haifa.ac.il/",
    notes: "תוכניות העשרה לקבוצות נוער.",
  },
];

function seedLeads() {
  let inserted = 0, existing = 0;
  for (const lead of SEED_LEADS) {
    const r = leadEngine.createChannel({ ...lead, audienceSizeStatus: "UNKNOWN", status: "DISCOVERED" });
    if (r.ok) inserted++;
    else if (r.error === "duplicate") existing++;
  }
  return { inserted, existing, total: leadEngine.listChannels().length };
}

module.exports = { seedLeads };
