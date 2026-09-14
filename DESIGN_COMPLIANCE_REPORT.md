# DESIGN_COMPLIANCE_REPORT.md

עודכן: 2026-09-14. עמידה מול §15–16 (Design System, נגישות). טוקנים: `DESIGN_TOKENS.md`.

## מיתוג (חובה — נשמר)
- ✅ צבעי KETY SEGEV: זהב #C9A96E/#C2974A, קרם #FAF8F4, ink #2D2A26 — לא הומצאה פלטה.
- ✅ RTL מלא · עברית ברירת מחדל · לוגו ותמונות נשמרו.

## Design Tokens
| דרישה | סטטוס |
|---|---|
| צבעים/surfaces/text/states/focus/spacing/radius/shadow/typography/motion | 🟡 מתועדים ב-DESIGN_TOKENS.md; חלקם כ-Tailwind מהודר + patch.css |
| אין צבעים ישירים בקומפוננטות | 🟡 חלקי — יש inline; טוקנים לא נאכפים בכל מקום |

## רכיבי Design System (§15)
| רכיב | סטטוס |
|---|---|
| Button, EmptyState | ✅ כרכיבים |
| Card, Input, Select, Progress, Modal, Toast, ErrorState, LoadingState | 🟡 קיימים inline — לא כספריית רכיבים מרוכזת |

## נגישות WCAG 2.2 AA (§16)
| היבט | סטטוס |
|---|---|
| RTL, focus-visible, aria-label, alt, reduced-motion | ✅ קיים ברוב המסכים |
| aria-live לתשובות בוט | 🟡 לאמת |
| contrast מלא, tap targets, keyboard על כל מסך | 🟡 audit מלא MISSING |
| screen states (loading/empty/error/offline/locked/completed/safety/handoff) לכל route | 🟡 חלקי |

## הפרדה עיצובית (Public / Care / Ops)
- 🟡 Public ו-Care מובחנים; Care-Ops (RBAC) MISSING.

## אודיו (§15)
- ❌ נגן עם play/pause/speed/transcript/resume — MISSING (placeholder בלבד).

## סטטוס כולל: PARTIAL — מיתוג ו-RTL COMPLETE; ספריית רכיבים, audit נגישות מלא ונגן אודיו נדרשים בשלב 9.
