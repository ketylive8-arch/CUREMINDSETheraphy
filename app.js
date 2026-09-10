// CureMindset — Kety Segev
// Curable-inspired Minimal Landing Page & React App (Babel-in-browser).
// Stack: React 18 (UMD) + Tailwind CSS + inline Lucide icons (icons.js).

const { useState, useEffect, useRef, useCallback } = React;
const Icon = window.Icon;

/* ---------------------------------------------------------------- */
/* Brand constants — KEEP UNCHANGED                                  */
/* ---------------------------------------------------------------- */

const CONTACT = {
  whatsapp: "972543032349",
  phoneDisplay: "054-303-2349",
  email: "ketyse@gmail.com",
  founder: "קטי שגב",
  brand: "CureMindset",
  social: "שיטה פרקטית לשינוי דפוסי תת־מודע, חיזוק חוסן רגשי ובניית ביטחון פנימי אמיתי.",
};

function waLink(text) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}

const PAYMENT_LINKS = {
  digital: "https://pay.grow.link/NDcyNjY~23b0b8d38a77cf03510833361d027ddf-MzY2MDI4MQ",
  youth: "",
  recommended: "",
  premium: "",
};

const MEDIA_LINKS = {
  linktree: "https://linktr.ee/Ketysegev",
  instagram: "https://instagram.com/ketysegev",
  youtubeChannel: "https://www.youtube.com/@ketynlplive",
  radio: "https://youtu.be/8q_5IAAJohQ?si=eL3RHvjbHDqWsuqj",
  spotify: "https://open.spotify.com/episode/3XMpL3GBhi9YQ2FVIZNXd3?si=RGKVlD3VRfqp-W7BKhsQcQ&utm_source=copy-link",
  video1: "https://www.youtube.com/watch?v=u2yy8yY_SN8",
  video2: "",
  article1: "https://ketysegev.blogspot.com/2026/03/blog-post.html",
  article2: "",
};

const BOOKING_LINKS = {
  calendar: "https://calendly.com/ketysegev/meet-with-me",
  zoom: "",
};

function mediaHref(direct, waText) {
  return direct || MEDIA_LINKS.linktree || waLink(waText);
}

