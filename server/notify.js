// שליחת התראות מייל על לידים חדשים (הרשמה לסדנה / לקוח חדש) — ישירות לקטי.
//
// אין תלות ב-npm: משתמשים ב-fetch המובנה של Node 22 מול Resend (resend.com),
// שירות שליחת מיילים חינמי (3,000 מיילים/חודש). כל מה שצריך כדי להפעיל:
//   1. חשבון חינם ב-resend.com → יצירת API Key.
//   2. ב-Render → Environment → להוסיף משתנה אחד:  RESEND_API_KEY = re_xxx...
// (אופציונלי: NOTIFICATION_EMAIL כדי לשנות את כתובת היעד; ברירת מחדל למטה.)
//
// אם המפתח לא הוגדר — הליד עדיין נשמר במסד הנתונים ומופיע ב-CRM, פשוט בלי מייל.
// הפונקציה לעולם לא זורקת שגיאה שתפיל את הבקשה של המשתמש.

const NOTIFY_TO = process.env.NOTIFICATION_EMAIL || "ketyse@gmail.com";
// כתובת שולח: ברירת המחדל של Resend עובדת מיד בלי אימות דומיין.
// כשמחברים דומיין מאומת אפשר להחליף ל-  no-reply@ketysegev.com  דרך NOTIFICATION_FROM.
const NOTIFY_FROM = process.env.NOTIFICATION_FROM || "CureMindset <onboarding@resend.dev>";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// בונה גוף מייל קריא בעברית מתוך אובייקט שדות.
function renderRows(fields) {
  return Object.entries(fields)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(
      ([label, v]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;color:#555">${esc(label)}</td>` +
        `<td style="padding:6px 12px;color:#111">${esc(v)}</td></tr>`
    )
    .join("");
}

// שולח התראת ליד. subject = כותרת קצרה; fields = { "שם": ..., "טלפון": ... }.
// מחזיר { sent: boolean, skipped?: true, error?: string } ולעולם לא זורק.
async function notifyLead(subject, fields) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, skipped: true };

  const html =
    `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">` +
    `<h2 style="color:#b5892f;margin:0 0 12px">${esc(subject)}</h2>` +
    `<table style="border-collapse:collapse;background:#faf7f0;border-radius:8px">${renderRows(fields)}</table>` +
    `<p style="margin-top:16px;color:#888;font-size:13px">נשלח אוטומטית מאתר CureMindset</p></div>`;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFY_FROM,
        to: [NOTIFY_TO],
        reply_to: fields["אימייל"] || fields["Email"] || undefined,
        subject,
        html,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return { sent: false, error: `Resend ${resp.status}: ${text.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: String(e && e.message ? e.message : e) };
  }
}

module.exports = { notifyLead, NOTIFY_TO };
