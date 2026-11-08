#!/usr/bin/env node
"use strict";
/**
 * scripts/build-kb-from-site.js
 * ---------------------------------------------------------------------------
 * מזין את "המוח" של קטי הדיגיטלית (CureBot) מתוך תוכן האתר עצמו.
 *
 * כל עמוד תוכן טיפולי באתר (חרדה, ביטחון עצמי, דחיינות, אימון רגשי, השיטה,
 * נוער, הורים...) מומר לקובץ Markdown נקי בתיקיית מאגר הידע
 * (server/knowledge_base). משם מנוע ה-RAG שולף את הקטעים הרלוונטיים בכל שיחה,
 * כך ש-CureBot עונה כ-coaching system על בסיס *כל* התוכן של קטי — לא רק
 * הפרוטוקולים הקליניים.
 *
 * הרצה:  node scripts/build-kb-from-site.js
 * אפשר להריץ שוב בכל פעם שעמוד באתר מתעדכן — הקבצים ייכתבו מחדש.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const KB_DIR = path.join(ROOT, "server", "knowledge_base");

// עמוד אתר -> קובץ מאגר ידע + כותרת ידידותית לציטוט (citation).
// מספרי 20+ כדי לא להתנגש בפרוטוקולים הקליניים (00-18).
const PAGES = [
  { file: "method.html",             out: "20-site-method.md",            title: "השיטה — CureMindset" },
  { file: "anxiety-and-stress.html", out: "21-site-anxiety-stress.md",    title: "חרדה ולחץ — כלים מהאתר" },
  { file: "self-confidence.html",    out: "22-site-self-confidence.md",   title: "ביטחון עצמי — כלים מהאתר" },
  { file: "procrastination.html",    out: "23-site-procrastination.md",   title: "דחיינות — כלים מהאתר" },
  { file: "emotional-coaching.html", out: "24-site-emotional-coaching.md",title: "אימון רגשי — כלים מהאתר" },
  { file: "cure-teens.html",         out: "25-site-cure-teens.md",        title: "CURE Teens — נוער והורים" },
  { file: "parents.html",            out: "26-site-parents.md",           title: "הדרכת הורים — כלים מהאתר" },
];

// חיתוך boilerplate: כל מה שמ-CTA/ניווט/פוטר והלאה אינו תוכן טיפולי.
const CUT_MARKERS = [
  '<div class="ctaband"',
  '<nav class="related"',
  '<footer',
];

// בלוקים להסרה מתוך גוף התוכן (לא תוכן טיפולי): כפתורי CTA, הערות קטנות,
// eyebrow (תגית עליונה), ו-disclaimer משפטי.
function removeBlock(html, className) {
  // הסרה פשוטה של <tag class="X" ...> ... </tag> ברמה אחת של קינון.
  const re = new RegExp(
    `<([a-z0-9]+)[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>[\\s\\S]*?</\\1>`,
    "gi"
  );
  return html.replace(re, " ");
}

function extractMain(html) {
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  let body = m ? m[1] : html;
  // חיתוך מה-CTA/related/footer והלאה
  let cutAt = body.length;
  for (const marker of CUT_MARKERS) {
    const idx = body.indexOf(marker);
    if (idx !== -1 && idx < cutAt) cutAt = idx;
  }
  body = body.slice(0, cutAt);
  // הסרת בלוקים שאינם תוכן
  for (const cls of ["eyebrow", "btnrow", "note", "disclaimer", "ctaband"]) {
    body = removeBlock(body, cls);
  }
  return body;
}

// המרת HTML נקי ל-Markdown קריא: כותרות, פסקאות, פריטי רשימה.
function htmlToMarkdown(html) {
  let out = html;
  out = out.replace(/<script[\s\S]*?<\/script>/gi, " ");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, " ");
  // כותרות
  out = out.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n\n# ${strip(t)}\n`);
  out = out.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n## ${strip(t)}\n`);
  out = out.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n\n### ${strip(t)}\n`);
  out = out.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, t) => `\n\n#### ${strip(t)}\n`);
  // פריטי רשימה
  out = out.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${strip(t)}`);
  // פסקאות / summary / details
  out = out.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, t) => `\n\n${strip(t)}`);
  out = out.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, (_, t) => `\n\n### ${strip(t)}\n`);
  // שאר תגיות — להסיר
  out = out.replace(/<[^>]+>/g, " ");
  out = decode(out);
  // ניקוי רווחים ושורות ריקות מרובות
  out = out
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out;
}

function strip(t) {
  return decode(String(t).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}
function decode(s) {
  return String(s)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&[a-z]+;/g, " ");
}

function run() {
  fs.mkdirSync(KB_DIR, { recursive: true });
  const written = [];
  for (const p of PAGES) {
    const src = path.join(ROOT, p.file);
    if (!fs.existsSync(src)) {
      console.warn(`דילוג: ${p.file} לא קיים`);
      continue;
    }
    const html = fs.readFileSync(src, "utf8");
    const md = htmlToMarkdown(extractMain(html));
    if (md.length < 200) {
      console.warn(`דילוג: ${p.file} הניב מעט מדי תוכן (${md.length})`);
      continue;
    }
    // חשוב: לא מזריקים הערות/מטא-דאטה לתוך הקובץ — כל טקסט בקובץ נכנס למנוע
    // השליפה ועלול לדלוף לתשובה. מקור הקובץ מתועד ב-PAGES כאן ובשם הקובץ בלבד.
    const body = `# ${p.title}\n\n${md}\n`;
    fs.writeFileSync(path.join(KB_DIR, p.out), body, "utf8");
    written.push(`${p.out} (${md.length} תווים)`);
  }
  console.log("נכתבו קבצי מאגר ידע מתוך האתר:");
  written.forEach((w) => console.log("  ✓ " + w));
  console.log(`\nסה"כ ${written.length} קבצים ב-${path.relative(ROOT, KB_DIR)}`);
}

run();
