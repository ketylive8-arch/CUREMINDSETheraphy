// CureMindset — Kety Segev
// Single-source React app (Babel-in-browser, no build step needed to preview).
// Stack: React 18 (UMD, vendored) + Tailwind CSS (precompiled, see styles.css) + inline Lucide icons (icons.js).

const { useState, useEffect, useRef, useCallback } = React;
const Icon = window.Icon;

/* ---------------------------------------------------------------- */
/* Brand constants                                                   */
/* ---------------------------------------------------------------- */

const CONTACT = {
  whatsapp: "972543032349",
  phoneDisplay: "054-303-2349",
  email: "ketylive8@gmail.com",
  founder: "קטי שגב",
  brand: "CureMindset",
  social: "שיטה פרקטית לשינוי דפוסי תת־מודע, חיזוק חוסן רגשי ובניית ביטחון פנימי אמיתי.",
};

function waLink(text) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}

// קישורי תשלום לכל מסלול — קטי: הדביקי כאן את קישורי הסליקה שלך
// (Grow/משולם, PayBox, ביט לעסקים או PayPal). מסלול שהקישור שלו ריק ("")
// ימשיך לשלוח את הלקוחה לוואטסאפ לתיאום תשלום.
const PAYMENT_LINKS = {
  digital: "",
  youth: "",
  recommended: "",
  premium: "",
};

/* ---------------------------------------------------------------- */
/* Content                                                            */
/* ---------------------------------------------------------------- */

