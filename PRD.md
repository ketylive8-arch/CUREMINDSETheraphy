# מסמך פיאט (PRD) — CureMindset · גרסה 2.0 (1.09.2026)
מקור אמת יחיד למוצר. Claude Code עובד לפי מסמך זה + CLAUDE.md + הפרומפט הקליני.

## 1. תקציר
פלטפורמת אימון רגשי דיגיטלית לפי שיטת קטי שגב (NLP, תת-מודע, ויסות מערכת עצבים). חוויית ריפוי רגשי דיגיטלי (בהשראת Curable — עקרונות בלבד, אפס העתקה) דרך שיחה עם AI ("קטי הדיגיטלית"), כלים, אודיו, תרגולים, פגישות וידאו ומעקב.
- **מודל:** התנסות חינם 72 שעות (מוצג כ"3 ימי התנסות", **בלי דדליין/שעון ספירה**) → מנוי (3 מסלולים) + פגישות וידאו בתשלום.
- **קהלים:** נוער 13+, הורים, מבוגרים, ארגונים (B2B).
- **שפה:** עברית RTL מלא. mobile-first. WCAG 2.1 AA.

## 2. מצב נוכחי (31.08)
עובד: register/login, /api/auth/me (X-Device-Token+X-Auth-Token), /api/checkin, /api/mood, /api/goals, /api/dashboard, /api/journey-summary, /api/profile, /api/access (72h server-side), Grow דיגיטלי ₪297, /api/workshop-signup.
שבור/חסר: (1) דליפת טקסט שיווקי ב-AI [טופל — ניקוי KB], (2) /api/materials ריק, (3) /api/articles ריק, (4) /api/onboarding 404, (5) POST /api/tasks 404, (6) רק מסלול Grow אחד, (7) אין admin, (8) אין העלאת חומרים, (9) אין היסטוריית משתמשים, (10) אין חשבוניות, (11) אין שליחת מיילים, (12) אין "ברוכה השבה", (13) אין דף וידאו, (14) אין Privacy/Terms, (15) אין הגנת פרטיות מלאה.

