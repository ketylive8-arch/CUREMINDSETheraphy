# IMPLEMENTATION_AUDIT.md — CureMindset

**תאריך:** 9 בספטמבר 2026
**מקור אמת:** מסמך האפיון "CureMindset אפיון ופ prompt ל-Claude Code" (גרסה 1.0, נקרא במלואו, כל 970 השורות, כולל סעיף 17 — פלטפורמת Care).
**כלל עבודה:** לא בונים מחדש, לא מוחקים קיים. Audit → Plan → תיקון מדורג. קובץ זה הוא שלב ה-Audit; לא שונו פיצ'רים ביצירתו.

---

## 0. ⚠️ ממצא קריטי — למה "המאמרים השתבשו"

**מה קרה:** בקומיט `5c18476` ("עיצוב מחדש בסגנון Curable — דף נחיתה חדש", 1.9.2026) נכתב מחדש `app.js` (1355 שורות נמחקו). במסגרת זה **נמחק כל סקשן "CureMindset ON AIR"** שכלל:
- רכיב **`ArticlesGrid`** — משך `/api/articles` (פיד ה-Blogspot של קטי) והציג את המאמרים ככרטיסים עם "לקריאת המאמר המלא".
- אזור מדיה (YouTube / ספוטיפיי-רדיו).

**המצב היום:**
- ה-Backend `GET /api/articles` **עובד מצוין** — מושך מ-`ketysegev.blogspot.com` (RSS) ונופל ל-3 מאמרים מקוריים אם ריק. הקוד שלם (`server/index.js:514–577`).
- ה-Frontend **אין בו יותר שום רכיב שמציג מאמרים** — נמחק בריעצוב. המאמרים לא "נשברו" טכנית; הם **הוסרו מהתצוגה**.

**המסקנה:** הנתונים והשרת תקינים. חסר רק רכיב תצוגה בצד הלקוח. **תיקון:** להחזיר סקשן מאמרים לדף הבית (וכעמוד `/articles` ל-SEO), שמושך מ-`/api/articles`. פירוט ב-IMPLEMENTATION_PLAN.md שלב 3.

---

## 1. תשתית קיימת (Snapshot)

| רכיב | מצב |
|---|---|
| Frontend | React 18 UMD + Babel **בדפדפן** (`type="text/babel"`), ללא build. קבצים: `app.js`, `memberArea.js`, `adminApp.js`, `workshops.js`, `main.js`, `icons.js` |
| CSS | Tailwind **מהודר מראש** ל-`styles.css` (אין CDN, אין build חי — רק מחלקות שכבר קומפלו עובדות) |
| Backend | Express 5 + `node-sqlite3-wasm` (`server/`), DB בקובץ `server/curemindset.db` |
| Hosting | Frontend: Vercel (`ketysegev.com`). Backend: Render (`curemindsetheraphy.onrender.com`) |
| Auth | OTP במייל (register → verify-otp), sessions (`auth_sessions`), device-token, OAuth Google/Facebook |
| AI | `server/openai.js` (gpt-4o) + RAG לקסיקלי `server/knowledgeBase.js` על `server/knowledge_base/*.md` |
| SEO | HTML סטטי לסורקים ב-`index.html` + React בצד לקוח; `sitemap.xml` = דף הבית בלבד |

**בריאות האתר (נבדק 9.9):** השרת מחזיר 200, הדף מרונדר במלואו, אפס שגיאות JS, הגנת פריסה ב-Vercel **כבויה** (האתר פתוח לכולם). אין תקלת זמינות.

---

## 2. טבלת Audit — דרישות האפיון מול המצב