const CONTENT = {
  nav: {
    links: [
      { label: "על קטי", href: "#about" },
      { label: "השיטה שלי", href: "#solution" },
      { label: "תחומי התמחות", href: "#journey" },
      { label: "סדנאות ותוכניות ליווי", href: "#plans" },
      { label: "סיפורי הצלחה ותוצאות", href: "#results" },
    ],
    login: "אזור אישי / כניסה למערכת",
    cta: "קביעת שיחה ראשונית",
  },
  hero: {
    kicker: "CureMindset · קטי שגב",
    headline: "לפרוץ את חסמי התודעה – וליצור חוסן רגשי לכל החיים",
    subhead:
      "מתודולוגיית אימון ו-NLP מתקדמת המעניקה לבני נוער, מבוגרים והורים את הכלים המעשיים לשחרור חרדות, בניית דימוי עצמי חזק ויציבות רגשית עמוקה.",
    points: [
      "פריצת דרך ממוקדת על דפוסי תת-המודע לפי שיטת CureMindset",
      "ליווי מובנה וכלים פרקטיים המותאמים אישית לנוער ולמבוגרים",
      "יצירת עוגנים רגשיים ושינוי מיינדסט שמחזיק לאורך זמן",
    ],
    ctaPrimary: "להתחיל תהליך שינוי – קבעו שיחה ראשונית",
    ctaSecondary: "להרשמה לסדנאות הקרובות",
    stats: ["+500 תהליכים אישיים", "הכשרות NLP בינלאומיות", "לנוער · לנשים · להורים"],
    imgAlt: "קטי שגב, מייסדת שיטת CureMindset",
  },
  problem: {
    eyebrow: "מה שמרגישים בפנים",
    title: "לפעמים זה לא משהו אחד ברור. זה פשוט תחושה פנימית:",
    items: [
      { icon: "wind", text: "עומס רגשי שלא נרגע" },
      { icon: "brain", text: "מחשבות שלא מפסיקות" },
      { icon: "sparkles", text: "חרדה שמופיעה בלי שליטה" },
      { icon: "compass", text: "חוסר ביטחון שמנהל החלטות" },
      { icon: "circle", text: "תחושת “אני לא יציב/ה בתוכי”" },
    ],
    closing: "וזה קורה גם כשכלפי חוץ הכול נראה בסדר.",
  },
  solution: {
    eyebrow: "הפתרון",
    title: "CureMindset — לעבוד עם השורש, לא רק עם התסמין",
    lead: "השיטה עובדת ישירות עם דפוסי התת־מודע והמערכת הרגשית — לא רק עם המחשבות שעל פני השטח. כשמשנים את הדפוס מבפנים, השינוי מחזיק.",
    items: [
      { icon: "brain", title: "עבודה עם דפוסי חשיבה עמוקים", text: "מאתרים את הדפוס שמייצר את התחושה הקבועה, ועובדים איתו בשורש." },
      { icon: "wind", title: "ויסות רגשי בזמן אמת", text: "כלים פרקטיים להחזיר את עצמכם לאיזון תוך דקות, בכל מצב." },
      { icon: "shield-check", title: "חיזוק ביטחון פנימי", text: "בונים תחושת ערך עצמי שלא תלויה באישור חיצוני." },
      { icon: "sparkles", title: "תגובה חדשה למצבי לחץ", text: "במקום להיסחף — יוצרים דרך תגובה חדשה, יציבה ובוחרת." },
    ],
  },
  audience: {
    eyebrow: "למי זה מתאים",
    title: "השיטה מותאמת לכל שלב בחיים",
    items: [
      { icon: "graduation-cap", title: "בני נוער", tags: ["חרדה חברתית", "לחץ לימודי"], text: "כלים לבנות ביטחון עצמי אמיתי, להירגע מלחץ חברתי ולימודי, ולהפסיק לחיות עם המחשבות לבד." },
      { icon: "heart", title: "נשים", tags: ["עומס רגשי", "תקיעות"], text: "לצאת ממעגל העומס והתקיעות, ולבנות מחדש ביטחון פנימי שמחזיק גם בלחץ היומיום." },
      { icon: "users", title: "הורים", tags: ["כלים רגשיים", "תקשורת בבית"], text: "כלים רגשיים פרקטיים לוויסות עצמי וליצירת תקשורת רגועה ובריאה יותר בבית." },
      { icon: "school", title: "בתי ספר וארגונים", tags: ["חוסן רגשי", "סדנאות העצמה"], text: "סדנאות חוסן והעצמה לקבוצות — לבני נוער, לצוותים ולקהילות." },
    ],
  },
  workshops: {
    eyebrow: "סדנאות ושירותים",
    title: "תוכניות וסדנאות פעילות",
    items: [
      { icon: "graduation-cap", title: "סדנת חוסן רגשי לנוער", meta: "קבוצות קטנות · מותאם גילאים", text: "סדנה חווייתית שמלמדת בני נוער לזהות דפוסים, לווסת רגשות וחרדה, ולבנות ביטחון עצמי יציב." },
      { icon: "heart-handshake", title: "סדנאות לנשים", meta: "מפגש קבוצתי · יום/בוקר", text: "מרחב בטוח לעבודה על עומס רגשי, תקיעות ודימוי עצמי — עם כלים פרקטיים ליישום מהרגע הראשון." },
      { icon: "building-2", title: "סדנאות לארגונים ובתי ספר", meta: "בנייה לפי צרכי הארגון", text: "תוכנית חוסן רגשי מותאמת אישית לבית הספר, עמותה או ארגון — החל מסדנה חד-פעמית ועד מסלול שנתי מלא. לבקשת מידע והצעת מחיר מותאמת." },
    ],
    cta: "לבדוק זמינות לסדנה הקרובה",
  },
  plans: {
    eyebrow: "תוכניות ומחירים",
    title: "בחרי את המסלול שמתאים לך",
    subtitle: "כל התוכניות כוללות שיחת היכרות חינמית של 30 דקות — ללא התחייבות",
    items: [
      {
        id: "digital",
        icon: "smartphone",
        badge: "ניסיון חינם",
        badgeColor: "#16A34A",
        title: "📱 מאמן אישי ומטפל רגשי בכף היד",
        price: "₪340",
        priceNote: "לחודש",
        trial: "לאחר 14 ימי ניסיון בחינם",
        highlight: false,
        features: [
          "צ'אטבוט טיפולי-אימוני אישי זמין עבורך 24/7",
          "מענה מותאם אישית לחלוטין על בסיס חומרי השיטה הרשמיים",
          "ניתוב מיינדסט, חוסן רגשי והטמעת עוגנים רגשיים",
          "מעקב התקדמות אישי וזיהוי דפוסים אוטומטי",
          "גישה מלאה לספריית החומרים הדיגיטליים",
        ],
        cta: "להתחיל ניסיון חינם",
      },
      {
        id: "youth",
        icon: "graduation-cap",
        badge: "לנוער",
        badgeColor: "#7C3AED",
        title: "👥 סדנאות חוסן ומפגשי זום קבוצתיים",
        price: "₪750",
        priceNote: "תהליך של 6 מפגשים",
        trial: null,
        highlight: false,
        features: [
          "תהליך קבוצתי ממוקד ומותאם (3 עד 8 משתתפים בקבוצה)",
          "מינימום 4 משתתפים לפתיחת קבוצה להבטחת דינמיקה מעצימה",
          "כלים מעשיים לחיזוק הדימוי העצמי והביטחון הפנימי",
          "שחרור דפוסים ופחדים בסביבה בטוחה ותומכת לגילם",
          "ליווי וחיזוק החוסן החברתי והרגשי בתוך הקבוצה",
        ],
        cta: "להרשמה",
      },
      {
        id: "recommended",
        icon: "star",
        badge: "מומלצת",
        badgeColor: "#D97706",
        title: "🎯 ליווי אישי ממוקד תוצאות",
        price: "₪1,700",
        priceNote: "תהליך מובנה של 5 מפגשים",
        trial: null,
        highlight: true,
        features: [
          "עבודה עמוקה על שורש הדפוס לפי מתודולוגיית CureMindset",
          "ניתוח תהליכים אישי ופירוק חסמים בזמן אמת",
          "הטמעת כלי NLP יישומיים לשינוי חשיבה וניהול רגשי",
          "חיזוק ביטחון פנימי יציב ועוגנים רגשיים מותאמים",
          "חומרים דיגיטליים בהתאמה אישית ותמיכה מלאה בין המפגשים",
        ],
        cta: "לתחילת תהליך",
      },
      {
        id: "premium",
        icon: "award",
        badge: "פרימיום",
        badgeColor: "#B45309",
        title: "👑 ליווי פרימיום בהתאמה אישית",
        price: "₪3,500",
        priceNote: "תהליך פרימיום של 11 מפגשים",
        trial: null,
        highlight: false,
        features: [
          "תהליך פרימיום מקיף בהתאמה אישית מלאה ומדויקת עבורך",
          "הגדרת מטרות מורחבת ועבודה על כל שדות החיים",
          "שחרור וניקוי דפוסים רגשיים מושרשים מהבסיס",
          "מענה, עיבוד ועבודה עמוקה עם טראומה והיסטוריה רגשית",
          "ליווי אישי צמוד, מעטפת עוטפת לאורך כל הדרך וגישה לכל התכנים",
        ],
        cta: "לתהליך פרימיום",
      },
    ],
  },
  results: {
    eyebrow: "תוצאות",
    title: "מה משתנה כשעובדים עם השיטה",
    pills: ["פחות חרדה יומיומית", "ביטחון עצמי גבוה יותר", "ויסות רגשי מהיר יותר", "תקשורת בריאה יותר בבית", "שינוי שמחזיק בזמן"],
    quotes: [
      { text: "תוך כמה שבועות הבת שלי הפסיקה לפחד לדבר על מה שמרגישה. זה שינה את היחסים בינינו.", who: "אמא לנערה בתהליך" },
      { text: "למדתי לעצור את עצמי באמצע התקף חרדה ולחזור לאיזון בלי שאף אחד ידע שזה קרה.", who: "משתתפת בתהליך אישי" },
      { text: "הסדנה בבית הספר היתה הדבר הראשון שבאמת דיבר אל התלמידים בגובה העיניים.", who: "יועצת חינוכית" },
    ],
  },
  finalCta: {
    title: "השינוי מתחיל בשיחה אחת",
    text: "אין צורך להגיע מוכנים. רק רוצים לדבר ולבדוק אם זה מתאים לכם.",
    ctaPrimary: "להתחיל תהליך שינוי – קבעו שיחה ראשונית",
    ctaSecondary: "להרשמה לסדנאות הקרובות",
  },
  footer: {
    tagline: CONTACT.social,
    rights: `© ${new Date().getFullYear()} CureMindset · קטי שגב. כל הזכויות שמורות.`,
  },
};

