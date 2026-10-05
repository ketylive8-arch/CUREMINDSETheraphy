// תגובה אוטומטית חמה לליד חדש (טופס באתר) — לא הבוט הטיפולי, לא שיחה קלינית.
// מטרת ה-AI כאן: לנסח הודעת "קיבלנו, תודה" אישית וקצרה, מתייחסת למה שהלקוח/ה
// כתב/ה, בלי לתת ייעוץ טיפולי ובלי להבטיח כלום מעבר למה שבאמת קיים.
// נכשל בשקט תמיד (לעולם לא זורק) — תגובת ליד היא "נחמד שיש", לא קריטית.

const SYSTEM_PROMPT = `את כותבת בשם קטי שגב, מייסדת CureMindset, תגובה ראשונה אוטומטית ללקוח/ה פוטנציאלי/ת שמילא/ה טופס פנייה באתר (לא לקוח קיים, לא שיחה טיפולית).

כללים מחייבים:
- טון חם, אישי, קצר (3-5 משפטים). לא שיווקי-אגרסיבי, לא מליצי.
- אם יש "מטרה" שהלקוח/ה כתב/ה — מתייחסים אליה במפורש במשפט אחד, כדי שירגיש/תרגיש שבאמת קראו.
- חובה לציין בבירור: זו תגובה אוטומטית ראשונה, וקטי עצמה תחזור אישית בקרוב (בלי תאריך/שעה מדויקים).
- אסור בהחלט: לתת ייעוץ טיפולי, לפרש את מה שהלקוח/ה כתב/ה מבחינה קלינית, להבטיח תוצאות, להתחיל "טיפול" בהודעה הזו.
- סיום עם צעד אחד פשוט וברור (לדוגמה: אפשר להתחיל ניסיון חינם באפליקציה, או לכתוב בוואטסאפ לשאלה דחופה).
- בלי אימוג'ים מרובים — לכל היותר אחד, בעדינות.
- עברית בלבד, גוף שני בלשון פנייה חמה (את/ה לפי ניחוש עדין מהשם, או ניטרלי אם לא ברור).

מחזירים טקסט ההודעה בלבד (plain text), בלי כותרת, בלי חתימה — החתימה תתווסף אוטומטית בנפרד.`;

async function composeLeadReply({ name, goal, source } = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null; // בלי מפתח — פשוט לא שולחים תגובה אוטומטית, לא קורס

  const userMsg = [
    name ? `שם: ${name}` : null,
    goal ? `מה כתב/ה שהוא/היא רוצה להשיג: ${goal}` : null,
    source ? `מקור הפנייה: ${source}` : null,
  ]
    .filter(Boolean)
    .join("\n") || "לא נמסרו פרטים נוספים מעבר לפנייה עצמה.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
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

module.exports = { composeLeadReply };
