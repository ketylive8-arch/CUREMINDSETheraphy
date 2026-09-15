# DECISIONS.md — CureMindset

מסמך החלטות ארכיטקטוניות, הנחות שמרניות ופערים שממתינים לאישור קטי.
עודכן: 2026-09-15.

---

## 0. ההחלטה המרכזית: לשפץ על ה-Stack הקיים — לא לבנות מחדש ב-Next.js

**ההקשר:** המפרט ביקש "React עם Next.js אם הפרויקט מאפשר; **אחרת השתמש ב-stack הקיים**",
וכן TypeScript, Supabase ו-Zod. הפרויקט הקיים בנוי אחרת:

| רכיב | הקיים בפועל | מה המפרט הציע |
|------|-------------|----------------|
| Frontend | React 18 UMD + Babel בדפדפן, **בלי build step** | Next.js + TypeScript |
| Backend | Express 5 + `node-sqlite3-wasm` | (לא צוין — Supabase נרמז) |
| DB | SQLite מקומי, **25 טבלאות עם נתוני משתמשות אמיתיים** | Supabase/Postgres |
| Validation | ידני בצד שרת | Zod |
| Auth | מימוש עצמי (`server/auth.js`, OTP, OAuth) | ספק Auth |

**ההחלטה:** להישאר על ה-stack הקיים ולשפץ עליו. **לא** לעבור ל-Next.js/Supabase/TypeScript ב-MVP.

**הנימוקים:**
1. **אתר חי עם נתונים אמיתיים.** יש DB עם 25 טבלאות ומשתמשות בפועל. מיגרציה ל-Supabase = סיכון לאובדן נתונים ולהשבתה, ללא ערך מיידי למשתמש.
2. **המפרט עצמו מתיר זאת** ("אחרת השתמש ב-stack הקיים"), ו-CLAUDE.md אוסר במפורש: "אתה משפץ, לא בונה מאפס."
3. **רוב הפיצ'רים כבר קיימים** (ראו §2). כתיבה מחדש הייתה זורקת עבודה תקינה.
4. **אבטחת מפתחות כבר תקינה** בצד שרת (ראו §3).

**המשמעות של הפער מול המפרט:**
- אין TypeScript/Zod → הוולידציה תישאר ידנית בצד שרת, עם חיזוק הדרגתי. תיעוד טיפוסים ב-JSDoc במקום TS.
- אין RLS של Postgres → ההרשאה נאכפת ב-application layer: כל route מסונן לפי `accountId`/`deviceToken` של המשתמש/ת. יש להוסיף בדיקות unauthorized-access ייעודיות (פער פתוח, §4).
- מבנה ה-routes הוא `/app`, `/admin` ב-hash-routing בצד לקוח (SPA), לא file-based routing. הכתובות הציבוריות מנותבות ב-`vercel.json`.

> אם בעתיד יוחלט לעבור ל-Next.js/Supabase — זו החלטה מוצריתמשמעותית (עלות, מיגרציה, זמן), שתתקבל בנפרד ולא כתופעת לוואי של MVP.

---

## 1. מיפוי מודל הנתונים של המפרט → הטבלאות הקיימות

| ישות במפרט | טבלה/מקור קיים | הערה |
|------------|-----------------|------|
| User | `accounts`, `patients` | קיים |
| UserProfile | `patient_profile` | קיים (age_group, trial, focus) |
| Consent | `consent_log` | קיים |
| Trial | `subscriptions` + `enrollmentTrialStatus` | trial 3 ימים |
| Track/Module/Lesson | `programs`, `module_progress`, `protocol_progress` | קיים חלקית — תוכן ה-seed צריך הרחבה |
| Exercise / Reflection | בתוך תוכן היחידה | אין טבלת reflection ייעודית — פער |
| AudioAsset | `client_materials` | קיים (העלאת חומרים) |
| CheckIn | `checkins`, `mood_logs` | קיים |
| Progress | `module_progress`, `protocol_progress`, `grounding_sessions` | קיים |
| Conversation / Message | `conversations` | קיים |
| ContentSource (RAG) | `server/knowledge_base/*.md` (19 קבצים) | קיים כקבצים, לא כטבלה |
| RecommendationLog | `recommendations`, `daily_tasks` | קיים חלקית |
| AuditLog | `audit_logs` | קיים |

---

## 2. מיפוי פיצ'רים: קיים / חלקי / חסר