/* ---------------------------------------------------------------- */
/* Hooks                                                              */
/* ---------------------------------------------------------------- */

function useInView(options) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------------------------------------- */
/* Shared bits                                                       */
/* ---------------------------------------------------------------- */

function Logo({ size = 48 }) {
  const [err, setErr] = useState(false);
  if (err) {
    // סימן מותג טיפוגרפי נקי — עד שקטי מעלה קובץ לוגו ל-images/logo.png
    return (
      <div className="flex flex-col items-start leading-none select-none">
        <span className="font-heading font-extrabold text-[22px] tracking-tight">
          <span className="text-ink-800">Cure</span>
          <span className="text-gold-600">Mindset</span>
        </span>
        <span className="text-[11px] font-medium tracking-[0.22em] text-ink-400 mt-1">KETY SEGEV · NLP</span>
      </div>
    );
  }
  return (
    <img
      src="/images/logo.png"
      alt="CureMindset — By Kety Segev"
      style={{ height: size, width: "auto", objectFit: "contain" }}
      onError={() => setErr(true)}
    />
  );
}

function Eyebrow({ children }) {
  return (
    <p className="font-heading text-[13px] font-semibold tracking-[0.18em] uppercase text-gold-600 mb-3">
      {children}
    </p>
  );
}

function Button({ as = "a", variant = "primary", size = "md", icon, iconPos = "start", className = "", children, ...rest }) {
  const Tag = as;
  const base =
    "inline-flex items-center justify-center gap-2.5 font-heading font-semibold rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold-600 select-none";
  const sizes = { md: "px-6 py-3.5 text-[15px] sm:text-base", lg: "px-7 py-4 text-base sm:text-lg" };
  const variants = {
    primary:
      "bg-gold-500 text-white shadow-[0_14px_34px_-14px_rgba(194,151,74,0.7)] hover:bg-gold-600 hover:-translate-y-0.5 hover:shadow-[0_20px_46px_-16px_rgba(194,151,74,0.85)]",
    secondary:
      "bg-white text-ink-800 border border-ink-100 hover:bg-gold-50 hover:border-gold-300 hover:-translate-y-0.5",
    dark: "bg-ink-800 text-white hover:bg-ink-700 hover:-translate-y-0.5",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-50",
  };
  return (
    <Tag className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {icon && iconPos === "start" ? <Icon name={icon} size={18} className="shrink-0" /> : null}
      <span>{children}</span>
      {icon && iconPos === "end" ? <Icon name={icon} size={18} className="shrink-0 rtl-flip" /> : null}
    </Tag>
  );
}

/* ---------------------------------------------------------------- */
/* Nav                                                                */
/* ---------------------------------------------------------------- */

