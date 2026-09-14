# CureMindset — קטי שגב

פלטפורמת Web בעברית (RTL) לליווי רגשי ומנטלי בשיטת CureMindset — אתר שיווקי,
הרשמה, ניסיון, אונבורדינג, אזור אישי, מסלולי תוכן, צ׳ק-אין, מעקב התקדמות
ועוזר AI מבוסס מקורות תוכן מאושרים בלבד.

> **הבהרה:** CureMindset הוא כלי לאימון, למידה ותרגול אישי. אינו תחליף לאבחון,
> טיפול רפואי או נפשי, ואינו מיועד למצבי חירום. במצוקה — ער"ן 1201, מד"א 101.

## Stack

- **Frontend:** React 18 (UMD) + Babel בדפדפן, **בלי build step**. HTML סטטי + `app.js`, `memberArea.js`, `adminApp.js`, `workshops.js`, `resilienceDashboard.js`, `main.js`. עיצוב: Tailwind מהודר (`styles.css`) + `patch.css`/`workshops.css`/`auth.css`.
- **Backend:** Express 5 + `node-sqlite3-wasm` (`server/`).
- **DB:** SQLite מקומי (`server/curemindset.db`) — 25 טבלאות.
- **AI:** OpenAI בצד שרת בלבד (`server/openai.js`), RAG מ-`server/knowledge_base/*.md`, נפילה למנוע מקומי (`server/guidedReply.js`).
- **בטיחות:** `server/safety.js` — זיהוי מצוקה בצד שרת לפני כל AI.

> החלטת ה-Stack (למה לא Next.js/Supabase/TypeScript) מתועדת ב-`DECISIONS.md`.
> כיסוי האפיון מול הקוד: `SPEC_COVERAGE.md`. טוקנים של המותג: `DESIGN_TOKENS.md`.

## דרישות מוקדמות

- Node.js **22.x**
- אין צורך ב-build/bundler.

## התקנה והרצה מקומית

```bash
npm install
cp .env.example .env      # מלא ערכים אמיתיים (ראו למטה). בלי .env השרת רץ במצב demo.
npm start                 # מריץ את השרת על PORT (ברירת מחדל 3000)
# פתח http://localhost:3000
```

בעליית השרת נזרעת אוטומטית משתמשת דמו (יעל) — אידמפוטנטי. פרטי הכניסה מודפסים ללוג.

## משתני סביבה

כל הסודות ב-`.env` בלבד (ה-`.env` ב-`.gitignore`). ראו `.env.example` לרשימה המלאה
עם placeholders. עיקריים:

| משתנה | לשם מה | חובה? |
|---|---|---|
| `PORT` | פורט השרת | לא (3000) |
| `SITE_URL` | כתובת ציבורית (אימות, OAuth, sitemap) | מומלץ |
| `OPENAI_API_KEY` | עוזר ה-AI (בלעדיו — מנוע מקומי) | לא |
| `ADMIN_USER` / `ADMIN_PASSWORD` | כניסה לפאנל הניהול | לפרודקשן |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` או `RESEND_API_KEY` | שליחת מיילים | לאימות מייל |
| `TWILIO_*` | OTP ב-SMS | לא |
| `GOOGLE_*` / `FACEBOOK_*` | התחברות חברתית | לא |
| `GROW_CHECKOUT_URL` / `GROW_WEBHOOK_SECRET` | תשלום (רק אחרי trial) | לא ב-MVP |

> **אבטחה:** אין סיסמאות hardcoded בקוד. אין לשמור סודות ב-git. `RESET_DEBUG` — פיתוח מקומי בלבד.

## בדיקות

```bash
npm test
```

מריץ את חבילת הבדיקות (Node built-in `node:test`, בלי תלויות חיצוניות):

- `test/safety.test.js` — זיהוי מצוקה + הודעת בטיחות (unit).
- `test/auth.test.js` — hashing, ולידציית הרשמה, התחברות עם שגיאה גנרית, session (unit, DB זמני).
- `test/integration.test.js` — מריץ את השרת האמיתי ובודק: גישה לא מורשית (400), הרשמה/כפילות (409), התחברות שגויה (401), בטיחות AI ב-`/api/checkin`, וצ׳ק-אין רגיל.

הבדיקות משתמשות ב-DB זמני (`os.tmpdir()`) ולעולם לא נוגעות ב-`server/curemindset.db`.

## מסד נתונים ו-seed

- הסכימה נוצרת אוטומטית בעליית השרת (`server/db.js`).
- זריעת משתמשת דמו: `npm run seed`.
- מיקום ה-DB: `DB_FILE` (ברירת מחדל `server/curemindset.db`, ב-`.gitignore`).

## מחוללי תוכן סטטי (SEO/סדנאות)

```bash
npm run gen:seo         # מחולל עמודי SEO סטטיים
npm run gen:workshops   # מחולל עמודי נחיתה לסדנאות
```

## מבנה הפרויקט (מקוצר)

```
index.html, *.html          עמודים ציבוריים סטטיים (SEO)
app.js                      דף הבית (React UMD)
memberArea.js               אזור אישי (היום שלי / מסלול / צ׳אט / צ׳ק-אין / פרופיל)
adminApp.js, admin.html     פאנל ניהול
workshop-*.html             עמודי נחיתה לסדנאות
server/
  index.js                  Express — routes + API
  db.js                     סכימה + גישת נתונים (25 טבלאות)
  auth.js, otp.js           הרשמה/התחברות/סשן/OTP
  openai.js, guidedReply.js עוזר ה-AI (מרוחק + מקומי)
  safety.js                 שכבת בטיחות (מצוקה/חירום)
  knowledge_base/*.md       מקורות RAG מאושרים
  seed.js                   זריעת דמו
scripts/                    מחוללי SEO/סדנאות
test/                       בדיקות (node:test)
DECISIONS.md, SPEC_COVERAGE.md, DESIGN_TOKENS.md
```

## פריסה

- **Frontend + rewrites:** Vercel (`vercel.json` — `/api/*` ו-`/uploads/*` מנותבים ל-backend).
- **Backend:** Render (`curemindsetheraphy`).

## מה עדיין דורש תוכן/אישור של קטי

ראו `SPEC_COVERAGE.md` (סעיף סיכום) ו-`DECISIONS.md` §5: סיפור אישי ל"אודות",
עדויות אמיתיות מאושרות, אישור טקסטי היחידות ב-seed, ו-webhook ל-CRM.
