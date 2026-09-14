# IMPLEMENTATION_STATUS.md — טבלת אמת חיה

עודכן: 2026-09-14 · מקור אמת יחיד לסטטוס הביצוע. מתעדכן אחרי כל שלב.

**סטטוסים:** COMPLETE · PARTIAL · MISSING · MOCK · BLOCKED · REQUIRES_APPROVAL · REQUIRES_LEGAL_REVIEW · REQUIRES_PROFESSIONAL_REVIEW

**מקרא עמודות:** Backend / Frontend / E2E דפדפן / בדיקות — ✅ קיים · 🟡 חלקי · ❌ אין

---

## שלב 2 — Auth, Consent, Intake, Safety

| דרישה | קבצים | Backend | Frontend | E2E | בדיקות | סטטוס |
|---|---|---|---|---|---|---|
| הרשמה/התחברות/איפוס/logout | server/auth.js, index.js | ✅ | ✅ | 🟡 | ✅ | COMPLETE |
| OTP + resend + rate limit | server/otp.js, index.js | ✅ | ✅ | 🟡 | 🟡 | PARTIAL — OTP תלוי Twilio (REQUIRES_APPROVAL) |
| שגיאה שלא חושפת אם מייל קיים | server/auth.js | ✅ | ✅ | ✅ | ✅ | COMPLETE |
| **ConsentRecord — 9 סוגים גרנולריים** | server/db.js, index.js | ✅ | ❌ | ❌ | ✅ | PARTIAL — Backend+API+בדיקות COMPLETE; **חסר UI מסך הסכמה** |
| **ייצוא נתוני משתמשת** | db.js `/api/account/export` | ✅ | ❌ | ❌ | ✅ | PARTIAL — API COMPLETE; חסר כפתור UI |
| **מחיקת חשבון** | db.js `/api/account/delete` | ✅ | ❌ | ❌ | ✅ | PARTIAL — API COMPLETE; חסר UI |
| Intake (audience/נושא/מטרה/זמן/פורמט/1–10) | memberArea.js | 🟡 | ✅ | 🟡 | ❌ | PARTIAL — קיים כ-IntakeChat; חסר "צורך בליווי אנושי" + explain-per-question |
| **Safety Check — מסך עצמאי** | server/safety.js, `/api/safety/check` | ✅ | ❌ | ❌ | ✅ | PARTIAL — לוגיקה+API+בדיקות COMPLETE; **חסר מסך ייעודי בזרימת intake** |
| Safety בצ׳אט (short-circuit + חירום) | server/safety.js, index.js | ✅ | ✅ | ✅ | ✅ | COMPLETE |
| SafetyFlag לפי policy + AuditLog | index.js (audit), db.js | ✅ | ❌ | — | 🟡 | PARTIAL — audit נכתב; טבלת SafetyFlag ייעודית MISSING |

## שלב 3 — Care journey, dashboard, content, progress

| דרישה | קבצים | Backend | Frontend | E2E | בדיקות | סטטוס |
|---|---|---|---|---|---|---|
| /app/today (≤3 המלצות, reason, SOS) | memberArea.js | 🟡 | ✅ | 🟡 | ❌ | PARTIAL |
| /app/track, /tools, /lesson, /check-in, /profile | memberArea.js | 🟡 | ✅ | 🟡 | ❌ | PARTIAL — קיימים כ-stages, לא deep-link routes |
| /app/preferences, /support, /appointments | — | ❌ | ❌ | ❌ | ❌ | MISSING |
| **ContentSource + ContentModule (טבלאות)** | server/db.js, contentSeed.js | ✅ | ❌ | 🟡 | ✅ | PARTIAL — Backend+API+בדיקות COMPLETE; חסר UI שיעור/קטלוג |
| **seed תוכן אמיתי (10 נושאים × 2)** | server/contentSeed.js | ✅ | ❌ | — | ✅ | PARTIAL — 20 יחידות מקוריות; needs_content_review=1 (קטי מעשירה/מאשרת + אודיו) |
| **API קטלוג** GET /api/content/modules[/:slug] + citations | server/index.js | ✅ | ❌ | 🟡 | ✅ | PARTIAL — API COMPLETE; חסר חיבור UI |
| progress + resume מהנקודה האחרונה | protocol_progress, index.js | ✅ | ✅ | 🟡 | ❌ | PARTIAL |

## שלב 4 — AI, sources, citations