function Nav({ onEnterApp }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeAndGo = () => setOpen(false);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/85 backdrop-blur-md shadow-softer border-b border-ink-100/70" : "bg-transparent"
      }`}
    >
      <nav className="max-w-[1180px] mx-auto px-5 sm:px-7 h-[68px] flex items-center justify-between" aria-label="ניווט ראשי">
        <a href="#top" className="shrink-0" aria-label="CureMindset — חזרה לראש העמוד">
          <Logo />
        </a>

        <ul className="hidden lg:flex items-center gap-7">
          {CONTENT.nav.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-[15px] font-medium text-ink-600 hover:text-gold-600 transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          <button
            type="button"
            onClick={onEnterApp}
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-ink-700 hover:text-gold-600 px-3 py-2 rounded-full transition-colors"
          >
            <Icon name="lock" size={16} />
            {CONTENT.nav.login}
          </button>
          <Button as="a" href={waLink("היי קטי! אשמח לקבוע שיחה ראשונית 🌿")} target="_blank" rel="noopener noreferrer" size="md" icon="whatsapp">
            {CONTENT.nav.cta}
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full text-ink-700 hover:bg-ink-50"
          aria-label={open ? "סגירת תפריט" : "פתיחת תפריט"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? "x" : "menu"} size={24} />
        </button>
      </nav>

      {open && (
        <div className="lg:hidden bg-white border-t border-ink-100 px-5 pb-6 pt-2 shadow-soft">
          <ul className="flex flex-col gap-1">
            {CONTENT.nav.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={closeAndGo}
                  className="block py-3 text-[16px] font-medium text-ink-700 border-b border-ink-100/70"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                closeAndGo();
                onEnterApp();
              }}
              className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-ink-700 border border-ink-100 rounded-full py-3"
            >
              <Icon name="lock" size={16} />
              {CONTENT.nav.login}
            </button>
            <Button as="a" href={waLink("היי קטי! אשמח לקבוע שיחה ראשונית 🌿")} target="_blank" rel="noopener noreferrer" icon="whatsapp" className="w-full">
              {CONTENT.nav.cta}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------- */
/* Hero                                                               */
/* ---------------------------------------------------------------- */

function Hero() {
  return (
    <header id="top" className="relative isolate overflow-hidden bg-gold-50 pt-[120px] pb-16 sm:pt-[150px] sm:pb-24">
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(42% 42% at 78% 25%, rgba(194,151,74,.18), transparent 70%), radial-gradient(38% 38% at 18% 80%, rgba(190,114,64,.14), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7 grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-10 lg:gap-16 items-center">
        <div className="text-center lg:text-start order-2 lg:order-1">
          <p className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full bg-white border border-ink-100 font-heading text-[13px] font-semibold text-ink-600">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" aria-hidden="true" />
            {CONTENT.hero.kicker}
          </p>
          <h1 className="font-heading font-bold text-ink-800 leading-[1.07] tracking-tight text-[34px] sm:text-[44px] lg:text-[58px] mb-5">
            {CONTENT.hero.headline}
          </h1>
          <p className="text-ink-500 text-[17px] sm:text-[19px] leading-relaxed max-w-[540px] mx-auto lg:mx-0 mb-6">
            {CONTENT.hero.subhead}
          </p>
          <ul className="flex flex-col gap-3 mb-8 max-w-[540px] mx-auto lg:mx-0" aria-label="עיקרי השיטה">
            {CONTENT.hero.points.map((p, i) => (
              <li key={i} className="flex items-start gap-3 justify-center lg:justify-start text-ink-700 font-medium text-[18px] leading-[1.6]">
                <Icon name="check-circle-2" size={20} className="text-gold-600 shrink-0 mt-1" />
                {p}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-7">
            <Button
              as="a"
              href={waLink("היי קטי! אשמח לשמוע עוד על השיטה 🌿")}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              icon="whatsapp"
              aria-label="פתיחת שיחה חדשה בוואטסאפ עם קטי שגב"
            >
              {CONTENT.hero.ctaPrimary}
            </Button>
            <Button as="a" href="#workshops" variant="secondary" size="lg" icon="arrow-left" iconPos="end" aria-label="מעבר לאזור הסדנאות הקרובות">
              {CONTENT.hero.ctaSecondary}
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start" aria-label="נתוני אמון">
            {CONTENT.hero.stats.map((s, i) => (
              <li key={i} className="text-[14px] font-medium text-ink-400 relative">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 lg:order-2 flex justify-center">
          <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[460px] aspect-[4/5] rounded-[1.25rem] overflow-hidden shadow-soft bg-white p-2 ring-1 ring-ink-100">
            <picture>
              <source srcSet="images/kety-640.webp 640w, images/kety-920.webp 920w" type="image/webp" sizes="(max-width:1024px) 320px, 460px" />
              <img
                src="images/kety-640.jpg"
                srcSet="images/kety-640.jpg 640w, images/kety-920.jpg 920w"
                sizes="(max-width:1024px) 320px, 460px"
                alt={CONTENT.hero.imgAlt}
                width={920}
                height={1150}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover rounded-[1rem]"
              />
            </picture>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- */
/* Journey — שלושת עמודי התווך של המסע                                */
/* ---------------------------------------------------------------- */

const JOURNEY_STAGES = [
  {
    num: "01",
    icon: "shield-check",
    img: "images/journey-1.jpg",
    title: "ניצחון על חרדות ופחדים",
    subtitle: "שחרור עמוק של פחדים חברתיים, לחצי מבחנים ומחסומים רגשיים.",
    text: "בשלב הראשון של המסע אנחנו נכנסים אל תת-המודע, מזהים את שורש הפחד ומפרקים את העומס הרגשי שמנהל את היום-יום, כדי לייצר שקט תודעתי ראשוני.",
  },
  {
    num: "02",
    icon: "heart",
    img: "images/journey-2.jpg",
    title: "בניית דימוי עצמי מנצח",
    subtitle: "פיתוח הערכה עצמית גבוהה ואהבה עצמית – ללא תלות בסביבה.",
    text: "השלב השני מוקדש לחיווט מחדש של האמונות המגבילות. לומדים להפסיק לחיות עם המחשבות לבד, ומחזקים עוגנים רגשיים פנימיים שלא תלויים באישור של אף אחד מבחוץ.",
  },
  {
    num: "03",
    icon: "sparkles",
    img: "images/journey-3.jpg",
    title: "כלים לחיים וחוסן רגשי",
    subtitle: "ללמוד איך להתמודד עם לחצים בעוצמה, ביטחון ושקט פנימי.",
    text: "שלב הנעילה של המסע שמבטיח חוסן ארוך טווח. המשתמש מקבל ארגז כלים פרקטי לחיים ומשימות אקטיביות, המאפשרים לו לנהל את הרגשות שלו בעצמו ולעבור מנוקשות רגשית לגמישות וצמיחה.",
  },
];

function JourneyCard({ stage, idx }) {
  return (
    <Reveal
      style={{ transitionDelay: `${idx * 100}ms` }}
      className="flex flex-col rounded-2xl bg-white border border-ink-100 overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1"
    >
      {/* חלון ויז'ואל: התמונה של קטי תוצג כאן; עד אז — רקע מותג אלגנטי עם האייקון */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gold-100 to-gold-200 overflow-hidden">
        <img
          src={stage.img}
          alt={stage.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <span className="absolute top-4 right-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/90 text-gold-600 shadow-soft">
          <Icon name={stage.icon} size={24} />
        </span>
        <span className="absolute bottom-3 left-4 font-heading font-extrabold text-[44px] leading-none text-white/80 select-none" aria-hidden="true">
          {stage.num}
        </span>
      </div>

      <div className="flex flex-col flex-1 p-8">
        <p className="font-heading font-semibold text-[13px] tracking-[0.18em] text-gold-600 mb-2">שלב {idx + 1} במסע</p>
        <h3 className="font-heading font-bold text-[24px] leading-tight text-ink-800 mb-3">{stage.title}</h3>
        <p className="font-heading font-semibold text-[19px] leading-snug text-gold-700 mb-4">{stage.subtitle}</p>
        <p className="text-[18px] leading-[1.6] text-ink-600">{stage.text}</p>
      </div>
    </Reveal>
  );
}

function Journey() {
  return (
    <section id="journey" className="py-20 sm:py-28" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FFF8F0 100%)" }}>
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-14">
          <Eyebrow>המסע שלך ב-CureMindset</Eyebrow>
          <h2 className="font-heading font-bold text-ink-800 text-[28px] sm:text-[38px] mb-4">שלושה שלבים לחוסן רגשי שמחזיק לכל החיים</h2>
          <p className="text-ink-500 text-[18px] leading-[1.6]">זה התהליך המדויק שכל מטופל ומטופלת עוברים איתי — שלב אחרי שלב, בקצב אישי.</p>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {JOURNEY_STAGES.map((stage, i) => (
            <JourneyCard key={stage.num} stage={stage} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* About — על קטי                                                     */
/* ---------------------------------------------------------------- */

function About() {
  const highlights = [
    { icon: "sparkles", title: "+500 תהליכים אישיים", text: "ליווי של מאות מתבגרים, נשים והורים בתהליכי שינוי עמוקים." },
    { icon: "graduation-cap", title: "הכשרות NLP בינלאומיות", text: "מתודולוגיה מבוססת כלים מוכחים לעבודה עם דפוסי תת-המודע." },
    { icon: "heart", title: "שיטה אחת — CureMindset", text: "גישה רגשית-תודעתית שפיתחתי, שעובדת עם השורש ולא עם התסמין." },
  ];
  return (
    <section id="about" className="py-16 sm:py-24 bg-white">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-12">
          <Eyebrow>על קטי</Eyebrow>
          <h2 className="font-heading font-bold text-ink-800 text-[26px] sm:text-[34px] mb-5">נעים להכיר, אני קטי שגב</h2>
          <p className="text-ink-500 text-[18px] leading-[1.6]">
            מאמנת ומטפלת רגשית-תודעתית, מפתחת שיטת CureMindset. אחרי שנים של עבודה עם בני נוער, נשים והורים,
            למדתי שהשינוי האמיתי לא קורה בשכנוע — הוא קורה כשעובדים עם התת-מודע, ברגש, בגובה העיניים.
            זו השליחות שלי: לתת לכל אחד ואחת את הכלים לחוסן רגשי שמחזיק לכל החיים.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <Reveal key={h.title} style={{ transitionDelay: `${i * 80}ms` }} className="rounded-2xl bg-gold-50 border border-gold-200 p-6 text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white text-gold-600 mb-4">
                <Icon name={h.icon} size={24} />
              </span>
              <h3 className="font-heading font-bold text-[19px] text-ink-800 mb-2">{h.title}</h3>
              <p className="text-ink-500 text-[15.5px] leading-relaxed">{h.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Problem                                                            */
/* ---------------------------------------------------------------- */

function Problem() {
  return (
    <section id="problem" className="py-16 sm:py-24 bg-white">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-12">
          <Eyebrow>{CONTENT.problem.eyebrow}</Eyebrow>
          <h2 className="font-heading font-bold text-ink-800 text-[26px] sm:text-[34px] leading-snug">
            {CONTENT.problem.title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {CONTENT.problem.items.map((it, i) => (
            <Reveal key={i} style={{ transitionDelay: `${i * 70}ms` }} className="bg-ink-50 rounded-2xl p-6 flex flex-col items-center text-center gap-3 hover:-translate-y-1 hover:shadow-softer transition-transform">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-gold-600 shadow-softer">
                <Icon name={it.icon} size={22} />
              </span>
              <p className="text-ink-700 font-medium text-[15px] leading-snug">{it.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-10">
          <p className="text-ink-500 text-[17px] font-medium">{CONTENT.problem.closing}</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Solution                                                           */
/* ---------------------------------------------------------------- */

function Solution() {
  return (
    <section id="solution" className="py-16 sm:py-24 bg-gold-50">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[720px] mx-auto mb-12">
          <Eyebrow>{CONTENT.solution.eyebrow}</Eyebrow>
          <h2 className="font-heading font-bold text-ink-800 text-[26px] sm:text-[36px] leading-snug mb-4">
            {CONTENT.solution.title}
          </h2>
          <p className="text-ink-500 text-[16px] sm:text-[18px] leading-relaxed">{CONTENT.solution.lead}</p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CONTENT.solution.items.map((it, i) => (
            <Reveal key={i} style={{ transitionDelay: `${i * 80}ms` }} className="bg-white rounded-2xl p-7 shadow-softer hover:-translate-y-1.5 transition-transform">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold-100 text-gold-700 mb-5">
                <Icon name={it.icon} size={22} />
              </span>
              <h3 className="font-heading font-semibold text-ink-800 text-[17px] mb-2">{it.title}</h3>
              <p className="text-ink-500 text-[14.5px] leading-relaxed">{it.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Audience — expandable cards                                       */
/* ---------------------------------------------------------------- */

function AudienceCard({ item, idx }) {
  const [open, setOpen] = useState(idx === 0);
  return (
    <Reveal as="li" style={{ transitionDelay: `${idx * 70}ms` }} className="border border-ink-100 rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-4 p-5 sm:p-6 text-start"
      >
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold-100 text-gold-700 shrink-0">
          <Icon name={item.icon} size={22} />
        </span>
        <span className="flex-1">
          <span className="block font-heading font-semibold text-ink-800 text-[17px]">{item.title}</span>
          <span className="flex flex-wrap gap-2 mt-1.5">
            {item.tags.map((t) => (
              <span key={t} className="text-[12px] font-medium text-gold-700 bg-gold-50 px-2.5 py-1 rounded-full">
                {t}
              </span>
            ))}
          </span>
        </span>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={20} className="text-ink-300 shrink-0" />
      </button>
      {open && (
        <div className="px-5 sm:px-6 pb-6 -mt-1">
          <p className="text-ink-500 text-[15px] leading-relaxed ps-16">{item.text}</p>
        </div>
      )}
    </Reveal>
  );
}

function Audience() {
  return (
    <section id="audience" className="py-16 sm:py-24 bg-white">
      <div className="max-w-[880px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center mb-12">
          <Eyebrow>{CONTENT.audience.eyebrow}</Eyebrow>
          <h2 className="font-heading font-bold text-ink-800 text-[26px] sm:text-[34px]">{CONTENT.audience.title}</h2>
        </Reveal>
        <ul className="flex flex-col gap-3">
          {CONTENT.audience.items.map((item, i) => (
            <AudienceCard key={item.title} item={item} idx={i} />
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Workshops / Services                                              */
/* ---------------------------------------------------------------- */

function Workshops() {
  return (
    <section id="workshops" className="py-16 sm:py-24 bg-ink-800 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 pointer-events-none opacity-40"
        style={{ background: "radial-gradient(50% 50% at 50% 0%, rgba(194,151,74,.25), transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-12">
          <p className="font-heading text-[13px] font-semibold tracking-[0.18em] uppercase text-gold-400 mb-3">
            {CONTENT.workshops.eyebrow}
          </p>
          <h2 className="font-heading font-bold text-white text-[26px] sm:text-[34px]">{CONTENT.workshops.title}</h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {CONTENT.workshops.items.map((it, i) => (
            <Reveal
              key={it.title}
              style={{ transitionDelay: `${i * 90}ms` }}
              className="bg-ink-700/60 border border-white/10 rounded-2xl p-7 flex flex-col gap-4 hover:-translate-y-1.5 hover:border-gold-500/40 transition-all"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold-500/15 text-gold-400">
                <Icon name={it.icon} size={22} />
              </span>
              <h3 className="font-heading font-semibold text-white text-[18px]">{it.title}</h3>
              <p className="flex items-center gap-1.5 text-[13px] text-gold-300/90 font-medium">
                <Icon name="calendar" size={14} />
                {it.meta}
              </p>
              <p className="text-ink-200 text-[14.5px] leading-relaxed flex-1">{it.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-12">
          <Button as="a" href="#contact" size="lg" icon="arrow-up-right" iconPos="end">
            {CONTENT.workshops.cta}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Plans & Pricing                                                   */
/* ---------------------------------------------------------------- */

function PlanCard({ plan, idx }) {
  const waText = `היי קטי! אני מעוניינ/ת ב${plan.title} 🌿`;
  const payLink = PAYMENT_LINKS[plan.id] || "";
  const ctaHref = payLink || `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(waText)}`;
  return (
    <Reveal
      style={{ transitionDelay: `${idx * 80}ms` }}
      className={`relative flex flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 ${
        plan.highlight
          ? "bg-ink-800 shadow-[0_24px_56px_-16px_rgba(194,151,74,0.45)] ring-2 ring-gold-400"
          : "bg-white border border-ink-100 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]"
      }`}
    >
      {plan.badge && (
        <span
          className="absolute -top-3 right-6 px-4 py-1.5 rounded-full text-white text-[14px] font-heading font-bold tracking-wide"
          style={{ backgroundColor: plan.badgeColor }}
        >
          {plan.badge}
        </span>
      )}

      <div className="flex items-center gap-3 mb-5">
        <span
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${
            plan.highlight ? "bg-gold-500/20 text-gold-400" : "bg-gold-50 text-gold-600"
          }`}
        >
          <Icon name={plan.icon} size={24} />
        </span>
        <h3 className={`font-heading font-bold text-[22px] leading-tight ${plan.highlight ? "text-white" : "text-ink-800"}`}>
          {plan.title}
        </h3>
      </div>

      <div className="mb-1">
        <span className={`font-heading font-extrabold text-[42px] leading-none ${plan.highlight ? "text-gold-400" : "text-gold-600"}`}>
          {plan.price}
        </span>
        <span className={`text-[17px] mr-2 ${plan.highlight ? "text-ink-300" : "text-ink-400"}`}>{plan.priceNote}</span>
      </div>
      {plan.trial && (
        <p className="text-[15px] font-semibold mb-4" style={{ color: plan.badgeColor }}>
          {plan.trial}
        </p>
      )}

      <ul className={`flex flex-col gap-3 flex-1 mt-4 mb-7 ${plan.highlight ? "text-ink-200" : "text-ink-600"}`}>
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-[18px] leading-[1.6]">
            <Icon name="check" size={19} className={`mt-1.5 shrink-0 ${plan.highlight ? "text-gold-400" : "text-gold-500"}`} />
            {f}
          </li>
        ))}
      </ul>

      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full py-4 rounded-full text-center font-heading font-semibold text-[17px] transition-all duration-300 hover:-translate-y-0.5 ${
          plan.highlight
            ? "bg-gold-500 text-white hover:bg-gold-400 shadow-[0_8px_24px_-8px_rgba(194,151,74,0.6)]"
            : "bg-gold-50 text-gold-700 border border-gold-200 hover:bg-gold-100"
        }`}
      >
        {payLink ? `${plan.cta} · תשלום מאובטח` : plan.cta}
      </a>
      {payLink && (
        <p className={`text-center text-[12px] mt-2 ${plan.highlight ? "text-ink-300" : "text-ink-400"}`}>
          לאחר התשלום תקבלי קוד אישי לכניסה למערכת
        </p>
      )}
    </Reveal>
  );
}

function Plans() {
  return (
    <section id="plans" className="py-16 sm:py-24" style={{ background: "linear-gradient(180deg, #FAFAF8 0%, #FFF8F0 100%)" }}>
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[640px] mx-auto mb-4">
          <Eyebrow>{CONTENT.plans.eyebrow}</Eyebrow>
          <h2 className="font-heading font-bold text-ink-800 text-[26px] sm:text-[34px]">{CONTENT.plans.title}</h2>
        </Reveal>
        <Reveal className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-50 border border-gold-200 text-gold-700 text-[13.5px] font-medium">
            <Icon name="gift" size={15} />
            {CONTENT.plans.subtitle}
          </span>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">
          {CONTENT.plans.items.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} idx={i} />
          ))}
        </div>

        <Reveal className="text-center mt-10">
          <p className="text-ink-400 text-[14px]">
            לסדנאות לארגונים, בתי ספר ועמותות —{" "}
            <a
              href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("היי קטי! אני מעוניינ/ת בסדנה לארגון/בית ספר, אשמח לקבל פרטים 🌿")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-600 font-semibold hover:underline"
            >
              לחצי לקבלת הצעת מחיר מותאמת
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Results + testimonials                                            */
/* ---------------------------------------------------------------- */

function Testimonials({ quotes }) {
  const [idx, setIdx] = useState(0);
  const go = useCallback((n) => setIdx((i) => (i + n + quotes.length) % quotes.length), [quotes.length]);

  useEffect(() => {
    const t = setInterval(() => go(1), 7000);
    return () => clearInterval(t);
  }, [go]);

  const q = quotes[idx];
  return (
    <div className="max-w-[680px] mx-auto text-center">
      <Icon name="quote" size={32} className="text-gold-400 mx-auto mb-4" />
      <p key={idx} className="text-ink-700 text-[18px] sm:text-[20px] leading-relaxed font-medium mb-4 min-h-[88px]">
        “{q.text}”
      </p>
      <p className="text-ink-400 text-[14px] font-medium mb-6">{q.who}</p>
      <div className="flex items-center justify-center gap-2" role="tablist" aria-label="עדויות">
        {quotes.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === idx}
            aria-label={`עדות ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === idx ? "bg-gold-500 w-6" : "bg-ink-100"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Results() {
  return (
    <section id="results" className="py-16 sm:py-24 bg-gold-50">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-10">
          <Eyebrow>{CONTENT.results.eyebrow}</Eyebrow>
          <h2 className="font-heading font-bold text-ink-800 text-[26px] sm:text-[34px]">{CONTENT.results.title}</h2>
        </Reveal>

        <Reveal className="flex flex-wrap justify-center gap-3 mb-14">
          {CONTENT.results.pills.map((p) => (
            <span key={p} className="px-4 py-2 rounded-full bg-white border border-gold-200 text-ink-700 text-[14px] font-medium">
              {p}
            </span>
          ))}
        </Reveal>

        <Reveal className="bg-white rounded-3xl shadow-soft p-8 sm:p-12">
          <Testimonials quotes={CONTENT.results.quotes} />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Final CTA / contact                                               */
/* ---------------------------------------------------------------- */

function FinalCta() {
  return (
    <section id="contact" className="py-16 sm:py-24 bg-white">
      <div className="max-w-[760px] mx-auto px-5 sm:px-7 text-center">
        <Reveal>
          <h2 className="font-heading font-bold text-ink-800 text-[28px] sm:text-[38px] mb-4">{CONTENT.finalCta.title}</h2>
          <p className="text-ink-500 text-[17px] mb-9">{CONTENT.finalCta.text}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button as="a" href={waLink("היי קטי! אשמח לקבוע שיחה ראשונית 🌿")} target="_blank" rel="noopener noreferrer" size="lg" icon="whatsapp">
              {CONTENT.finalCta.ctaPrimary}
            </Button>
            <Button as="a" href="#workshops" variant="secondary" size="lg" icon="arrow-left" iconPos="end">
              {CONTENT.finalCta.ctaSecondary}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Footer + floating WhatsApp                                        */
/* ---------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="bg-ink-800 text-ink-200 pt-14 pb-8">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-7">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pb-10 border-b border-white/10">
          <div>
            <Logo size={34} />
            <p className="text-ink-300 text-[14px] leading-relaxed mt-4 max-w-[280px]">{CONTENT.footer.tagline}</p>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3 text-[15px]">ניווט</p>
            <ul className="flex flex-col gap-2">
              {CONTENT.nav.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-ink-300 text-[14.5px] hover:text-gold-400 transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3 text-[15px]">יצירת קשר</p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 text-ink-300 text-[14.5px] hover:text-gold-400 transition-colors">
                  <Icon name="mail" size={16} />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phoneDisplay.replace(/-/g, "")}`} className="flex items-center gap-2 text-ink-300 text-[14.5px] hover:text-gold-400 transition-colors">
                  <Icon name="phone" size={16} />
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={waLink("היי קטי!")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-ink-300 text-[14.5px] hover:text-gold-400 transition-colors">
                  <Icon name="whatsapp" size={16} />
                  וואטסאפ
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="text-ink-400 text-[13px] text-center pt-6">{CONTENT.footer.rights}</p>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  return (
    <a
      href={waLink("היי קטי! אשמח לדבר 🌿")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="פתיחת שיחה בוואטסאפ"
      className="fixed bottom-5 inset-inline-end-5 z-40 w-14 h-14 rounded-full bg-gold-500 text-white shadow-soft flex items-center justify-center hover:bg-gold-600 hover:scale-105 transition-all"
    >
      <Icon name="whatsapp" size={26} />
    </a>
  );
}

/* ---------------------------------------------------------------- */
/* Home page                                                         */
/* ---------------------------------------------------------------- */

function Home({ onEnterApp }) {
  return (
    <>
      <Nav onEnterApp={onEnterApp} />
      <main>
        <Hero />
        <About />
        <Problem />
        <Solution />
        <Journey />
        <Workshops />
        <Plans />
        <Results />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}

window.CureMindsetHome = Home;
window.CONTENT = CONTENT;
window.CONTACT = CONTACT;
window.waLink = waLink;
window.Reveal = Reveal;
window.Button = Button;
window.Eyebrow = Eyebrow;
window.Logo = Logo;
