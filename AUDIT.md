# AUDIT — CureMindset (לפני עריכה)

> audit חובה לפני כל עריכת קוד. נבנה מקריאת הקוד בפועל + בדיקות ריצה חיות.
> **מצב:** קריאה בלבד — לא בוצעה שום עריכה. אין production חדש (הכל ב-branch `zip-integration-2026-08-30`, לא main).
> **מקורות אימות:** `server/*.js`, `memberArea.js`, `index.html`, בדיקות E2E מול שרת מקומי.

## היעד (מוסכם)
מוצר דיגיטלי מקורי, ברור ובטוח: אתר ציבורי עם תוכניות וסדנאות · flow הרשמה שמתחיל בשיחה אמפתית · אזור אישי עם guidance יומי · AI מבוסס תכני קטי · database ששומר את המסע · **72 שעות ניסיון** · תשלום Grow **רק אחרי** תום ההתנסות. אין להעתיק את Curable — כל קופי, שם מאמן, מסך, פרוטוקול, prompt ועיצוב מקוריים.

---

## דירוג חומרה
- 🔴 **P0** — חוסם השקה / סיכון נתונים או תשלום.
- 🟠 **P1** — פוגם בחוויה/עקביות, חובה לפני קהל רחב.
- 🟡 **P2** — ליטוש.

---

## 1. מודל ה-trial — ✅ תקין בשרת, 🔴 סותר ב-frontend

**שרת (מקור אמת):** נכון.
- `TRIAL_HOURS = 72` יחיד (`server/db.js:403`). אין fallback של 14 יום.
- `getAccessStatus` מחשב 72h מ-`trial_start_at` (`db.js:344-371`).
- `/api/checkout` חוסם בזמן trial (403) ופותח רק בסיום (`server/index.js:772-803`). מאומת E2E.

**frontend (`memberArea.js`): 🔴 שתי מערכות ניסיון מתחרות שנוגדות את ה-72h.**
1. **נעילת paywall לפי מספר מודולים** (`memberArea.js:2973-2980`):
   `FREE_MODULES = 2` → `trialLocked = !paid && modulesUsed >= 2` → `expired = access.expired || trialLocked`.
   משתמש שמסיים 2 מודולים נחסם — בלי קשר לזמן.
2. **תוכנית 14 יום עם נעילה יומית** (`memberArea.js:2283-2322`, `:2806` `locked = d.day > currentDay`): 4 שערים × ימים 1–14.
3. **קופי שיורי "14 יום"**: `:385` ("14-day trial"), `:651` ("14 יום במודולים").
4. **באג "paid":** הקוד בודק `access.status === "paid"` (`:2976`) אך השרת לעולם לא מחזיר "paid" (רק trial/code/expired) — מסלול פתיחה-אחרי-תשלום בצד-לקוח שבור; המצב האמיתי ב-`enrollment.subscription_status` לא נקרא כאן.

**נדרש:** להסיר את נעילת המודולים/הימים ממסלול ה-trial; זמן (72h server-side) = מקור אמת יחיד גם ב-UI; לחבר מצב "שילם" ל-`subscription_status`/`/api/auth/me`. תוכן ה-14 יום יכול להישאר כמסע לימודי — אך לא כשער תשלום.

---

## 2. קישוריות נתונים — 🟠 חלקי

**גשר תקין:** משתמש מחובר → `req.deviceToken = accountId` (`server/deviceToken.js:10-14`), כך שהטבלאות הישנות נכתבות תחת ה-accountId, שהוא גם `user_id` בטבלאות החדשות.

**פערים:**
- **2a 🟠 אין `enrollment_id` בטבלאות הישנות:** `checkins, mood_logs, protocol_progress, client_materials, client_goals, daily_tasks, grounding_sessions` (`db.js:52-124`) מפתוחות ב-`device_token` בלבד. רמת חשבון, לא per-enrollment. למשתמש עם >1 תוכנית — הנתונים מעורבבים.
- **2b 🟠 אין מיגרציה אנונימי→רשום:** נתונים תחת `X-Device-Token` אנונימי לא ממוזגים ל-`accountId` בהתחברות (`deviceToken.js`). המסע שלפני ההרשמה אובד.
- **2c 🟡 שני שעוני trial:** `patient_profile.trial_start_at` (`db.js:344`) מול `enrollment.trial_ends_at` (`db.js:459`). שניהם 72h אך נקבעים ברגעים שונים; `growGateStatus` משתמש בשעון החשבון.

