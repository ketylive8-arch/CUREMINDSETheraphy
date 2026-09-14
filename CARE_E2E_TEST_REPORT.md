# CARE_E2E_TEST_REPORT.md

עודכן: 2026-09-14. תוצאות בדיקות אוטומטיות. הרצה: `npm test`.

## סיכום: 24/24 עוברות · 0 נכשלות · 0 תלויות חיצוניות (node:test מובנה)

| קובץ | סוג | בדיקות | מכסה |
|---|---|---|---|
| test/safety.test.js | unit | 4 | זיהוי מצוקה, אפס false-positive, הודעת חירום, גרסת נוער |
| test/auth.test.js | unit + DB | 6 | hashing, ולידציית הרשמה, התחברות גנרית (לא חושפת מייל), session |
| test/integration.test.js | E2E API (שרת אמיתי) | 5 | גישה לא מורשית 400, הרשמה/כפילות 409, התחברות 401, בטיחות AI, צ׳ק-אין רגיל |
| test/consent.test.js | E2E API (שרת אמיתי) | 9 | 9 סוגי consent, grant/revoke, safety-check, export, delete+confirm |

## מיפוי לבדיקות החובה מהאפיון (§18)
| בדיקה נדרשת | סטטוס |
|---|---|
| unit tests (validation, safety) | ✅ |
| integration signup/login | ✅ |
| unauthorized access | ✅ |
| safety (AI short-circuit) | ✅ |
| consent / delete / export | ✅ |
| Browser E2E (Playwright): onboarding/dashboard/lesson/check-in/reward/AI/handoff | ❌ MISSING — ידרוש Playwright flows |
| prompt injection / cross-user leakage / no-source | ❌ MISSING |
| RTL/mobile/keyboard/contrast/reduced-motion | 🟡 ידני חלקי |

## הבא: להוסיף Browser E2E (Playwright) ובדיקות AI-safety (injection/leakage) בשלב 4.
