/* CureMindset — Workshops page ("מפת הדרכים הפנימית").
   A self-contained, visually distinct section (own workshops.css world).
   Full content for all 8 workshops, written as invitations. Exposes
   window.WorkshopsSection. Signup posts to /api/workshop-signup (same CRM). */
(function () {
  "use strict";
  const { useState, useEffect } = React;

  const WA = "972543032349";
  const BOOKING = "https://calendly.com/ketysegev/meet-with-me";

  /* small inline SVG icon set (the shared icons.js lacks compass/anchor) */
  function Svg({ d, size = 15, fill }) {
    return React.createElement(
      "svg",
      { width: size, height: size, viewBox: "0 0 24 24", fill: fill || "none",
        stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" },
      Array.isArray(d) ? d.map((p, i) => React.createElement("path", { key: i, d: p })) : React.createElement("path", { d })
    );
  }
  const Check = () => <Svg d="M20 6 9 17l-5-5" />;
  const Compass = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
  const RoseSVG = () => (
    <svg className="wk__rose" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="100" cy="100" r="92" />
      <circle cx="100" cy="100" r="66" />
      <circle cx="100" cy="100" r="10" />
      <path d="M100 8 L112 100 L100 192 L88 100 Z" fill="currentColor" stroke="none" opacity="0.6" />
      <path d="M8 100 L100 112 L192 100 L100 88 Z" fill="currentColor" stroke="none" opacity="0.35" />
      <path d="M35 35 L100 100 L165 165 M165 35 L100 100 L35 165" />
    </svg>
  );

  /* ---- category theming (echoes the infographic station colors) ---- */
  const CATS = {
    org:    { label: "ארגונים · B2B",     accent: "#4f7a99", soft: "rgba(79,122,153,0.12)",  line: "rgba(79,122,153,0.32)" },
    youth:  { label: "חינוך · נוער",       accent: "#6f9268", soft: "rgba(111,146,104,0.14)", line: "rgba(111,146,104,0.34)" },
    depth:  { label: "סדנת עומק",          accent: "#c2974a", soft: "rgba(194,151,74,0.13)",  line: "rgba(194,151,74,0.34)" },
    module: { label: "מודול ממוקד",        accent: "#bd7d5b", soft: "rgba(189,125,91,0.14)",  line: "rgba(189,125,91,0.34)" },
  };

  /* ---- full workshop content (from Kety's document + invitation copy) ---- */
  const WORKSHOPS = [
    {
      cat: "org", title: "המצפן הפנימי", sub: "תוכנית חוסן רגשי לעובדים",
      tagline: "כשכל אחד בצוות מוצא את הצפון הפנימי שלו — הארגון כולו נושם אחרת.",
      invite: "הזמנה לצוות שלך לשלושה מפגשים אינטימיים שמשנים את הדרך שבה אנשים מתמודדים עם לחץ. רוב תוכניות הרווחה עוסקות בגוף — כושר, תזונה, ארגונומיה. חשוב, אבל מפספס את השורש: עובד שנושא עומס רגשי פנימי לא־פתור, שום מדיטציה או חדר כושר לא יפתרו אותו. \"המצפן הפנימי\" עובד ברמת התת־מודע ומחזיר לאנשים שקט, שליטה ונוכחות — לא עוד יום גיבוש שנשכח למחרת, אלא שינוי שנשאר.",
      stepsLabel: "שלבי התוכנית",
      steps: [
        ["פיצוח קוד העוצמה", "זיהוי ושחרור אמונות מגבילות מהתת־מודע (\"אני לא מספיק\", \"לא יאהבו אותי\"), ובניית חוסן מתוך ערך עצמי — לא מתוך אישור חיצוני."],
        ["תמונה עובדת בשביל החברה", "ניהול רגשות והחלטות תחת לחץ, שיח פנימי מיטיב לביצועים, ופרקטיקות עוגן יומיומיות שנשמרות לאורך זמן."],
        ["העתיד שלי מתחיל עכשיו", "חוסן עתידי, עבודה עם חלומות וציפיות, ועיגון התוצאות בתת־מודע כך שהשינוי מחזיק בשגרה וברגעי אמת."],
      ],
      results: ["ויסות רגשי גבוה תחת לחץ", "ירידה בשחיקה ובהיעדרויות", "כלים פרקטיים לשימוש יומיומי", "שינוי ברמת הזהות — לא הרגעה זמנית"],
      meta: ["3 מפגשים", "עד 8 משתתפים", "קבוצה אינטימית"], audience: "ארגונים · צוותים · מחלקות",
    },
    {
      cat: "depth", title: "שינוי רמת זהות", sub: "סדנת עומק · 10 שלבים",
      tagline: "אתה לא צריך עוד כוח רצון — אתה צריך זהות חדשה שממנה הכל זורם מעצמו.",
      invite: "רוב השינויים שאנחנו מנסים לעשות נכשלים, כי הם פועלים ברמת ההתנהגות. אבל התת־מודע לא משנה התנהגות — הוא משנה זהות. אם בפנים כתוב \"אני לא מספיק\", כל שינוי התנהגותי יקרוס ברגע הלחץ הראשון. הסדנה הזו, המבוססת על מודל הרמות הלוגיות של Dilts, לוקחת אותך שלב אחר שלב אל השכבה שממנה נובע הכל — ובונה מחדש את \"מי אני\". הזמנה לשינוי שלא צריך להחזיק בכוח, כי הוא פשוט מי שאתה.",
      stepsLabel: "10 השלבים",
      steps: [
        ["מיפוי רמת הזהות הנוכחית", "איפה אני ממוקם ברמות הלוגיות?"],
        ["זיהוי האמונות המגבילות", "מהם הקולות הפנימיים שעוצרים אותי?"],
        ["חקירת המקור", "מאיפה הגיעו האמונות? (עובדים ברמת התת־מודע, בלי לחזור לטראומה)"],
        ["פירוק הקשר הרגשי", "ניתוק הטעינה הרגשית מהאמונה המגבילה."],
        ["בניית זהות חדשה", "מי אני רוצה להיות? מהם הערכים של הזהות החדשה?"],
        ["עיגון בתת־מודע", "הטמעת הזהות החדשה ברמה העצבית."],
        ["בדיקת התאמה לרמות הלוגיות", "האם הזהות החדשה תואמת סביבה, התנהגות ויכולות?"],
        ["Future Pacing", "הקרנת הזהות החדשה אל העתיד."],
        ["עיגון תוצאות", "חיזוק השינוי כך שיחזיק מעמד במציאות."],
        ["תוכנית פעולה יומיומית", "כלים פרקטיים לשמירת השינוי בשגרה."],
      ],
      results: ["שינוי תפיסתי עמוק ב\"מי אני\"", "שחרור אמונות שפעלו שנים", "חוסן שנשמר לאורך זמן", "התאמה בין הזהות הפנימית למציאות"],
      meta: ["10 שלבים", "סדנה מלאה או קורס מודולרי"], audience: "מבוגרים · נוער · אנשי מקצוע",
    },
    {
      cat: "depth", title: "Future Pacing רגשי־גופני", sub: "סדנה ממוקדת · 8 שלבים",
      tagline: "לחזור מהעתיד כשהתשובה כבר נמצאת בגוף.",
      invite: "Future Pacing הוא אחד הכלים החזקים בעולם ה־NLP: היכולת \"להקרין\" את התוצאה הרצויה אל העתיד ולעגן אותה בתת־מודע — כך שכשמגיע הרגע, הגוף והנפש כבר יודעים מה לעשות. הגרסה של CureMindset מוסיפה שכבה גופנית־רגשית: קודם מנקים את העומס המצטבר, משחררים חסימות, ואז מעגנים את התוצאה עמוק בגוף. מושלם לפני ראיון, מבחן, מצגת או כל רגע שבו אתה רוצה להגיע מוכן — לא רק בראש, גם בבטן.",
      stepsLabel: "8 השלבים",
      steps: [
        ["זיהוי המטרה", "מהי התוצאה שרוצים להשיג?"],
        ["ניקוי עומס רגשי מצטבר", "שחרור ה\"פסולת\" הרגשית שעלולה להפריע."],
        ["בניית תמונת העתיד", "יצירת ייצוג חושי עשיר — ראייה, שמיעה, תחושה."],
        ["עיגון גופני", "חיבור התמונה לתחושה גופנית ספציפית."],
        ["הכנסת משתנים", "מה יקרה כשיהיה לחץ? כשמשהו ישתבש?"],
        ["חזרה מנטלית מדורגת", "תרגול התסריט ברמות קושי עולות."],
        ["עיגון סופי בתת־מודע", "הטמעת התוצאה כ\"זיכרון עתידי\"."],
        ["בדיקת שטח", "איך זה מרגיש עכשיו? מה השתנה בגוף?"],
      ],
      results: ["ניהול החלטות תחת לחץ בביטחון", "ניקוי עומס רגשי מצטבר", "עיגון תוצאות בגוף — לא רק בראש", "ירידה משמעותית בחרדת ביצועים"],
      meta: ["8 שלבים", "סדנה ממוקדת"], audience: "עובדים · מנהלים · נוער",
    },
    {
      cat: "youth", title: "קבוצות חוסן ודימוי עצמי לנוער", sub: "בתי ספר ורשתות חינוך",
      tagline: "הדימוי העצמי שנבנה עכשיו — נשאר איתם לכל החיים.",
      invite: "גיל ההתבגרות הוא החלון הקריטי ביותר לבניית חוסן מנטלי. נער או נערה עם דימוי עצמי יציב לא רק מתפקדים טוב יותר — הם עמידים יותר ללחץ חברתי, לחרדת בחינות ולדחיינות. שלושה מפגשים אינטימיים, בשפה של בני נוער ובאווירה בטוחה, שנותנים להם ערכת כלים אמיתית לחיים — ומונעים נשירה ושחיקה עוד לפני שהן מתחילות.",
      stepsLabel: "מבנה התוכנית",
      steps: [
        ["מפגש 1 · חוסן וויסות רגשי", "היכרות עם \"המצפן הפנימי\", זיהוי הקולות הפנימיים, התמודדות עם לחץ חברתי, וכלים ראשוניים לוויסות רגשי."],
        ["מפגש 2 · דימוי עצמי וביטחון", "העלאת הביטחון, פירוק דחיינות, והתמודדות עם \"מחסלי הביטחון\"."],
        ["מפגש 3 · כלים לחיים", "עיגון הכלים בשגרה, ו־Future Pacing מותאם לנוער (מבחנים, שיחות קשות, מעברי שלב). יוצאים עם ערכת כלים מעשית."],
      ],
      results: ["עלייה בביטחון ובדימוי העצמי", "ירידה בדחיינות ובחרדת בחינות", "כלים ללחץ חברתי", "מניעת נשירה סמויה ושחיקה"],
      meta: ["3 מפגשים", "עד 8 תלמידים", "קבוצה אינטימית"], audience: "בתי ספר · רשתות חינוך · תנועות נוער",
      note: "מודל מימון: הסדנה ממומנת על ידי ההורים בעלות סמלית ומסובסדת של 350 ₪ לתלמיד עבור כל התהליך — ללא עלות לבית הספר או לרשת. ניתן להתאים גם לתקציבי רווחה חינוכית או מניעת נשירה.",
    },
    {
      cat: "module", title: "מודול חרדה", sub: "כלים להתמודדות יומיומית",
      tagline: "חרדה היא לא מחלה — היא תת־מודע שנתקע במצב הישרדות.",
      invite: "החרדה לא באה כדי להעניש אותך — היא מערכת אזעקה רגישה מדי שנתקעה בדריכות. המודול הזה לא מנסה \"להסיח את הדעת\", אלא עובד על השורש: מזהים את הטריגרים ברמת התת־מודע, משחררים את הטעינה הרגשית, ובונים מנגנוני ויסות פנימיים שזמינים בכל רגע. יוצאים עם היכולת להרגיע את עצמך — לבד, בזמן אמת.",
      stepsLabel: "מה עוברים במודול",
      steps: [
        ["הבנת מנגנון החרדה", "מה קורה בגוף ובתת־מודע."],
        ["זיהוי וניתוק טריגרים רגשיים", ""],
        ["כלי עיגון להרגעה מיידית", ""],
        ["Future Pacing למצבי חרדה ספציפיים", ""],
        ["בניית חוסן מנטלי", "כבסיס למניעת הישנות."],
      ],
      results: ["הרגעה עצמית בזמן אמת", "פחות הצפות", "שליטה חוזרת"],
      meta: ["סדנה ממוקדת / מודול"], audience: "מבוגרים · נוער · עובדים",
    },
    {
      cat: "module", title: "מודול העצמה וביטחון", sub: "בניית ביטחון עצמי מהשורש",
      tagline: "ביטחון אמיתי לא נבנה מאפירמציות — אלא משחרור מה שחוסם אותו.",
      invite: "כולם אומרים לך \"תאמין בעצמך\". אבל ביטחון אמיתי לא נולד ממשפטים חיוביים שאתה לא ממש מאמין בהם — הוא נולד כשמפרקים את האמונות המגבילות שמתחת, ובונים זהות חזקה ויציבה מהשורש. המודול הזה מחליף את הקול הפנימי שמחליש ב\"שופר פנימי\" שמחזק אותך דווקא ברגעים שבהם הכי קשה.",
      stepsLabel: "מה עוברים במודול",
      steps: [
        ["7 \"מחסלי ביטחון\"", "זיהוי ופירוק."],
        ["עבודת זהות", "מי אני כשאני משוחרר מאישור חיצוני?"],
        ["עיגון רגשי למצבי ביטחון", ""],
        ["Future Pacing למצבים מאתגרים", "ראיונות, הצגות, שיחות קשות."],
        ["בניית \"שופר פנימי\"", "שמחזק במקום להחליש."],
      ],
      results: ["נוכחות ועמידה מול קהל", "לומר את דעתך בלי לקרוס", "ביטחון שמחזיק ברגע אמת"],
      meta: ["סדנה ממוקדת / מודול"], audience: "נשים · נוער · מנהלים · יזמים",
    },
    {
      cat: "module", title: "מודול עיגון רגשי", sub: "Anchoring",
      tagline: "כפתור פנימי שמדליק רוגע, ביטחון או מיקוד — בדיוק כשצריך.",
      invite: "עיגון (Anchoring) הוא אחד הכלים החזקים ב־NLP: יצירת חיבור בין גירוי חיצוני קטן לבין מצב רגשי רצוי — כך שאפשר \"להדליק\" את המצב הזה בכל רגע נתון. במודול הזה בונים עוגנים חיוביים, מפרקים עוגנים שליליים, ולומדים להשתמש בהם בשגרה. כמו שלט פנימי למצבי הרוח שלך.",
      stepsLabel: "מה עוברים במודול",
      steps: [
        ["מבנה העוגן", "איך המוח יוצר חיבורים רגשיים."],
        ["בניית עוגנים חיוביים", "ביטחון, רוגע, מיקוד."],
        ["פירוק עוגנים שליליים", "טריגרים שמפעילים חרדה או דחיינות."],
        ["עוגנים מורכבים", "דריכות + רוגע, מוטיבציה + סבלנות."],
        ["יישום יומיומי", "כיצד להשתמש בעוגנים בשגרה."],
      ],
      results: ["גישה מהירה לרוגע ולמיקוד", "פחות שליטה של טריגרים", "יותר שליטה שלך"],
      meta: ["מודול מעשי"], audience: "כלל המשתתפים",
    },
    {
      cat: "module", title: "מודול טראומה", sub: "עיבוד ושחרור",
      tagline: "לא צריך לחיות מחדש את הכאב כדי להשתחרר ממנו.",
      invite: "טראומה לא חייבת להיות אירוע דרמטי אחד. לעיתים היא הצטברות שקטה של חוויות קטנות שמעולם לא עובדו — דחייה, ביקורת, חוסר יציבות. המודול פועל ברמת התת־מודע כדי לעבד ולשחרר את הטעינה הרגשית — בלי לחזור ולחיות מחדש את החוויה הכואבת. עבודה עדינה, בטוחה, בקצב שלך.",
      stepsLabel: "מה עוברים במודול",
      steps: [
        ["הבנת מנגנון הטראומה בתת־מודע", ""],
        ["זיהוי טראומות \"שקטות\"", "לא רק אירועי קיצון."],
        ["טכניקות עיבוד ושחרור", "ברמת התת־מודע."],
        ["עבודה עם עובדים טיפוליים", "מניעת טראומה משנית ושחיקה."],
        ["בניית חוסן פוסט־טראומטי", ""],
      ],
      results: ["הקלה אמיתית", "פחות עומס נישא", "חוסן פוסט־טראומטי"],
      meta: ["עבודה אישית / קבוצתית סגורה"], audience: "מבוגרים · נוער · עובדים טיפוליים",
    },
  ];

  function waLink(title) {
    const txt = `היי קטי! אשמח לפרטים על הסדנה "${title}" 🌿`;
    return `https://wa.me/${WA}?text=${encodeURIComponent(txt)}`;
  }

  function Station({ w, idx }) {
    const c = CATS[w.cat];
    const styleVars = { "--wk-accent": c.accent, "--wk-accent-soft": c.soft, "--wk-accent-line": c.line };
    return (
      <div className="wk-station" style={styleVars}>
        <div className="wk-station__node">
          <div className="wk-badge">
            <span className="wk-badge__ring" />
            <span className="wk-badge__n">{String(idx + 1).padStart(2, "0")}</span>
          </div>
        </div>
        <article className="wk-card">
          <div className="wk-card__chips">
            <span className="wk-chip">{c.label}</span>
            {w.meta.map((m) => <span key={m} className="wk-chip">{m}</span>)}
          </div>
          <h3 className="wk-card__title">{w.title}</h3>
          <p className="wk-card__sub">{w.sub}</p>
          <p className="wk-card__tagline">{w.tagline}</p>
          <p className="wk-card__invite">{w.invite}</p>

          <div className="wk-label">{w.stepsLabel}</div>
          <ul className="wk-steps">
            {w.steps.map((s, i) => (
              <li key={i}><b>{s[0]}</b>{s[1] ? ` — ${s[1]}` : ""}</li>
            ))}
          </ul>

          <div className="wk-label">מה יוצאים איתו</div>
          <div className="wk-results">
            {w.results.map((r) => (
              <span key={r} className="wk-result"><Check />{r}</span>
            ))}
          </div>

          {w.note ? <p className="wk-note">{w.note}</p> : null}

          <div className="wk-card__foot">
            <a className="wk-btn wk-btn--primary" href={waLink(w.title)} target="_blank" rel="noopener noreferrer">
              <Svg d={["M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Z"]} size={15} /> להזמנת הסדנה
            </a>
            <a className="wk-btn wk-btn--ghost" href="#wk-signup">פרטים והרשמה</a>
            <div className="wk-meta">
              <span><Compass size={14} /> {w.audience}</span>
            </div>
          </div>
        </article>
      </div>
    );
  }

  function SignupForm() {
    const [form, setForm] = useState({ fullName: "", phone: "", email: "", workshop: "" });
    const [status, setStatus] = useState("idle");
    const [err, setErr] = useState("");
    const options = WORKSHOPS.map((w) => w.title).concat(["עדיין לא בטוח/ה — אשמח לייעוץ"]);

    function up(k, v) { setForm((f) => ({ ...f, [k]: v })); if (status === "error") setStatus("idle"); }
    function submit(e) {
      e.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      fetch("/api/workshop-signup", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      })
        .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "משהו השתבש — נסי שוב"); setStatus("done"); })
        .catch((e2) => { setStatus("error"); setErr(e2.message); });
    }

    if (status === "done") {
      return (
        <div className="wk-done">
          <span className="wk-done__mark"><Check /></span>
          <h4>נרשמת בהצלחה!</h4>
          <p>קיבלתי את הפרטים שלך ואחזור אלייך בהקדם לתיאום.</p>
        </div>
      );
    }
    return (
      <form className="wk-form" onSubmit={submit} dir="rtl">
        <input type="text" required placeholder="שם מלא" value={form.fullName} onChange={(e) => up("fullName", e.target.value)} />
        <input type="tel" required placeholder="טלפון נייד" value={form.phone} onChange={(e) => up("phone", e.target.value)} />
        <input type="email" placeholder="אימייל (לא חובה)" value={form.email} onChange={(e) => up("email", e.target.value)} />
        <select required value={form.workshop} onChange={(e) => up("workshop", e.target.value)} style={form.workshop ? null : { color: "#b3a894" }}>
          <option value="" disabled>באיזו סדנה מדובר?</option>
          {options.map((o) => <option key={o} value={o} style={{ color: "#2c2820" }}>{o}</option>)}
        </select>
        {status === "error" ? <p className="wk-form__err">{err}</p> : null}
        <button type="submit" disabled={status === "loading"}>{status === "loading" ? "שולח…" : "אני רוצה פרטים על הסדנה"}</button>
      </form>
    );
  }

  /* ---- 3 flagship programs (featured at the top of the page) ---- */
  const FEATURED = [
    {
      cat: "youth", badge: "נוער · גילאי 12–18", title: "מייצרים חוסן",
      meta: ["3 מפגשים", "שעתיים כל מפגש", "קבוצות בוטיק אינטימיות"],
      tagline: "שלושה מפגשים שמשנים את הדרך שבה הם רואים את עצמם.",
      intro: "תוכנית עומק בשיטת CureMindset שנותנת לבני נוער כלים אמיתיים לביטחון, לוויסות רגשי ולחוסן — בקבוצה קטנה ובטוחה, בשפה שלהם.",
      sessions: [
        ["מפגש 1 · פיצוח 'קוד' תת־המודע", "כרטיס הביקור של העוצמה והתקנת עוגן ביטחון."],
        ["מפגש 2 · ניהול רגשות", "שינוי הדיאלוג הפנימי והתמודדות עם חרדה חברתית."],
        ["מפגש 3 · קבלת החלטות", "מנהיגות פנימית ופיתוח חוסן אישי."],
      ],
    },
    {
      cat: "youth", badge: "פיילוט · מעבר ו' → ז'", title: "נחיתה רכה",
      meta: ["תוכנית פיילוט", "מעבר לחטיבת הביניים"],
      tagline: "המעבר לחטיבה לא חייב להיות נפילה.",
      intro: "תוכנית ממוקדת למעבר מכיתה ו' ל־ז', שמונעת נשירה סמויה וחברתית ומחזקת את החוסן הרגשי בדיוק ברגע הרגיש הזה.",
      sessions: [
        ["הכנה רגשית למעבר", "רכות בכניסה למסגרת החדשה."],
        ["חיזוק ביטחון חברתי", "כלים להשתלבות בקבוצה חדשה."],
        ["מניעת נשירה שקטה", "זיהוי מוקדם וחיזוק החוסן."],
      ],
    },
    {
      cat: "org", badge: "ארגונים · עובדים", title: "חוסן ו־Wellness לארגונים",
      meta: ["תוכניות מותאמות", "לחברות ולצוותים"],
      tagline: "צוות חסין הוא צוות שנשאר.",
      intro: "תוכניות מותאמות לחברות ולארגונים לניהול עומסים, מניעת שחיקה ושיפור הביצועים — עבודה בשורש הרגשי, לא רק ברווחה החיצונית.",
      sessions: [
        ["ניהול עומסים ולחץ", "כלים מעשיים לרגעי לחץ בעבודה."],
        ["מניעת שחיקה", "שמירה על אנרגיה ומוטיבציה לאורך זמן."],
        ["שיפור ביצועים ונוכחות", "עובדים נוכחים, יציבים ואפקטיביים יותר."],
      ],
    },
  ];

  function FeaturedProgram({ p }) {
    const c = CATS[p.cat];
    const vars = { "--wk-accent": c.accent, "--wk-accent-soft": c.soft, "--wk-accent-line": c.line };
    return (
      <article className="wk-flag" style={vars}>
        <span className="wk-flag__badge">{p.badge}</span>
        <h3 className="wk-flag__title">{p.title}</h3>
        <p className="wk-flag__tagline">{p.tagline}</p>
        <div className="wk-flag__meta">
          {p.meta.map((m) => <span key={m}>{m}</span>)}
        </div>
        <p className="wk-flag__intro">{p.intro}</p>
        <ul className="wk-flag__sessions">
          {p.sessions.map((s, i) => (
            <li key={i}><b>{s[0]}</b><span>{s[1]}</span></li>
          ))}
        </ul>
        <div className="wk-flag__cta">
          <a className="wk-btn wk-btn--primary" href={waLink(p.title)} target="_blank" rel="noopener noreferrer">
            <Svg d={["M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Z"]} size={15} /> להזמנת התוכנית
          </a>
          <a className="wk-btn wk-btn--ghost" href="#wk-signup">פרטים והרשמה</a>
        </div>
      </article>
    );
  }

  function WorkshopsSection() {
    // Deep-link: /workshops scrolls straight to this section.
    useEffect(() => {
      if (location.pathname.replace(/\/+$/, "") === "/workshops") {
        const el = document.getElementById("workshops");
        if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 250);
      }
    }, []);
    return (
      <section id="workshops" className="wk">
        <span className="wk__orb wk__orb--1" /><span className="wk__orb wk__orb--2" /><span className="wk__orb wk__orb--3" />
        <RoseSVG />
        <div className="wk__inner">
          <header style={{ textAlign: "center" }}>
            <span className="wk__eyebrow"><Compass size={15} /> מפת הסדנאות</span>
            <h1 className="wk__title">מפת הדרכים <em>הפנימית</em></h1>
            <p className="wk__lead">
              שיטת CureMindset היא מתודולוגיה קלינית מובנית הפועלת ברמת התת־מודע — מטפלת בשורש, לא בסימפטום.
              משלבת NLP, דמיון נוירולוגי, עבודה עם התת־מודע ועקרונות גמישות מוחית (Neuroplasticity) — בשיטת CureMindset של קטי שגב.
            </p>
            <div className="wk__methods">
              {["NLP", "דמיון נוירולוגי", "עבודה עם התת־מודע", "גמישות מוחית", "שיטת CureMindset"].map((m) => (
                <span key={m} className="wk__method">{m}</span>
              ))}
            </div>
          </header>

          <div className="wk__featured-head">
            <h2 className="wk__featured-title">התוכניות המובילות</h2>
            <p className="wk__featured-sub">שלוש תוכניות דגל בשיטת CureMindset — לנוער, למעברי גיל ולארגונים.</p>
          </div>
          <div className="wk__featured">
            {FEATURED.map((p) => <FeaturedProgram key={p.title} p={p} />)}
          </div>

          <div className="wk__diff">
            <h3>למה CureMindset שונה?</h3>
            <p>
              רוב הגישות בתחום החוסן עובדות ברמה הקוגניטיבית־התנהגותית — "תחשוב אחרת", "תנשום עמוק".
              CureMindset עובדת בשכבה העמוקה ביותר — רמת הזהות והתת־מודע — ומשחררת את האמונות והדפוסים
              שמתחת לכל השאר. <strong>התוצאה: שינוי שנשמר לאורך זמן, לא רק הרגעה זמנית.</strong>
            </p>
            <p>איכות החוסן הרגשי משפיעה על כל תחומי החיים — בריאות, קריירה, זוגיות, הורות ובריאות נפשית.</p>
          </div>

          <div className="wk__road">
            {WORKSHOPS.map((w, i) => <Station key={w.title} w={w} idx={i} />)}
          </div>

          <div className="wk-cta" id="wk-signup">
            <h2 className="wk-cta__title">רוצה להביא את המסע הזה אלייך?</h2>
            <p className="wk-cta__lead">
              לסדנה בארגון, בבית הספר או לקבוצה פרטית — אפשר לקבוע איתי פגישת היכרות אישית,
              או להשאיר פרטים ואחזור אלייך עם כל המידע. ללא התחייבות.
            </p>
            <a className="wk-book" href={BOOKING} target="_blank" rel="noopener noreferrer">
              <Compass size={18} /> לקביעת פגישת היכרות
            </a>
            <p className="wk-cta__or">— או השאירו פרטים —</p>
            <SignupForm />
          </div>
        </div>
      </section>
    );
  }

  window.WorkshopsSection = WorkshopsSection;
})();
