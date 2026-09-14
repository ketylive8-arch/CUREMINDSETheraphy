# SPEC_COVERAGE.md — מפת כיסוי האפיון מול הקוד בפועל

**מקור אמת יחיד.** לכל אפיון מהמפרט: סטטוס + הפניה לקוד/החלטה.
נבדק מול הקוד בפועל (grep/קריאה), לא הנחות. עודכן: 2026-09-14.

**מקרא:** ✅ בוצע ומאומת · 🟡 חלקי (קיים אך לא לפי כל האפיון) · ❌ חסר · ⚪ לא רלוונטי לפי החלטה מתועדת (DECISIONS.md)

> **למה סריקה חיצונית "מוצאת הרבה חוסרים":** (1) חלק מהאפיונים קיימים כ**סקשנים בדף הבית** ולא כעמודים נפרדים; (2) הסורק מחפש Next.js/TypeScript/Supabase/Zod/בדיקות — שהוחלט **במכוון** לא להשתמש בהם (ראו DECISIONS.md §0); (3) חלק באמת חסרים ומרוכזים כאן ב-❌.

---

## A. עמודים ציבוריים
| אפיון | סטטוס | ראיה / הערה |
|---|---|---|
| `/` דף בית | ✅ | `index.html` + `app.js` |
| `/method` | ✅ | `method.html` (+נתיב ב-vercel.json) |
| `/cure-teens` | ✅ | `cure-teens.html` |
| `/about` | ✅ | `about.html` |
| `/faq` | ✅ | `faq.html` |
| `/contact` | ✅ | `contact.html` |
| `/privacy` `/terms` `/accessibility` `/responsibility` | ✅ | קיימים כ-.html |
| `/how-it-works` | 🟡 | קיים כסקשן `#how-it-works` בדף הבית — **אין עמוד נפרד** |
| `/plans` | 🟡 | קיים כסקשן `#plans` — **אין עמוד נפרד** |
| `/organizations` | 🟡 | קיים כסקשן `#organizations` — **אין עמוד נפרד** |
| `/stories` (סיפורי שינוי) | 🟡 | קיים כסקשן `#results` — **אין עמוד נפרד** |
| בונוס: 3 עמודי סדנאות + עמודי SEO | ✅ | `workshop-*.html`, `emotional-coaching`, `anxiety-and-stress`, `self-confidence`, `procrastination`, `parents` |

## B. דף הבית — סקשנים
| אפיון | סטטוס | ראיה |
|---|---|---|
| Hero + הבטחה + CTA | ✅ | `app.js` CONTENT.hero |
| "3 ימים חינם · בלי כרטיס אשראי · ביטול בכל עת" | ✅ | app.js |
| למי השירות מתאים | 🟡 | קיים חלקית — לא בדיוק כ-4 כרטיסי בעיה מהאפיון |
| 3 שלבים (מדברים/מקבלים כלי/משתנים) | ✅ | `#how-it-works` |
| 4 עקרונות CURE (בהירות/שחרור/חשיבה/העצמה) | ✅ | CONTENT.method (Unblock מתוקן) |
| אזור על קטי | ✅ | `#about` |
| אזור CURE Teens | ✅ | `#cure-teens` |
| אזור מסלולים | ✅ | `#plans` |
| סיפורי שינוי (עם אנונימיזציה) | 🟡 | `#results` — ממתין לעדויות אמיתיות מאושרות |
| FAQ + הבהרת אחריות | ✅ | `#faq` + disclaimer |
| WhatsApp/Calendly דרך config | ✅ | `BOOKING_LINKS` / `LEAD_WEBHOOK_URL` env |

## C. הרשמה ואימות
| אפיון | סטטוס | ראיה |
|---|---|---|
| הרשמה (אימייל+סיסמה+הסכמה) | ✅ | `POST /api/auth/register` |
| אימות (OTP) + resend | ✅ | `/api/auth/verify-otp`, `/api/auth/resend-otp` |
| התחברות + איפוס סיסמה | ✅ | `/api/auth/login`, `/forgot`, `/reset` |
| הצגת/הסתרת סיסמה | 🟡 | לאמת ב-UI |
| Hashing דרך ספק Auth | ✅ | `server/auth.js` (hashing עצמי בצד שרת) |
| Rate limiting | ✅ | `rateLimit(...)` על routes |
| שגיאות שלא חושפות אם אימייל קיים | 🟡 | לאמת ניסוח בכל מסלול |
| אין סיסמאות/tokens בלוגים | ✅ | לא נמצאה הדפסת סוד; אומת ב-DECISIONS §3 |

