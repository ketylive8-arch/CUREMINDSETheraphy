# DESIGN_TOKENS.md — CureMindset

**מקור:** צבעי המותג הקיימים של KETY SEGEV / CureMindset (index.html, styles.css, עמודי ה-SEO).
**כלל:** אין להמציא פלטה חדשה ואין להעתיק את השפה החזותית של Curable/BetterHelp. משתמשים ב-CSS variables, לא צבעים ישירים בקומפוננטות.

## צבעים
```
color.brand.primary    #C9A96E   /* זהב — CTA, כפתורים ראשיים */
color.brand.primaryAlt #C2974A   /* זהב חי (theme-color, קישורים) */
color.brand.deep       #8A6A2F   /* זהב עמוק — כותרות, קישורים */
color.brand.soft       #EFE3CC   /* זהב רך — גבולות, רקעים משניים */

color.surface.page     #FAF8F4   /* קרם — רקע ראשי */
color.surface.pageAlt  #FBF7EF   /* קרם בהיר (עמודי מידע) */
color.surface.card     #FFFFFF   /* לבן — כרטיסים */
color.surface.beige    #E8E0D5   /* בז' — הפרדות */

color.text.primary     #2D2A26   /* ink — טקסט ראשי */
color.text.secondary   #6B6560   /* ink-500 — טקסט משני */
color.text.muted       #9B958F   /* ink-300 — placeholders, hints */

color.accent.softBlue  #B8D4E3   /* תכלת — אלמנטים רגשיים, אייקונים */

color.state.success    #16A34A
color.state.warning    #D97706
color.state.error      #DC2626
color.state.info       #B8D4E3
color.focus.ring       #C2974A   /* טבעת פוקוס — outline 3px */
```
> אדום (`error`) לשגיאת מערכת בלבד — **לעולם לא** לסימון "כישלון" של המשתמשת (כלל 18.11).

## מרווחים (spacing scale, 4px base)
```
spacing.1 4px · spacing.2 8px · spacing.3 12px · spacing.4 16px
spacing.5 20px · spacing.6 24px · spacing.7 32px · spacing.8 48px
```

## פינות (radius)
```
radius.sm 8px · radius.md 12px · radius.lg 18px · radius.pill 999px
```

## צללים (shadow)
```
shadow.card     0 1px 3px rgba(45,42,38,.06), 0 8px 24px -12px rgba(45,42,38,.10)
shadow.elevated 0 20px 48px -20px rgba(194,151,74,.35)
```

## תנועה (motion) — עדינה בלבד
```
motion.fast      150ms ease
motion.standard  280ms cubic-bezier(.4,0,.2,1)
motion.reduced   0ms   /* prefers-reduced-motion: reduce */
```

## טיפוגרפיה (עברית RTL)
```
type.display  Rubik 800  clamp(27px,6vw,42px)  /* Hero */
type.heading  Rubik 700  22–24px               /* כותרות סקשן */
type.body     Assistant 400/500  16–17px       /* גוף */
type.caption  Assistant 500  13px              /* הערות, hints */
type.button   Rubik 700  15–16px               /* כפתורים */
```
- פונטים: **Rubik** (כותרות) + **Assistant** (גוף) — כפי שנטענים ב-index.html ובעמודי ה-SEO.
- גוף טקסט במובייל: line-height ≥ 1.7, פסקאות קצרות.

## Tap targets ונגישות
- שטח נגיעה מינימלי 44×44px.
- `focus-visible`: outline 3px `color.focus.ring`, offset 2px.
- ניגודיות טקסט ≥ 4.5:1 (WCAG AA).

## סטטוס יישום
🟢 הצבעים והפונטים כבר בשימוש חי (styles.css + עמודי SEO). 🟡 לרכז כ-tokens מרכזיים מתועדים (קובץ זה) לפני בניית מסכי ה-Care.
