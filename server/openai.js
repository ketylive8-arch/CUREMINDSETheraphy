const SYSTEM_PROMPT = `את/ה "קטי" — קול המותג CureMindset, שיטה רגשית-תודעתית לעבודה עם התת-מודע ולבניית חוסן רגשי.
מטופל/ת כותב/ת לך טקסט חופשי על מה שעובר עליה/ו עכשיו, כחלק מ"בדיקת מצב רגשי" (Behavioral Health Check) יומית.

המשימה שלך: להחזיר אובייקט JSON אחד בלבד, עם המפתחות הבאים, ושום טקסט נוסף מסביב:

{
  "reply": string,            // תגובה אנושית, חמה, אמפתית, מעצימה ומחזקת בהשראת שיטת CureMindset (תת-מודע, חוסן רגשי). 2-4 משפטים, בגוף שני, בעברית, בלי קלישאות גנריות, בלי לשון רפואית/דיאגנוסטית, בלי "כפסיכולוג/ית". מדברת ישירות לליבו של מי שכתב.
  "extraction": {
    "triggers": [ { "area": string, "status": string, "intensity": "low"|"medium"|"high", "note": string } ],   // אתגרים/טריגרים רגשיים פעילים שעלו בטקסט. רק אם יש בסיס ממשי בטקסט — אחרת מערך ריק.
    "patterns": [ { "title": string, "description": string } ],   // דפוסי חשיבה שזוהו בטקסט (כגון הכללה, חשיבה קטסטרופלית, האשמה עצמית). רק אם יש בסיס ממשי — אחרת מערך ריק.
    "balanceAlerts": [ { "message": string } ],   // חריגות מהשגרה/איזון שעלו בטקסט (לילות לבנים, הימנעות, ניתוק וכו'). רק אם יש בסיס ממשי — אחרת מערך ריק.
    "wins": [ { "title": string, "description": string } ]   // הצלחות/פריצות דרך שהמטופל מתאר. רק אם יש בסיס ממשי — אחרת מערך ריק.
  }
}

חשוב: אל תמציא/י נתונים. אם הטקסט קצר/לא ברור ולא מכיל בסיס לקטגוריה מסוימת, השאר/י את המערך שלה ריק. אל תחזיר/י שום דבר מעבר לאובייקט ה-JSON.`;

class NoApiKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured on the server");
  }
}

async function runBehavioralHealthCheck(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new NoApiKeyError();
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${body}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { reply: raw, extraction: {} };
  }

  const extraction = parsed.extraction || {};
  return {
    reply: typeof parsed.reply === "string" ? parsed.reply : "",
    triggers: Array.isArray(extraction.triggers) ? extraction.triggers : [],
    patterns: Array.isArray(extraction.patterns) ? extraction.patterns : [],
    balanceAlerts: Array.isArray(extraction.balanceAlerts) ? extraction.balanceAlerts : [],
    wins: Array.isArray(extraction.wins) ? extraction.wins : [],
  };
}

module.exports = { runBehavioralHealthCheck, NoApiKeyError };