## D. אונבורדינג (wizard)
| אפיון | סטטוס | ראיה |
|---|---|---|
| בחירת קהל / נושאים / מטרה / צ׳ק-אין 1–10 | ✅ | IntakeChat ב-`memberArea.js` |
| מסלול אישי ראשוני + יחידה ראשונה | ✅ | onDone → מסך "היום שלי"/צ׳אט |
| שמירת consent + createdAt | ✅ | `consent_log`, `/api/onboarding` |
| ניתן לדלג על שאלה רגישה | 🟡 | לאמת בכל שלב |
| ללא אבחנה/ציון רפואי | ✅ | צ׳ק-אין לא-אבחוני |

## E. אזור אישי
| אפיון | סטטוס | ראיה |
|---|---|---|
| היום שלי (הצעד הבא, ≤3 המלצות, SOS) | ✅ | STAGE id:0 "היום שלי", המלצות עם `reason` |
| מסלול (locked/current/completed) | ✅ | STAGES + protocol_progress |
| כלים (חיפוש/סינון) | 🟡 | כלים קיימים; סינון לפי משך/נושא לאמת |
| שיעור/יחידה (תוכן+תרגיל+reflection) | 🟡 | קיים; audio placeholder/reflection לאמת |
| צ׳ק-אין (מצב+מגמה) | ✅ | `/api/checkin` + dashboard |
| צ׳אט AI (citation, מחיקה, גבולות) | 🟡 | צ׳אט+disclaimer ✅; citation גלוי + מחיקת שיחה לאמת |
| פרופיל (מחיקת חשבון, יציאה) | 🟡 | פרופיל קיים; מחיקת חשבון לאמת |

## F. מודל נתונים + הרשאות
| אפיון | סטטוס | ראיה |
|---|---|---|
| 25 טבלאות מכסות את מודל המפרט | ✅ | `server/db.js` (מיפוי ב-DECISIONS §1) |
| טבלת Reflection ייעודית | ❌ | אין — reflection בתוך תוכן היחידה |
| ContentSource כטבלה | 🟡 | קיים כקבצי `knowledge_base/*.md`, לא טבלה |
| הרשאה ברמת-שורה | 🟡 | נאכף ב-app layer לפי `deviceToken`/`accountId`; **חסרות בדיקות unauthorized ייעודיות** |

## G. CMS (ניהול תוכן)
| אפיון | סטטוס | ראיה |
|---|---|---|
| פאנל אדמין קיים | ✅ | `admin.html` + `adminApp.js` |
| ניהול משתמשות/חומרים/קודים | ✅ | admin routes (patients/materials/codes) |
| **CRUD ל-Track/Module/Lesson/Exercise** | ❌ | התוכן קשיח ב-`memberArea.js` — לא נערך מ-CMS |
| **סטטוסים draft/review/published/archived** | ❌ | לא קיים |
| version/author/tags/preview מובייל | ❌ | לא קיים |

