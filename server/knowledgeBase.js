// CureMindset RAG — מאגר הידע הדינמי של קטי.
// קטי מעלה קבצי תוכן (.md / .txt) לתיקיית server/knowledge_base — מחברות,
// פרוטוקולים (חרדות, חוסן רגשי, דימוי עצמי, ניהול מתחים...). בכל הודעת צ'ק-אין
// השרת שולף מכאן את הקטעים הרלוונטיים ומזריק אותם ל-Prompt, וה-AI מחויב
// לענות רק על בסיסם (ראו openai.js).
//
// השליפה לקסיקלית (חפיפת מילים משוקללת נדירוּת, בסגנון TF-IDF) — ללא תלות
// בשירות חיצוני, צפויה ויציבה בעברית, ומספיקה היטב לקורפוס של עשרות מחברות.

const fs = require("node:fs");
const path = require("node:path");

const KB_DIR = path.join(__dirname, "knowledge_base");
fs.mkdirSync(KB_DIR, { recursive: true });

// ניקוי טקסט עברי: הסרת ניקוד, פיסוק ותווי עיצוב; שימור עברית/לטינית/ספרות.
function normalize(text) {
  return text
    .replace(/[֑-ׇ]/g, "") // ניקוד וטעמים
    .replace(/[^א-תa-zA-Z0-9 ]+/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

// מילות עצירה נפוצות שלא מבדילות בין נושאים.
const STOP = new Set([
  "אני", "אתה", "את", "הוא", "היא", "אנחנו", "הם", "הן", "זה", "זאת", "של", "עם",
  "על", "לא", "כן", "מה", "מי", "איך", "למה", "כי", "אם", "או", "גם", "רק", "יש",
  "אין", "היה", "היתה", "הייתי", "להיות", "עכשיו", "היום", "כל", "אבל", "מאוד",
  "יותר", "פחות", "שלי", "שלך", "שלו", "שלה", "לי", "לך", "לו", "לה", "אותי",
  "אותך", "אותו", "אותה", "the", "and", "for", "with",
]);

function keywords(text) {
  return normalize(text).filter((w) => !STOP.has(w));
}

// פיצול קובץ לקטעים: לפי כותרות Markdown או שורות ריקות כפולות; קטע ~1200 תווים.
function splitIntoChunks(content, fileName) {
  const rawParts = content.split(/\n(?=#{1,3} )|\n\s*\n\s*\n/);
  const chunks = [];
  let buffer = "";
  for (const part of rawParts) {
    const p = part.trim();
    if (!p) continue;
    if ((buffer + "\n\n" + p).length > 1200 && buffer) {
      chunks.push(buffer);
      buffer = p;
    } else {
      buffer = buffer ? buffer + "\n\n" + p : p;
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.map((text, i) => ({ file: fileName, index: i, text, terms: keywords(text) }));
}

// טעינה עם מטמון: נטען מחדש רק כשקבצים השתנו (בדיקת mtime זולה בכל קריאה).
let cache = { stamp: "", chunks: [] };

function loadChunks() {
  let files = [];
  try {
    files = fs
      .readdirSync(KB_DIR)
      .filter((f) => /\.(md|txt)$/i.test(f))
      .sort();
  } catch {
    return [];
  }
  const stamp = files
    .map((f) => {
      try {
        return f + ":" + fs.statSync(path.join(KB_DIR, f)).mtimeMs;
      } catch {
        return f;
      }
    })
    .join("|");
  if (stamp === cache.stamp) return cache.chunks;

  const chunks = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(path.join(KB_DIR, f), "utf8");
      chunks.push(...splitIntoChunks(content, f));
    } catch {
      // קובץ פגום — מדלגים, לא מפילים את הצ'אט
    }
  }
  cache = { stamp, chunks };
  return chunks;
}

// הסרת תחיליות עברית נפוצות (ו,ה,ב,ל,כ,מ,ש — עד שתיים) כך ש"מפחד" ו"הפחד"
// שניהם יורדים ל"פחד" לפני ההשוואה.
function stripPrefixes(word) {
  let w = word;
  for (let i = 0; i < 2; i++) {
    if (w.length > 3 && "והבלכמש".includes(w[0])) w = w.slice(1);
  }
  return w;
}

// התאמת מונחים עמידה להטיות עברית: "מפחד"↔"פחד", "חרדות"↔"חרדה" — התאמה מלאה,
// הכלה של מונח בן 3+ תווים, או שורש משותף אחרי הסרת תחיליות.
function termsMatch(a, b) {
  if (a === b) return true;
  if (a.length >= 3 && b.includes(a)) return true;
  if (b.length >= 3 && a.includes(b)) return true;
  const sa = stripPrefixes(a);
  const sb = stripPrefixes(b);
  if (sa === sb) return true;
  if (sa.length >= 3 && sb.includes(sa)) return true;
  if (sb.length >= 3 && sa.includes(sb)) return true;
  return false;
}

function chunkHasTerm(chunk, term) {
  return chunk.terms.some((t) => termsMatch(t, term));
}

// שליפה: ניקוד כל קטע לפי חפיפת מונחים עם שאלת המשתמש, משוקלל בנדירות המונח
// (מונח שמופיע בכל הקטעים לא מלמד כלום; מונח נדיר הוא אות חזק).
function retrieveKnowledge(query, k = 4) {
  const chunks = loadChunks();
  if (!chunks.length) return [];

  const queryTerms = [...new Set(keywords(query))];
  if (!queryTerms.length) return [];

  // df לכל מונח בשאילתה
  const df = new Map();
  for (const term of queryTerms) {
    let n = 0;
    for (const c of chunks) if (chunkHasTerm(c, term)) n++;
    df.set(term, n);
  }

  const scored = chunks
    .map((c) => {
      let score = 0;
      for (const term of queryTerms) {
        if (chunkHasTerm(c, term)) {
          const n = df.get(term) || 0;
          if (n > 0) score += Math.log(1 + chunks.length / n);
        }
      }
      return { chunk: c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map((s) => ({ file: s.chunk.file, text: s.chunk.text, score: Number(s.score.toFixed(2)) }));
}

// לרשימת האדמין: אילו קבצים טעונים וכמה קטעים יש בכל אחד.
function knowledgeStats() {
  const chunks = loadChunks();
  const byFile = {};
  for (const c of chunks) byFile[c.file] = (byFile[c.file] || 0) + 1;
  return Object.entries(byFile).map(([file, count]) => ({ file, chunks: count }));
}

module.exports = { retrieveKnowledge, knowledgeStats, KB_DIR };
