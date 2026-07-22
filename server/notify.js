// שליחת התראות על לידים חדשים ישירות למייל של קטי — בלי הרשמה ובלי מפתח.
//
// משתמשים ב-FormSubmit (formsubmit.co): שירות חינמי ששולח מייל לכתובת נתונה
// כשעושים לו POST. אין צורך בחשבון, ב-API key או בהגדרת משתני סביבה. השרת של
// Render (עם גישה לאינטרנט) שולח את הפנייה, ו-FormSubmit מעביר אותה למייל.
//
// הפעלה חד-פעמית: בפנייה הראשונה FormSubmit ישלח לקטי מייל "Activate" — לחיצה
// אחת עליו, ומאותו רגע כל פנייה נוחתת ישירות בתיבה. אין שום שלב אחר.
//
// (אם בעתיד רוצים דרך מקצועית יותר עם דומיין מאומת — אפשר להוסיף RESEND_API_KEY
//  ואז נשלח דרך Resend במקום; ראו למטה.)

const NOTIFY_TO = process.env.NOTIFICATION_EMAIL || "ketyse@gmail.com";

// שליחה דרך FormSubmit — ללא מפתח. מחזיר { sent, error? } ולעולם לא זורק.
async function sendViaFormSubmit(subject, fields) {
  try {
    const payload = { _subject: subject, _template: "table", ...fields };
    const resp = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(NOTIFY_TO)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      return { sent: false, error: `FormSubmit ${resp.status}: ${t.slice(0, 160)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: String(e && e.message ? e.message : e) };
  }
}

// שליחה דרך Resend (אופציונלי) — רק אם הוגדר RESEND_API_KEY.
async function sendViaResend(subject, fields) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null; // לא מוגדר — נשתמש ב-FormSubmit
  const from = process.env.NOTIFICATION_FROM || "CureMindset <onboarding@resend.dev>";
  const rows = Object.entries(fields)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:600">${esc(k)}</td><td style="padding:6px 12px">${esc(v)}</td></tr>`)
    .join("");
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif"><h2 style="color:#b5892f">${esc(subject)}</h2><table style="border-collapse:collapse;background:#faf7f0;border-radius:8px">${rows}</table></div>`;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [NOTIFY_TO], subject, html }),
    });
    return resp.ok ? { sent: true } : { sent: false, error: `Resend ${resp.status}` };
  } catch (e) {
    return { sent: false, error: String(e && e.message ? e.message : e) };
  }
}

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// שולח התראת ליד. subject = כותרת; fields = { "שם": ..., "טלפון": ... }.
// מנסה Resend (אם מוגדר), אחרת FormSubmit. לעולם לא זורק.
async function notifyLead(subject, fields) {
  const viaResend = await sendViaResend(subject, fields);
  if (viaResend) return viaResend;
  return sendViaFormSubmit(subject, fields);
}

module.exports = { notifyLead, NOTIFY_TO };