---

## 3. תשלום Grow — 🔴 קוד מוכן, לא חי

- `checkoutUrl` נשאר `null` בלי `GROW_CHECKOUT_URL` (`index.js:786-787`). מאומת: כשלא מוגדר — לא מדליף קישור.
- `/api/webhooks/grow` מחזיר 503 בלי `GROW_WEBHOOK_SECRET` (`index.js:415`).
- חתימת HMAC היא placeholder‏ `${eventId}:${userId}:${enrollmentId}` (`index.js:426-427`) — חובה להתאים לסכמה האמיתית של Grow.
- אידמפוטנטיות תקינה דרך `webhook_events` (`db.js:299-303`, `applyPaymentWebhook`).

**נדרש:** env ב-Render + התאמת חתימה + חיבור ה-paywall ב-frontend ל-`/api/checkout` + בדיקת test מלאה. 🔑 (חשבון Grow)

---

## 4. Deploy & persistence — 🔴 לא מאומת חי

- `DB_FILE` — בלי דיסק קבוע ב-Render הנתונים עלולים להיעלם ב-redeploy (`db.js:13-18`).
- `vercel.json` אמור להפנות `/api` ו-`/uploads` ל-Render — לוודא.
- הכל ב-branch/commit, **לא main**. אין לטעון production חדש לפני אימות commit חי ב-Vercel וב-Render.

---

## 5. אתר ציבורי & סדנאות — 🟠 חסר

- דף הבית מערבב אימון אישי, סדנאות, מודולים, ארגונים, אזור אישי, WhatsApp וניסיון דיגיטלי — בלי מסלול חד.
- קישורי הסדנאות מפנים ל-`#wk-signup` או WhatsApp, **אין דף פרטים ייעודי לכל סדנה** (route/page אמיתי).
- אין הפרדת 3 מוצרים (דיגיטלי / סדנאות / פרימיום) עם CTA+מחיר+מסלול נפרד.

**נדרש:** route/page אמיתי לכל סדנה (מבנה מלא: למי מתאים · מה תחווה · מה כלול/לא · מנחה · גיל/משך/מפגשים · מחיר/הצעה · שאלות נפוצות · גבולות · CTA); הפרדת מוצרים; שקיפות מחיר לפני checkout במוצר הדיגיטלי.

---

## 6. flow הרשמה & AI — 🟠 לוודא/לשפר

- **6a** flow ההרשמה נפתח כ-`AuthGate` (טופס), לא כשיחה אמפתית שממפה צורך ומחברת לתוכנית (`memberArea.js:2027`, `:2982-2989`). היעד: שיחה ראשונה מכילה.
- **6b 🔑** AI: לוודא מפתח OpenAI פעיל ב-Render, אחרת רץ fallback מקומי (`server/openai.js` + `guidedReply.js`).
- **6c** provenance לכל מודול AI (מקור, גרסה, קהל, מטרה, גבולות, תרגיל, פעולה קטנה, check-in) — לא קיים מובנה.

---

## 7. עיצוב ותוכן (אסטרטגיית לונדון) — 🟡 טרם בוצע
מפורט ב-`DESIGN_STRATEGY.md` ו-`WORKPLAN_FIXES.md` (חלק ב'): פסטל-accent (הזהב נשאר גיבור), Serif לכותרות אנגלית, צילום macro/editorial/"מרחב", "כלים לכל אתגר", קול "ישיר אך פואטי". 🔑 (תמונות ותכנים)

---

## סיכום עדיפויות לתיקון
1. 🔴 **P0:** (1) הסרת נעילת מודולים/ימים ממסלול trial · (3) חיבור Grow · (4) דיסק קבוע ב-Render.
2. 🟠 **P1:** (5) דפי סדנה + הפרדת מוצרים · (2a/2b) enrollment_id + מיגרציה אנונימי→רשום · (6a) הרשמה כשיחה.
3. 🟡 **P2:** (2c) איחוד שעונים · (6c) provenance · (7) עיצוב/קופי לונדון.

**לא מתחילים לתקן עד אישור סעיף-סעיף.**
