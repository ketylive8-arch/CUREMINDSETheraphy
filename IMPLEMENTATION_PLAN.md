# IMPLEMENTATION_PLAN.md — CureMindset

**תאריך:** 9 בספטמבר 2026
**מבוסס על:** IMPLEMENTATION_AUDIT.md + מסמך האפיון (מקור אמת).
**עיקרון:** משפצים את הקיים בשלבים. אחרי כל שלב — בדיקה ודיווח. לא מוחקים, לא בונים מאפס.

---

## שלוש שכבות המוצר

1. **Public Acquisition** — האתר הציבורי, עמודי SEO, מאמרים, כניסה לניסיון.
2. **Digital Care** — הרשמה, אינטייק, מסלול אישי, תרגול, צ'ק-אין, מעקב, AI, SOS.
3. **Human Care Operations** — בקשות ליווי אנושי, מפגשים, דגלי בטיחות, הרשאות צוות — רק כשיש צוות מורשה.

---

## סדר ביצוע מדורג

### שלב 0 — תיקון דחוף: החזרת המאמרים  🔴 ראשון
- **קבצים:** `app.js` (רכיב `ArticlesSection` חדש שמושך `/api/articles`), `index.html` (cache bump).
- **מה:** להחזיר סקשן מאמרים לדף הבית — בדיוק מה שנמחק בריעצוב, בעיצוב הזהב-קרם הנוכחי.
- **אימות:** הסקשן מופיע, מושך מהבלוג, נופל ל-3 מאמרים מקוריים אם ריק. צילום מסך.
- **מדוע ראשון:** זה מה שקטי הצביעה עליו כ"השתבש".

### שלב 1 — תשתית, routing, brand tokens
- לוודא build/deploy יציב (Vercel+Render). ליישר brand tokens (זהב-קרם) כמשתני CSS. Design System קטן (Button/Card/Input/Progress/Modal/Toast/Empty/Error/Loading).
- **אימות:** אין רגרסיה חזותית; כל המחלקות קומפלו ב-`styles.css`.

### שלב 2 — אתר ציבורי + SEO (Public Acquisition)
- routes ציבוריים נפרדים: `/emotional-coaching`, `/anxiety-and-stress`, `/self-confidence`, `/procrastination`, `/cure-teens`, `/parents`, `/workshops`, `/method`, `/about`, `/faq`, `/contact`, `/articles`, `/privacy`, `/terms`, `/accessibility`, `/responsibility`.
- קובץ תוכן מרכזי (`content/seoPages`) — slug/keyword/title/description/h1/sections/faq/cta/related.
- תוכן מרכזי ב-HTML הראשוני (SSR/SSG או pre-render) לכל route. `sitemap.xml` מלא + `lastmod`. canonical אחד www/non-www. JSON-LD אמיתי בלבד.
- **אימות:** בדיקת title/description/canonical/H1-יחיד/תוכן-ב-HTML לכל route.

### שלב 3 — הרשמה, אימות, הסכמות, אינטייק, בטיחות
- מסכים: `/signup`, `/verify-email`, `/login`, `/forgot-password`, `/consent`, `/intake`, `/safety-check`, `/onboarding-complete`.
- intake מדורג: קהל / נושא / מטרה ל-3 ימים / זמן פנוי / פורמט / צ'ק-אין 1–10. כל שאלה עם הסבר; אפשר לדלג ברגישות; ללא אבחנה.
- safety-check עדין + ישות `SafetyFlag` לפי מדיניות.
- **אימות:** זרימה מלאה עד onboarding-complete; ללא אבחנה/ציון רפואי.

### שלב 4 — אזור אישי + Dashboard יומי (Digital Care)
- `/app/today` (מסך תרגול יומי): מטרה, סטטוס מסלול, צעד-אחד, resume, צ'ק-אין, **SOS גלוי**, "אני צריכה אדם", משימה/פגישה, הסבר-למה. עד 3 המלצות.
- `/app/track`, `/app/tools`, `/app/lesson/[id]`, `/app/check-in`, `/app/chat`, `/app/preferences`, `/app/profile`.
- **אימות:** משתמשת חדשה מגיעה למסך היום עם צעד אחד; חוזרת ממשיכה מהנקודה.