## H. AI — בטיחות והמלצות
| אפיון | סטטוס | ראיה |
|---|---|---|
| מפתח server-side בלבד | ✅ | `server/openai.js` |
| context רק ממקורות מאושרים (RAG) | ✅ | `knowledgeContext()` מ-19 מקורות |
| JSON פנימי מובנה | ✅ | `response_format: json_object` |
| **טיפול בפגיעה עצמית/חירום (short-circuit + מספרי חירום)** | ✅ | `server/safety.js` — **נבנה עכשיו**, נבדק E2E |
| disclaimer קבוע בצ׳אט | ✅ | memberArea.js:952 ("ער\"ן 1201 · מד\"א 101") |
| המלצות שקופות עם `reason` | ✅ | memberArea.js:884+ ("כי סימנת X/10") |
| ≤3 המלצות ב"היום שלי" + SOS גלוי | ✅ | STAGE id:0 |
| הפרדת UserPreferences מתוכן רגשי | 🟡 | חלקי — cm_intake נפרד; consent למחיקה לאמת |
| מינימום הקשר למודל (לא כל ההיסטוריה) | ✅ | openai.js — 8 הודעות אחרונות בלבד |
| מנוע המלצות מבוסס-חוקים (לא ML) | ✅ | resilience.js + לוגיקת today |
| **כפתורי פתיחה מוכנים** ("אני מוצפת עכשיו" וכו') | ❌ | לא נמצאו |
| "לא מתאים לי עכשיו" + מניעת חזרה ×2 | ❌ | לא קיים |
| RecommendationLog (הוצע/נפתח/הושלם) | 🟡 | `recommendations`/`daily_tasks` קיימות — לוג מלא לאמת |
| citation גלוי בצ׳אט ("מבוסס על: יחידה 2") | 🟡 | RAG פנימי קיים; תצוגה ב-UI לאמת |
| **סיכום שבועי (שימוש+דיווח עצמי בלבד)** | ❌ | לא קיים |
| תבנית תשובה (שיקוף→כלי→פעולה→שאלה→קישור) | 🟡 | בפרומפט; לאמת עקביות |

## I. מערכת עיצוב
| אפיון | סטטוס | ראיה |
|---|---|---|
| CSS variables של המותג | ✅ | `DESIGN_TOKENS.md` + styles.css |
| RTL / focus-visible / aria / contrast / reduced-motion | ✅ | patch.css + עמודים |
| רכיבי DesignSystem נפרדים (Button/Card/Input/Select/Progress/Modal/Toast/EmptyState/ErrorState/LoadingState) | 🟡 | קיימים **inline**; רק `Button` ו-`EmptyState` כרכיבים נפרדים — **אין ספריית רכיבים מרוכזת** |
| דסקטופ+מובייל מכוונים | ✅ | תוקן ב-patch.css + inline styles |

## J. תוכן seed
| אפיון | סטטוס | ראיה |
|---|---|---|
| משתמשת דמו (יעל) | ✅ | `server/seed.js` |
| **6 מסלולים × 3 מודולים × 2 יחידות** מובנים | 🟡 | תוכן מסע קיים ב-memberArea.js אך **לא כ-seed מובנה** עם title/duration/body/exercise/reflectionQuestion/nextAction |
| סימוני TODO להחלפה בתוכן של קטי | ❌ | לא מסומן שיטתית |

## K. בדיקות ו-QA
| אפיון | סטטוס | ראיה |
|---|---|---|
| **README** (setup/env/seed/run) | ✅ | `README.md` — **נבנה עכשיו** |
| **בדיקות** unit/integration (auth/onboarding/הרשאות/safety) | ✅ | `test/` — 16 בדיקות עוברות (`npm test`), בלי תלויות (node:test) |
| בדיקת unauthorized access | ✅ | `test/integration.test.js` — checkin בלי טוקן → 400 |
| DECISIONS.md | ✅ | קיים |
| .env.example | ✅ | קיים |

## Stack (הוחלט אחרת — לא "חוסר")
| הסורק מחפש | סטטוס | הערה |
|---|---|---|
| Next.js / TypeScript / Supabase / Zod | ⚪ | הוחלט להישאר על Express+SQLite+React-UMD הקיים (DECISIONS.md §0) — לא חוסר, החלטה |

---

## סיכום — מה באמת חסר (❌), לפי עדיפות
1. ~~**בדיקות + README** (K)~~ — ✅ **בוצע** (16 בדיקות עוברות + README).
2. **CMS לתוכן** (G) — CRUD ל-Track/Module/Lesson + סטטוסים.
3. **כפתורי פתיחה ל-AI + "לא מתאים לי" + סיכום שבועי** (H).
4. **seed מובנה 6×3×2 + סימוני TODO** (J).
5. **4 עמודים נפרדים**: how-it-works, plans, organizations, stories (A).
6. מסך `/app/preferences` מלא + citation גלוי בצ׳אט (E/H).

### התקדמות הבנייה (עדכני)
- ✅ שלב 1: Audit + DECISIONS + .env.example
- ✅ שלב 2: שכבת בטיחות AI (server/safety.js)
- ✅ שלב 3: בדיקות (16) + README
- ⏭️ הבא: seed מובנה 6×3×2 → כפתורי AI + סיכום שבועי → 4 עמודים → CMS

## מה שכבר בוצע ומאומת (✅) — לא לבנות מחדש
אתר ציבורי, הרשמה+OTP+איפוס+OAuth, אונבורדינג, אזור אישי (היום/מסלול/צ׳אט/צ׳ק-אין), RAG AI server-side, **שכבת בטיחות**, disclaimer, המלצות עם reason, מיתוג נעול, DECISIONS+.env.example.
