"use strict";
/**
 * server/audioSeed.js — מועמדי אודיו מהדרייב של קטי, ממופים ליחידות תוכן.
 * נכנסים לתור אישור (status='pending'). קטי מאזינה ומאשרת — לא מתפרסם אוטומטית.
 *
 * נכללות רק הקלטות שקטי יצרה בעצמה (owner: ketyse@gmail.com) בעלות אופי טיפולי.
 * הוצאו במכוון: תוכן עסקי/שיווקי, מוזיקה מוגנת בזכויות, וידאו, וקבצים של אחרים.
 *
 * הערה חשובה (REQUIRES): ה-view_url הוא קישור צפייה ב-Drive שדורש הרשאה —
 * אינו מתנגן ישירות בנגן של האתר. לניגון בפועל צריך שלב אירוח/שיתוף (ראו IMPLEMENTATION_STATUS).
 */
const { db } = require("./db");

// מקור: סריקת Google Drive (owner ketyse@gmail.com). fileId → יחידת תוכן.
const CANDIDATES = [
  { id: "drv-1g9R", provider: "drive", external_id: "1g9R_cgnV6s3ZslPWGfsq_Hd9A-vcspFd", title: "שחרור מדיבור עצמי שלילי", mime: "audio/mp4", suggested_slug: "selfimage-inner-critic", topic: "self_image", match_note: "שחרור הקול המבקר — מתאים ליחידת 'הקול המבקר'." },
  { id: "drv-1aQC", provider: "drive", external_id: "1aQC1tKRnFIm5BEKjpwxCtR6ovk-VAL7k", title: "ניהול רגשות", mime: "audio/mp4", suggested_slug: "regulation-name-it", topic: "regulation", match_note: "ניהול/ויסות רגשי — מתאים ל'לתת שם לרגש'." },
  { id: "drv-1diD", provider: "drive", external_id: "1diDpuKPNxyuRnkV6kG2pPC5IRjzdJfGX", title: "שינוי סטייט אוף מיינד", mime: "audio/mp4", suggested_slug: "regulation-box-breath", topic: "regulation", match_note: "שינוי מצב תודעתי — מתאים לכלי הרגעה/נשימה." },
  { id: "drv-1XN2", provider: "drive", external_id: "1XN2boazSja6TsA3r--bfu1tkBRc3z3d2", title: "ספירלת משאבים", mime: "audio/mpeg", suggested_slug: "confidence-small-wins", topic: "confidence", match_note: "ספירלת משאבים חיובית — מתאים ל'ניצחונות קטנים'." },
  { id: "drv-1XN0", provider: "drive", external_id: "1XN07WyDrK3eo3VlQGlIV13-if_MVntsR", title: "אתה תמיד יותר ממה שאתה מעבר למילים", mime: "audio/mpeg", suggested_slug: "selfimage-kind-voice", topic: "self_image", match_note: "ערך עצמי מעבר למילים — מתאים ל'הקול המיטיב'." },
  { id: "drv-1SkO", provider: "drive", external_id: "1SkOTU7pr3UboqXkGZ-_t83iotws0Z8op", title: "מיקוד חיובי", mime: "audio/aac", suggested_slug: "confidence-future", topic: "confidence", match_note: "מיקוד חיובי — מתאים לדמיון מודרך של הצלחה." },
  { id: "drv-1T-y", provider: "drive", external_id: "1T-yN75vNEenH8RbHSylp3UQbEEeGS6C4", title: "אין 'אי אפשר', יש רק 'אפשר'", mime: "audio/aac", suggested_slug: "confidence-small-wins", topic: "confidence", match_note: "אמונת מסוגלות — תומך בביטחון עצמי." },
  { id: "drv-1XUR", provider: "drive", external_id: "1XUR4ZwjyX6bOdt8asEwxuqvcKH4Is1xV", title: "Spin release", mime: "audio/mpeg", suggested_slug: "anxiety-anchor", topic: "anxiety", match_note: "טכניקת NLP להרגעת תחושה מסתחררת — מתאים לעוגן הרגעה." },
  { id: "drv-1zSU", provider: "drive", external_id: "1zSUs0SxTqyWhaWZZlkDJyoRSLFG_wwRg", title: "כאב ועונג", mime: "audio/mp4", suggested_slug: "habits-replace", topic: "addiction", match_note: "מנוף כאב/עונג לשינוי הרגלים — מתאים ל'מה הדפוס נותן לי'." },
  { id: "drv-1T4F", provider: "drive", external_id: "1T4FjGLDTwRfzxvwFdIfEu9jzJldZZWPM", title: "מיצוי יכולות", mime: "audio/x-wav", suggested_slug: "confidence-future", topic: "confidence", match_note: "מיצוי יכולות — תומך בביטחון עצמי ובעתיד רצוי." },
];

function driveViewUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

function seedAudioCandidates() {
  const ins = db.prepare(
    `INSERT OR IGNORE INTO audio_candidates
     (id, provider, external_id, title, view_url, mime, suggested_slug, topic, match_note, rights_status, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'owned', 'pending')`
  );
  let n = 0;
  for (const c of CANDIDATES) {
    const r = ins.run(c.id, c.provider, c.external_id, c.title, driveViewUrl(c.external_id), c.mime, c.suggested_slug, c.topic, c.match_note);
    n += r.changes || 0;
  }
  return { inserted: n, total: CANDIDATES.length };
}

module.exports = { seedAudioCandidates, CANDIDATES };