| דרישה (אפיון) | מצב נוכחי | קבצים רלוונטיים | פער | תיקון נדרש | סטטוס |
|---|---|---|---|---|---|
| **מאמרים / ספריית ידע** | Backend עובד, Frontend נמחק בריעצוב | `server/index.js:514`, היסטוריה: `5c18476` | אין תצוגת מאמרים | להחזיר סקשן מאמרים + `/articles` | 🔴 חסר תצוגה |
| דף הבית (ערך, שיטה, מסלולים, סיפורים, FAQ, CTA) | קיים ומלא | `app.js` | — | — | 🟢 קיים |
| שאלות נפוצות + הבהרת אחריות | קיים (נוסף היום) | `app.js` Faq | — | — | 🟢 קיים |
| עמודי SEO נפרדים (`/anxiety-and-stress` וכו') | הכל בדף אחד + עוגנים | `main.js`, `index.html` | אין URLs נפרדים, אין SSR לכל עמוד | ליצור routes ציבוריים עם תוכן ב-HTML | 🔴 חסר |
| `sitemap.xml` מלא + `lastmod` | רק דף הבית | `sitemap.xml` | חסרים כל שאר העמודים | להרחיב עם כל העמודים | 🟡 חלקי |
| `robots.txt` (חוסם רק admin/api) | תקין | `robots.txt` | — | — | 🟢 קיים |
| SSR/SSG — תוכן ב-HTML לסורק | HTML סטטי חלקי + React | `index.html` | תוכן העמודים תלוי JS | תוכן מרכזי ב-HTML לכל route | 🟡 חלקי |
| הרשמה / אימות / התחברות | קיים (OTP) | `server/index.js`, `server/auth.js`, `otp.js` | — | — | 🟢 קיים |
| איפוס סיסמה | קיים (token) | `server/index.js:252,270` | — | — | 🟢 קיים |
| הסכמות (Consent) — מסך ייעודי | טבלה קיימת, אין מסך מובנה | `db.js` consent_log | אין מסך `/consent` בזרימה | להוסיף מסך הסכמות | 🟡 חלקי |
| Intake / אינטייק מדורג | חלקי (onboarding קצר) | `server/index.js:236`, `memberArea.js` | אין intake מלא לפי אפיון (קהל/נושא/מטרה/זמן/פורמט/1–10) | לבנות intake wizard | 🟡 חלקי |
| בדיקת בטיחות (Safety Check) בזרימה | קיים ב-AI prompt, לא כמסך | `server/openai.js`, `guidedReply.js` | אין מסך safety-check ייעודי + SafetyFlag | להוסיף מסך + ישות | 🟡 חלקי |
| מסלול אישי (CarePath) | מודולים/שלבים קיימים | `memberArea.js` STAGES, `db.js` module_progress | אין מנוע התאמה שקוף לפי intake | לבנות מנוע חוקים + הסבר | 🟡 חלקי |
| Dashboard יומי (`/app/today`) | אין מסך "היום" ייעודי | `memberArea.js` | אין צעד-יומי-אחד + SOS גלוי + "אני צריכה אדם" | לבנות מסך היום | 🔴 חסר |
| יחידות תוכן (Track→Module→Lesson→Exercise) | חלקי (9 שלבים) | `memberArea.js` | אין היררכיית תוכן מלאה + 6 מסלולים×3×2 | להרחיב תוכן + seed | 🟡 חלקי |
| צ'ק-אין ומעקב | קיים | `server/index.js:652`, `db.js` checkins/mood_logs | — | להעשיר מגמות | 🟢 קיים |
| התאמה אישית שקופה + RecommendationLog | אין | — | אין מנוע המלצות + לוג | לבנות לפי אפיון 6.9 | 🔴 חסר |
| AI — Guided Practice Companion | צ'אט AI כללי יותר | `server/openai.js`, `guidedReply.js` | אין מצבי-AI מובנים + JSON פנימי + citation | למבנה לפי אפיון 6.6/6.11 | 🟡 חלקי |
| AI — מקורות מאושרים (ContentSource) | RAG על קבצי md ללא metadata אישור | `knowledgeBase.js` | אין sourceId/version/approvedBy/sensitivity | לבנות מודל מקורות + אישור | 🟡 חלקי |
| כלי SOS גלוי | קיים באזור אישי | `memberArea.js` (קרקוע/עוגן) | לא גלוי בכל מסך | להנגיש SOS קבוע | 🟡 חלקי |
| Human handoff ("אני צריכה אדם") | אין כפתור ייעודי | — | אין HumanSupportRequest | להוסיף כפתור + ישות | 🔴 חסר |
| מפגשים / Appointments | קיים (Calendly + שלב "המפגש שלי") | `app.js`, `memberArea.js` | — | לחבר תיעוד פנימי | 🟢 קיים |
| מנוי / תשלום | trial + Grow webhook + cancel | `server/index.js:421,867` | חיוב אוטומטי לא מופעל (תקין ל-MVP) | להשאיר כפי שהוא | 🟢 קיים |
| CMS (Draft/Review/Published + גרסאות) | אדמין בסיסי (codes/patients/materials) | `adminApp.js`, `server/index.js` admin | אין ניהול תוכן/מקורות עם סטטוסים | לבנות CMS | 🟡 חלקי |
| פרטיות/הרשאות בצד שרת (ownership) | קיים (device_token isolation) | `server/deviceToken.js`, `db.js` | — | לוודא בכל endpoint חדש | 🟢 קיים |
| מחיקת חשבון/נתונים + ייצוא | חלקי | `memberArea.js` SettingsSheet | אין ייצוא + מחיקה מלאה | להוסיף | 🟡 חלקי |
| מייל (לידים/התראות) | קוד מוכן, ערוץ לא מחובר | `server/notify.js` | צריך App Password / n8n webhook | לחבר ערוץ | 🔴 ממתין לקטי |
| RTL + mobile-first | מלא | `app.js`, `styles.css` | — | — | 🟢 קיים |
| נגישות (focus/aria/contrast/reduced-motion) | חלקי | כל ה-frontend | לא נבדק שיטתית | לעבור נגישות | 🟡 חלקי |
| הבהרה "לא תחליף לטיפול" | קיים (נוסף היום) | `app.js` Faq disclaimer | להוסיף גם בצ'אט וב-intake | להרחיב | 🟡 חלקי |

---

## 3. פערי פלטפורמת Care — לפי 3 השכבות (אפיון סעיף 17)

| שכבה | מה קיים | פער עיקרי |
|---|---|---|
| **1. Public Acquisition** | דף בית מלא, FAQ, CTA, לידים | עמודי SEO נפרדים, **מאמרים** (הוסרו), SSR לכל עמוד |
| **2. Digital Care** | הרשמה, אזור אישי, צ'ק-אין, AI, מודולים | intake מלא, safety-check כמסך, Dashboard יומי, מנוע המלצות שקוף, AI מובנה במצבים, ContentSource מאושר, human handoff |
| **3. Human Care Operations** | codes/patients/materials באדמין | CarePath/SafetyFlag/CareCheckpoint/HumanSupportRequest/CareTask/DataSharePermission/ConsentRecord + Dashboard צוות לפי הרשאות + AuditLog לכל גישה רגישה |

**הערת גבולות (חובה מהאפיון):** אין להציג את השירות כ"טיפול" זמין אם אין צוות מקצועי מורשה. עד אז — "פלטפורמת ליווי רגשי ותרגול מונחה", וליווי מקצועי = בקשת שיחה/פגישה.

---

## 4. ישויות נתונים — קיים מול נדרש

**קיימות (25 טבלאות):** accounts, patients, patient_profile, enrollments, programs, subscriptions, checkins, mood_logs, conversations, summaries, module_progress, protocol_progress, grounding_sessions, daily_tasks, client_goals, client_materials, assessments, recommendations, access_codes, auth_sessions, consent_log, audit_logs, notifications, webhook_events, workshop_signups.

**חסרות (לפי אפיון):** CarePath, IntakeResponse, SafetyFlag, CareCheckpoint, HumanSupportRequest, ContentSource (עם אישור), RecommendationLog, DataSharePermission, Track/Module/Lesson/Exercise כישויות תוכן מלאות, AudioAsset.

> יש בסיס נתונים עשיר. רוב הפער הוא **הרחבה**, לא בנייה מאפס — תואם לכלל "משפצים לא בונים".

---

## 5. סיכום

- **הבעיה שקטי הצביעה עליה (מאמרים) — אובחנה:** נמחקו בריעצוב; ה-Backend שלם; צריך להחזיר תצוגה.
- האתר הציבורי **תקין וזמין**; אין תקלת זמינות.
- הפער המרכזי מול האפיון: מעבר מ"אתר תדמית עם אזור אישי" ל"פלטפורמת Care" — בעיקר עמודי SEO נפרדים, intake/safety/dashboard-יומי, מנוע המלצות שקוף, AI מובנה במצבים, ושכבת Care Operations.
- **אין צורך בבנייה מחדש.** התשתית (auth, DB, AI, תשלום, אדמין) קיימת ועובדת; העבודה היא הרחבה מדורגת לפי IMPLEMENTATION_PLAN.md.
