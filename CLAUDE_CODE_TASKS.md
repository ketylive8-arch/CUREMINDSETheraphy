# פרומפט ל-Claude Code — CureMindset

## מבוא
אתה עובד על ה-repo של CureMindset: https://github.com/ketylive8-arch/CUREMINDSETheraphy
האתר חי ב-ketysegev.com (Render backend + Vercel frontend).
המותג: קטי שגב, אימון מנטאלי לנוער, חיילים ומבוגרים. שיטת CURE: Clarity, Resilience, Rewire, Empowerment.
צבעי מותג: cream (#FAF8F4), beige (#E8E0D5), gold (#C9A96E), soft blue (#B8D4E3).

---

## משימות לפי עדיפות

### 1. טופס לכידת לידים בדף הנחיתה (CRITICAL)

כרגע יש רק קישורי `mailto:` שפותחים מייל במכשיר של הלקוח. זה לא קולט לידים — מי שלא שולח מייל, אבוד.

**מה לבנות:**
- טופס הרשמה אמיתי ב-section "תוכניות" וב-CTA הסופי
- שדות: שם מלא, טלפון, אימייל, נושא פנייה (dropdown: נוער/פרטי/ארגון/אחר)
- הטופס שולח POST ל-`/api/send-lead` (כבר קיים בשרת!)
- אחרי שליחה: הודעת "תודה, נחזור אלייך תוך 24 שעות" + כפתור וואטסאפ
- עיצוב: כרטיס לבן עם border gold, RTL, גודל נעים, אנימציית Reveal
- ולידציה: שם לפחות 2 תווים, טלפון ישראלי תקין, אימייל תקין

**בדוק:** שה-endpoint `/api/send-lead` מקבל את השדות הנכונים (קרא server/index.js שורות 477+).

---

### 2. חיבור כפתורי תשלום לכל המסלולים

כרגע רק `PAYMENT_LINKS.digital` מלא. השאר ריקים:
```js
const PAYMENT_LINKS = {
  digital: "https://pay.grow.link/NDcyNjY~...",
  youth: "",      // EMPTY
  recommended: "", // EMPTY
  premium: "",     // EMPTY
};
```

**מה לעשות:**
- כש-`PAYMENT_LINKS[plan.id]` ריק, הכפתור כבר נופל ל-WhatsApp fallback — זה נכון
- אבל תוודא שהטקסט ב-WhatsApp מזהה את המסלול הנכון: "אשמח להתחיל במסלול {plan.badge}"
- הוסף הודעת placeholder עדינה: "תשלום אונליין בקרוב — נא ליצור קשר להרשמה"

---

### 3. ניווט ו-UX

- וודא שכל הקישורים בתפריט מובילים ל-sectionים שקיימים (Hero, HowItWorks, Vision, About, CureTeens, Plans, Organizations, Testimonials, FinalCta)
- הסראת "מה עובר עלייך?" ו"סדנאות" מהתפריט — כבר בוצע, רק וודא
- בדוק שסקרול חלק (smooth scroll) עובד לכל anchor
- וודא ש-mobile menu נסגר אחרי לחיצה על קישור

---

### 4. SEO ו-Meta Tags

המטא-תגיות ב-index.html כבר טובות. תוסיף:
- `<meta name="google-site-verification" content="">` — placeholder לאימות Google Search Console
- Schema.org `LocalBusiness` או `ProfessionalService` ב-JSON-LD:
  ```json
  {
    "@type": "ProfessionalService",
    "name": "CureMindset — קטי שגב",
    "description": "אימון מנטאלי וחוסן רגשי לנוער ומבוגרים",
    "telephone": "+972543032349",
    "email": "ketyse@gmail.com",
    "url": "https://ketysegev.com",
    "areaServed": "חיפה והצפון, כל הארץ (אונליין)",
    "priceRange": "₪97-₪397"
  }
  ```
- עדכן את `og:image` לתמונה הכי טובה של קטי (kety-920.jpg כרגע — וודא שהוא קיים)

---

### 5. ביצועים ואבטחה

- וודא שכל התמונות טעונות עם `loading="lazy"` חוץ מ-hero
- הוסף `rel="noopener noreferrer"` לכל קישור חיצוני שנפתח ב-tab חדש
- וודא שאין console errors בדף
- בדוק שהאתר עובד נכון ב-mobile (viewport, touch targets מינימום 44px)

---

### 6. נגישות (Accessibility)

- הוסף `alt` לכל תמונה (רובן כבר יש, וודא)
- הוסף `aria-label` לכל כפתור אייקון
- וודא ניגודיות צבעים תקינה (WCAG AA)
- וודא ניווט מקלדת עובד (Tab, Enter)

---

### 7. תוכן שיווקי — עדכונים נדרשים

- בסקשן "תוכניות": וודא שהמחירים הם 97/197/397 ₪ (לא 340/750/1700/3500)
- בסקשן "תוכניות": וודא שהמלל מתאר מסלולים דיגיטליים (לא סדנאות)
- ב-CTA הסופי: וודא שהטקסט מפנה להרשמה/ניסיון חינם (72 שעות)
- וודא שאין שום אזכור של "סדנאות" או "מה עובר עלייך" בשום מקום בדף

---

### 8. חיבורים חברתיים (כבר בוצע — רק וודא)

- Instagram: https://instagram.com/ketysegev — בפוטר וב-JSON-LD
- YouTube: https://www.youtube.com/@ketynlplive — בפוטר וב-JSON-LD
- Linktree: https://linktr.ee/Ketysegev — ב-MEDIA_LINKS
- Calendly: https://calendly.com/ketysegev/meet-with-me — בכפתורי CTA
- WhatsApp: wa.me/972543032349 — בפוטר ובכפתורים

---

### 9. Google Business Profile (לא טכני — הערה לקטי)

יש דף עסקי ב-Google שכתוב "קטי שגב ניהול חרדות". צריך לעדכן:
- שם עסק: "CureMindset — קטי שגב | אימון מנטאלי"
- קטגוריה: אימון אישי / ייעוץ רגשי
- תיאור: "אימון מנטאלי וחוסן רגשי לנוער, חיילים ומבוגרים. שיטת CURE: Clarity, Resilience, Rewire, Empowerment."
- אתר: ketysegev.com
- טלפון: 054-3032349
- שעות: ימים א-ה 9:00-19:00, ו 9:00-14:00
- כתובת: חיפה (אם יש מרחב פיזי) או "שירות אונליין בלבד"

---

## כללים
- אל תשנה את העיצוב הכללי (Curable minimal style)
- אל תחזיר סקשנים שהוסרו ("מה עובר עלייך", סדנאות)
- אם אתה מוסיף קוד, שמור על הסגנון הקיים (Tailwind classes, RTL, Hebrew)
- בדוק כל שינוי לפני commit
- עדכן את CLAUDE.md אחרי שינויים משמעותיים