### שלב 5 — תוכן ומעקב
- היררכיה Track→Module→Lesson→Exercise→Reflection. seed 6 מסלולים ×3 מודולים ×2 יחידות (תוכן מקורי + TODO להחלפה ע"י קטי). מעקב התנהגותי (לא ציון נפשי).
- **אימות:** יחידה נפתחת/מושלמת/נשמרת; מעקב מציג שימוש.

### שלב 6 — התאמה אישית שקופה (ללא ML)
- מנוע חוקים לפי tags (audience/topic/duration/difficulty/stage/format/sensitivity). כל המלצה עם `reason`. כפתור "לא מתאים לי עכשיו". `RecommendationLog`. אין חזרה על כלי >פעמיים.
- **אימות:** כל המלצה מציגה סיבה; לוג נשמר; אין upsell מהמלצות.

### שלב 7 — AI מבוסס מקורות מאושרים + Safety
- `ContentSource` עם sourceId/version/topic/audience/sensitivity/approvedBy/approvedAt. RAG סף-התאמה; אם אין מקור — לא ממציא. מצבי AI (הסבר/כלי/תרגול/SOS/הורות/סיכום). JSON פנימי → UI. citation "מבוסס על: יחידה X". server-side בלבד. שמירת שיחות רק ב-consent + מחיקה. מינימום context.
- **אימות:** בדיקת no-source fallback; אין דליפת prompt/embeddings; safety עוצר ומפנה.

### שלב 8 — CMS והרשאות
- ניהול Track/Module/Lesson/Exercise + מקורות AI. סטטוסים Draft/Review/Published/Archived + גרסאות + תיוג + preview מובייל. הרשאות תפקיד (admin/editor).
- **אימות:** יצירת יחידה → טיוטה → פרסום → מופיעה באתר.

### שלב 9 — Human Care Operations (רק אם יש צוות מורשה)
- ישויות: CarePath, IntakeResponse, SafetyFlag, CareCheckpoint, HumanSupportRequest, Appointment, CareTask, ConsentRecord, DataSharePermission, AuditLog.
- Dashboard צוות — רק משתמשות עם `DataSharePermission` תקף; ללא שיחות-AI/השתקפויות כברירת מחדל; כל גישה רגישה ל-`AuditLog`.
- **מסומן:** `REQUIRES_PROFESSIONAL_REVIEW` + `REQUIRES_LEGAL_REVIEW`.

### שלב 10 — איכות: בדיקות, ביצועים, נגישות
- בדיקות auth/onboarding/progress/permissions/AI-safety/unauthorized/RTL/mobile/SEO/loading-empty-error. README + DECISIONS.md.

---

## מה ממתין לאישור/החומר של קטי
- ערוץ מייל (App Password / n8n webhook) — לחיבור לידים.
- 10 ההחלטות הפתוחות (אפיון §15): שם העוזר, מבנה חינמי, מנוי באתר, חשבון הורה, קהילה, טענות מותרות, מקורות AI, סליקה, מדיניות שמירת שיחות, שפות.
- חומרים (אפיון §14): תוכן 6 מסלולים, תסריטי אודיו, סיפורי לקוחות מאושרים, טקסטים משפטיים, מקורות AI מאושרים.

## סימוני סטטוס בשימוש
`MOCK` · `TODO` · `REQUIRES_APPROVAL` · `REQUIRES_LEGAL_REVIEW` · `REQUIRES_PROFESSIONAL_REVIEW`

---

**הצעד הבא (ממתין לאישורך):** שלב 0 — החזרת סקשן המאמרים לדף הבית. לומר "כן, תחזיר את המאמרים" ואתחיל.