function youtubeEmbed(url) {
  if (!url) return "";
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

function spotifyEmbed(url) {
  if (!url) return "";
  const m = url.match(/open\.spotify\.com\/(episode|show|playlist|track|album)\/([\w]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : "";
}

/* ---------------------------------------------------------------- */
/* Content — Curable Inspired Minimal Hebrew Content                 */
/* ---------------------------------------------------------------- */

const CONTENT = {
  nav: {
    links: [
      { label: "איך זה עובד", href: "#how-it-works" },
      { label: "השיטה", href: "#vision" },
      { label: "תוכניות", href: "#plans" },
      { label: "CURE Teens", href: "#cure-teens" },
      { label: "לארגונים", href: "#organizations" },
      { label: "סיפורי שינוי", href: "#results" },
      { label: "מאמרים", href: "#articles" },
      { label: "שאלות נפוצות", href: "#faq" },
    ],
    login: "כניסה למערכת",
    cta: "להתחיל ניסיון חינם",
  },
  hero: {
    kicker: "CureMindset · קטי שגב",
    headline: "הריפוי הרגשי שלך מתחיל כאן",
    subhead: "זה אפשרי. אני אראה לך איך.",
    ctaPrimary: "להתחיל ניסיון חינם",
    ctaNote: "3 ימים חינם · בלי כרטיס אשראי · מתחילים עכשיו",
    banner: "התחילי ב-3 ימי ניסיון חינם · ללא התחייבות · ביטול בכל עת",
    imgAlt: "קטי שגב, מייסדת שיטת CureMindset",
  },
  problem: {
    eyebrow: "מה עובר עלייך?",
    title: "מה עובר עלייך?",
    items: [
      { icon: "brain", text: "המחשבות לא מפסיקות" },
      { icon: "heart", text: "מרגיש/ה לא מספיק טוב/ה" },
      { icon: "wind", text: "הכל יותר מדי" },
      { icon: "compass", text: "לא יודע/ת לאן ללכת" },
    ],
  },
  howItWorks: {
    eyebrow: "איך זה עובד",
    title: "3 צעדים פשוטים לשינוי",
    steps: [
      { step: "1", title: "מדברים", text: "כותבים בחופשיות. קטי הדיגיטלית מקשיבה ומבינה." },
      { step: "2", title: "מקבלים כלים", text: "תרגול אחד קטן שאפשר לעשות עכשיו. לא תיאוריה — פעולה." },
      { step: "3", title: "משתנים", text: "כל יום צעד קטן. ב-3 ימים כבר מרגישים את ההבדל." },
    ],
  },
  method: {
    eyebrow: "השיטה",
    title: "הכוח לשנות נמצא כבר בתוכך. אני כאן לעזור לך למצוא אותו.",
    items: [
      { icon: "eye", title: "בהירות", text: "מזהים את הדפוס שמייצר את התחושה הקבועה." },
      { icon: "shield", title: "חוסן", text: "בונים יציבות פנימית שלא תלויה באישור חיצוני." },
      { icon: "refresh-cw", title: "חשיבה מחודשת", text: "משנים את הדפוס מבפנים והשינוי מחזיק." },
      { icon: "trending-up", title: "העצמה", text: "יוצאים עם כלים מעשיים לחיים." },
    ],
    approachTitle: "איך זה עובד באמת — מתחת לפני השטח",
    approachLead: "השיטה עובדת דרך תת-המודע, אבל לא באמצעות מילים או שכנוע. אנחנו עובדים ברמה החושית והתת-חושית — שם באמת נשמרים הדפוסים.",
    approachBody: "המחקר מראה שיש ארבע דרכים בסיסיות שבהן אנשים מגיבים לחוויות חושיות. כשאנחנו יוצרים תהליך מדויק בדמיון המודרך, אנחנו פותחים בדיוק את מסלולי התגובה האלה — ודרך ארבעת הדפוסים האלה אפשר לייצר מחדש תחושות של רוגע, הנאה, ביטחון והתלהבות, ובאותה דרך ממש לשחרר התנהגויות ותגובות שכבר לא משרתות אותך.",
    approachClose: "זו לא תיאוריה ולא חשיבה חיובית — זו עבודה עדינה ומדויקת עם השפה הפנימית של מערכת העצבים.",
  },
  workshops: {
    eyebrow: "סדנאות",
    title: "סדנאות ותוכניות CureMindset",
    subtitle: "מפגשים ממוקדים בקבוצות קטנות ובאווירה תומכת",
    items: [
      { icon: "compass", title: "המצפן הפנימי — מנהיגות ורווחה", meta: "3 מפגשים · עד 8 משתתפים", text: "פיצוח קוד העוצמה האישית, ניהול רגשות תחת לחץ ובניית חוסן רגשי לעתיד." },
      { icon: "user-round", title: "שינוי רמת זהות", meta: "10 שלבים · מבוגרים / נוער", text: "עבודה עמוקה ברמת הזהות: מיפוי אמונות מגבילות, פירוק הטעינה הרגשית ובניית זהות חדשה." },
      { icon: "sparkles", title: "Future Pacing — עיגון העתיד", meta: "8 שלבים · סדנה ממוקדת", text: "בניית זיכרון עתידי עשיר, עיגון גופני וחזרה מנטלית מדורגת תחת לחץ." },
    ],
    cta: "לבדוק זמינות לסדנה הקרובה",
  },
  plans: {
    eyebrow: "תוכניות",
    title: "בחרי את המסלול שמתאים לך",
    subtitle: "3 ימים חינם · בלי כרטיס אשראי · ביטול בכל עת",
    items: [
      {
        id: "basic",
        badge: "בסיסי",
        price: "₪97/חודש",
        audience: "מבוגר/ת שרוצה להתחיל בקצב שלו/ה",
        features: ["צ'אט AI", "מודולים 1-3", "צ'ק-אין יומי", "עוגן SOS"],
        highlight: false,
        cta: "להתחיל ניסיון חינם",
      },
      {
        id: "plus",
        badge: "מומלץ",
        price: "₪197/חודש",
        audience: "מבוגר/ת או הורה שרוצה תהליך מלא",
        features: [
          "כל מה בבסיסי",
          "כל המודולים",
          "אודיו מודרך",
          "מעקב מתקדם",
          "ניתוח דפוסים",
        ],
        highlight: true,
        cta: "להתחיל ניסיון חינם",
      },
      {
        id: "premium",
        badge: "פרימיום",
        price: "₪397/חודש",
        audience: "מי שרוצה גם ליווי חי — מפגש זום אישי",
        features: [
          "כל מה באמצע",
          "סדנה חודשית",
          "קהילה פרטית",
          "מפגש זום חודשי",
        ],
        highlight: false,
        cta: "להתחיל ניסיון חינם",
      },
    ],
  },
  testimonials: {
    eyebrow: "סיפורי שינוי",
    title: "מה משתנה כשעובדים עם השיטה",
    quotes: [
      {
        text: "תוך כמה שבועות הבת שלי הפסיקה לפחד לדבר על מה שמרגישה. זה שינה את היחסים בינינו.",
        who: "אמא לנערה בתהליך",
      },
      {
        text: "למדתי לעצור את עצמי באמצע התקף חרדה ולחזור לאיזון בלי שאף אחד ידע שזה קרה.",
        who: "משתתפת בתהליך אישי",
      },
      {
        text: "הסדנה בבית הספר היתה הדבר הראשון שבאמת דיבר אל התלמידים בגובה העיניים.",
        who: "יועצת חינוכית",
      },
    ],
  },
  faq: {
    eyebrow: "שאלות נפוצות",
    title: "כל מה שחשוב לדעת לפני שמתחילים",
    items: [
      { q: "למי השירות מתאים?", a: "למבוגרים, להורים ולבני נוער (13+) שמתמודדים עם חרדה, עומס, דחיינות, דימוי עצמי נמוך או תקיעות רגשית — ורוצים כלים מעשיים לחוסן וביטחון. יש מסלולים נפרדים למבוגרים, להורים ולנוער." },
      { q: "כמה זמן זה לוקח ביום?", a: "מעט. כל יום צעד קטן אחד — שיחה קצרה, שיעור של כמה דקות או תרגול. בנוי כך שייכנס לחיים העמוסים ביותר, לא יעמיס עליהם." },
      { q: "מה כולל הניסיון החינם?", a: "3 ימי התנסות מלאים — בלי כרטיס אשראי ובלי התחייבות. מתנסים בשיחה, בכלים ובתרגולים, ורק בסוף מחליטים אם ממשיכים." },
      { q: "מה לגבי פרטיות?", a: "כל מה שאת/ה משתף/ת נשמר מוצפן ופרטי. איננו מוכרים מידע. אפשר למחוק את החשבון והנתונים בכל עת." },
      { q: "ה-AI — זה מטפל?", a: "לא. \"קטי הדיגיטלית\" היא כלי לאימון, למידה ותרגול המבוסס על השיטה של קטי. היא אינה נותנת אבחנה, אינה תחליף לטיפול רפואי או נפשי, ואינה מיועדת למצבי חירום." },
      { q: "אני הורה — איך זה עובד עם בן/בת נוער?", a: "לנוער יש מסלול ייעודי (CURE Teens) עם ליווי אישי והדרכת הורים. מתחילים בשיחת אבחון קצרה ללא עלות, שבה נתאים יחד את המסלול והקצב." },
      { q: "אפשר לבטל?", a: "כן, בכל עת. הביטול עוצר את החיוב מהמחזור הבא, בלי קנסות ובלי שיחות שכנוע." },
    ],
    disclaimer: "CureMindset הוא כלי לאימון, למידה ותרגול אישי בשיטת NLP. הוא אינו תחליף לאבחון, לטיפול רפואי או נפשי, ואינו מיועד למצבי חירום. במצוקה מיידית פנו לעזרה מקצועית — קו סיוע נפשי (ער\"ן) 1201, מד\"א 101, או פנייה לרופא/ה או למטפל/ת.",
  },
  finalCta: {
    title: "השינוי מתחיל בשיחה אחת",
    text: "אין צורך להגיע מוכנים. רק רוצים לדבר ולבדוק אם זה מתאים.",
    ctaPrimary: "להתחיל ניסיון חינם",
    ctaSecondaryText: "יש שאלה? שלחי וואטסאפ",
  },
  footer: {
    tagline: CONTACT.social,
    rights: `© ${new Date().getFullYear()} CureMindset · קטי שגב. כל הזכויות שמורות.`,
  },
};

/* ---------------------------------------------------------------- */
/* Hooks & Shared Components                                         */
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
      className={`transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Logo({ size = 48 }) {
  const [err, setErr] = useState(false);
  if (err) {
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
      src="images/logo.svg"
      alt="CureMindset — By Kety Segev"
      style={{ height: size, width: "auto", objectFit: "contain" }}
      onError={() => setErr(true)}
    />
  );
}

function Eyebrow({ children }) {
  return (
    <p className="font-heading text-[13px] font-semibold tracking-[0.18em] uppercase text-gold-600 mb-3 text-center">
      {children}
    </p>
  );
}

function Button({ as = "a", variant = "primary", size = "md", icon, iconPos = "start", className = "", children, ...rest }) {
  const Tag = as;
  const base =
    "inline-flex items-center justify-center gap-2.5 font-heading font-semibold rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold-600 select-none";
  const sizes = { md: "px-6 py-3.5 text-[15px] sm:text-base", lg: "px-8 py-4 text-base sm:text-lg" };
  const variants = {
    primary:
      "bg-gold-500 text-white shadow-[0_14px_34px_-14px_rgba(194,151,74,0.7)] hover:bg-gold-600 hover:-translate-y-0.5 hover:shadow-[0_20px_46px_-16px_rgba(194,151,74,0.85)]",
    secondary:
      "bg-white text-ink-800 border border-ink-100 hover:bg-gold-50 hover:border-gold-300 hover:-translate-y-0.5",
    dark: "bg-ink-800 text-white hover:bg-ink-700 hover:-translate-y-0.5",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-50",
    outline:
      "bg-transparent text-gold-700 border border-gold-400 hover:bg-gold-50 hover:-translate-y-0.5",
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
        scrolled ? "bg-white/90 backdrop-blur-md shadow-softer border-b border-ink-100/70" : "bg-transparent"
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
          <Button as="a" href={waLink("היי קטי! אשמח להתחיל ניסיון חינם בשיטת CureMindset")} target="_blank" rel="noopener noreferrer" size="md">
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
            <Button as="a" href={waLink("היי קטי! אשמח להתחיל ניסיון חינם")} target="_blank" rel="noopener noreferrer" className="w-full">
              {CONTENT.nav.cta}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------- */
/* Hero — Curable Minimal Style                                      */
/* ---------------------------------------------------------------- */

function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-[#FAF8F4] pt-[130px] pb-16 sm:pt-[160px] sm:pb-24 text-center">
      <div className="max-w-[840px] mx-auto px-5 sm:px-7">
        <Reveal>
          <span className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white border border-gold-200/80 font-heading text-[13px] font-semibold text-gold-700 shadow-softer">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" aria-hidden="true" />
            {CONTENT.hero.kicker}
          </span>
          <h1 className="font-heading font-extrabold text-ink-800 leading-[1.12] tracking-tight text-[38px] sm:text-[54px] lg:text-[64px] mb-6">
            {CONTENT.hero.headline}
          </h1>
          <p className="text-ink-600 text-[20px] sm:text-[24px] font-medium leading-relaxed max-w-[620px] mx-auto mb-4">
            {CONTENT.hero.subhead}
          </p>
          <p className="text-ink-500 text-[15.5px] sm:text-[16.5px] font-medium max-w-[620px] mx-auto mb-9">
            חרדה · לחץ ועומס · דחיינות · דימוי עצמי נמוך — בדרך לחוסן, ביטחון ושקט פנימי. לך, או לבן/בת שלך.
          </p>

          <div className="flex flex-col items-center justify-center gap-3">
            <Button
              as="a"
              href={waLink("היי קטי! אשמח להתחיל ניסיון חינם")}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              className="px-10 py-4 text-[18px] shadow-lg"
            >
              {CONTENT.hero.ctaPrimary}
            </Button>
            <p className="text-[14px] font-medium text-ink-500 mt-1">
              {CONTENT.hero.ctaNote}
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-12 sm:mt-16 flex justify-center">
          <div className="relative w-full max-w-[360px] sm:max-w-[420px] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-soft bg-white p-2.5 ring-1 ring-gold-200/60">
            <picture>
              <source srcSet="images/kety-640.webp 640w, images/kety-920.webp 920w" type="image/webp" sizes="(max-width:1024px) 360px, 420px" />
              <img
                src="images/kety-640.jpg"
                srcSet="images/kety-640.jpg 640w, images/kety-920.jpg 920w"
                sizes="(max-width:1024px) 360px, 420px"
                alt={CONTENT.hero.imgAlt}
                width={920}
                height={1150}
                loading="eager"
                decoding="async"
                className="w-full h-full object-cover rounded-[1.5rem]"
              />
            </picture>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FreeTrialBanner() {
  return (
    <section className="bg-white border-y border-gold-200/60 py-5">
      <div className="max-w-[1180px] mx-auto px-5 text-center">
        <p className="font-heading font-semibold text-[16px] sm:text-[18px] text-gold-700 flex items-center justify-center gap-2">
          <Icon name="sparkles" size={20} className="text-gold-500" />
          {CONTENT.hero.banner}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Problem ("מה עובר עלייך?")                                          */
/* ---------------------------------------------------------------- */

function Problem() {
  return (
    <section id="problem" className="py-20 sm:py-28 bg-white">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-14">
          <Eyebrow>{CONTENT.problem.eyebrow}</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[30px] sm:text-[42px] leading-tight">
            {CONTENT.problem.title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CONTENT.problem.items.map((it, i) => (
            <Reveal
              key={i}
              style={{ transitionDelay: `${i * 70}ms` }}
              className="bg-[#FAF8F4] border border-ink-100/80 rounded-2xl p-7 flex flex-col items-center text-center gap-4 hover:border-gold-300 hover:shadow-softer transition-all cursor-pointer group"
              onClick={() => {
                const el = document.getElementById("plans");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white text-gold-600 shadow-softer group-hover:scale-110 transition-transform">
                <Icon name={it.icon} size={24} />
              </span>
              <p className="text-ink-800 font-semibold text-[17px] leading-snug">{it.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* How It Works (3 Steps Curable Style)                             */
/* ---------------------------------------------------------------- */

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-[#FAF8F4]">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-16">
          <Eyebrow>{CONTENT.howItWorks.eyebrow}</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[30px] sm:text-[42px] leading-tight">
            {CONTENT.howItWorks.title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {CONTENT.howItWorks.steps.map((st, i) => (
            <Reveal key={st.step} style={{ transitionDelay: `${i * 90}ms` }} className="bg-white rounded-2xl p-8 border border-gold-100 shadow-softer flex flex-col items-center">
              <span className="font-heading font-black text-6xl text-gold-500/80 mb-4 select-none">
                {st.step}
              </span>
              <h3 className="font-heading font-bold text-[22px] text-ink-800 mb-3">{st.title}</h3>
              <p className="text-ink-600 text-[16.5px] leading-relaxed">{st.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Vision / Method (4 Pillars)                                      */
/* ---------------------------------------------------------------- */

function Vision() {
  return (
    <section id="vision" className="py-20 sm:py-28 bg-white">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[760px] mx-auto mb-16">
          <Eyebrow>{CONTENT.method.eyebrow}</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[28px] sm:text-[40px] leading-tight">
            {CONTENT.method.title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CONTENT.method.items.map((it, i) => (
            <Reveal
              key={it.title}
              style={{ transitionDelay: `${i * 80}ms` }}
              className="bg-[#FAF8F4] border border-gold-200/70 rounded-2xl p-8 flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform shadow-softer"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold-100 text-gold-700">
                <Icon name={it.icon} size={22} />
              </span>
              <h3 className="font-heading font-bold text-ink-800 text-[21px]">{it.title}</h3>
              <p className="text-ink-600 text-[16.5px] leading-relaxed">{it.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 max-w-[860px] mx-auto">
          <div className="bg-[#FAF8F4] border border-gold-200/70 rounded-2xl p-8 sm:p-10 shadow-softer">
            <h3 className="font-heading font-extrabold text-ink-800 text-[22px] sm:text-[26px] mb-4">
              {CONTENT.method.approachTitle}
            </h3>
            <p className="text-ink-700 text-[17px] leading-relaxed mb-4 font-medium">
              {CONTENT.method.approachLead}
            </p>
            <p className="text-ink-600 text-[16.5px] leading-relaxed mb-4">
              {CONTENT.method.approachBody}
            </p>
            <p className="text-ink-500 text-[15.5px] leading-relaxed border-r-2 border-gold-300 pr-4">
              {CONTENT.method.approachClose}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* About (Founder & Credentials)                                    */
/* ---------------------------------------------------------------- */

function About() {
  return (
    <section id="about" className="py-16 sm:py-24 bg-[#FAF8F4] border-t border-gold-200/50">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <div className="grid grid-cols-1 lg:grid-cols-[.8fr_1.2fr] gap-10 items-center">
          <Reveal className="flex justify-center">
            <div className="w-full max-w-[340px] aspect-[4/5] rounded-2xl overflow-hidden shadow-soft ring-1 ring-gold-200/70 bg-white p-2">
              <img
                src="images/kety-about.jpg"
                alt="קטי שגב"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => { e.currentTarget.src = "images/kety-640.jpg"; }}
              />
            </div>
          </Reveal>
          <Reveal className="flex flex-col gap-4">
            <Eyebrow>על המייסדת</Eyebrow>
            <h2 className="font-heading font-extrabold text-ink-800 text-[28px] sm:text-[36px]">קטי שגב · CureMindset</h2>
            <p className="text-ink-600 text-[17px] leading-relaxed">
              מפתחת שיטת CureMindset, מאמנת מנטלית ומטפלת NLP בכירה. לאורך השנים לוויתי מאות בני נוער, מבוגרים והורים בתהליכי עומק לשחרור חרדות, בניית חוסן נפשי ויציבות פנימית אמיתית.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="bg-white p-4 rounded-xl border border-gold-200/60 text-center">
                <span className="font-heading font-extrabold text-gold-600 text-[20px] block">+500</span>
                <span className="text-[13.5px] text-ink-600 font-medium">תהליכים אישיים</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gold-200/60 text-center">
                <span className="font-heading font-extrabold text-gold-600 text-[20px] block">NLP Master</span>
                <span className="text-[13.5px] text-ink-600 font-medium">הסמכה בינלאומית</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gold-200/60 text-center">
                <span className="font-heading font-extrabold text-gold-600 text-[20px] block">100%</span>
                <span className="text-[13.5px] text-ink-600 font-medium">כלים מעשיים</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Workshops (Simplified)                                           */
/* ---------------------------------------------------------------- */

function Workshops() {
  return (
    <section id="workshops" className="py-20 sm:py-28 bg-white">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-14">
          <Eyebrow>{CONTENT.workshops.eyebrow}</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[30px] sm:text-[40px]">{CONTENT.workshops.title}</h2>
          <p className="text-ink-500 text-[17px] mt-2">{CONTENT.workshops.subtitle}</p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {CONTENT.workshops.items.map((it, i) => (
            <Reveal
              key={it.title}
              style={{ transitionDelay: `${i * 90}ms` }}
              className="bg-[#FAF8F4] border border-ink-100 rounded-2xl p-7 flex flex-col gap-3 shadow-softer hover:border-gold-300 transition-all"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gold-100 text-gold-700">
                <Icon name={it.icon} size={20} />
              </span>
              <span className="text-[13px] font-semibold text-gold-600 tracking-wide">{it.meta}</span>
              <h3 className="font-heading font-bold text-ink-800 text-[20px]">{it.title}</h3>
              <p className="text-ink-600 text-[15px] leading-relaxed flex-1">{it.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center">
          <Button as="a" href={waLink("היי קטי! אשמח לפרטים על הסדנה הקרובה")} target="_blank" rel="noopener noreferrer" variant="secondary" size="md">
            {CONTENT.workshops.cta}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* CURE Teens                                                       */
/* ---------------------------------------------------------------- */

const CURE_TEENS_NAVY = "linear-gradient(180deg, #0B1A2B 0%, #123047 100%)";
const CURE_TEENS_CTA_TEXT = "לקביעת פגישת אבחון ופיצוח דפוסים";

function CureTeens() {
  return (
    <section id="cure-teens" className="py-20 sm:py-28 relative overflow-hidden" style={{ background: CURE_TEENS_NAVY }}>
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7 relative">
        <Reveal className="text-center max-w-[800px] mx-auto mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border font-heading text-[13px] font-semibold mb-6" style={{ borderColor: "rgba(52,211,153,.4)", color: "#6EE7B7" }}>
            <Icon name="graduation-cap" size={15} />
            CURE Teens · תהליך מאיץ למתבגרים
          </span>
          <h2 className="font-heading font-extrabold text-white text-[30px] sm:text-[42px] leading-tight mb-4">
            מהמסכים אל החיים — פוקוס, ויסות רגשי ותקשורת בבית
          </h2>
          <p className="text-white/75 text-[17px] sm:text-[18px] leading-relaxed">
            תהליך מבוסס NLP וחקר המוח שבונה למתבגר/ת מערכת הפעלה חדשה — מניתוק ודחיינות אל חוסן פנימי, ביטחון ותקשורת מקרבת.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {[
            { letter: "C", title: "Clarity · בהירות", text: "פיצוח הזהות האישית מעבר למסכים וזיהוי ערכי הליבה." },
            { letter: "U", title: "Understand · הבנה", text: "הבנת מנגנון המוח והשחרור מתקיעות רגשית ודחיינות." },
            { letter: "R", title: "Rewire · חיווט מחדש", text: "שינוי תגובות אוטומטיות ללחץ ובניית חוסן רגשי." },
            { letter: "E", title: "Empower · העצמה", text: "הנדסת הרגלים, עצמאות רגשית ותקשורת מקרבת." },
          ].map((p, i) => (
            <Reveal key={p.letter} style={{ transitionDelay: `${i * 80}ms` }} className="rounded-2xl bg-white/[0.05] border border-white/10 p-6 text-center backdrop-blur-sm">
              <span className="font-heading font-black text-3xl block mb-2" style={{ color: "#6EE7B7" }}>{p.letter}</span>
              <h3 className="font-heading font-bold text-[17px] text-white mb-2">{p.title}</h3>
              <p className="text-white/65 text-[14px] leading-relaxed">{p.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-[820px] mx-auto">
          {[
            { icon: "calendar", label: "6 מפגשים", sub: "תהליך מלא ומובנה" },
            { icon: "clock", label: "50 דקות", sub: "כל מפגש אישי" },
            { icon: "user-round", label: "1:1 · פרונטלי או זום", sub: "ליווי אישי צמוד" },
            { icon: "users", label: "מפגשי הדרכה להורים", sub: "שינוי שמחזיק גם בבית" },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl bg-white/[0.05] border border-white/10 p-5 text-center backdrop-blur-sm">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3" style={{ background: "rgba(52,211,153,.12)", color: "#6EE7B7" }}>
                <Icon name={f.icon} size={19} />
              </span>
              <p className="font-heading font-bold text-[15px] text-white leading-tight">{f.label}</p>
              <p className="text-white/55 text-[12.5px] mt-1">{f.sub}</p>
            </div>
          ))}
        </Reveal>

        <Reveal className="text-center">
          <Button as="a" href={BOOKING_LINKS.calendar || waLink(CURE_TEENS_CTA_TEXT)} target="_blank" rel="noopener noreferrer" className="bg-[#10B981] hover:bg-[#0E7C63] text-white border-0">
            {CURE_TEENS_CTA_TEXT}
          </Button>
          <p className="text-white/60 text-[13.5px] leading-relaxed mt-4 max-w-[560px] mx-auto">
            מתחילים בשיחת אבחון של 20 דקות — ללא עלות וללא התחייבות. בשיחה נכיר את המתבגר/ת, נזהה את הדפוס ונבנה יחד את המסלול והקצב המתאימים. CURE Teens הוא מסלול ליווי אישי לנוער (13+) והורים, נפרד מתוכניות האפליקציה החודשיות שלמטה.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Plans / Pricing (3 Tiers Curable Style)                           */
/* ---------------------------------------------------------------- */

function PlanCard({ plan, idx, onEnterApp }) {
  const isPlus = plan.highlight;
  return (
    <Reveal
      style={{ transitionDelay: `${idx * 90}ms` }}
      className={`rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
        isPlus
          ? "bg-white border-2 border-gold-400 shadow-soft scale-102 lg:-translate-y-2 z-10"
          : "bg-[#FAF8F4] border border-ink-100/80 shadow-softer"
      }`}
    >
      {isPlus && (
        <span className="absolute -top-3.5 inset-x-0 mx-auto w-fit px-4 py-1 rounded-full bg-gold-500 text-white font-heading font-bold text-[12px] tracking-wide uppercase shadow-sm">
          {plan.badge}
        </span>
      )}
      <div>
        {!isPlus && (
          <span className="inline-block px-3 py-1 rounded-full bg-gold-100 text-gold-700 font-heading font-semibold text-[12.5px] mb-3">
            {plan.badge}
          </span>
        )}
        <div className="mt-2 mb-3">
          <span className="font-heading font-extrabold text-ink-800 text-[36px] sm:text-[42px] leading-none">
            {plan.price}
          </span>
        </div>
        {plan.audience && (
          <p className="mb-5 text-[13px] text-ink-500 leading-snug">
            <span className="font-semibold text-ink-700">מתאים ל: </span>{plan.audience}
          </p>
        )}

        <ul className="flex flex-col gap-3 mb-8">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 text-ink-700 text-[15.5px] font-medium">
              <Icon name="check-circle-2" size={18} className="text-gold-600 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        as="button"
        type="button"
        onClick={() => {
          if (PAYMENT_LINKS[plan.id]) {
            window.open(PAYMENT_LINKS[plan.id], "_blank");
          } else {
            onEnterApp ? onEnterApp() : window.open(waLink(`היי קטי! אשמח להתחיל במסלול ${plan.badge}`), "_blank");
          }
        }}
        variant={isPlus ? "primary" : "secondary"}
        size="md"
        className="w-full mt-4"
      >
        {plan.cta}
      </Button>
    </Reveal>
  );
}

function Plans({ onEnterApp }) {
  return (
    <section id="plans" className="py-20 sm:py-28 bg-[#FAF8F4]">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[640px] mx-auto mb-4">
          <Eyebrow>{CONTENT.plans.eyebrow}</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[30px] sm:text-[42px]">
            {CONTENT.plans.title}
          </h2>
        </Reveal>
        <Reveal className="text-center mb-14">
          <p className="text-ink-600 text-[17px] font-medium">
            {CONTENT.plans.subtitle}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-stretch">
          {CONTENT.plans.items.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} idx={i} onEnterApp={onEnterApp} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Organizations                                                    */
/* ---------------------------------------------------------------- */

function Organizations() {
  return (
    <section id="organizations" className="py-20 sm:py-28 bg-white border-t border-ink-100">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7 text-center">
        <Reveal className="max-w-[760px] mx-auto mb-12">
          <Eyebrow>לארגונים ולבתי ספר</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[28px] sm:text-[38px] mb-4">
            סדנאות חוסן ואימון מנטלי לצוותים
          </h2>
          <p className="text-ink-600 text-[17px] leading-relaxed">
            הרצאות וסדנאות מותאמות אישית לארגונים, חברות הייטק, מוסדות חינוך ומכינות — כלים מעשיים להתמודדות עם לחץ ושחיקה.
          </p>
        </Reveal>

        <Reveal className="mb-10">
          <p className="font-heading text-[13px] font-semibold tracking-[0.14em] uppercase text-gold-600 mb-5">כבר העברתי סדנאות והרצאות ב־</p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            {["מרכז הצעירים · קריית מוצקין", "עמותת יסמין", "מרכז תכלת"].map((name) => (
              <span key={name} className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F4] border border-gold-200/80 px-5 py-2.5 text-ink-700 font-heading font-semibold text-[14.5px] shadow-softer">
                <Icon name="shield-check" size={16} className="text-gold-500 shrink-0" />
                {name}
              </span>
            ))}
          </div>
          <p className="text-ink-500 text-[14px] mt-5">
            פורמט טיפוסי: מפגש בן 60–90 דקות, לקבוצות של עד 30 משתתפים — מותאם לצוות, למורים/יועצות או לבני נוער.
          </p>
        </Reveal>

        <Reveal>
          <Button as="a" href={BOOKING_LINKS.calendar || waLink("היי קטי! אשמח לפרטים על סדנה לארגון")} target="_blank" rel="noopener noreferrer" variant="secondary" size="md">
            לקביעת שיחת היכרות לארגון
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Testimonials / Results (Curable Clean Cards)                     */
/* ---------------------------------------------------------------- */

function Testimonials() {
  return (
    <section id="results" className="py-20 sm:py-28 bg-[#FAF8F4]">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-16">
          <Eyebrow>{CONTENT.testimonials.eyebrow}</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[30px] sm:text-[42px]">
            {CONTENT.testimonials.title}
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {CONTENT.testimonials.quotes.map((q, i) => (
            <Reveal
              key={i}
              style={{ transitionDelay: `${i * 90}ms` }}
              className="bg-white rounded-2xl p-8 border border-gold-200/60 shadow-softer flex flex-col justify-between"
            >
              <p className="text-ink-700 text-[17px] leading-relaxed font-medium mb-6">
                “{q.text}”
              </p>
              <p className="text-gold-700 text-[14.5px] font-semibold">
                — {q.who}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Lead Capture Form  →  POST /api/send-lead                        */
/* ---------------------------------------------------------------- */

const LEAD_SUBJECTS = [
  { value: "", label: "מה מעניין אותך?" },
  { value: "personal", label: "ליווי אישי (מבוגרים)" },
  { value: "teens", label: "CURE Teens — נוער והורים" },
  { value: "organization", label: "סדנה / הרצאה לארגון" },
  { value: "other", label: "אחר / לא בטוחה עדיין" },
];

function normalizePhone(v) {
  return (v || "").replace(/[^\d]/g, "");
}

function LeadForm({ compact = false }) {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", subject: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  function validate() {
    const er = {};
    if (!form.fullName || form.fullName.trim().length < 2) er.fullName = "נא למלא שם מלא";
    const phone = normalizePhone(form.phone);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    const phoneOk = /^05\d{8}$/.test(phone);
    if (!form.phone && !form.email) {
      er.phone = "נא להשאיר טלפון או אימייל";
    } else {
      if (form.phone && !phoneOk) er.phone = "מספר נייד לא תקין (10 ספרות, מתחיל ב-05)";
      if (form.email && !emailOk) er.email = "כתובת אימייל לא תקינה";
    }
    return er;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const er = validate();
    if (Object.keys(er).length) { setErrors(er); return; }
    setStatus("sending");
    const subjectLabel = (LEAD_SUBJECTS.find((s) => s.value === form.subject) || {}).label || "";
    try {
      const res = await fetch("/api/send-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: normalizePhone(form.phone),
          onboarding: subjectLabel,
          source: "landing-lead-form",
        }),
      });
      if (!res.ok) throw new Error("bad status " + res.status);
      setStatus("done");
    } catch (_err) {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl bg-white border border-gold-200 shadow-soft p-8 text-center max-w-[520px] mx-auto">
        <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center mx-auto mb-4">
          <Icon name="check-circle-2" size={26} />
        </div>
        <h3 className="font-heading font-extrabold text-ink-800 text-[22px] mb-2">קיבלנו את הפרטים שלך</h3>
        <p className="text-ink-600 text-[15.5px] mb-6">
          קטי או מישהי מהצוות תחזור אליך בהקדם. רוצה להתחיל כבר עכשיו? אפשר לכתוב לנו ישירות בוואטסאפ.
        </p>
        <Button as="a" href={waLink("היי קטי! השארתי פרטים באתר ואשמח להתקדם")} target="_blank" rel="noopener noreferrer" size="md" className="mx-auto">
          <Icon name="whatsapp" size={18} className="shrink-0" />
          להמשך שיחה בוואטסאפ
        </Button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border bg-white px-4 py-3.5 text-[15.5px] text-ink-800 placeholder-ink-400 outline-none transition-colors focus:border-gold-400 focus:ring-2 focus:ring-gold-200";
  const errCls = "text-[13px] text-red-600 mt-1";

  return (
    <form onSubmit={onSubmit} noValidate className={`text-start ${compact ? "" : "rounded-2xl bg-white border border-ink-100 shadow-soft p-7 sm:p-9"} max-w-[520px] mx-auto`}>
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="lead-name" className="block text-[14px] font-semibold text-ink-700 mb-1.5">שם מלא</label>
          <input id="lead-name" type="text" autoComplete="name" value={form.fullName} onChange={set("fullName")}
            placeholder="איך לפנות אליך?" className={`${inputCls} ${errors.fullName ? "border-red-400" : "border-ink-200"}`}
            aria-invalid={!!errors.fullName} />
          {errors.fullName && <p className={errCls}>{errors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="lead-phone" className="block text-[14px] font-semibold text-ink-700 mb-1.5">טלפון נייד</label>
          <input id="lead-phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={form.phone} onChange={set("phone")}
            placeholder="050-000-0000" className={`${inputCls} text-right ${errors.phone ? "border-red-400" : "border-ink-200"}`}
            aria-invalid={!!errors.phone} />
          {errors.phone && <p className={errCls}>{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="lead-email" className="block text-[14px] font-semibold text-ink-700 mb-1.5">אימייל</label>
          <input id="lead-email" type="email" inputMode="email" autoComplete="email" dir="ltr" value={form.email} onChange={set("email")}
            placeholder="name@email.com" className={`${inputCls} text-right ${errors.email ? "border-red-400" : "border-ink-200"}`}
            aria-invalid={!!errors.email} />
          {errors.email && <p className={errCls}>{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="lead-subject" className="block text-[14px] font-semibold text-ink-700 mb-1.5">מה מעניין אותך?</label>
          <select id="lead-subject" value={form.subject} onChange={set("subject")}
            className={`${inputCls} border-ink-200 appearance-none`}
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A9987A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "left 1rem center",
              backgroundSize: "16px 16px",
            }}>
            {LEAD_SUBJECTS.map((s) => (
              <option key={s.value} value={s.value} disabled={s.value === ""}>{s.label}</option>
            ))}
          </select>
        </div>

        {status === "error" && (
          <p className="text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-center">
            משהו השתבש בשליחה. אפשר לנסות שוב או לכתוב לנו בוואטסאפ.
          </p>
        )}

        <Button as="button" type="submit" variant="primary" size="md" className="w-full mt-1" disabled={status === "sending"}>
          {status === "sending" ? "שולח…" : "שליחה — ונחזור אליך"}
        </Button>

        <p className="text-[12.5px] text-ink-400 text-center leading-relaxed">
          הפרטים נשמרים אצל קטי בלבד ולא מועברים לגורם שלישי. 3 ימי התנסות · בלי כרטיס אשראי · ביטול בכל עת.
        </p>
      </div>
    </form>
  );
}

function LeadSection() {
  return (
    <section id="lead" className="py-20 sm:py-28 bg-white border-t border-ink-100">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <Eyebrow>נתחיל לדבר</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[30px] sm:text-[42px] mb-4 leading-tight">
            השאירי פרטים — ונחזור אליך
          </h2>
          <p className="text-ink-600 text-[17px] leading-relaxed mb-6">
            לא צריך להגיע עם תשובות. משאירים שם וטלפון או אימייל, ואנחנו חוזרים אליך כדי לבדוק יחד אם השיטה מתאימה לך או לבן/בת שלך.
          </p>
          <ul className="flex flex-col gap-2.5">
            {["3 ימי התנסות חינם — בלי התחייבות", "שיחה אישית להיכרות והתאמה", "פרטיות מלאה — הנתונים שלך נשארים אצלנו"].map((t, i) => (
              <li key={i} className="flex items-center gap-2.5 text-ink-700 text-[15.5px] font-medium">
                <Icon name="check-circle-2" size={18} className="text-gold-600 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal style={{ transitionDelay: "120ms" }}>
          <LeadForm />
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Articles — ספריית הידע (מושכת מ-/api/articles, בלוג קטי)           */
/* הוחזר אחרי שהוסר בטעות בריעצוב (commit 5c18476). ראה IMPLEMENTATION_AUDIT.md */
/* ---------------------------------------------------------------- */

function ArticlesSection() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/articles")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => { if (alive) setItems(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);

  // נפילה: מאמרים מקוריים המקשרים לבלוג — כדי שהסקשן לעולם לא יהיה ריק.
  const fallback = [
    { title: "חרדה אצל בני נוער — מה קורה במוח ואיך מרגיעים אותו", link: MEDIA_LINKS.article1 || "https://ketysegev.blogspot.com/", description: "חרדה אינה חולשה — היא מערכת התראה שלמדה לירות מוקדם מדי. עובדים עם ויסות מערכת העצבים לצד מסגור מחדש של המחשבה." },
    { title: "דימוי עצמי נמוך: איך בונים ביטחון פנימי שמחזיק", link: "https://ketysegev.blogspot.com/", description: "ביטחון אמיתי נבנה מ'עוגן בית' פנימי — ערך עצמי וכבוד — ולא ממחמאות מבחוץ. מזהים את הקול המבקר ומפרידים אותו מהעובדות." },
    { title: "חוסן רגשי בתקופה לא יציבה — שלושה כלים מעשיים", link: "https://ketysegev.blogspot.com/", description: "חוסן הוא מיומנות נלמדת: נשימת קופסה לוויסות מיידי, עוגן SOS לרגעי הצפה, ומיקרו-צעד אחד שמחזיר תנועה קדימה." },
  ];

  const cards = items && items.length
    ? items.map((a) => ({ title: a.title, link: a.link, desc: a.description }))
    : fallback.map((a) => ({ title: a.title, link: a.link, desc: a.description }));

  return (
    <section id="articles" className="py-20 sm:py-28 bg-white border-t border-gold-200/50">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center max-w-[680px] mx-auto mb-16">
          <Eyebrow>מהבלוג של קטי</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[30px] sm:text-[42px]">
            מאמרים וכלים תודעתיים
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {cards.map((a, i) => (
            <Reveal
              key={i}
              style={{ transitionDelay: `${i * 90}ms` }}
              className="bg-[#FAF8F4] rounded-2xl p-8 border border-gold-200/60 shadow-softer flex flex-col gap-4"
            >
              <span className="font-heading font-semibold text-[12.5px] tracking-wide text-gold-600">מאמר</span>
              <h3 className="font-heading font-bold text-ink-800 text-[20px] leading-tight flex-1">{a.title}</h3>
              {a.desc ? <p className="text-ink-600 text-[15px] leading-relaxed">{a.desc}</p> : null}
              {a.link ? (
                <a
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 self-start text-gold-700 font-heading font-semibold text-[15px]"
                >
                  לקריאת המאמר המלא
                  <Icon name="arrow-left" size={17} />
                </a>
              ) : null}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* FAQ (accessible accordion) + responsibility disclaimer           */
/* ---------------------------------------------------------------- */

function Faq() {
  const [open, setOpen] = React.useState(0);
  return (
    <section id="faq" className="py-20 sm:py-28 bg-white border-t border-gold-200/50">
      <div className="max-w-[780px] mx-auto px-5 sm:px-7">
        <Reveal className="text-center mb-12">
          <Eyebrow>{CONTENT.faq.eyebrow}</Eyebrow>
          <h2 className="font-heading font-extrabold text-ink-800 text-[28px] sm:text-[38px]">
            {CONTENT.faq.title}
          </h2>
        </Reveal>

        <Reveal className="flex flex-col gap-3">
          {CONTENT.faq.items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="bg-[#FAF8F4] border border-gold-200/70 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-right font-heading font-bold text-ink-800 text-[17px] transition-colors"
                  style={{ padding: "18px 22px", background: "transparent" }}
                >
                  <span>{it.q}</span>
                  <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={20} className="text-gold-600 shrink-0" />
                </button>
                {isOpen && (
                  <div style={{ padding: "0 22px 20px" }}>
                    <p className="text-ink-600 text-[16px] leading-relaxed">{it.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </Reveal>

        <Reveal className="mt-8">
          <div
            className="rounded-2xl p-6 flex gap-3 items-start"
            style={{ background: "rgba(184,212,227,0.18)", border: "1px solid rgba(184,212,227,0.5)" }}
          >
            <Icon name="shield-check" size={20} className="text-ink-500 shrink-0" />
            <p className="text-ink-600 text-[14px] leading-relaxed">{CONTENT.faq.disclaimer}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Final CTA                                                        */
/* ---------------------------------------------------------------- */

function FinalCta() {
  return (
    <section id="contact" className="py-20 sm:py-28 bg-white border-t border-gold-200/50">
      <div className="max-w-[720px] mx-auto px-5 sm:px-7 text-center">
        <Reveal>
          <h2 className="font-heading font-extrabold text-ink-800 text-[32px] sm:text-[44px] mb-4">
            {CONTENT.finalCta.title}
          </h2>
          <p className="text-ink-600 text-[18px] mb-9">
            {CONTENT.finalCta.text}
          </p>
          <div className="flex flex-col items-center gap-4">
            <Button
              as="a"
              href="#lead"
              size="lg"
              className="px-10 py-4 text-[18px]"
            >
              {CONTENT.finalCta.ctaPrimary}
            </Button>
            <a
              href={waLink("היי קטי! יש לי שאלה")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-ink-500 hover:text-gold-600 font-medium text-[15px] transition-colors mt-2"
            >
              <Icon name="whatsapp" size={17} />
              {CONTENT.finalCta.ctaSecondaryText}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Footer & Floats                                                   */
/* ---------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="bg-[#1C1917] text-white/80 pt-16 pb-10">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-7">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 pb-10 border-b border-white/10">
          <div>
            <img src="images/logo.svg" alt="CureMindset" className="h-11 w-auto mb-3" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <span className="font-heading font-extrabold text-[22px] tracking-tight text-white block mb-3">
              Cure<span className="text-gold-400">Mindset</span>
            </span>
            <p className="text-white/60 text-[14px] leading-relaxed max-w-[280px]">
              {CONTENT.footer.tagline}
            </p>
          </div>
          <div>
            <p className="font-heading font-semibold text-white mb-3 text-[15px]">קישורים</p>
            <ul className="flex flex-col gap-2">
              {CONTENT.nav.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-white/60 text-[14.5px] hover:text-gold-400 transition-colors">
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
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors">
                  <Icon name="mail" size={16} />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phoneDisplay.replace(/-/g, "")}`} className="flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors">
                  <Icon name="phone" size={16} />
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={waLink("היי קטי!")} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors">
                  <Icon name="whatsapp" size={16} />
                  וואטסאפ
                </a>
              </li>
              <li>
                <a href={MEDIA_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors">
                  <Icon name="instagram" size={16} className="shrink-0" />
                  Instagram
                </a>
              </li>
              <li>
                <a href={MEDIA_LINKS.youtubeChannel} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors">
                  <Icon name="youtube" size={16} className="shrink-0" />
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 pb-6 border-b border-white/10">
          <p className="font-heading font-semibold text-white/70 mb-3 text-[13.5px]">נושאים</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { href: "/method", label: "השיטה" },
              { href: "/emotional-coaching", label: "אימון רגשי" },
              { href: "/anxiety-and-stress", label: "חרדה ולחץ" },
              { href: "/self-confidence", label: "ביטחון עצמי" },
              { href: "/procrastination", label: "דחיינות" },
              { href: "/cure-teens", label: "ליווי לנוער" },
              { href: "/parents", label: "הדרכת הורים" },
            ].map((l) => (
              <a key={l.href} href={l.href} className="text-white/55 text-[14px] hover:text-gold-400 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-8">
          {[
            { href: "/privacy", label: "פרטיות" },
            { href: "/terms", label: "תנאי שימוש" },
            { href: "/accessibility", label: "נגישות" },
            { href: "/responsibility", label: "הבהרת אחריות" },
            { href: "/contact", label: "יצירת קשר" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="text-white/50 text-[13px] hover:text-gold-400 transition-colors">
              {l.label}
            </a>
          ))}
        </div>
        <p className="text-white/40 text-[13px] text-center pt-5">{CONTENT.footer.rights}</p>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  return (
    <a
      href={waLink("היי קטי! אשמח לדבר")}
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
/* Main Home Component                                              */
/* ---------------------------------------------------------------- */

function Home({ onEnterApp }) {
  return (
    <>
      <Nav onEnterApp={onEnterApp} />
      <main>
        <Hero />
        <FreeTrialBanner />
        <HowItWorks />
        <Vision />
        <About />
        <CureTeens />
        <Plans onEnterApp={onEnterApp} />
        <LeadSection />
        <Organizations />
        <Testimonials />
        <ArticlesSection />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}

// Window exports
window.CureMindsetHome = Home;
window.CONTENT = CONTENT;
window.CONTACT = CONTACT;
window.waLink = waLink;
window.Reveal = Reveal;
window.Button = Button;
window.Eyebrow = Eyebrow;
window.Logo = Logo;
