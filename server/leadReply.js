// תגובה אוטומטית ללקוח/ה שהשאיר/ה פרטים (טופס באתר או צ'אט) — כוללת את מתנת
// "תהליך דיקנס" בפועל (לא רק "תודה, נחזור אליך"). המתנה והמבנה של המייל הם
// קבועים ואמינים — לא תלויים ב-OpenAI; אם יש מפתח זמין, הוא רק מוסיף משפט
// אישי אחד בהתאם למה שהלקוח/ה כתב/ה. כשל שקט תמיד (לעולם לא זורק).

const GIFT_VIDEO_URL = "https://youtu.be/qxB499l-GhQ";

const SYSTEM_PROMPT = `את כותבת בשם קטי שגב, מייסדת CureMindset, משפט אישי אחד (לא יותר) שמתייחס למה שלקוח/ה פוטנציאלי/ת כתב/ה בטופס פנייה באתר.

כללים מחייבים:
- משפט אחד בלבד, חם ואישי, לא שיווקי.
- מתייחס במפורש למה שהלקוח/ה כתב/ה שהוא/היא רוצה להשיג.
- בלי ייעוץ טיפולי, בלי פרשנות קלינית, בלי הבטחת תוצאות.
- עברית בלבד.

מחזירים את המשפט בלבד (plain text), בלי כותרת, בלי חתימה.`;

async function personalizedLine({ name, goal } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !goal) return null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: [name ? `שם: ${name}` : null, `מה כתב/ה שרוצה להשיג: ${goal}`].filter(Boolean).join("\n") },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildGiftEmailHtml({ name, personalLine }) {
  const greeting = name ? `שלום ${esc(name)},` : "שלום,";
  const personal = personalLine ? `<p style="margin:0 0 16px">${esc(personalLine)}</p>` : "";
  return `
<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#2D2A26;line-height:1.7">
  <div style="text-align:center;padding:22px 0 14px">
    <div style="font-family:Georgia,serif;font-weight:800;font-size:20px;color:#AD8A52;letter-spacing:.02em">CureMindset · קטי שגב</div>
  </div>
  <div style="background:#FFFFFF;border:1px solid #E8E0D5;border-radius:18px;padding:28px 26px">
    <p style="margin:0 0 16px;font-weight:700;font-size:17px">${greeting}</p>
    <p style="margin:0 0 16px">תודה שפנית — קיבלתי את הפרטים שלך, ואני אחזור אלייך אישית בקרוב.</p>
    ${personal}
    <div style="background:#FAF8F4;border-radius:14px;padding:20px;margin:22px 0;text-align:center">
      <p style="margin:0 0 6px;font-weight:800;font-size:16px">המתנה שלי אלייך — תהליך דיקנס</p>
      <p style="margin:0 0 16px;color:#6B6560;font-size:14.5px">שבי במקום שקט, עם אוזניות, ותני לתהליך לעבוד. כך מתחילים את תהליך הטמעת השינוי — כבר עכשיו.</p>
      <a href="${GIFT_VIDEO_URL}" style="display:inline-block;background:#C9A96E;color:#fff;padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:700">לצפות בתהליך עכשיו ←</a>
    </div>
    <p style="margin:0;color:#6B6560;font-size:14px">אם משהו דחוף — אפשר גם בוואטסאפ: 054-303-2349.</p>
  </div>
  <p style="text-align:center;color:#9B958F;font-size:12.5px;margin-top:16px">קטי שגב · CureMindset · ketysegev.com</p>
</div>`.trim();
}

async function composeLeadReply({ name, goal, source } = {}) {
  // נשמר לצרכי תאימות עם קוד קיים שקורא לפונקציה הזו ישירות.
  const line = await personalizedLine({ name, goal });
  return buildGiftEmailHtml({ name, personalLine: line });
}

module.exports = { composeLeadReply, buildGiftEmailHtml, personalizedLine, GIFT_VIDEO_URL };
