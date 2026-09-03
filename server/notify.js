// צינור שליחת התראות ללידים — פולט מייל ל-ketyse@gmail.com בכל הרשמה/טופס.
//
// שלוש דרכים, לפי הסדר. הראשונה שמוגדרת — מנצחת. אין צורך בשום קוד נוסף:
//
//   1) Gmail ישיר (Nodemailer)  — הכי פשוט. דורש 2 משתני סביבה ב-Render:
//        GMAIL_USER=ketyse@gmail.com
//        GMAIL_APP_PASSWORD=<App Password בן 16 תווים מחשבון Google>
//      (App Password נוצר ב: Google Account → Security → App passwords.
//       דורש שאימות דו-שלבי מופעל בחשבון.)
//
//   2) Resend  — דורש משתנה אחד: RESEND_API_KEY (מ-resend.com, חינם).
//
//   3) FormSubmit  — גיבוי ללא מפתח, אך דורש לחיצת "Activate" חד-פעמית.
//
// כל הפונקציות לעולם לא זורקות — כישלון מחזיר { sent:false, error }.

const NOTIFY_TO = process.env.NOTIFICATION_EMAIL || "ketylive8@gmail.com";

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(subject, fields) {
  const rows = Object.entries(fields)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 14px;font-weight:700;color:#4a3c1e;border-bottom:1px solid #eee">${esc(k)}</td>` +
        `<td style="padding:8px 14px;color:#333;border-bottom:1px solid #eee">${esc(v)}</td></tr>`
    )
    .join("");
  return (
    `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto">` +
    `<h2 style="color:#b5892f">${esc(subject)}</h2>` +
    `<table style="border-collapse:collapse;width:100%;background:#faf7f0;border-radius:10px;overflow:hidden">${rows}</table>` +
    `<p style="color:#999;font-size:12px;margin-top:14px">התראה אוטומטית ממערכת CureMindset · ketysegev.com</p></div>`
  );
}

// ── 1) Gmail ישיר דרך Nodemailer ──
async function sendViaGmail(to, subject, fields) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null; // לא מוגדר — ננסה דרך אחרת
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass: pass.replace(/\s+/g, "") }, // App Password לפעמים מודבק עם רווחים
    });
    await transporter.sendMail({
      from: `CureMindset <${user}>`,
      to,
      subject,
      html: buildHtml(subject, fields),
    });
    return { sent: true, via: "gmail" };
  } catch (e) {
    return { sent: false, error: `Gmail ${String((e && e.message) || e).slice(0, 160)}` };
  }
}

// ── 2) Resend ──
async function sendViaResend(to, subject, fields) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const from = process.env.NOTIFICATION_FROM || "CureMindset <onboarding@resend.dev>";
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html: buildHtml(subject, fields) }),
    });
    return resp.ok ? { sent: true, via: "resend" } : { sent: false, error: `Resend ${resp.status}` };
  } catch (e) {
    return { sent: false, error: String((e && e.message) || e) };
  }
}

// ── 3) FormSubmit (גיבוי ללא מפתח) ──
async function sendViaFormSubmit(to, subject, fields) {
  try {
    const resp = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ _subject: subject, _template: "table", ...fields }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      return { sent: false, error: `FormSubmit ${resp.status}: ${t.slice(0, 160)}` };
    }
    return { sent: true, via: "formsubmit" };
  } catch (e) {
    return { sent: false, error: String((e && e.message) || e) };
  }
}

// שולח מייל ליעד כלשהו דרך Gmail → Resend → FormSubmit. לעולם לא זורק.
async function notifyEmail(to, subject, fields) {
  for (const send of [sendViaGmail, sendViaResend, sendViaFormSubmit]) {
    const r = await send(to, subject, fields);
    if (r === null) continue; // ספק לא מוגדר — לנסות את הבא
    if (r.sent) return r; // הצלחה
  }
  return { sent: false, error: "no email channel succeeded" };
}

// התראת ליד לקטי (ליעד ברירת המחדל).
async function notifyLead(subject, fields) {
  return notifyEmail(NOTIFY_TO, subject, fields);
}

module.exports = { notifyLead, notifyEmail, NOTIFY_TO };
