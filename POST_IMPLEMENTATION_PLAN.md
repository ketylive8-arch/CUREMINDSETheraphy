# POST_IMPLEMENTATION_PLAN.md

עודכן: 2026-09-14. תוכנית ביצוע לפי הסדר המחייב (10 שלבים). מעקב חי: `IMPLEMENTATION_STATUS.md`.

## עקרונות
- לשפץ על ה-stack הקיים, לא לבנות מחדש (DECISIONS.md §0).
- כל שלב: קוד עובד → בדיקות עוברות → עדכון IMPLEMENTATION_STATUS → commit.
- אין COMPLETE ל-MOCK. תלות חיצונית → adapter + UI + סימון REQUIRES_*.

## סדר ביצוע וסטטוס
| שלב | תוכן | סטטוס |
|---|---|---|
| 1 | Audit + תוכנית + DECISIONS + .env.example | ✅ הושלם |
| 2 | Auth + Consent(9) + Intake + Safety Check | 🟡 Backend+API+בדיקות ✅ · UI חסר |
| 3 | Care journey + ContentModule + seed + progress | ⏭️ הבא — ContentSource/Module + seed 10 נושאים |
| 4 | AI + citations + no-source + quick-replies | ⏳ |
| 5 | personalization + rewards + notifications | ⏳ |
| 6 | Basic/Middle/Premium + entitlements | ⏳ |
| 7 | Human Care Ops + RBAC + AuditLog | ⏳ |
| 8 | נוער + parental consent + DataSharePermission | ⏳ |
| 9 | Design System + a11y + audio + screen states | ⏳ |
| 10 | SEO + claims + performance + בדיקות מלאות | 🟡 SEO ✅ · claims REQUIRES_LEGAL_REVIEW |

## הבא בתור (שלב 3, מיידי)
1. טבלאות `content_sources` + `content_modules` עם השדות מהאפיון.
2. seed תוכן מקורי בעברית ל-10 נושאים (2–3 יחידות לנושא), עם sourceIds ו-status.
3. API `/api/content/modules` + `/api/content/modules/:slug` עם סינון audience/sensitivity + entitlement.
4. חיבור citations בצ׳אט למודולים; בדיקות.
