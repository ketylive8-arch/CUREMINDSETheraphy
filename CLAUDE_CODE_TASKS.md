# פרומפט ל-Claude Code — CureMindset

## מבוא
אתה עובד על ה-repo של CureMindset: https://github.com/ketylive8-arch/CUREMINDSETheraphy
האתר חי ב-ketysegev.com (Render backend + Vercel frontend).
המותג: קטי שגב, אימון מנטאלי לנוער, חיילים ומבוגרים. שיטת CURE: Clarity, Resilience, Rewire, Empowerment.
צבעי מותג: cream (#FAF8F4), beige (#E8E0D5), gold (#C9A96E), soft blue (#B8D4E3).

---

## מה שכבר נעשה (02.09.2026) — אל תשנה את זה

### חיבור רשתות חברתיות
- Instagram נוסף לפוטר (instagram.com/ketysegev) עם אייקון 📷
- YouTube נוסף לפוטר (youtube.com/@ketynlplive) עם אייקון ▶
- JSON-LD sameAs עודכן ב-index.html עם Instagram + YouTube
- MEDIA_LINKS ב-app.js עודכן עם קישורים מלאים

### ניקוי תפריט
- "מה עובר עלייך?" הוסר מה-nav (הסקשן עצמו כבר הוסר קודם)
- "סדנאות" הוסר מה-nav (הסקשן עצמו כבר הוסר קודם)
- התפריט עכשיו: איך זה עובד, השיטה, תוכניות, CURE Teens, לארגונים, סיפורי שינוי

### Cache busting
- כל קבצי CSS/JS עודכנו ל-v=20260904 ב-index.html

---

## משימות לביצוע (לפי עדיפות)

### 1. טופס לכידת לידים בדף הנחיתה (CRITICAL)

כרגע יש רק קישורי mailto: שפותחים מייל במכשיר של הלקוח. זה לא קולט לידים — מי שלא שולח מייל, אבוד.

מה לבנות:
- טופס הרשמה אמיתי ב-section "תוכניות" (#plans) וב-CTA הסופי
- שדות: שם מלא, טלפון, אימייל, נושא פנייה (dropdown: נוער/פרטי/ארגון/אחר)
- הטופס שולח POST ל-/api/send-lead (כבר קיים בשרת! קרא server/index.js שורות 477+)
- אחרי שליחה: הודעת "תודה, נחזור אלייך תוך 24 שעות" + כפתור וואטסאפ
- עיצוב: כרטיס לבן עם border gold, RTL, אנימציית Reveal (השתמש בקומפוננטת Reveal הקיימת)
- ולידציה: שם לפחות 2 תווים, טלפון ישראלי תקין (10 ספרות, מתחיל ב-05), אימייל תקין
- אם יש כבר טופס ב-memberArea.js — קח ממנו השראה לעיצוב

חשוב: ה-endpoint /api/send-lead כבר קיים ומקבל נתונים. בדוק מה הוא מצפה לקבל (שדות) והתאם את הטופס לזה.

---

### 2. חיבור כפתורי תשלום לכל המסלולים

כרגע ב-app.js:
const PAYMENT_LINKS = {
  digital: "https://pay.grow.link/NDcyNjY~23b0b8d38a77cf03510833361d027ddf-MzY2MDI4MQ",
  youth: "",      // ריק — נופל ל-WhatsApp
  recommended: "", // ריק — נופל ל-WhatsApp
  premium: "",     // ריק — נופל ל-WhatsApp
};

מה לעשות:
- כש-PAYMENT_LINKS[plan.id] ריק, הכפתור נופל ל-WhatsApp — זה נכון ועובד
- וודא שהטקסט ב-WhatsApp מזהה את המסלול הנכון: "אשמח להתחיל במסלול {plan.badge}"
- אם אין קישור תשלום, הצג טקסט עדין: "תשלום אונליין בקרוב — נא ליצור קשר להרשמה"
- אל תשנה את המחירים: 97/197/397 ₪

---

### 3. Schema.org LocalBusiness ב-JSON-LD

ב-index.html כבר יש JSON-LD מסוג WebSite + Person. תוסיף:

{
  "@type": "ProfessionalService",
  "name": "CureMindset — קטי שגב | אימון מנטאלי",
  "description": "אימון מנטאלי וחוסן רגשי לנוער, חיילים ומבוגרים. שיטת CURE: Clarity, Resilience, Rewire, Empowerment.",
  "telephone": "+972543032349",
  "email": "ketyse@gmail.com",
  "url": "https://ketysegev.com",
  "areaServed": "חיפה והצפון, כל הארץ (אונליין)",
  "priceRange": "₪97-₪397",
  "sameAs": ["https://linktr.ee/Ketysegev", "https://instagram.com/ketysegev", "https://www.youtube.com/@ketynlplive"]
}

זה יעזור ל-Google Business Profile להופיע במפות ובחיפושים מקומיים.

---

### 4. ביצועים ואבטחה

- וודא שכל התמונות טעונות עם loading="lazy" חוץ מ-hero
- הוסף rel="noopener noreferrer" לכל קישור חיצוני שנפתח ב-target="_blank" (רובם כבר יש — וודא)
- בדוק שאין console errors בדף
- בדוק שהאתר עובד נכון ב-mobile (viewport, touch targets מינימום 44px)

---

### 5. נגישות (Accessibility)

- הוסף alt לכל תמונה (רובן כבר יש — וודא שיש לכולן)
- הוסף aria-label לכל כפתור שהוא אייקון בלבד
- וודא ניגודיות צבעים תקינה (WCAG AA)
- וודא ניווט מקלדת עובד (Tab, Enter)
- החלף את ה-emoji 📷 ו-▶ בפוטר ב-SVG אייקונים אמיתיים (השתמש ב-icons.js)

---

### 6. תוכן שיווקי — וידוא

- בסקשן "תוכניות": וודא שהמחירים הם 97/197/397 ₪
- בסקשן "תוכניות": וודא שהמלל מתאר מסלולים דיגיטליים (לא סדנאות)
- ב-CTA הסופי: וודא שהטקסט מפנה להרשמה/ניסיון חינם (72 שעות)
- וודא שאין שום אזכור של "סדנאות" או "מה עובר עלייך" בשום מקום בדף
- וודא שאין קישורים שבורים (#workshops, #problem — כבר הוסרו מה-nav אבל וודא שלא נשארו בקוד)

---

### 7. חיבורים חברתיים (כבר בוצע — רק וודא)

כל הקישורים כבר מחוברים בפוטר וב-JSON-LD:
- Instagram: https://instagram.com/ketysegev
- YouTube: https://www.youtube.com/@ketynlplive
- Linktree: https://linktr.ee/Ketysegev
- Facebook: https://www.facebook.com/Ketyse
- Blogspot: https://ketysegev.blogspot.com/
- Calendly: https://calendly.com/ketysegev/meet-with-me
- WhatsApp: https://wa.me/972543032349
- Spotify: https://open.spotify.com/episode/3XMpL3GBhi9YQ2FVIZNXd3
- Grow Payment (digital only): https://pay.grow.link/NDcyNjY~23b0b8d38a77cf03510833361d027ddf-MzY2MDI4MQ

---

### 8. Google Business Profile (הערה — לא טכני)

יש דף עסקי ב-Google שכתוב "קטי שגב ניהול חרדות". צריך לעדכן ידנית ב-business.google.com:
- שם עסק: "CureMindset — קטי שגב | אימון מנטאלי"
- קטגוריה: אימון אישי / ייעוץ רגשי
- תיאור: "אימון מנטאלי וחוסן רגשי לנוער, חיילים ומבוגרים. שיטת CURE."
- אתר: ketysegev.com
- טלפון: 054-3032349
- שעות: א-ה 9:00-19:00, ו 9:00-14:00

---

## כללים
- אל תשנה את העיצוב הכללי (Curable minimal style)
- אל תחזיר סקשנים שהוסרו ("מה עובר עלייך", סדנאות)
- אם אתה מוסיף קוד, שמור על הסגנון הקיים (Tailwind classes, RTL, Hebrew)
- בדוק כל שינוי לפני commit
- שמור על כל הקישורים החברתיים שכבר נוספו (Instagram, YouTube בפוטר)
- אל תשנה את קובץ CLAUDE_CODE_TASKS.md — זה מסמך התקשורת עם המנהל