## 3. פרטיות ואבטחה (קריטי)
תקינה: חוק הגנת הפרטיות התשמ"א-1981 + תיקון 13, GDPR, עקרונות HIPAA.
- **הצפנה:** TLS 1.2+, AES-256 במנוחה, סיסמאות bcrypt (10+ rounds), וידאו WebRTC+SRTP.
- **בקרת גישה:** authz בצד שרת לכל endpoint (לא לסמוך על userId מהלקוח), א'≠ב', admin נפרד (isAdmin), RBAC (user/admin), least privilege.
- **מניעת זליגת AI:** פרומפט מערכת בשרת בלבד (לעולם לא ללקוח); סינון תגובות (אין טקסט פנימי/שיווקי/אסטרטגי); no cross-context leakage; ה-AI ניגש ל-DB רק דרך API מתווך; לוגים = metadata בלבד (userId, timestamp, moduleId, safetyFlag) — לא תוכן מלא.
- **קבצים:** אודיו/וידאו רק ל-enrollment פעיל; signed URLs עם תפוגה (5 דק'–שעה); אין tokens/סיסמאות/PII בלוגים או URL.
- **מחיקה:** מחיקת חשבון מהפרופיל מוחקת שיחות/צ'ק-אין/מצב-רוח/יעדים/התקדמות/פרופיל; חשבוניות נשמרות 7 שנים מנותקות מזהות.
- **דפים:** /privacy-policy ו-/terms (ח.פ 037662392, ketyse@gmail.com; גיל 13+, באישור הורה עד 18; קווי חירום: סהר 1202, ער"ן, 118).

## 4. אתר ציבורי
דפים: בית (קטי, 4 עמודי השיטה, CTA "התחל ניסיון חינם"), אודות, **מיקומי טיפול** (מרכז דיאלוג-קריות; מרכז תכלת-קרית מוצקין אוסישקין 1 + חיפה נורדאו 3; קליניקה פרטית-קרית מוצקין; אונליין), סדנאות (המצפן הפנימי/חוסן לחיילים/Longevity), **פגישת וידאו** (₪280, 20% הנחה מ-₪350, Calendly, Grow, WebRTC), **תוכניות** (₪97/₪197/₪397), בלוג, Privacy, Terms.
בכל דף: דגש "פנים אל פנים בקריות/חיפה או אונליין מכל מקום".
עיצוב: mobile-first (320/480/768/1024/1440), bottom-nav במובייל, RTL מלא (logical properties), פלטה cream #FAF8F4 / beige #E8E0D5 / gold #C9A96E / soft-blue #B8D4E3, נגישות WCAG 2.1 AA, FCP<2s.

## 5. אזור המשתמש (App)
זרימה: בית → בחירת תוכנית → הרשמה → trial 72h → שיחה פתוחה → זיהוי נושא → שיקוף+אישור → ציון חוסן → המלצת מודול → כלי/אודיו → תרגול+check-in → שמירה → יציאה → חזרה (מכשיר אחר) → "ברוכה השבה" → סוף 72h → סיכום+הצעה+מחיר → תשלום Grow → תוכנית מלאה → וידאו.
מצבים: new/registered/trial_active/trial_expired/payment_pending/subscribed/cancelled/suspended_for_safety. אין onboarding לחוזרת עם enrollment פעיל.
מסכים: (1) שיחה פתוחה, (2) ציון חוסן="מפת מצב" (לא "אבחנה", דטרמיניסטי, versioned), (3) המיקוד שלי (מודול+הסבר "למה"), (4) החומרים שלי (אודיו אמיתי או placeholder ברור, transcript), (5) ההתקדמות שלי, (6) התוכנית שלי, (7) פגישת וידאו, (8) הפרופיל שלי (מחיקה/ייצוא/הסכמות), (9) ברוכה השבה.
ניווט: שיחה | מיקוד | חומרים | התקדמות | תוכנית | וידאו | פרופיל.
**AI:** לפי הפרומפט הקליני v3.0 (קובץ נפרד). שפה חמה; מפיק דפוס (לא תוכי); שאלה פתוחה אחת; ממפה ל-4 עמודים+פרוטוקול; כלי מעשי אחד; בטיחות — סימני סיכון→עצירה+הפניה.
כלים: נשימת קופסה 4-4-4-4, עוגן SOS, יומן רגעי אוויר, מיקרו-צעד, עוגן הבית, Future Pacing.
**Trial:** 72h server-side (trialEndsAt=trialStartedAt+72h), מוצג "3 ימי התנסות" בלי שעון. סוף→נעילה+סיכום+הצעה.
**Checkout (לפני תשלום):** מה קיבלת ב-3 ימים, מה ייפתח, מחיר+מטבע, תאריך חיוב ראשון, תדירות+חידוש, מה כלול, ביטול, "אין חיוב עד אישור מפורש".
**מסלולים:** בסיסי ₪97 (צ'ט+חומרים בסיסיים) · אמצע ₪197 (+אודיו+מעקב) · CureTeens ₪397 (חבילה מלאה+סדנה חודשית+קורסים). וידאו ₪280 (זיכוי אם בוטל לפני 24h). מנוי מתעדכן רק אחרי webhook מאומת idempotent.

## 6. פאנל Admin (/admin, isAdmin, 2FA מומלץ)
מסכים: דאשבורד (פעילים/trial/מנויים/הכנסה/חדשים/וידאו קרובות/התראות), ניהול משתמשים (טבלה+חיפוש), פרופיל משתמש (פרטים+חוסן+היסטוריית שיחות+חומרים+גרף+**ניתוח AI** להמלצת כלים), ניהול חומרים (CRUD+העלאה), ניהול וידאו (לוח+סטטוס+חדר+סיכום), שליחת מיילים (תבניות+היסטוריה), חשבוניות (יצירה+שליחה+ח.פ 037662392), ניתוח ודוחות (חודשי/התקדמות/חומרים/וידאו, ייצוא CSV).
ניתוח AI ב-Admin: דפוסים חוזרים, פרוטוקול מומלץ הבא, סימני החמרה/סיכון, כלי נוסף שטרם הוצע.

## 7. מודל נתונים
קיים (לא למחוק): users, profiles, sessions, conversations, assessments, recommendations, materials, progress, enrollments, mood, goals, subscriptions, audit_logs.
חדש: admin_emails, invoices, material_assignments, admin_notes, video_sessions(scheduledAt,duration,price,status,roomUrl,roomPassword,summary), privacy_consents(consentType,version,consentedAt,ipAddress).

## 8. API
לתקן: POST /api/checkin (ניקוי פרומפט), POST /api/tasks, GET /api/onboarding, GET /api/materials, GET /api/articles.
חדש — Admin: GET /api/admin/{dashboard,users,users/:id,invoices,reports,video-sessions}; POST /api/admin/{materials,assign-material,email,invoice,ai-analysis,video-sessions}; PUT/DELETE /api/admin/materials/:id; PUT /api/admin/video-sessions/:id.
חדש — User: GET /api/welcome-back, POST /api/feedback, POST /api/video-session, GET /api/video-session/:id, POST /api/consent, GET /api/export-data, DELETE /api/account.

## 9. סדר עבודה (9 שלבים)
1. **דחוף:** נקה דליפת AI [בוצע], תקן POST /api/tasks, תקן/הסר /api/onboarding, הזן 3-5 חומרים, פרסם 2-3 מאמרים.
2. **פרטיות:** Privacy Policy, Terms, consent ברישמה, /api/export-data, DELETE /api/account, פרומפט בשרת בלבד, לוגים בלי תוכן, signed URLs.
3. **UX:** מסך "ברוכה השבה", ניווט פנימי, אין onboarding כפול, GET /api/welcome-back, הטמעת פרומפט קליני, transcript לאודיו.
4. **תשלום:** Grow ל-3 מסלולים, מסך checkout מלא, webhook מאומת, עדכון דף תוכניות.
5. **וידאו:** דף הזמנה, Calendly, ₪280 Grow, WebRTC/SRTP, מסך הכנה+חדר נעול, סיכום+חומרי המשך, ניהול ב-Admin.
6. **Admin:** /admin מוגן, דאשבורד, משתמשים+פרופיל, חומרים CRUD, מיילים, חשבוניות, ניתוח AI, דוחות.
7. **אתר ציבורי:** אודות, סדנאות, תוכניות (₪97/197/397), וידאו (₪280), בלוג, Privacy, Terms.
8. **נגישות+רספונסיב:** WCAG 2.1 AA, keyboard, screen-reader/ARIA, קונטרסט 4.5:1, 44x44px, RTL, breakpoints.
9. **בדיקות:** משתמשת חדשה, חוזרת ממכשיר אחר, סוף trial→checkout, וידאו, admin, א'≠ב', מחיקה מוחקת הכל, נגישות.

## 10. משאבים
דומיין ketysegev.com · repo ketylive8-arch/CUREMINDSETheraphy · Vercel · Grow (pay.grow.link) · Calendly /ketysegev · וואטסאפ 054-303-2349 · ketyse@gmail.com · ח.פ 037662392 · פרומפט קליני v3.0 (בדרייב).

## 11. כללים
Preview בלבד (אל תשנה production בלי אישור); תקן, אל תבנה מאפס; אל תמחק נתונים; אל תעתיק Curable/BetterHelp (עקרונות בלבד); RTL+mobile-first+WCAG AA; דוח סיום אחרי כל שלב; placeholder ברור במקום נתון מזויף; הפרומפט הקליני כבר כתוב — הטמע אל תכתוב מחדש; קרא קוד קיים לפני שינוי; פרטיות לפני הכל — אפס זליגה של טקסט פנימי/פרומפט/נתוני משתמש.

## 12. SEO
בעיה: sitemap עם URL אחד, אין דפי עיר/נושא, מילות מפתח כלליות.
אסטרטגיה: כל חיפוש = דף ייעודי. שכבות: דפי עיר (Local), דפי נושא (Service), צירוף עיר+נושא (long-tail), בלוג, Google Business Profile.
דפי עיר: חיפה, קריות, קרית-מוצקין, קרית-אתא, נשר, עכו, טירת-כרמל, זכרון-יעקב, חדרה, באקה-אל-גרבייה (`/אימון-מנטלי-לנוער-<עיר>`).
דפי נושא (~50): חרדה-חברתית/דימוי-עצמי/ביטחון-עצמי/חוסן-רגשי/ויסות-רגשי/פחד-מכישלון/פחד-מדחייה/בדידות/OCD/לחץ-לימודי/העצמה/NLP/טראומה/שחרור-רגשי/התמכרות-רגשית/שינוי-אמונות/סדנאות/המצפן-הפנימי/CureTeens וכו'.
כל דף: H1+meta title/description ייעודיים, 500-800 מילים מקצועיות (לא שיווקיות, לא duplicate), כלים, FAQ, CTA, Schema (LocalBusiness/FAQPage/Service), breadcrumbs, internal linking.
Technical: canonical, og, hreflang he-IL, alt, slug עברי kebab, LCP<2.5s/CLS<0.1, brotli/webp/lazy, robots (Disallow /admin,/api), sitemap ל-Search Console, GA4 (בלי PII).
Google Business Profile: Mental health service, אזור חיפה, שעות א-ה 9-18, תמונות, שירותים, טלפון 054-303-2349, ביקורות.
