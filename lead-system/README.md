# Segev MKG · Lead System

מערכת לידים עצמאית (React + PHP + SQLite) עבור Segev MKG. נפרדת מאתר CureMindset.

## הרצה מקומית
```bash
php lead-system/seed/seed.php                       # יוצר DB + נתונים ראשוניים
php -S 127.0.0.1:8100 lead-system/api/router.php    # מריץ את המערכת
# דפדפן: http://127.0.0.1:8100
```

כניסת מנהלת (ברירת מחדל — לשנות סיסמה מיד):
- אימייל: `segevmkg@gmail.com`
- סיסמה: `Segev2026!`

## הגדרות (`.env` בתוך `lead-system/`, לא נשמר ב-git)
```
APP_SECRET=<מחרוזת אקראית>
DB_DSN=sqlite:/абс/path/lead-system/data/leads.db   # או mysql:host=...;dbname=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=segevmkg@gmail.com
SMTP_PASS=<Google App Password>
DAILY_SEND_CAP=30
```
ללא SMTP — המערכת לא שולחת, רק מכינה ומראה. ראו `SPEC.md` לפרטים מלאים.

## מבנה
```
lead-system/
├── api/      PHP: router, auth, leads, db, helpers, config
├── public/   React SPA (index.html, app.js, styles.css, vendor/)
├── seed/     נתוני התחלה אמיתיים + סקריפט seed
└── data/     קובץ ה-SQLite (נוצר אוטומטית)
```