| דרישה | קבצים | Backend | Frontend | E2E | בדיקות | סטטוס |
|---|---|---|---|---|---|---|
| AI server-side + RAG ממקורות מאושרים | server/openai.js | ✅ | ✅ | 🟡 | 🟡 | PARTIAL — OpenAI REQUIRES_APPROVAL (מפתח); נפילה למנוע מקומי עובדת |
| מבנה תשובה (שיקוף→כלי→פעולה→שאלה→קישור) | server/openai.js (prompt) | ✅ | 🟡 | — | ❌ | PARTIAL |
| no-source fallback | server/openai.js | 🟡 | 🟡 | — | ❌ | PARTIAL |
| citation גלוי בצ׳אט | server/chatConfig.js, index.js | ✅ | ❌ | 🟡 | ✅ | PARTIAL — citation ב-API response; חסר רינדור UI |
| quick replies / "לא מתאים לי" / "אני צריכה אדם" | server/chatConfig.js, `/api/chat/config` | ✅ | ❌ | 🟡 | ✅ | PARTIAL — API COMPLETE (5 starters+2 controls); חסר UI |
| no-source fallback (לא ממציאים מקור) | server/chatConfig.js citationFor | ✅ | 🟡 | — | ✅ | COMPLETE (backend) — סף score, null כשאין מקור |
| delete conversation / disable memory | consent + `/api/account/delete` | 🟡 | ❌ | — | 🟡 | PARTIAL — consent+מחיקה קיימים; פעולת UI MISSING |
| בדיקות prompt-injection / cross-user / no-source | test/chat.test.js | ✅ | — | — | ✅ | COMPLETE — 3 בדיקות עוברות |

## שלב 5–8 — personalization, rewards, notifications, entitlements, care-ops, נוער

| דרישה | Backend | Frontend | בדיקות | סטטוס |
|---|---|---|---|---|
| מנוע המלצות מבוסס-חוקים + reason | 🟡 | ✅ | ❌ | PARTIAL |
| RecommendationLog (opened/completed) | 🟡 | ❌ | ❌ | PARTIAL |
| RewardSystem (ללא leaderboard/shame) | ❌ | ❌ | ❌ | MISSING |
| NotificationPreferences (opt-in לכל ערוץ, quiet hours) | 🟡 | ❌ | ❌ | PARTIAL — notify.js קיים; העדפות MISSING; SMS/WhatsApp BLOCKED (provider) |
| Basic/Middle/Premium → entitlements + feature flags | 🟡 | 🟡 | ❌ | PARTIAL — programs/trial קיימים; entitlement checks MISSING |
| Human Care Ops (RBAC, HumanSupportRequest, Appointment, CareTask) | 🟡 | 🟡 | ❌ | PARTIAL — admin קיים; ישויות care-ops MISSING; ProfessionalNote REQUIRES_PROFESSIONAL_REVIEW |
| נוער + parental consent + DataSharePermission | 🟡 | 🟡 | ❌ | PARTIAL — youth prompt+consent type קיימים; linked-parent MISSING |

## שלב 9–10 — Design System, accessibility, SEO, claims

| דרישה | סטטוס | הערה |
|---|---|---|
| Design Tokens מרכזיים | PARTIAL | DESIGN_TOKENS.md קיים; רכיבים inline (ראו SPEC_COVERAGE §I) |
| נגישות WCAG 2.2 AA | PARTIAL | RTL/focus/aria קיימים; audit מלא MISSING |
| screen states (loading/empty/error/offline/locked/completed/safety/handoff) | PARTIAL | חלקי לכל route |
| SEO routes (title/desc/canonical/OG/H1/JSON-LD) | ✅ | עמודי SEO + workshop COMPLETE |
| **CONTENT_CLAIMS_REVIEW** (ריפוי/מחקר/24-7) | REQUIRES_LEGAL_REVIEW | ראו CONTENT_CLAIMS_REVIEW.md |

---

## הושלם בפועל עד כה (COMPLETE, מאומת ב-24 בדיקות עוברות)
- שכבת בטיחות AI (server/safety.js) — short-circuit + מספרי חירום, בצ׳אט וב-safety-check.
- ConsentRecord גרנולרי (9 סוגים) + API + היסטוריה.
- ייצוא + מחיקת חשבון (זכות פרטיות) + API.
- Auth: הרשמה/התחברות/session + שגיאה גנרית שלא חושפת מייל.
- תשתית בדיקות (node:test, בלי תלויות) + README + .env.example + DECISIONS.

## תלויות חיצוניות שחוסמות production (REQUIRES_*)
| תלות | חוסם | מה נדרש |
|---|---|---|
| OpenAI API key | AI מלא (יש נפילה למנוע מקומי) | `OPENAI_API_KEY` ב-.env |
| Twilio | OTP ב-SMS | `TWILIO_*` |
| Gmail/Resend | אימות מייל אמיתי | `GMAIL_APP_PASSWORD` או `RESEND_API_KEY` |
| Grow | תשלום (לא ב-MVP) | `GROW_*` |
| Make/n8n | לידים ל-CRM | `LEAD_WEBHOOK_URL` |
| ליווי מקצועי מורשה | ProfessionalNote/Professional Care | REQUIRES_PROFESSIONAL_REVIEW |
| בדיקה משפטית | claims רפואיים | REQUIRES_LEGAL_REVIEW |

## סדר ההמשך (הבא בתור)
1. **ContentSource + ContentModule + seed 10 נושאים** (שלב 3) — הבסיס ל-citations והמלצות.
2. חיבור UI: מסך Consent + Safety Check + preferences (שלב 2 → COMPLETE).
3. quick-replies + "לא מתאים לי" + citation גלוי (שלב 4).
4. entitlements Basic/Middle/Premium (שלב 6).
