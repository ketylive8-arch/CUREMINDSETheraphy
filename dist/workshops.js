/* CureMindset — Workshops page ("מפת הדרכים הפנימית").
   A self-contained, visually distinct section (own workshops.css world).
   Full content for all 8 workshops, written as invitations. Exposes
   window.WorkshopsSection. Signup posts to /api/workshop-signup (same CRM). */
(function () {
  "use strict";

  const {
    useState,
    useEffect
  } = React;
  const WA = "972543032349";
  const BOOKING = "https://calendly.com/ketysegev/meet-with-me";

  /* small inline SVG icon set (the shared icons.js lacks compass/anchor) */
  function Svg({
    d,
    size = 15,
    fill
  }) {
    return React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: fill || "none",
      stroke: "currentColor",
      strokeWidth: 1.9,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, Array.isArray(d) ? d.map((p, i) => React.createElement("path", {
      key: i,
      d: p
    })) : React.createElement("path", {
      d
    }));
  }
  const Check = () => /*#__PURE__*/React.createElement(Svg, {
    d: "M20 6 9 17l-5-5"
  });
  const Compass = ({
    size
  }) => /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
  }));
  const RoseSVG = () => /*#__PURE__*/React.createElement("svg", {
    className: "wk__rose",
    viewBox: "0 0 200 200",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.4",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "100",
    cy: "100",
    r: "92"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "100",
    cy: "100",
    r: "66"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "100",
    cy: "100",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M100 8 L112 100 L100 192 L88 100 Z",
    fill: "currentColor",
    stroke: "none",
    opacity: "0.6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 100 L100 112 L192 100 L100 88 Z",
    fill: "currentColor",
    stroke: "none",
    opacity: "0.35"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M35 35 L100 100 L165 165 M165 35 L100 100 L35 165"
  }));

  /* ---- category theming (echoes the infographic station colors) ---- */
  const CATS = {
    youth: {
      label: "חינוך · נוער",
      accent: "#6f9268",
      soft: "rgba(111,146,104,0.14)",
      line: "rgba(111,146,104,0.34)"
    },
    depth: {
      label: "סדנת עומק",
      accent: "#c2974a",
      soft: "rgba(194,151,74,0.13)",
      line: "rgba(194,151,74,0.34)"
    },
    module: {
      label: "מודול ממוקד",
      accent: "#bd7d5b",
      soft: "rgba(189,125,91,0.14)",
      line: "rgba(189,125,91,0.34)"
    }
  };

  /* ---- full workshop content (from Kety's document + invitation copy) ---- */
  const WORKSHOPS = [{
    cat: "depth",
    title: "שינוי רמת זהות",
    sub: "סדנת עומק · 10 שלבים",
    tagline: "אתה לא צריך עוד כוח רצון — אתה צריך זהות חדשה שממנה הכל זורם מעצמו.",
    invite: "רוב השינויים שאנחנו מנסים לעשות נכשלים, כי הם פועלים ברמת ההתנהגות. אבל התת־מודע לא משנה התנהגות — הוא משנה זהות. אם בפנים כתוב \"אני לא מספיק\", כל שינוי התנהגותי יקרוס ברגע הקושי הראשון. הסדנה הזו, המבוססת על מודל הרמות הלוגיות של Dilts, לוקחת אותך שלב אחר שלב אל השכבה שממנה נובע הכל — ובונה מחדש את \"מי אני\". הזמנה לשינוי שלא צריך להחזיק בכוח, כי הוא פשוט מי שאתה.",
    stepsLabel: "10 השלבים",
    steps: [["מיפוי רמת הזהות הנוכחית", "איפה אני ממוקם ברמות הלוגיות?"], ["זיהוי האמונות המגבילות", "מהם הקולות הפנימיים שעוצרים אותי?"], ["חקירת המקור", "מאיפה הגיעו האמונות? (עובדים ברמת התת־מודע, בלי לחזור לטראומה)"], ["פירוק הקשר הרגשי", "ניתוק הטעינה הרגשית מהאמונה המגבילה."], ["בניית זהות חדשה", "מי אני רוצה להיות? מהם הערכים של הזהות החדשה?"], ["עיגון בתת־מודע", "הטמעת הזהות החדשה ברמה העצבית."], ["בדיקת התאמה לרמות הלוגיות", "האם הזהות החדשה תואמת סביבה, התנהגות ויכולות?"], ["Future Pacing", "הקרנת הזהות החדשה אל העתיד."], ["עיגון תוצאות", "חיזוק השינוי כך שיחזיק מעמד במציאות."], ["תוכנית פעולה יומיומית", "כלים פרקטיים לשמירת השינוי בשגרה."]],
    results: ["שינוי תפיסתי עמוק ב\"מי אני\"", "שחרור אמונות שפעלו שנים", "חוסן שנשמר לאורך זמן", "התאמה בין הזהות הפנימית למציאות"],
    meta: ["10 שלבים", "סדנה מלאה או קורס מודולרי"],
    audience: "מבוגרים · נוער · אנשי מקצוע"
  }, {
    cat: "depth",
    title: "Future Pacing רגשי־גופני",
    sub: "סדנה ממוקדת · 8 שלבים",
    tagline: "לחזור מהעתיד כשהתשובה כבר נמצאת בגוף.",
    invite: "Future Pacing הוא אחד הכלים החזקים בעולם ה־NLP: היכולת \"להקרין\" את התוצאה הרצויה אל העתיד ולעגן אותה בתת־מודע — כך שכשמגיע הרגע, הגוף והנפש כבר יודעים מה לעשות. הגרסה של CureMindset מוסיפה שכבה גופנית־רגשית: קודם מנקים את העומס המצטבר, משחררים חסימות, ואז מעגנים את התוצאה עמוק בגוף. מושלם לפני ראיון, מבחן, מצגת או כל רגע שבו אתה רוצה להגיע מוכן — לא רק בראש, גם בבטן.",
    stepsLabel: "8 השלבים",
    steps: [["זיהוי המטרה", "מהי התוצאה שרוצים להשיג?"], ["ניקוי עומס רגשי מצטבר", "שחרור ה\"פסולת\" הרגשית שעלולה להפריע."], ["בניית תמונת העתיד", "יצירת ייצוג חושי עשיר — ראייה, שמיעה, תחושה."], ["עיגון גופני", "חיבור התמונה לתחושה גופנית ספציפית."], ["הכנסת משתנים", "מה יקרה כשיהיה קושי? כשמשהו ישתבש?"], ["חזרה מנטלית מדורגת", "תרגול התסריט ברמות קושי עולות."], ["עיגון סופי בתת־מודע", "הטמעת התוצאה כ\"זיכרון עתידי\"."], ["בדיקת שטח", "איך זה מרגיש עכשיו? מה השתנה בגוף?"]],
    results: ["ניהול החלטות במצבי אתגר בביטחון", "ניקוי עומס רגשי מצטבר", "עיגון תוצאות בגוף — לא רק בראש", "ירידה משמעותית בחרדת ביצועים"],
    meta: ["8 שלבים", "סדנה ממוקדת"],
    audience: "עובדים · מנהלים · נוער"
  }, {
    cat: "youth",
    title: "קבוצות חוסן ודימוי עצמי לנוער",
    sub: "בתי ספר ורשתות חינוך",
    tagline: "הדימוי העצמי שנבנה עכשיו — נשאר איתם לכל החיים.",
    invite: "גיל ההתבגרות הוא החלון הקריטי ביותר לבניית חוסן מנטלי. נער או נערה עם דימוי עצמי יציב לא רק מתפקדים טוב יותר — הם עמידים יותר לאתגרים חברתיים, לחרדת בחינות ולדחיינות. שלושה מפגשים אינטימיים, בשפה של בני נוער ובאווירה בטוחה, שנותנים להם ערכת כלים אמיתית לחיים — ומונעים נשירה ושחיקה עוד לפני שהן מתחילות.",
    stepsLabel: "מבנה התוכנית",
    steps: [["מפגש 1 · חוסן וויסות רגשי", "היכרות עם \"המצפן הפנימי\", זיהוי הקולות הפנימיים, התמודדות עם אתגרים חברתיים, וכלים ראשוניים לוויסות רגשי."], ["מפגש 2 · דימוי עצמי וביטחון", "העלאת הביטחון, פירוק דחיינות, והתמודדות עם \"מחסלי הביטחון\"."], ["מפגש 3 · כלים לחיים", "עיגון הכלים בשגרה, ו־Future Pacing מותאם לנוער (מבחנים, שיחות קשות, מעברי שלב). יוצאים עם ערכת כלים מעשית."]],
    results: ["עלייה בביטחון ובדימוי העצמי", "ירידה בדחיינות ובחרדת בחינות", "כלים לאתגרים חברתיים", "מניעת נשירה סמויה ושחיקה"],
    meta: ["3 מפגשים", "עד 8 תלמידים", "קבוצה אינטימית"],
    audience: "בתי ספר · רשתות חינוך · תנועות נוער",
    note: "מודל מימון: הסדנה ממומנת על ידי ההורים בעלות סמלית ומסובסדת של 350 ₪ לתלמיד עבור כל התהליך — ללא עלות לבית הספר או לרשת. ניתן להתאים גם לתקציבי רווחה חינוכית או מניעת נשירה."
  }, {
    cat: "module",
    title: "מודול חרדה",
    sub: "כלים להתמודדות יומיומית",
    tagline: "חרדה היא לא מחלה — היא תת־מודע שנשאר במצב הישרדות.",
    invite: "החרדה לא באה כדי להעניש אותך — היא מערכת התראה רגישה מדי שנשארה בדריכות. המודול הזה לא מנסה \"להסיח את הדעת\", אלא עובד על השורש: מזהים את הטריגרים ברמת התת־מודע, משחררים את הטעינה הרגשית, ובונים מנגנוני ויסות פנימיים שזמינים בכל רגע. יוצאים עם היכולת להרגיע את עצמך — לבד, בזמן אמת.",
    stepsLabel: "מה עוברים במודול",
    steps: [["הבנת מנגנון החרדה", "מה קורה בגוף ובתת־מודע."], ["זיהוי וניתוק טריגרים רגשיים", ""], ["כלי עיגון להרגעה מיידית", ""], ["Future Pacing למצבי חרדה ספציפיים", ""], ["בניית חוסן מנטלי", "כבסיס למניעת הישנות."]],
    results: ["הרגעה עצמית בזמן אמת", "פחות הצפות", "שליטה חוזרת"],
    meta: ["סדנה ממוקדת / מודול"],
    audience: "מבוגרים · נוער · עובדים"
  }, {
    cat: "module",
    title: "מודול העצמה וביטחון",
    sub: "בניית ביטחון עצמי מהשורש",
    tagline: "ביטחון אמיתי לא נבנה מאפירמציות — אלא משחרור מה שחוסם אותו.",
    invite: "כולם אומרים לך \"תאמין בעצמך\". אבל ביטחון אמיתי לא נולד ממשפטים חיוביים שאתה לא ממש מאמין בהם — הוא נולד כשמפרקים את האמונות המגבילות שמתחת, ובונים זהות חזקה ויציבה מהשורש. המודול הזה מחליף את הקול הפנימי שמחליש ב\"שופר פנימי\" שמחזק אותך דווקא ברגעים שבהם הכי קשה.",
    stepsLabel: "מה עוברים במודול",
    steps: [["7 \"מחסלי ביטחון\"", "זיהוי ופירוק."], ["עבודת זהות", "מי אני כשאני משוחרר מאישור חיצוני?"], ["עיגון רגשי למצבי ביטחון", ""], ["Future Pacing למצבים מאתגרים", "ראיונות, הצגות, שיחות קשות."], ["בניית \"שופר פנימי\"", "שמחזק במקום להחליש."]],
    results: ["נוכחות ועמידה מול קהל", "לומר את דעתך בלי לקרוס", "ביטחון שמחזיק ברגע אמת"],
    meta: ["סדנה ממוקדת / מודול"],
    audience: "נשים · נוער · מנהלים · יזמים"
  }, {
    cat: "module",
    title: "מודול עיגון רגשי",
    sub: "Anchoring",
    tagline: "כפתור פנימי שמדליק רוגע, ביטחון או מיקוד — בדיוק כשצריך.",
    invite: "עיגון (Anchoring) הוא אחד הכלים החזקים ב־NLP: יצירת חיבור בין גירוי חיצוני קטן לבין מצב רגשי רצוי — כך שאפשר \"להדליק\" את המצב הזה בכל רגע נתון. במודול הזה בונים עוגנים חיוביים, מפרקים עוגנים שליליים, ולומדים להשתמש בהם בשגרה. כמו שלט פנימי למצבי הרוח שלך.",
    stepsLabel: "מה עוברים במודול",
    steps: [["מבנה העוגן", "איך המוח יוצר חיבורים רגשיים."], ["בניית עוגנים חיוביים", "ביטחון, רוגע, מיקוד."], ["פירוק עוגנים שליליים", "טריגרים שמפעילים חרדה או דחיינות."], ["עוגנים מורכבים", "דריכות + רוגע, מוטיבציה + סבלנות."], ["יישום יומיומי", "כיצד להשתמש בעוגנים בשגרה."]],
    results: ["גישה מהירה לרוגע ולמיקוד", "פחות שליטה של טריגרים", "יותר שליטה שלך"],
    meta: ["מודול מעשי"],
    audience: "כלל המשתתפים"
  }, {
    cat: "module",
    title: "מודול טראומה",
    sub: "עיבוד ושחרור",
    tagline: "לא צריך לחיות מחדש את הכאב כדי להשתחרר ממנו.",
    invite: "טראומה לא חייבת להיות אירוע דרמטי אחד. לעיתים היא הצטברות שקטה של חוויות קטנות שמעולם לא עובדו — דחייה, ביקורת, חוסר יציבות. המודול פועל ברמת התת־מודע כדי לעבד ולשחרר את הטעינה הרגשית — בלי לחזור ולחיות מחדש את החוויה הכואבת. עבודה עדינה, בטוחה, בקצב שלך.",
    stepsLabel: "מה עוברים במודול",
    steps: [["הבנת מנגנון הטראומה בתת־מודע", ""], ["זיהוי טראומות \"שקטות\"", "לא רק אירועי קיצון."], ["טכניקות עיבוד ושחרור", "ברמת התת־מודע."], ["עבודה עם עובדים טיפוליים", "מניעת טראומה משנית ושחיקה."], ["בניית חוסן פוסט־טראומטי", ""]],
    results: ["הקלה אמיתית", "פחות עומס נישא", "חוסן פוסט־טראומטי"],
    meta: ["עבודה אישית / קבוצתית סגורה"],
    audience: "מבוגרים · נוער · עובדים טיפוליים"
  }];
  function waLink(title) {
    const txt = `היי קטי! אשמח לפרטים על הסדנה "${title}"`;
    return `https://wa.me/${WA}?text=${encodeURIComponent(txt)}`;
  }
  function Station({
    w,
    idx
  }) {
    const c = CATS[w.cat];
    const [open, setOpen] = useState(false);
    const styleVars = {
      "--wk-accent": c.accent,
      "--wk-accent-soft": c.soft,
      "--wk-accent-line": c.line
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "wk-station",
      style: styleVars
    }, /*#__PURE__*/React.createElement("div", {
      className: "wk-station__node"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wk-badge"
    }, /*#__PURE__*/React.createElement("span", {
      className: "wk-badge__ring"
    }), /*#__PURE__*/React.createElement("span", {
      className: "wk-badge__n"
    }, String(idx + 1).padStart(2, "0")))), /*#__PURE__*/React.createElement("article", {
      className: `wk-card${open ? " is-open" : ""}`
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "wk-card__head",
      onClick: () => setOpen(o => !o),
      "aria-expanded": open
    }, /*#__PURE__*/React.createElement("span", {
      className: "wk-card__headmain"
    }, /*#__PURE__*/React.createElement("span", {
      className: "wk-card__chips"
    }, /*#__PURE__*/React.createElement("span", {
      className: "wk-chip"
    }, c.label), w.meta.map(m => /*#__PURE__*/React.createElement("span", {
      key: m,
      className: "wk-chip"
    }, m))), /*#__PURE__*/React.createElement("span", {
      className: "wk-card__title"
    }, w.title), /*#__PURE__*/React.createElement("span", {
      className: "wk-card__sub"
    }, w.sub), /*#__PURE__*/React.createElement("span", {
      className: "wk-card__tagline"
    }, w.tagline)), /*#__PURE__*/React.createElement("span", {
      className: "wk-card__chev",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement(Svg, {
      d: "m6 9 6 6 6-6",
      size: 20
    }))), /*#__PURE__*/React.createElement("div", {
      className: "wk-card__reveal"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wk-card__revealinner"
    }, /*#__PURE__*/React.createElement("p", {
      className: "wk-card__invite"
    }, w.invite), /*#__PURE__*/React.createElement("div", {
      className: "wk-label"
    }, w.stepsLabel), /*#__PURE__*/React.createElement("ul", {
      className: "wk-steps"
    }, w.steps.map((s, i) => /*#__PURE__*/React.createElement("li", {
      key: i
    }, /*#__PURE__*/React.createElement("b", null, s[0]), s[1] ? ` — ${s[1]}` : ""))), /*#__PURE__*/React.createElement("div", {
      className: "wk-label"
    }, "\u05DE\u05D4 \u05D9\u05D5\u05E6\u05D0\u05D9\u05DD \u05D0\u05D9\u05EA\u05D5"), /*#__PURE__*/React.createElement("div", {
      className: "wk-results"
    }, w.results.map(r => /*#__PURE__*/React.createElement("span", {
      key: r,
      className: "wk-result"
    }, /*#__PURE__*/React.createElement(Check, null), r))), w.note ? /*#__PURE__*/React.createElement("p", {
      className: "wk-note"
    }, w.note) : null, /*#__PURE__*/React.createElement("div", {
      className: "wk-card__foot"
    }, /*#__PURE__*/React.createElement("a", {
      className: "wk-btn wk-btn--primary",
      href: waLink(w.title),
      target: "_blank",
      rel: "noopener noreferrer"
    }, /*#__PURE__*/React.createElement(Svg, {
      d: ["M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Z"],
      size: 15
    }), " \u05DC\u05D4\u05D6\u05DE\u05E0\u05EA \u05D4\u05E1\u05D3\u05E0\u05D4"), /*#__PURE__*/React.createElement("a", {
      className: "wk-btn wk-btn--ghost",
      href: "#wk-signup"
    }, "\u05E4\u05E8\u05D8\u05D9\u05DD \u05D5\u05D4\u05E8\u05E9\u05DE\u05D4"), /*#__PURE__*/React.createElement("div", {
      className: "wk-meta"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Compass, {
      size: 14
    }), " ", w.audience)))))));
  }
  function SignupForm() {
    const [form, setForm] = useState({
      fullName: "",
      phone: "",
      email: "",
      workshop: ""
    });
    const [status, setStatus] = useState("idle");
    const [err, setErr] = useState("");
    const options = WORKSHOPS.map(w => w.title).concat(["עדיין לא בטוח/ה — אשמח לייעוץ"]);
    function up(k, v) {
      setForm(f => ({
        ...f,
        [k]: v
      }));
      if (status === "error") setStatus("idle");
    }
    function submit(e) {
      e.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      fetch("/api/workshop-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      }).then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "משהו השתבש — נסי שוב");
        setStatus("done");
      }).catch(e2 => {
        setStatus("error");
        setErr(e2.message);
      });
    }
    if (status === "done") {
      return /*#__PURE__*/React.createElement("div", {
        className: "wk-done"
      }, /*#__PURE__*/React.createElement("span", {
        className: "wk-done__mark"
      }, /*#__PURE__*/React.createElement(Check, null)), /*#__PURE__*/React.createElement("h4", null, "\u05E0\u05E8\u05E9\u05DE\u05EA \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4!"), /*#__PURE__*/React.createElement("p", null, "\u05E7\u05D9\u05D1\u05DC\u05EA\u05D9 \u05D0\u05EA \u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05E9\u05DC\u05DA \u05D5\u05D0\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05D9\u05DA \u05D1\u05D4\u05E7\u05D3\u05DD \u05DC\u05EA\u05D9\u05D0\u05D5\u05DD."));
    }
    return /*#__PURE__*/React.createElement("form", {
      className: "wk-form",
      onSubmit: submit,
      dir: "rtl"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      required: true,
      placeholder: "\u05E9\u05DD \u05DE\u05DC\u05D0",
      value: form.fullName,
      onChange: e => up("fullName", e.target.value)
    }), /*#__PURE__*/React.createElement("input", {
      type: "tel",
      required: true,
      placeholder: "\u05D8\u05DC\u05E4\u05D5\u05DF \u05E0\u05D9\u05D9\u05D3",
      value: form.phone,
      onChange: e => up("phone", e.target.value)
    }), /*#__PURE__*/React.createElement("input", {
      type: "email",
      placeholder: "\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC (\u05DC\u05D0 \u05D7\u05D5\u05D1\u05D4)",
      value: form.email,
      onChange: e => up("email", e.target.value)
    }), /*#__PURE__*/React.createElement("select", {
      required: true,
      value: form.workshop,
      onChange: e => up("workshop", e.target.value),
      style: form.workshop ? null : {
        color: "#b3a894"
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: "",
      disabled: true
    }, "\u05D1\u05D0\u05D9\u05D6\u05D5 \u05E1\u05D3\u05E0\u05D4 \u05DE\u05D3\u05D5\u05D1\u05E8?"), options.map(o => /*#__PURE__*/React.createElement("option", {
      key: o,
      value: o,
      style: {
        color: "#2c2820"
      }
    }, o))), status === "error" ? /*#__PURE__*/React.createElement("p", {
      className: "wk-form__err"
    }, err) : null, /*#__PURE__*/React.createElement("button", {
      type: "submit",
      disabled: status === "loading"
    }, status === "loading" ? "שולח…" : "אני רוצה פרטים על הסדנה"));
  }

  /* ---- 3 flagship programs (featured at the top of the page) ---- */
  const FEATURED = [{
    cat: "youth",
    badge: "נוער · גילאי 12–18",
    title: "מייצרים חוסן",
    meta: ["3 מפגשים", "שעתיים כל מפגש", "קבוצות בוטיק אינטימיות"],
    tagline: "שלושה מפגשים שמשנים את הדרך שבה הם רואים את עצמם.",
    intro: "תוכנית עומק בשיטת CureMindset שנותנת לבני נוער כלים אמיתיים לביטחון, לוויסות רגשי ולחוסן — בקבוצה קטנה ובטוחה, בשפה שלהם.",
    sessions: [["מפגש 1 · פיצוח 'קוד' תת־המודע", "כרטיס הביקור של העוצמה והתקנת עוגן ביטחון."], ["מפגש 2 · ניהול רגשות", "שינוי הדיאלוג הפנימי והתמודדות עם חרדה חברתית."], ["מפגש 3 · קבלת החלטות", "מנהיגות פנימית ופיתוח חוסן אישי."]]
  }, {
    cat: "youth",
    badge: "פיילוט · מעבר ו' → ז'",
    title: "נחיתה רכה",
    meta: ["תוכנית פיילוט", "מעבר לחטיבת הביניים"],
    tagline: "המעבר לחטיבה לא חייב להיות נפילה.",
    intro: "תוכנית ממוקדת למעבר מכיתה ו' ל־ז', שמונעת נשירה סמויה וחברתית ומחזקת את החוסן הרגשי בדיוק ברגע הרגיש הזה.",
    sessions: [["הכנה רגשית למעבר", "רכות בכניסה למסגרת החדשה."], ["חיזוק ביטחון חברתי", "כלים להשתלבות בקבוצה חדשה."], ["מניעת נשירה שקטה", "זיהוי מוקדם וחיזוק החוסן."]]
  }];
  function FeaturedProgram({
    p
  }) {
    const c = CATS[p.cat];
    const vars = {
      "--wk-accent": c.accent,
      "--wk-accent-soft": c.soft,
      "--wk-accent-line": c.line
    };
    return /*#__PURE__*/React.createElement("article", {
      className: "wk-flag",
      style: vars
    }, /*#__PURE__*/React.createElement("span", {
      className: "wk-flag__badge"
    }, p.badge), /*#__PURE__*/React.createElement("h3", {
      className: "wk-flag__title"
    }, p.title), /*#__PURE__*/React.createElement("p", {
      className: "wk-flag__tagline"
    }, p.tagline), /*#__PURE__*/React.createElement("div", {
      className: "wk-flag__meta"
    }, p.meta.map(m => /*#__PURE__*/React.createElement("span", {
      key: m
    }, m))), /*#__PURE__*/React.createElement("p", {
      className: "wk-flag__intro"
    }, p.intro), /*#__PURE__*/React.createElement("ul", {
      className: "wk-flag__sessions"
    }, p.sessions.map((s, i) => /*#__PURE__*/React.createElement("li", {
      key: i
    }, /*#__PURE__*/React.createElement("b", null, s[0]), /*#__PURE__*/React.createElement("span", null, s[1])))), /*#__PURE__*/React.createElement("div", {
      className: "wk-flag__cta"
    }, /*#__PURE__*/React.createElement("a", {
      className: "wk-btn wk-btn--primary",
      href: waLink(p.title),
      target: "_blank",
      rel: "noopener noreferrer"
    }, /*#__PURE__*/React.createElement(Svg, {
      d: ["M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2Z"],
      size: 15
    }), " \u05DC\u05D4\u05D6\u05DE\u05E0\u05EA \u05D4\u05EA\u05D5\u05DB\u05E0\u05D9\u05EA"), /*#__PURE__*/React.createElement("a", {
      className: "wk-btn wk-btn--ghost",
      href: "#wk-signup"
    }, "\u05E4\u05E8\u05D8\u05D9\u05DD \u05D5\u05D4\u05E8\u05E9\u05DE\u05D4")));
  }
  function WorkshopsSection() {
    // Deep-link: /workshops scrolls straight to this section.
    useEffect(() => {
      if (location.pathname.replace(/\/+$/, "") === "/workshops") {
        const el = document.getElementById("workshops");
        if (el) setTimeout(() => el.scrollIntoView({
          behavior: "smooth"
        }), 250);
      }
    }, []);
    return /*#__PURE__*/React.createElement("section", {
      id: "workshops",
      className: "wk"
    }, /*#__PURE__*/React.createElement("span", {
      className: "wk__orb wk__orb--1"
    }), /*#__PURE__*/React.createElement("span", {
      className: "wk__orb wk__orb--2"
    }), /*#__PURE__*/React.createElement("span", {
      className: "wk__orb wk__orb--3"
    }), /*#__PURE__*/React.createElement(RoseSVG, null), /*#__PURE__*/React.createElement("div", {
      className: "wk__inner"
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "wk__eyebrow"
    }, /*#__PURE__*/React.createElement(Compass, {
      size: 15
    }), " \u05DE\u05E4\u05EA \u05D4\u05E1\u05D3\u05E0\u05D0\u05D5\u05EA"), /*#__PURE__*/React.createElement("h1", {
      className: "wk__title"
    }, "\u05DE\u05E4\u05EA \u05D4\u05D3\u05E8\u05DB\u05D9\u05DD ", /*#__PURE__*/React.createElement("em", null, "\u05D4\u05E4\u05E0\u05D9\u05DE\u05D9\u05EA")), /*#__PURE__*/React.createElement("p", {
      className: "wk__lead"
    }, "\u05E9\u05D9\u05D8\u05EA CureMindset \u05D4\u05D9\u05D0 \u05DE\u05EA\u05D5\u05D3\u05D5\u05DC\u05D5\u05D2\u05D9\u05D4 \u05DE\u05D1\u05D5\u05E1\u05E1\u05EA-\u05DE\u05D7\u05E7\u05E8 \u05D4\u05E4\u05D5\u05E2\u05DC\u05EA \u05D1\u05E8\u05DE\u05EA \u05D4\u05EA\u05EA\u05BE\u05DE\u05D5\u05D3\u05E2 \u2014 \u05DE\u05D8\u05E4\u05DC\u05EA \u05D1\u05E9\u05D5\u05E8\u05E9, \u05DC\u05D0 \u05D1\u05E1\u05D9\u05DE\u05E4\u05D8\u05D5\u05DD. \u05DE\u05E9\u05DC\u05D1\u05EA NLP, \u05D3\u05DE\u05D9\u05D5\u05DF \u05E0\u05D5\u05D9\u05E8\u05D5\u05DC\u05D5\u05D2\u05D9, \u05E2\u05D1\u05D5\u05D3\u05D4 \u05E2\u05DD \u05D4\u05EA\u05EA\u05BE\u05DE\u05D5\u05D3\u05E2 \u05D5\u05E2\u05E7\u05E8\u05D5\u05E0\u05D5\u05EA \u05D2\u05DE\u05D9\u05E9\u05D5\u05EA \u05DE\u05D5\u05D7\u05D9\u05EA (Neuroplasticity) \u2014 \u05D1\u05E9\u05D9\u05D8\u05EA CureMindset \u05E9\u05DC \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1."), /*#__PURE__*/React.createElement("div", {
      className: "wk__methods"
    }, ["NLP", "דמיון נוירולוגי", "עבודה עם התת־מודע", "גמישות מוחית", "שיטת CureMindset"].map(m => /*#__PURE__*/React.createElement("span", {
      key: m,
      className: "wk__method"
    }, m)))), /*#__PURE__*/React.createElement("div", {
      className: "wk__featured-head"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "wk__featured-title"
    }, "\u05D4\u05EA\u05D5\u05DB\u05E0\u05D9\u05D5\u05EA \u05D4\u05DE\u05D5\u05D1\u05D9\u05DC\u05D5\u05EA"), /*#__PURE__*/React.createElement("p", {
      className: "wk__featured-sub"
    }, "\u05E9\u05EA\u05D9 \u05EA\u05D5\u05DB\u05E0\u05D9\u05D5\u05EA \u05D3\u05D2\u05DC \u05D1\u05E9\u05D9\u05D8\u05EA CureMindset \u2014 \u05DC\u05DE\u05D1\u05D5\u05D2\u05E8\u05D9\u05DD \u05D5\u05DC\u05E0\u05D5\u05E2\u05E8.")), /*#__PURE__*/React.createElement("div", {
      className: "wk__featured"
    }, FEATURED.map(p => /*#__PURE__*/React.createElement(FeaturedProgram, {
      key: p.title,
      p: p
    }))), /*#__PURE__*/React.createElement("div", {
      className: "wk__diff"
    }, /*#__PURE__*/React.createElement("h3", null, "\u05DC\u05DE\u05D4 CureMindset \u05E9\u05D5\u05E0\u05D4?"), /*#__PURE__*/React.createElement("p", null, "\u05E8\u05D5\u05D1 \u05D4\u05D2\u05D9\u05E9\u05D5\u05EA \u05D1\u05EA\u05D7\u05D5\u05DD \u05D4\u05D7\u05D5\u05E1\u05DF \u05E2\u05D5\u05D1\u05D3\u05D5\u05EA \u05D1\u05E8\u05DE\u05D4 \u05D4\u05E7\u05D5\u05D2\u05E0\u05D9\u05D8\u05D9\u05D1\u05D9\u05EA\u05BE\u05D4\u05EA\u05E0\u05D4\u05D2\u05D5\u05EA\u05D9\u05EA \u2014 \"\u05EA\u05D7\u05E9\u05D5\u05D1 \u05D0\u05D7\u05E8\u05EA\", \"\u05EA\u05E0\u05E9\u05D5\u05DD \u05E2\u05DE\u05D5\u05E7\". CureMindset \u05E2\u05D5\u05D1\u05D3\u05EA \u05D1\u05E9\u05DB\u05D1\u05D4 \u05D4\u05E2\u05DE\u05D5\u05E7\u05D4 \u05D1\u05D9\u05D5\u05EA\u05E8 \u2014 \u05E8\u05DE\u05EA \u05D4\u05D6\u05D4\u05D5\u05EA \u05D5\u05D4\u05EA\u05EA\u05BE\u05DE\u05D5\u05D3\u05E2 \u2014 \u05D5\u05DE\u05E9\u05D7\u05E8\u05E8\u05EA \u05D0\u05EA \u05D4\u05D0\u05DE\u05D5\u05E0\u05D5\u05EA \u05D5\u05D4\u05D3\u05E4\u05D5\u05E1\u05D9\u05DD \u05E9\u05DE\u05EA\u05D7\u05EA \u05DC\u05DB\u05DC \u05D4\u05E9\u05D0\u05E8. ", /*#__PURE__*/React.createElement("strong", null, "\u05D4\u05EA\u05D5\u05E6\u05D0\u05D4: \u05E9\u05D9\u05E0\u05D5\u05D9 \u05E9\u05E0\u05E9\u05DE\u05E8 \u05DC\u05D0\u05D5\u05E8\u05DA \u05D6\u05DE\u05DF, \u05DC\u05D0 \u05E8\u05E7 \u05D4\u05E8\u05D2\u05E2\u05D4 \u05D6\u05DE\u05E0\u05D9\u05EA.")), /*#__PURE__*/React.createElement("p", null, "\u05D0\u05D9\u05DB\u05D5\u05EA \u05D4\u05D7\u05D5\u05E1\u05DF \u05D4\u05E8\u05D2\u05E9\u05D9 \u05DE\u05E9\u05E4\u05D9\u05E2\u05D4 \u05E2\u05DC \u05DB\u05DC \u05EA\u05D7\u05D5\u05DE\u05D9 \u05D4\u05D7\u05D9\u05D9\u05DD \u2014 \u05D1\u05E8\u05D9\u05D0\u05D5\u05EA, \u05E7\u05E8\u05D9\u05D9\u05E8\u05D4, \u05D6\u05D5\u05D2\u05D9\u05D5\u05EA, \u05D4\u05D5\u05E8\u05D5\u05EA \u05D5\u05D1\u05E8\u05D9\u05D0\u05D5\u05EA \u05E0\u05E4\u05E9\u05D9\u05EA.")), /*#__PURE__*/React.createElement("div", {
      className: "wk__road"
    }, WORKSHOPS.map((w, i) => /*#__PURE__*/React.createElement(Station, {
      key: w.title,
      w: w,
      idx: i
    }))), /*#__PURE__*/React.createElement("div", {
      className: "wk-cta",
      id: "wk-signup"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "wk-cta__title"
    }, "\u05E8\u05D5\u05E6\u05D4 \u05DC\u05D4\u05D1\u05D9\u05D0 \u05D0\u05EA \u05D4\u05DE\u05E1\u05E2 \u05D4\u05D6\u05D4 \u05D0\u05DC\u05D9\u05D9\u05DA?"), /*#__PURE__*/React.createElement("p", {
      className: "wk-cta__lead"
    }, "\u05DC\u05E1\u05D3\u05E0\u05D4 \u05D1\u05D0\u05E8\u05D2\u05D5\u05DF, \u05D1\u05D1\u05D9\u05EA \u05D4\u05E1\u05E4\u05E8 \u05D0\u05D5 \u05DC\u05E7\u05D1\u05D5\u05E6\u05D4 \u05E4\u05E8\u05D8\u05D9\u05EA \u2014 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E7\u05D1\u05D5\u05E2 \u05D0\u05D9\u05EA\u05D9 \u05E4\u05D2\u05D9\u05E9\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA \u05D0\u05D9\u05E9\u05D9\u05EA, \u05D0\u05D5 \u05DC\u05D4\u05E9\u05D0\u05D9\u05E8 \u05E4\u05E8\u05D8\u05D9\u05DD \u05D5\u05D0\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05D9\u05DA \u05E2\u05DD \u05DB\u05DC \u05D4\u05DE\u05D9\u05D3\u05E2. \u05DC\u05DC\u05D0 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA."), /*#__PURE__*/React.createElement("a", {
      className: "wk-book",
      href: BOOKING,
      target: "_blank",
      rel: "noopener noreferrer"
    }, /*#__PURE__*/React.createElement(Compass, {
      size: 18
    }), " \u05DC\u05E7\u05D1\u05D9\u05E2\u05EA \u05E4\u05D2\u05D9\u05E9\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA"), /*#__PURE__*/React.createElement("p", {
      className: "wk-cta__or"
    }, "\u2014 \u05D0\u05D5 \u05D4\u05E9\u05D0\u05D9\u05E8\u05D5 \u05E4\u05E8\u05D8\u05D9\u05DD \u2014"), /*#__PURE__*/React.createElement(SignupForm, null))));
  }
  window.WorkshopsSection = WorkshopsSection;
})();