**קיים ועובד:**
- הרשמה, אימות OTP, התחברות, איפוס סיסמה, OAuth (Google/Facebook) — `server/index.js`
- Onboarding כשיחה (IntakeChat) — `memberArea.js`
- אזור אישי: היום שלי / מסלול / כלים / צ׳ק-אין / צ׳אט AI / פרופיל — `memberArea.js` (STAGES)
- עוזר AI server-side עם RAG ממקורות מאושרים, JSON מובנה, פרומפט נפרד לנוער/מבוגר — `server/openai.js`
- פאנל אדמין — `admin.html` + `adminApp.js`
- trial 3 ימים, בלי checkout בזמן trial (חוסם 403) — `server/index.js:830`
- מיתוג זהב-קרם נעול ב-`DESIGN_TOKENS.md` + `styles.css`

**חלקי / דורש חיזוק:**
- **AI safety:** יש `safety_flag` ב-DB ובטיחות בפרומפט, אבל **אין short-circuit קשיח לזיהוי פגיעה עצמית** עם מספרי חירום (ער"ן 1201, סה"ר, מד"א 101) בצד שרת. פער בטיחותי — עדיפות עליונה (§4).
- **מנוע המלצות:** קיים אבל יש לוודא שהוא מבוסס-חוקים ושקוף עם `reason` לכל המלצה (המפרט §RAG).
- **סתירת trial 14/3:** יש הערות "14-day" בקוד לצד טקסט "3 ימים". יש לוודא אחידות (CLAUDE.md §8.1).
- **תוכן seed:** 6 מסלולים × 3 מודולים × 2 יחידות — טרם נכתב במלואו; דורש תוכן מקורי + TODO לקטי.

**חסר:**
- `.env.example` — **נוצר עכשיו** ✓
- `DECISIONS.md` — **נוצר עכשיו** ✓
- בדיקות אוטומטיות (auth/onboarding/הרשאות/safety) — אין test runner מוגדר. פער פתוח.
- `/app/preferences` נפרד (זיכרון AI, ייצוא נתונים, מחיקת צ׳אטים) — חלקי.
- Citation גלוי בצ׳אט ("מבוסס על: יחידה X") — לבדוק אם מוצג ב-UI.

---

## 3. אבטחה — מצב נוכחי

- **מפתח OpenAI:** נקרא מ-`process.env` בצד שרת בלבד, לא נחשף לדפדפן ✓
- **סיסמאות:** אין hardcoded; `ADMIN_USER`/`ADMIN_PASSWORD` מ-env ✓
- **`.env`** ב-`.gitignore` ✓ ; **`server/*.db`** (נתוני משתמשות) ב-`.gitignore` ✓
- **חשיפת מפתח בהודעות שגיאה:** תוקן בעבר (CLAUDE.md §8.2) — יש לאמת שאין רגרסיה.
- **RESET_DEBUG:** חושף טוקן איפוס — מסומן ב-.env.example כ"פיתוח מקומי בלבד".

---

## 4. פערים פתוחים בעדיפות (הצעת סדר עבודה)

1. **AI safety short-circuit** (עדיפות עליונה): זיהוי מילות מפתח לפגיעה עצמית/חירום בצד שרת → עצירת תוכן רגיל → הודעת בטיחות עם ער"ן 1201 / מד"א 101 / סה"ר → `needsHumanSupport=true`. לא להסתמך רק על הפרומפט.
2. **אחידות trial 3 ימים** בכל הקוד והטקסטים.
3. **מנוע המלצות שקוף** עם `reason` + "לא מתאים לי עכשיו" + מניעת חזרה על אותו כלי פעמיים ברצף.
4. **תוכן seed** ל-6 המסלולים (מקורי, לא רפואי, עם TODO לקטי).
5. **בדיקות** ל-auth/onboarding/הרשאות/safety.
6. `/app/preferences` מלא + citation גלוי בצ׳אט.

---

## 5. פריטים שממתינים לקטי (תוכן/אישור — לא ניתן להמציא)

- **הסיפור האישי** לעמוד "אודות" (5–6 משפטים).
- **עדויות אמיתיות** (שם + משפט, מאושר לפרסום) לסעיף "סיפורי שינוי".
- **אישור טקסטי היחידות** ב-seed (כל יחידה מסומנת TODO להחלפה בתוכן שלה).
- **webhook ל-CRM** (Make/n8n) ללידים — כרגע נופל לוואטסאפ.

---

## 6. חלוקת אחריות בין הסוכנים (Elara / Claude)

**ההחלטה:** כל הכתיבה השיווקית, היררכיית התוכן, ה-IA ומפת ה-SEO — באחריות Elara, סוכנת התוכן של קטי, שעובדת אך ורק דרך ענפים ו-PR-ים. Claude אחראי על קוד, עיצוב, backend ופריסה, ומממש PR-ים של תוכן בלי לשכתב אותם. מקור אמת מלא: `CONTENT_OWNERSHIP.md` (נוסף ב-PR #2).
