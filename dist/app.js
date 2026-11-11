function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function HmSocial() {
  const box = {
    width: 46,
    height: 46,
    borderRadius: "50%",
    border: "1px solid var(--line, #E2D9C9)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--gold-deep, #8A6A2F)",
    background: "#fff"
  };
  const items = [["YouTube", "https://www.youtube.com/@ketynlplive", /*#__PURE__*/React.createElement("svg", {
    key: "y",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2C.5 9.1.5 12 .5 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8zM9.8 15.1V8.9l5.4 3.1-5.4 3.1z"
  }))], ["Spotify", MEDIA_LINKS.spotify, /*#__PURE__*/React.createElement("svg", {
    key: "s",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 1.5A10.5 10.5 0 1 0 22.5 12 10.5 10.5 0 0 0 12 1.5zm4.8 15.1a.65.65 0 0 1-.9.2c-2.5-1.5-5.6-1.9-9.3-1a.65.65 0 1 1-.3-1.3c4-.9 7.5-.5 10.3 1.2a.65.65 0 0 1 .2.9zm1.3-2.9a.8.8 0 0 1-1.1.3c-2.8-1.7-7.2-2.2-10.5-1.2a.8.8 0 1 1-.5-1.5c3.8-1.1 8.6-.6 11.8 1.4a.8.8 0 0 1 .3 1zm.1-3c-3.4-2-9-2.2-12.3-1.2a1 1 0 1 1-.6-1.9c3.800-1.100 10-.9 13.900 1.400a1 1 0 0 1-1 1.700z"
  }))], ["Instagram", MEDIA_LINKS.instagram, /*#__PURE__*/React.createElement("svg", {
    key: "i",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17.3",
    cy: "6.7",
    r: "1",
    fill: "currentColor",
    stroke: "none"
  }))]];
  return /*#__PURE__*/React.createElement("div", {
    className: "social-icons",
    style: {
      display: "flex",
      gap: 14,
      marginTop: 22,
      alignItems: "center"
    }
  }, items.map(([label, href, icon]) => /*#__PURE__*/React.createElement("a", {
    key: label,
    href: href,
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": label,
    title: label,
    style: box
  }, icon)));
}
function HmHero() {
  return /*#__PURE__*/React.createElement("section", {
    className: "hero",
    id: "top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 \xB7 \u05DC\u05D9\u05D5\u05D5\u05D9 \u05E8\u05D2\u05E9\u05D9 \u05D1\u05D7\u05D9\u05E4\u05D4, \u05D1\u05E7\u05E8\u05D9\u05D5\u05EA \u05D5\u05D1\u05D6\u05D5\u05DD"), /*#__PURE__*/React.createElement("h1", null, "\u05D0\u05EA\u05DD \u05DC\u05D0 \u05E6\u05E8\u05D9\u05DB\u05D9\u05DD \u05DC\u05D4\u05E1\u05D1\u05D9\u05E8 \u05DC\u05D9 \u05DE\u05D4 \u05E7\u05D5\u05E8\u05D4. \u05D0\u05E0\u05D9 \u05DE\u05D6\u05D4\u05D4 \u05D0\u05EA \u05D6\u05D4 \u05DE\u05D4\u05E9\u05D5\u05E8\u05D4 \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D4."), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "\u05D6\u05D4 \u05D4\u05DE\u05E7\u05D5\u05DD \u05E9\u05D1\u05D5 \u05DE\u05E4\u05E1\u05D9\u05E7\u05D9\u05DD \u05DC\u05D4\u05E1\u05D1\u05D9\u05E8 \u05D5\u05DE\u05EA\u05D7\u05D9\u05DC\u05D9\u05DD \u05DC\u05E2\u05D1\u05D5\u05D3."), /*#__PURE__*/React.createElement("p", null, "\u05D0\u05E0\u05D9 \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1, \u05DE\u05D8\u05E4\u05DC\u05EA \u05E8\u05D2\u05E9\u05D9\u05EA \u05D5\u05DE\u05D0\u05DE\u05E0\u05EA NLP, \u05DE\u05E4\u05EA\u05D7\u05EA \u05E9\u05D9\u05D8\u05EA CureMindset."), /*#__PURE__*/React.createElement("div", {
    className: "btnrow"
  }, /*#__PURE__*/React.createElement("a", {
    className: "btn primary",
    href: HM_CAL,
    target: "_blank",
    rel: "noopener"
  }, "\u05DC\u05E9\u05D9\u05D7\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA \u05E9\u05DC 20 \u05D3\u05E7\u05D5\u05EA")), /*#__PURE__*/React.createElement(HmSocial, null)), /*#__PURE__*/React.createElement("figure", {
    className: "hero-photo"
  }, /*#__PURE__*/React.createElement("picture", null, /*#__PURE__*/React.createElement("source", {
    srcSet: "images/kety-640.webp 640w, images/kety-920.webp 920w",
    type: "image/webp",
    sizes: "(max-width:1024px) 440px, 520px"
  }), /*#__PURE__*/React.createElement("img", {
    src: "images/kety-640.jpg",
    alt: "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1, \u05DE\u05D8\u05E4\u05DC\u05EA \u05E8\u05D2\u05E9\u05D9\u05EA \u05D5\u05DE\u05D0\u05DE\u05E0\u05EA NLP",
    width: "640",
    height: "800",
    loading: "eager",
    decoding: "async"
  })))));
}
// CureMindset — Kety Segev
// Curable-inspired Minimal Landing Page & React App (Babel-in-browser).
// Stack: React 18 (UMD) + Tailwind CSS + inline Lucide icons (icons.js).

const {
  useState,
  useEffect,
  useRef,
  useCallback
} = React;
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
  social: "שיטה פרקטית לשינוי דפוסי תת־מודע, חיזוק חוסן רגשי ובניית ביטחון פנימי אמיתי."
};
function waLink(text) {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
}

// לינקי התשלום הורדו זמנית (בקשת קטי) בזמן שעובדים על עיצוב אזור ההרשמה.
// כשריקים, הכפתורים נופלים אוטומטית לכניסה לאפליקציה / תיאום שיחה במקום תשלום.
const PAYMENT_LINKS = {
  digital: "https://pay.grow.link/NDcyNjY~23b0b8d38a77cf03510833361d027ddf-MzY2MDI4MQ",
  youth: "",
  recommended: "",
  premium: ""
};
const MEDIA_LINKS = {
  linktree: "https://linktr.ee/Ketysegev",
  instagram: "https://instagram.com/kety_nlp",
  youtubeChannel: "https://www.youtube.com/@ketynlplive",
  radio: "https://youtu.be/8q_5IAAJohQ?si=eL3RHvjbHDqWsuqj",
  spotify: "https://open.spotify.com/episode/3XMpL3GBhi9YQ2FVIZNXd3?si=RGKVlD3VRfqp-W7BKhsQcQ&utm_source=copy-link",
  video1: "https://www.youtube.com/watch?v=u2yy8yY_SN8",
  video2: "",
  article1: "https://ketysegev.blogspot.com/2026/03/blog-post.html",
  article2: ""
};
const BOOKING_LINKS = {
  calendar: "https://calendly.com/ketysegev/meet-with-me",
  zoom: ""
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
    links: [{
      label: "השיטה",
      href: "/method"
    }, {
      label: "לנוער",
      href: "/teens"
    }, {
      label: "לצעירים",
      href: "/young-adults"
    }, {
      label: "למבוגרים",
      href: "/adults"
    }, {
      label: "מוסדות",
      href: "/schools"
    }, {
      label: "עזרה וירטואלית",
      href: "/online"
    }, {
      label: "שאלות נפוצות",
      href: "/faq"
    }],
    login: "שיחת היכרות",
    cta: "שיחה עם קיורטי"
  },
  hero: {
    kicker: "CureMindset · קטי שגב",
    headline: "אימון מנטלי שמחזיר לך כיוון, בחירה וביטחון.",
    subhead: "לנוער, להורים ולמבוגרים בחיפה, בקריות ובזום: עבודה מעשית על חרדה, פחדים, דימוי עצמי, ביטחון עצמי ודפוסים שחוזרים על עצמם.",
    ctaPrimary: "לשיחת היכרות ללא עלות",
    ctaNote: "ללא התחייבות",
    banner: "שיחת היכרות ללא עלות · ללא התחייבות",
    imgAlt: "קטי שגב, מייסדת שיטת CureMindset"
  },
  problem: {
    eyebrow: "מה עובר עלייך?",
    title: "מה עובר עלייך?",
    items: [{
      icon: "brain",
      text: "המחשבות לא מפסיקות"
    }, {
      icon: "heart",
      text: "מרגיש/ה לא מספיק טוב/ה"
    }, {
      icon: "wind",
      text: "הכל יותר מדי"
    }, {
      icon: "compass",
      text: "לא יודע/ת לאן ללכת"
    }]
  },
  howItWorks: {
    eyebrow: "איך זה עובד",
    title: "3 צעדים פשוטים לשינוי",
    steps: [{
      step: "1",
      title: "מדברים",
      text: "כותבים בחופשיות. קיורטי מקשיבה ומבינה."
    }, {
      step: "2",
      title: "מקבלים כלים",
      text: "תרגול אחד קטן שאפשר לעשות עכשיו. לא תיאוריה — פעולה."
    }, {
      step: "3",
      title: "משתנים",
      text: "כל יום צעד קטן. ב-3 ימים כבר מרגישים את ההבדל."
    }]
  },
  method: {
    eyebrow: "השיטה",
    title: "CureMindset: אימון מנטלי שמתחיל בהקשבה",
    items: [{
      icon: "eye",
      title: "Clarity · בהירות",
      text: "פוגשים את שומר הראש: מזהים את הדפוס ואת התפקיד שהוא בא למלא."
    }, {
      icon: "wind",
      title: "Unblock · שחרור חסמים",
      text: "משחררים את העומס שהצטבר שנים במערכת העצבים."
    }, {
      icon: "refresh-cw",
      title: "Rewire · חיווט מחדש",
      text: "כותבים מחדש את פרוטוקול הביטחון של המוח."
    }, {
      icon: "trending-up",
      title: "Empower · העצמה",
      text: "חוסן שמחזיק — ומערכת הפעלה פנימית לחיים."
    }],
    approachTitle: "איך זה עובד באמת — מתחת לפני השטח",
    approachLead: "השיטה עובדת דרך תת-המודע, אבל לא באמצעות מילים או שכנוע. אנחנו עובדים ברמה החושית והתת-חושית — שם באמת נשמרים הדפוסים.",
    approachBody: "המחקר מראה שיש ארבע דרכים בסיסיות שבהן אנשים מגיבים לחוויות חושיות. כשאנחנו יוצרים תהליך מדויק בדמיון המודרך, אנחנו פותחים בדיוק את מסלולי התגובה האלה — ודרך ארבעת הדפוסים האלה אפשר לייצר מחדש תחושות של רוגע, הנאה, ביטחון והתלהבות, ובאותה דרך ממש לשחרר התנהגויות ותגובות שכבר לא משרתות אותך.",
    approachClose: "זו לא תיאוריה ולא חשיבה חיובית — זו עבודה עדינה ומדויקת עם השפה הפנימית של מערכת העצבים."
  },
  workshops: {
    eyebrow: "סדנאות",
    title: "סדנאות ותוכניות CureMindset",
    subtitle: "כל סדנה בנפרד — עם התוכן והמסגרת שלה. פרטים ומחיר בשיחה קצרה איתי",
    items: [{
      icon: "compass",
      title: "המצפן הפנימי",
      meta: "3 מפגשים · עד 8 משתתפים",
      text: "סדנת חוויה קבוצתית בשיטת CURE: לפגוש חרדה, לשחרר חסמים ולחווט מחדש את הדרך שאתה מגיב.",
      href: "/workshop-inner-compass"
    }, {
      icon: "user-round",
      title: "CURE Teens",
      meta: "6 מפגשים אישיים",
      text: "ליווי פרימיום אישי לנוער 13–18: ביטחון, הרגעת חרדה וכלים אמיתיים לחוסן — בשפה שלהם.",
      href: "/workshop-cure-teens"
    }],
    cta: "לבדוק זמינות לסדנה הקרובה"
  },
  plans: {
    eyebrow: "תוכניות ומסלולים",
    title: "בחרי את המסלול שמתאים לך",
    subtitle: "ליווי אישי בתיאום · תשלום מאובטח",
    items: [{
      id: "basic",
      badge: "בסיסי · דיגיטלי",
      price: "אזור דיגיטלי",
      priceNote: "גישה מלאה",
      audience: "מי שרוצה להתחיל עצמאית, בקצב שלו/ה, עם הכלים הדיגיטליים",
      features: ["צ'אט עם קיורטי — 24/7", "כל הכלים והתרגולים", "צ'ק-אין יומי ומעקב אישי", "מודולים מודרכים לפי השיטה", "עוגן SOS לרגעי הצפה"],
      highlight: false,
      cta: "להתחיל"
    }, {
      id: "combined",
      badge: "שילוב · מומלץ",
      price: "דיגיטלי + זום אישי",
      priceNote: "פרטים ומחיר בשיחת היכרות",
      audience: "השילוב האפקטיבי ביותר — הכלים הדיגיטליים יחד עם ליווי חי של קטי",
      features: ["כל האזור הדיגיטלי המלא", "מפגשי זום אישיים עם קטי", "התאמת תהליך אישי לצרכים שלך", "ליווי בין המפגשים בצ'אט", "מעקב והתאמות שוטפות"],
      highlight: true,
      cta: "לתיאום שיחת היכרות"
    }, {
      id: "premium",
      badge: "CURE Teens · פרימיום",
      price: "ליווי אישי לנוער",
      priceNote: "שיחת אבחון 20 דק' ללא עלות",
      audience: "ליווי אישי עמוק לנוער (13+) — התהליך המלא עם קטי",
      features: ["6 מפגשים אישיים עם קטי (50 דק')", "1:1 — פרונטלי או בזום", "עבודה ממוקדת חוסן, ביטחון וויסות רגשי", "כל הכלים הדיגיטליים באתר", "מתחילים בשיחת אבחון 20 דק' ללא עלות"],
      highlight: false,
      cta: "לשיחת אבחון ללא עלות"
    }]
  },
  testimonials: {
    eyebrow: "סיפורי שינוי",
    title: "מה משתנה כשעובדים עם השיטה",
    quotes: [{
      text: "תוך כמה שבועות הבת שלי הפסיקה לפחד לדבר על מה שמרגישה. זה שינה את היחסים בינינו.",
      who: "אמא לנערה בתהליך"
    }, {
      text: "למדתי לעצור את עצמי באמצע התקף חרדה ולחזור לאיזון בלי שאף אחד ידע שזה קרה.",
      who: "משתתפת בתהליך אישי"
    }, {
      text: "הסדנה בבית הספר היתה הדבר הראשון שבאמת דיבר אל התלמידים בגובה העיניים.",
      who: "יועצת חינוכית"
    }]
  },
  faq: {
    eyebrow: "שאלות נפוצות",
    title: "כל מה שחשוב לדעת לפני שמתחילים",
    items: [{
      q: "למי השירות מתאים?",
      a: "למבוגרים ולבני נוער (13+) שמתמודדים עם חרדה, עומס, דחיינות, דימוי עצמי נמוך או עמידה במקום — ורוצים כלים מעשיים לחוסן וביטחון. יש מסלולים נפרדים למבוגרים ולנוער."
    }, {
      q: "כמה זמן זה לוקח ביום?",
      a: "מעט. כל יום צעד קטן אחד — שיחה קצרה, שיעור של כמה דקות או תרגול. בנוי כך שייכנס לחיים העמוסים ביותר, לא יעמיס עליהם."
    }, {
      q: "מה לגבי פרטיות?",
      a: "כל מה שאת/ה משתף/ת נשמר מוצפן ופרטי. איננו מוכרים מידע. אפשר למחוק את החשבון והנתונים בכל עת."
    }, {
      q: "ה-AI — זה מטפל?",
      a: "לא. \"קיורטי\" היא כלי לאימון, למידה ותרגול המבוסס על השיטה של קטי. היא אינה נותנת אבחנה, אינה תחליף לטיפול רפואי או נפשי, ואינה מיועדת למצבי חירום."
    }, {
      q: "אני הורה — איך זה עובד עם בן/בת נוער?",
      a: "לנוער יש מסלול ייעודי (CURE Teens) — ליווי רגשי אישי לחיזוק חוסן וביטחון של המתבגר/ת. מתחילים בשיחת אבחון קצרה ללא עלות, שבה נתאים יחד את המסלול והקצב."
    }, {
      q: "אפשר לבטל?",
      a: "כן, בכל עת. הביטול עוצר את החיוב מהמחזור הבא, בלי קנסות ובלי שיחות שכנוע."
    }],
    disclaimer: "CureMindset הוא כלי לאימון, למידה ותרגול אישי בשיטת NLP. הוא אינו תחליף לאבחון, לטיפול רפואי או נפשי, ואינו מיועד למצבי חירום. במצוקה מיידית פנו לעזרה מקצועית — קו סיוע נפשי (ער\"ן) 1201, מד\"א 101, או פנייה לרופא/ה או למטפל/ת."
  },
  finalCta: {
    title: "השינוי מתחיל בשיחה אחת",
    text: "אין צורך להגיע מוכנים. רק רוצים לדבר ולבדוק אם זה מתאים.",
    ctaPrimary: "להתחיל ניסיון חינם",
    ctaSecondaryText: "יש שאלה? שלחי וואטסאפ"
  },
  footer: {
    tagline: CONTACT.social,
    rights: `© ${new Date().getFullYear()} CureMindset · קטי שגב. כל הזכויות שמורות.`
  }
};

/* ---------------------------------------------------------------- */
/* Hooks & Shared Components                                         */
/* ---------------------------------------------------------------- */

function Reveal({
  as: Tag = "div",
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(Tag, _extends({
    "data-sc-in": true,
    className: className
  }, rest), children);
}
function Logo({
  size = 48
}) {
  const [err, setErr] = useState(false);
  if (err) {
    return /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col items-start leading-none select-none"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-extrabold text-[22px] tracking-tight"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-ink-800"
    }, "Cure"), /*#__PURE__*/React.createElement("span", {
      className: "text-gold-600"
    }, "Mindset")), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-medium tracking-[0.22em] text-ink-400 mt-1"
    }, "KETY SEGEV \xB7 NLP"));
  }
  return /*#__PURE__*/React.createElement("img", {
    src: "images/logo.png",
    alt: "CureMindset \u2014 By Kety Segev",
    style: {
      height: size,
      width: "auto",
      objectFit: "contain"
    },
    onError: () => setErr(true)
  });
}
function Eyebrow({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    className: "font-heading text-[13px] font-semibold tracking-[0.18em] uppercase text-gold-600 mb-3 text-center"
  }, children);
}
function Button({
  as = "a",
  variant = "primary",
  size = "md",
  icon,
  iconPos = "start",
  className = "",
  children,
  ...rest
}) {
  const Tag = as;
  const base = "inline-flex items-center justify-center gap-2.5 font-heading font-semibold rounded-full transition-all duration-300 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold-600 select-none";
  const sizes = {
    md: "px-6 py-3.5 text-[15px] sm:text-base",
    lg: "px-8 py-4 text-base sm:text-lg"
  };
  const variants = {
    primary: "bg-gold-500 text-white shadow-[0_14px_34px_-14px_rgba(194,151,74,0.7)] hover:bg-gold-600 hover:-translate-y-0.5 hover:shadow-[0_20px_46px_-16px_rgba(194,151,74,0.85)]",
    secondary: "bg-white text-ink-800 border border-ink-100 hover:bg-gold-50 hover:border-gold-300 hover:-translate-y-0.5",
    dark: "bg-ink-800 text-white hover:bg-ink-700 hover:-translate-y-0.5",
    ghost: "bg-transparent text-ink-700 hover:bg-ink-50",
    outline: "bg-transparent text-gold-700 border border-gold-400 hover:bg-gold-50 hover:-translate-y-0.5"
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: `${base} ${sizes[size]} ${variants[variant]} ${className}`
  }, rest), icon && iconPos === "start" ? /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 18,
    className: "shrink-0"
  }) : null, /*#__PURE__*/React.createElement("span", null, children), icon && iconPos === "end" ? /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 18,
    className: "shrink-0 rtl-flip"
  }) : null);
}

/* ---------------------------------------------------------------- */
/* Nav                                                                */
/* ---------------------------------------------------------------- */

function Nav({
  onEnterApp
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const closeAndGo = () => setOpen(false);
  // פותח את חלון הצ'אט הצף של CureBot (curebot-float.js, טעון בכל דף).
  const openCureBot = () => window.cmOpenBot ? window.cmOpenBot() : document.getElementById("cmFloatBtn")?.click();
  return /*#__PURE__*/React.createElement("header", {
    className: `fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-softer border-b border-ink-100/70" : "bg-white/95 backdrop-blur-md border-b border-ink-100/70"}`
  }, /*#__PURE__*/React.createElement("nav", {
    className: "max-w-[1180px] mx-auto px-5 sm:px-7 h-[68px] flex items-center justify-between",
    "aria-label": "\u05E0\u05D9\u05D5\u05D5\u05D8 \u05E8\u05D0\u05E9\u05D9"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#top",
    className: "shrink-0 brand-text",
    "aria-label": "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 \u2014 \u05D7\u05D6\u05E8\u05D4 \u05DC\u05E8\u05D0\u05E9 \u05D4\u05E2\u05DE\u05D5\u05D3"
  }, "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1"), /*#__PURE__*/React.createElement("ul", {
    className: "hidden lg:flex items-center gap-7"
  }, CONTENT.nav.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l.href
  }, /*#__PURE__*/React.createElement("a", {
    href: l.href,
    className: "text-[15px] font-medium text-ink-600 hover:text-gold-600 transition-colors"
  }, l.label)))), /*#__PURE__*/React.createElement("div", {
    className: "hidden lg:flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://calendly.com/ketysegev/meet-with-me",
    target: "_blank",
    rel: "noopener",
    className: "inline-flex items-center gap-2 text-[14px] font-semibold text-ink-700 hover:text-gold-600 px-3 py-2 rounded-full transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 16
  }), CONTENT.nav.login), /*#__PURE__*/React.createElement(Button, {
    as: "button",
    type: "button",
    onClick: openCureBot,
    size: "md"
  }, CONTENT.nav.cta)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full text-ink-700 hover:bg-ink-50",
    "aria-label": open ? "סגירת תפריט" : "פתיחת תפריט",
    "aria-expanded": open,
    onClick: () => setOpen(o => !o)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: open ? "x" : "menu",
    size: 24
  }))), open && /*#__PURE__*/React.createElement("div", {
    className: "lg:hidden bg-white border-t border-ink-100 px-5 pb-6 pt-2 shadow-soft"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "flex flex-col gap-1"
  }, CONTENT.nav.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l.href
  }, /*#__PURE__*/React.createElement("a", {
    href: l.href,
    onClick: closeAndGo,
    className: "block py-3 text-[16px] font-medium text-ink-700 border-b border-ink-100/70"
  }, l.label)))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-3 mt-4"
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://calendly.com/ketysegev/meet-with-me",
    target: "_blank",
    rel: "noopener",
    onClick: closeAndGo,
    className: "inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-ink-700 border border-ink-100 rounded-full py-3"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 16
  }), CONTENT.nav.login), /*#__PURE__*/React.createElement(Button, {
    as: "button",
    type: "button",
    onClick: () => {
      closeAndGo();
      openCureBot();
    },
    className: "w-full"
  }, CONTENT.nav.cta))));
}

/* ---------------------------------------------------------------- */
/* Hero — Curable Minimal Style                                      */
/* ---------------------------------------------------------------- */

function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    id: "top",
    className: "relative isolate overflow-hidden hero-v2 pt-[120px] pb-16 sm:pt-[150px] sm:pb-24"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1180px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-hero gap-10 lg:gap-14 items-center"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white border border-gold-200/80 font-heading text-[13px] font-semibold text-gold-700 shadow-softer"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-2 h-2 rounded-full bg-gold-500",
    "aria-hidden": "true"
  }), CONTENT.hero.kicker), /*#__PURE__*/React.createElement("h1", {
    className: "font-heading font-semibold text-ink-800 leading-[1.14] tracking-tight text-[34px] sm:text-[46px] lg:text-[54px] mb-5"
  }, CONTENT.hero.headline), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[19px] sm:text-[22px] font-medium leading-relaxed max-w-[560px] mb-4"
  }, CONTENT.hero.subhead), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[15.5px] sm:text-[16.5px] font-medium leading-relaxed max-w-[560px] mb-9"
  }, "\u05E9\u05D9\u05D8\u05EA CureMindset \u05E2\u05D5\u05D1\u05D3\u05EA \u05E2\u05DD \u05EA\u05EA-\u05D4\u05DE\u05D5\u05D3\u05E2 \u2014 \u05D1\u05E8\u05DE\u05D4 \u05E9\u05D1\u05D4 \u05D4\u05D3\u05E4\u05D5\u05E1\u05D9\u05DD \u05D1\u05D0\u05DE\u05EA \u05E0\u05E9\u05DE\u05E8\u05D9\u05DD \u2014 \u05D5\u05DE\u05E9\u05D7\u05E8\u05E8\u05EA \u05D0\u05D5\u05EA\u05DD \u05DE\u05D1\u05E4\u05E0\u05D9\u05DD. \u05DC\u05DA, \u05D0\u05D5 \u05DC\u05D1\u05DF/\u05D1\u05EA \u05E9\u05DC\u05DA."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center gap-3 mb-7"
  }, /*#__PURE__*/React.createElement(Button, {
    as: "a",
    href: waLink("היי קטי! אשמח להתחיל ניסיון חינם"),
    target: "_blank",
    rel: "noopener noreferrer",
    size: "lg"
  }, CONTENT.hero.ctaPrimary), /*#__PURE__*/React.createElement("a", {
    href: "/method",
    className: "inline-flex items-center gap-2 font-heading font-semibold text-gold-700 hover:text-gold-600 px-2 py-3"
  }, "\u05DE\u05D4 \u05D6\u05D5 \u05D4\u05E9\u05D9\u05D8\u05D4? ", /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2190"))), /*#__PURE__*/React.createElement("p", {
    className: "text-[14px] font-medium text-ink-500"
  }, CONTENT.hero.ctaNote)), /*#__PURE__*/React.createElement(Reveal, {
    className: "relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-arch",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative w-full max-w-[400px] mx-auto lg:max-w-none"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-figure"
  }, /*#__PURE__*/React.createElement("picture", null, /*#__PURE__*/React.createElement("source", {
    srcSet: "images/kety-640.webp 640w, images/kety-920.webp 920w",
    type: "image/webp",
    sizes: "(max-width:1024px) 360px, 420px"
  }), /*#__PURE__*/React.createElement("img", {
    src: "images/kety-640.jpg",
    srcSet: "images/kety-640.jpg 640w, images/kety-920.jpg 920w",
    sizes: "(max-width:1024px) 360px, 420px",
    alt: CONTENT.hero.imgAlt,
    width: 920,
    height: 1150,
    loading: "eager",
    decoding: "async"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "hero-badge hero-badge-a"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-badge-dot",
    "aria-hidden": "true"
  }), "\u05E9\u05D9\u05D8\u05EA CURE \xB7 \u05D0\u05E8\u05D1\u05E2\u05D4 \u05E9\u05DC\u05D1\u05D9\u05DD"))))));
}
function FreeTrialBanner() {
  return /*#__PURE__*/React.createElement("section", {
    className: "bg-white border-y border-gold-200/60 py-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1180px] mx-auto px-5 text-center"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-heading font-semibold text-[16px] sm:text-[18px] text-gold-700 flex items-center justify-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 20,
    className: "text-gold-500"
  }), CONTENT.hero.banner)));
}

/* ---------------------------------------------------------------- */
/* Problem ("מה עובר עלייך?")                                          */
/* ---------------------------------------------------------------- */

function Problem() {
  return /*#__PURE__*/React.createElement("section", {
    id: "problem",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[680px] mb-14"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, CONTENT.problem.eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[30px] sm:text-[42px] leading-tight"
  }, CONTENT.problem.title)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
  }, CONTENT.problem.items.map((it, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    style: {
      transitionDelay: `${i * 70}ms`
    },
    className: "bg-[#FAF8F4] border border-ink-100/80 rounded-2xl p-7 flex flex-col items-center text-center gap-4 hover:border-gold-300 hover:shadow-softer transition-all cursor-pointer group",
    onClick: () => {
      const el = document.getElementById("plans");
      if (el) el.scrollIntoView({
        behavior: "smooth"
      });
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center justify-center w-14 h-14 rounded-full bg-white text-gold-600 shadow-softer group-hover:scale-110 transition-transform"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 24
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-800 font-semibold text-[17px] leading-snug"
  }, it.text))))));
}

/* ---------------------------------------------------------------- */
/* How It Works (3 Steps Curable Style)                             */
/* ---------------------------------------------------------------- */

function HowItWorks() {
  return /*#__PURE__*/React.createElement("section", {
    id: "how-it-works",
    className: "py-20 sm:py-28 bg-[#FAF8F4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[680px] mb-16"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, CONTENT.howItWorks.eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[30px] sm:text-[42px] leading-tight"
  }, CONTENT.howItWorks.title)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
  }, CONTENT.howItWorks.steps.map((st, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: st.step,
    style: {
      transitionDelay: `${i * 90}ms`
    },
    className: "bg-white rounded-2xl p-8 border border-gold-100 shadow-softer flex flex-col items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-black text-6xl text-gold-500/80 mb-4 select-none"
  }, st.step), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-[22px] text-ink-800 mb-3"
  }, st.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[16.5px] leading-relaxed"
  }, st.text))))));
}

/* ---------------------------------------------------------------- */
/* Vision / Method (4 Pillars)                                      */
/* ---------------------------------------------------------------- */

function Vision() {
  return /*#__PURE__*/React.createElement("section", {
    id: "vision",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[760px] mb-16"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, CONTENT.method.eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[28px] sm:text-[40px] leading-tight"
  }, CONTENT.method.title)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-6"
  }, CONTENT.method.items.map((it, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: it.title,
    style: {
      transitionDelay: `${i * 80}ms`
    },
    className: "bg-[#FAF8F4] border border-gold-200/70 rounded-2xl p-8 flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform shadow-softer"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gold-100 text-gold-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[21px]"
  }, it.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[16.5px] leading-relaxed"
  }, it.text)))), /*#__PURE__*/React.createElement(Reveal, {
    className: "mt-14 max-w-[860px] mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#FAF8F4] border border-gold-200/70 rounded-2xl p-8 sm:p-10 shadow-softer"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-semibold text-ink-800 text-[22px] sm:text-[26px] mb-4"
  }, CONTENT.method.approachTitle), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-700 text-[17px] leading-relaxed mb-4 font-medium"
  }, CONTENT.method.approachLead), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[16.5px] leading-relaxed mb-4"
  }, CONTENT.method.approachBody), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[15.5px] leading-relaxed border-r-2 border-gold-300 pr-4"
  }, CONTENT.method.approachClose)))));
}

/* ---------------------------------------------------------------- */
/* About (Founder & Credentials)                                    */
/* ---------------------------------------------------------------- */

function About() {
  return /*#__PURE__*/React.createElement("section", {
    id: "about",
    className: "py-16 sm:py-24 bg-[#FAF8F4] border-t border-gold-200/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-[.85fr_1.15fr] gap-10 items-center"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "flex justify-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-full max-w-[340px] aspect-[4/5] rounded-2xl overflow-hidden shadow-soft ring-1 ring-gold-200/70 bg-white p-2"
  }, /*#__PURE__*/React.createElement("img", {
    src: "images/kety-about.jpg",
    alt: "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1",
    className: "w-full h-full object-cover rounded-xl",
    onError: e => {
      e.currentTarget.src = "images/kety-640.jpg";
    }
  }))), /*#__PURE__*/React.createElement(Reveal, {
    className: "flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05E2\u05DC \u05D4\u05DE\u05D9\u05D9\u05E1\u05D3\u05EA"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[28px] sm:text-[36px]"
  }, "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 \xB7 CureMindset"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[17px] leading-relaxed"
  }, "\u05DE\u05E4\u05EA\u05D7\u05EA \u05E9\u05D9\u05D8\u05EA CureMindset, \u05DE\u05D8\u05E4\u05DC\u05EA NLP \u05D5\u05DE\u05D0\u05DE\u05E0\u05EA \u05DE\u05E0\u05D8\u05DC\u05D9\u05EA \u05D1\u05DB\u05D9\u05E8\u05D4. \u05D0\u05E0\u05D9 \u05DE\u05DC\u05D5\u05D5\u05D4 \u05E0\u05D5\u05E2\u05E8, \u05D4\u05D5\u05E8\u05D9\u05DD \u05D5\u05DE\u05D1\u05D5\u05D2\u05E8\u05D9\u05DD \u05D1\u05D7\u05D9\u05E4\u05D4, \u05D1\u05E7\u05E8\u05D9\u05D5\u05EA \u05D5\u05D1\u05D6\u05D5\u05DD, \u05D1\u05EA\u05D4\u05DC\u05D9\u05DA \u05DE\u05E2\u05E9\u05D9 \u05DC\u05D1\u05E0\u05D9\u05D9\u05EA \u05D7\u05D5\u05E1\u05DF, \u05D1\u05D9\u05D8\u05D7\u05D5\u05DF \u05D5\u05DE\u05D9\u05E7\u05D5\u05D3 \u05E4\u05E0\u05D9\u05DE\u05D9."), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-gold-200/60 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-extrabold text-gold-600 text-[20px] block"
  }, "+500"), /*#__PURE__*/React.createElement("span", {
    className: "text-[13.5px] text-ink-600 font-medium"
  }, "\u05EA\u05D4\u05DC\u05D9\u05DB\u05D9\u05DD \u05D0\u05D9\u05E9\u05D9\u05D9\u05DD")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-gold-200/60 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-extrabold text-gold-600 text-[20px] block"
  }, "NLP Master"), /*#__PURE__*/React.createElement("span", {
    className: "text-[13.5px] text-ink-600 font-medium"
  }, "\u05D4\u05E1\u05DE\u05DB\u05D4 \u05D1\u05D9\u05E0\u05DC\u05D0\u05D5\u05DE\u05D9\u05EA")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-gold-200/60 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-extrabold text-gold-600 text-[20px] block"
  }, "100%"), /*#__PURE__*/React.createElement("span", {
    className: "text-[13.5px] text-ink-600 font-medium"
  }, "\u05DB\u05DC\u05D9\u05DD \u05DE\u05E2\u05E9\u05D9\u05D9\u05DD")))))));
}

/* ---------------------------------------------------------------- */
/* Digital Platform + AI Coach (מציג את המערכת שנבנתה)              */
/* ---------------------------------------------------------------- */

function DigitalPlatform() {
  const cards = [{
    icon: "message-circle",
    title: "שיחה עם קיורטי",
    text: "מלווה לתרגול, זמינה תמיד. מספרת מה עובר עלייך — ומקבלת כלי אחד מעשי וצעד קטן להיום.",
    href: "/talk",
    cta: "לפתוח שיחה"
  }, {
    icon: "home",
    title: "היום שלי",
    text: "מסך הבית האישי: הצעד הבא להיום, כלי הרגעה, וכפתור עזרה דחופה תמיד בהישג יד.",
    href: "/today",
    cta: "להיכנס"
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "digital",
    className: "py-20 sm:py-28 bg-[#FAF8F4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-10 lg:gap-14 items-center mb-14"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[680px]"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05D4\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9\u05EA"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[30px] sm:text-[40px]"
  }, "\u05E7\u05D8\u05D9 \u05D1\u05DB\u05D9\u05E1 \u05E9\u05DC\u05DA \u2014 \u05DB\u05DC \u05D9\u05D5\u05DD, \u05D1\u05E7\u05E6\u05D1 \u05E9\u05DC\u05DA"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[17px] mt-2"
  }, "\u05D0\u05D9\u05DE\u05D5\u05DF \u05DE\u05E0\u05D8\u05DC\u05D9 \u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9 \u05D1\u05E9\u05D9\u05D8\u05EA CureMindset: \u05E9\u05D9\u05D7\u05D4, \u05DB\u05DC\u05D9\u05DD \u05D5\u05EA\u05E8\u05D2\u05D5\u05DC \u05D9\u05D5\u05DE\u05D9. \u05DE\u05DC\u05D5\u05D5\u05D4 \u05DC\u05EA\u05E8\u05D2\u05D5\u05DC \u2014 \u05DC\u05D0 \u05EA\u05D7\u05DC\u05D9\u05E3 \u05DC\u05D8\u05D9\u05E4\u05D5\u05DC.")), /*#__PURE__*/React.createElement(Reveal, {
    className: "hidden lg:flex justify-end"
  }, /*#__PURE__*/React.createElement("div", {
    className: "digital-figure"
  }, /*#__PURE__*/React.createElement("img", {
    src: "images/kety-digital.jpg",
    alt: "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 \u05DE\u05E9\u05EA\u05DE\u05E9\u05EA \u05D1\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D9\u05EA CureMindset \u05D4\u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9\u05EA",
    width: 800,
    height: 1000,
    loading: "lazy",
    decoding: "async"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-6"
  }, cards.map((c, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: c.title,
    style: {
      transitionDelay: `${i * 90}ms`
    },
    className: "bg-white border border-ink-100 rounded-2xl p-7 flex flex-col gap-3 shadow-softer hover:border-gold-300 cm-lift"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gold-100 text-gold-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[20px]"
  }, c.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[15px] leading-relaxed flex-1"
  }, c.text), /*#__PURE__*/React.createElement("a", {
    href: c.href,
    className: "font-heading font-bold text-[14px] text-gold-700 hover:text-gold-600 mt-1"
  }, c.cta, " \u2190")))), /*#__PURE__*/React.createElement(Reveal, {
    className: "mt-8 bg-white border border-ink-100 rounded-2xl p-7 sm:p-9 shadow-softer"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[21px] mb-2"
  }, "\u05DE\u05D4 \u05E7\u05D9\u05D5\u05E8\u05D8\u05D9 \u05DB\u05DF \u2014 \u05D5\u05DE\u05D4 \u05DC\u05D0"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[15px]"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600"
  }, /*#__PURE__*/React.createElement("b", {
    className: "text-gold-700"
  }, "\u05DB\u05DF:"), " \u05DE\u05E7\u05E9\u05D9\u05D1\u05D4, \u05DE\u05E9\u05E7\u05E4\u05EA, \u05D5\u05DE\u05E6\u05D9\u05E2\u05D4 \u05DB\u05DC\u05D9 \u05DE\u05E2\u05E9\u05D9 \u05D0\u05D7\u05D3 \u05D5\u05E6\u05E2\u05D3 \u05E7\u05D8\u05DF \u2014 \u05DE\u05D1\u05D5\u05E1\u05E1 \u05E2\u05DC \u05DE\u05E7\u05D5\u05E8\u05D5\u05EA \u05D4\u05E9\u05D9\u05D8\u05D4 \u05E9\u05DC \u05E7\u05D8\u05D9."), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600"
  }, /*#__PURE__*/React.createElement("b", {
    className: "text-ink-800"
  }, "\u05DC\u05D0:"), " \u05D0\u05D9\u05E0\u05D4 \u05DE\u05D0\u05D1\u05D7\u05E0\u05EA, \u05D0\u05D9\u05E0\u05D4 \u05DE\u05D1\u05D8\u05D9\u05D7\u05D4 \u05EA\u05D5\u05E6\u05D0\u05D4, \u05D5\u05D0\u05D9\u05E0\u05D4 \u05EA\u05D7\u05DC\u05D9\u05E3 \u05DC\u05D8\u05D9\u05E4\u05D5\u05DC \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9 \u05D0\u05D5 \u05DC\u05E9\u05D9\u05E8\u05D5\u05EA \u05D7\u05D9\u05E8\u05D5\u05DD.")), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[13.5px] mt-4"
  }, "\u05DB\u05E9\u05E6\u05E8\u05D9\u05DA \u05D0\u05D3\u05DD \u2014 \u05D9\u05E9 \u05DB\u05E4\u05EA\u05D5\u05E8 \"\u05D0\u05E0\u05D9 \u05E6\u05E8\u05D9\u05DB\u05D4 \u05D0\u05D3\u05DD\", \u05D5\u05D1\u05DE\u05E6\u05D5\u05E7\u05D4 \u05DE\u05D9\u05D9\u05D3\u05D9\u05EA \u05DE\u05D5\u05E6\u05D2\u05D9\u05DD \u05DE\u05D9\u05D3 \u05E2\u05E8\"\u05DF 1201 \u05D5\u05DE\u05D3\"\u05D0 101."))));
}

/* ---------------------------------------------------------------- */
/* Workshops (Simplified)                                           */
/* ---------------------------------------------------------------- */

function Workshops() {
  return /*#__PURE__*/React.createElement("section", {
    id: "workshops",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[680px] mb-14"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, CONTENT.workshops.eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[30px] sm:text-[40px]"
  }, CONTENT.workshops.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[17px] mt-2"
  }, CONTENT.workshops.subtitle)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10"
  }, CONTENT.workshops.items.map((it, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: it.title,
    style: {
      transitionDelay: `${i * 90}ms`
    },
    className: "ws-card bg-white border border-ink-100 rounded-2xl overflow-hidden flex flex-col shadow-softer hover:border-gold-300 cm-lift"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-card-media",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ws-card-medallion"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 26
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-7 pt-6 flex flex-col gap-3 flex-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ws-card-meta"
  }, it.meta), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[20px]"
  }, it.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[15px] leading-relaxed flex-1"
  }, it.text), it.href && /*#__PURE__*/React.createElement("a", {
    href: it.href,
    className: "ws-card-link font-heading font-bold text-[14px] text-gold-700 hover:text-gold-600 mt-1"
  }, "\u05DC\u05E4\u05E8\u05D8\u05D9\u05DD \u05DE\u05DC\u05D0\u05D9\u05DD ", /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2190")))))), /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center"
  }, /*#__PURE__*/React.createElement(Button, {
    as: "a",
    href: waLink("היי קטי! אשמח לפרטים על הסדנה הקרובה"),
    target: "_blank",
    rel: "noopener noreferrer",
    variant: "secondary",
    size: "md"
  }, CONTENT.workshops.cta))));
}

/* ---------------------------------------------------------------- */
/* CURE Teens                                                       */
/* ---------------------------------------------------------------- */

const CURE_TEENS_CTA_TEXT = "לקביעת פגישת אבחון ופיצוח דפוסים";
function CureTeens() {
  return /*#__PURE__*/React.createElement("section", {
    id: "cure-teens",
    className: "py-20 sm:py-28 relative overflow-hidden bg-[#E8E0D5]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7 relative"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[800px] mb-14"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border font-heading text-[13px] font-semibold mb-6",
    style: {
      borderColor: "#C9A96E",
      color: "#AD8A52"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "graduation-cap",
    size: 15
  }), "CURE Teens \xB7 \u05EA\u05D4\u05DC\u05D9\u05DA \u05DE\u05D0\u05D9\u05E5 \u05DC\u05DE\u05EA\u05D1\u05D2\u05E8\u05D9\u05DD"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-900 text-[30px] sm:text-[42px] leading-tight mb-4"
  }, "\u05DE\u05D4\u05DE\u05E1\u05DB\u05D9\u05DD \u05D0\u05DC \u05D4\u05D7\u05D9\u05D9\u05DD \u2014 \u05E4\u05D5\u05E7\u05D5\u05E1, \u05D5\u05D9\u05E1\u05D5\u05EA \u05E8\u05D2\u05E9\u05D9 \u05D5\u05EA\u05E7\u05E9\u05D5\u05E8\u05EA \u05D1\u05D1\u05D9\u05EA"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[17px] sm:text-[18px] leading-relaxed"
  }, "\u05EA\u05D4\u05DC\u05D9\u05DA \u05DE\u05D1\u05D5\u05E1\u05E1 NLP \u05D5\u05D7\u05E7\u05E8 \u05D4\u05DE\u05D5\u05D7 \u05E9\u05D1\u05D5\u05E0\u05D4 \u05DC\u05DE\u05EA\u05D1\u05D2\u05E8/\u05EA \u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E4\u05E2\u05DC\u05D4 \u05D7\u05D3\u05E9\u05D4 \u2014 \u05DE\u05E0\u05D9\u05EA\u05D5\u05E7 \u05D5\u05D3\u05D7\u05D9\u05D9\u05E0\u05D5\u05EA \u05D0\u05DC \u05D7\u05D5\u05E1\u05DF \u05E4\u05E0\u05D9\u05DE\u05D9, \u05D1\u05D9\u05D8\u05D7\u05D5\u05DF \u05D5\u05EA\u05E7\u05E9\u05D5\u05E8\u05EA \u05DE\u05E7\u05E8\u05D1\u05EA.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12"
  }, [{
    letter: "C",
    title: "Clarity · בהירות",
    text: "פיצוח הזהות האישית מעבר למסכים וזיהוי ערכי הליבה."
  }, {
    letter: "U",
    title: "Unblock · שחרור חסמים",
    text: "שחרור העומס הרגשי, פירוק דפוסים מעכבים והפגת דריכות היתר במערכת העצבים."
  }, {
    letter: "R",
    title: "Rewire · חיווט מחדש",
    text: "שינוי תגובות אוטומטיות ובניית חוסן רגשי."
  }, {
    letter: "E",
    title: "Empower · העצמה",
    text: "הנדסת הרגלים, עצמאות רגשית ותקשורת מקרבת."
  }].map((p, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: p.letter,
    style: {
      transitionDelay: `${i * 80}ms`
    },
    className: "rounded-2xl bg-white border border-[#E8E0D5] p-6 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-black text-3xl block mb-2",
    style: {
      color: "#AD8A52"
    }
  }, p.letter), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-[17px] text-ink-900 mb-2"
  }, p.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[14px] leading-relaxed"
  }, p.text)))), /*#__PURE__*/React.createElement(Reveal, {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 max-w-[820px] mx-auto"
  }, [{
    icon: "calendar",
    label: "6 מפגשים",
    sub: "תהליך מלא ומובנה"
  }, {
    icon: "clock",
    label: "50 דקות",
    sub: "כל מפגש אישי"
  }, {
    icon: "user-round",
    label: "1:1 · פרונטלי או זום",
    sub: "ליווי אישי צמוד"
  }, {
    icon: "sparkles",
    label: "כלים לחוסן",
    sub: "תרגול שממשיך בין המפגשים"
  }].map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "rounded-2xl bg-white border border-[#E8E0D5] p-5 text-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3",
    style: {
      background: "#B8D4E3",
      color: "#2D2A26"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.icon,
    size: 19
  })), /*#__PURE__*/React.createElement("p", {
    className: "font-heading font-bold text-[15px] text-ink-900 leading-tight"
  }, f.label), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[12.5px] mt-1"
  }, f.sub)))), /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center"
  }, /*#__PURE__*/React.createElement(Button, {
    as: "a",
    href: BOOKING_LINKS.calendar || waLink(CURE_TEENS_CTA_TEXT),
    target: "_blank",
    rel: "noopener noreferrer"
  }, CURE_TEENS_CTA_TEXT), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[13.5px] leading-relaxed mt-4 max-w-[560px] mx-auto"
  }, "\u05DE\u05EA\u05D7\u05D9\u05DC\u05D9\u05DD \u05D1\u05E9\u05D9\u05D7\u05EA \u05D0\u05D1\u05D7\u05D5\u05DF \u05E9\u05DC 20 \u05D3\u05E7\u05D5\u05EA \u2014 \u05DC\u05DC\u05D0 \u05E2\u05DC\u05D5\u05EA \u05D5\u05DC\u05DC\u05D0 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA. \u05D1\u05E9\u05D9\u05D7\u05D4 \u05E0\u05DB\u05D9\u05E8 \u05D0\u05EA \u05D4\u05DE\u05EA\u05D1\u05D2\u05E8/\u05EA, \u05E0\u05D6\u05D4\u05D4 \u05D0\u05EA \u05D4\u05D3\u05E4\u05D5\u05E1 \u05D5\u05E0\u05D1\u05E0\u05D4 \u05D9\u05D7\u05D3 \u05D0\u05EA \u05D4\u05DE\u05E1\u05DC\u05D5\u05DC \u05D5\u05D4\u05E7\u05E6\u05D1 \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D9\u05DD. CURE Teens \u05D4\u05D5\u05D0 \u05DE\u05E1\u05DC\u05D5\u05DC \u05DC\u05D9\u05D5\u05D5\u05D9 \u05D0\u05D9\u05E9\u05D9 \u05DC\u05E0\u05D5\u05E2\u05E8 (13+) \u05D5\u05D4\u05D5\u05E8\u05D9\u05DD, \u05E0\u05E4\u05E8\u05D3 \u05DE\u05EA\u05D5\u05DB\u05E0\u05D9\u05D5\u05EA \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05D5\u05EA \u05E9\u05DC\u05DE\u05D8\u05D4."))));
}

/* ---------------------------------------------------------------- */
/* Plans / Pricing (3 Tiers Curable Style)                           */
/* ---------------------------------------------------------------- */

function PlanCard({
  plan,
  idx,
  onEnterApp
}) {
  const isPlus = plan.highlight;
  return /*#__PURE__*/React.createElement(Reveal, {
    style: {
      transitionDelay: `${idx * 90}ms`
    },
    className: `rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 relative ${isPlus ? "bg-white border-2 border-gold-400 shadow-soft scale-102 lg:-translate-y-2 z-10" : "bg-[#FAF8F4] border border-ink-100/80 shadow-softer"}`
  }, isPlus && /*#__PURE__*/React.createElement("span", {
    className: "absolute -top-3.5 inset-x-0 mx-auto w-fit px-4 py-1 rounded-full bg-gold-500 text-white font-heading font-bold text-[12px] tracking-wide uppercase shadow-sm"
  }, plan.badge), /*#__PURE__*/React.createElement("div", null, !isPlus && /*#__PURE__*/React.createElement("span", {
    className: "inline-block px-3 py-1 rounded-full bg-gold-100 text-gold-700 font-heading font-semibold text-[12.5px] mb-3"
  }, plan.badge), /*#__PURE__*/React.createElement("div", {
    className: "mt-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-extrabold text-ink-800 text-[22px] sm:text-[25px] leading-snug"
  }, plan.price)), plan.priceNote && /*#__PURE__*/React.createElement("p", {
    className: "mb-3 text-[13px] font-semibold text-gold-700"
  }, plan.priceNote), plan.audience && /*#__PURE__*/React.createElement("p", {
    className: "mb-5 text-[13px] text-ink-500 leading-snug"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-ink-700"
  }, "\u05DE\u05EA\u05D0\u05D9\u05DD \u05DC: "), plan.audience), /*#__PURE__*/React.createElement("ul", {
    className: "flex flex-col gap-3 mb-8"
  }, plan.features.map((f, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "flex items-center gap-2.5 text-ink-700 text-[15.5px] font-medium"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle-2",
    size: 18,
    className: "text-gold-600 shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, f))))), /*#__PURE__*/React.createElement(Button, {
    as: "button",
    type: "button",
    onClick: () => {
      if (PAYMENT_LINKS[plan.id]) {
        window.open(PAYMENT_LINKS[plan.id], "_blank");
      } else if (plan.id === "basic") {
        onEnterApp ? onEnterApp() : window.open(waLink("היי קטי! אשמח להתחיל בהתנסות הדיגיטלית"), "_blank");
      } else {
        // מסלולי ליווי אישי — לתיאום שיחה ביומן של קטי
        window.open(BOOKING_LINKS.calendar || waLink(`היי קטי! אשמח לפרטים על מסלול ${plan.badge}`), "_blank", "noopener");
      }
    },
    variant: isPlus ? "primary" : "secondary",
    size: "md",
    className: "w-full mt-4"
  }, plan.cta));
}
function Plans({
  onEnterApp
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: "plans",
    className: "py-20 sm:py-28 bg-[#FAF8F4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[640px] mb-4"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, CONTENT.plans.eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[30px] sm:text-[42px]"
  }, CONTENT.plans.title)), /*#__PURE__*/React.createElement(Reveal, {
    className: "mb-14"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[17px] font-medium"
  }, CONTENT.plans.subtitle)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-7 items-stretch"
  }, CONTENT.plans.items.map((plan, i) => /*#__PURE__*/React.createElement(PlanCard, {
    key: plan.id,
    plan: plan,
    idx: i,
    onEnterApp: onEnterApp
  })))));
}

/* ---------------------------------------------------------------- */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* Testimonials / Results (Curable Clean Cards)                     */
/* ---------------------------------------------------------------- */

function Testimonials() {
  return /*#__PURE__*/React.createElement("section", {
    id: "results",
    className: "py-20 sm:py-28 bg-[#FAF8F4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[680px] mb-16"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, CONTENT.testimonials.eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[30px] sm:text-[42px]"
  }, CONTENT.testimonials.title)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-7"
  }, CONTENT.testimonials.quotes.map((q, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    style: {
      transitionDelay: `${i * 90}ms`
    },
    className: "bg-white rounded-2xl p-8 border border-gold-200/60 shadow-softer flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-ink-700 text-[17px] leading-relaxed font-medium mb-6"
  }, "\u201C", q.text, "\u201D"), /*#__PURE__*/React.createElement("p", {
    className: "text-gold-700 text-[14.5px] font-semibold"
  }, "\u2014 ", q.who))))));
}

/* ---------------------------------------------------------------- */
/* Lead Capture Form  →  POST /api/send-lead                        */
/* ---------------------------------------------------------------- */

const LEAD_SUBJECTS = [{
  value: "",
  label: "מה מעניין אותך?"
}, {
  value: "personal",
  label: "ליווי אישי (מבוגרים)"
}, {
  value: "teens",
  label: "CURE Teens — נוער והורים"
}, {
  value: "organization",
  label: "סדנה / הרצאה לארגון"
}, {
  value: "other",
  label: "אחר / לא בטוחה עדיין"
}];
function normalizePhone(v) {
  let d = (v || "").replace(/[^\d]/g, "");
  if (d.startsWith("972") && d.length === 12) d = "0" + d.slice(3);else if (d.startsWith("9720") && d.length === 13) d = "0" + d.slice(4);
  return d;
}
function LeadForm({
  compact = false
}) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    subject: "",
    goal: ""
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const set = k => e => {
    setForm(f => ({
      ...f,
      [k]: e.target.value
    }));
    setErrors(er => ({
      ...er,
      [k]: undefined
    }));
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
    if (Object.keys(er).length) {
      setErrors(er);
      return;
    }
    setStatus("sending");
    const subjectLabel = (LEAD_SUBJECTS.find(s => s.value === form.subject) || {}).label || "";
    try {
      const res = await fetch("/api/send-lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: normalizePhone(form.phone),
          onboarding: (subjectLabel + (form.goal.trim() ? " | מה רוצה להשיג: " + form.goal.trim().slice(0, 220) : "")).slice(0, 400),
          source: "landing-lead-form"
        })
      });
      if (!res.ok) throw new Error("bad status " + res.status);
      setStatus("done");
    } catch (_err) {
      setStatus("error");
    }
  }
  if (status === "done") {
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl bg-white border border-gold-200 shadow-soft p-8 text-center max-w-[520px] mx-auto"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-12 h-12 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center mx-auto mb-4"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle-2",
      size: 26
    })), /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-semibold text-ink-800 text-[22px] mb-2"
    }, "\u05E7\u05D9\u05D1\u05DC\u05E0\u05D5 \u05D0\u05EA \u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05E9\u05DC\u05DA"), /*#__PURE__*/React.createElement("p", {
      className: "text-ink-600 text-[15.5px] mb-6"
    }, "\u05E7\u05D8\u05D9 \u05D0\u05D5 \u05DE\u05D9\u05E9\u05D4\u05D9 \u05DE\u05D4\u05E6\u05D5\u05D5\u05EA \u05EA\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DA \u05D1\u05D4\u05E7\u05D3\u05DD. \u05E8\u05D5\u05E6\u05D4 \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC \u05DB\u05D1\u05E8 \u05E2\u05DB\u05E9\u05D9\u05D5? \u05D0\u05E4\u05E9\u05E8 \u05DC\u05DB\u05EA\u05D5\u05D1 \u05DC\u05E0\u05D5 \u05D9\u05E9\u05D9\u05E8\u05D5\u05EA \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4."), /*#__PURE__*/React.createElement(Button, {
      as: "a",
      href: waLink("היי קטי! השארתי פרטים באתר ואשמח להתקדם"),
      target: "_blank",
      rel: "noopener noreferrer",
      size: "md",
      className: "mx-auto"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "whatsapp",
      size: 18,
      className: "shrink-0"
    }), "\u05DC\u05D4\u05DE\u05E9\u05DA \u05E9\u05D9\u05D7\u05D4 \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4"));
  }
  const inputCls = "w-full rounded-xl border bg-white px-4 py-3.5 text-[15.5px] text-ink-800 placeholder-ink-400 outline-none transition-colors focus:border-gold-400 focus:ring-2 focus:ring-gold-200";
  const errCls = "text-[13px] text-red-600 mt-1";
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: onSubmit,
    noValidate: true,
    className: `text-start ${compact ? "" : "rounded-2xl bg-white border border-ink-100 shadow-soft p-7 sm:p-9"} max-w-[520px] mx-auto`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "lead-name",
    className: "block text-[14px] font-semibold text-ink-700 mb-1.5"
  }, "\u05E9\u05DD \u05DE\u05DC\u05D0"), /*#__PURE__*/React.createElement("input", {
    id: "lead-name",
    type: "text",
    autoComplete: "name",
    value: form.fullName,
    onChange: set("fullName"),
    placeholder: "\u05D0\u05D9\u05DA \u05DC\u05E4\u05E0\u05D5\u05EA \u05D0\u05DC\u05D9\u05DA?",
    className: `${inputCls} ${errors.fullName ? "border-red-400" : "border-ink-200"}`,
    "aria-invalid": !!errors.fullName
  }), errors.fullName && /*#__PURE__*/React.createElement("p", {
    className: errCls
  }, errors.fullName)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "lead-phone",
    className: "block text-[14px] font-semibold text-ink-700 mb-1.5"
  }, "\u05D8\u05DC\u05E4\u05D5\u05DF \u05E0\u05D9\u05D9\u05D3"), /*#__PURE__*/React.createElement("input", {
    id: "lead-phone",
    type: "tel",
    inputMode: "tel",
    autoComplete: "tel",
    dir: "ltr",
    value: form.phone,
    onChange: set("phone"),
    placeholder: "050-000-0000",
    className: `${inputCls} text-right ${errors.phone ? "border-red-400" : "border-ink-200"}`,
    "aria-invalid": !!errors.phone
  }), errors.phone && /*#__PURE__*/React.createElement("p", {
    className: errCls
  }, errors.phone)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "lead-email",
    className: "block text-[14px] font-semibold text-ink-700 mb-1.5"
  }, "\u05D0\u05D9\u05DE\u05D9\u05D9\u05DC"), /*#__PURE__*/React.createElement("input", {
    id: "lead-email",
    type: "email",
    inputMode: "email",
    autoComplete: "email",
    dir: "ltr",
    value: form.email,
    onChange: set("email"),
    placeholder: "name@email.com",
    className: `${inputCls} text-right ${errors.email ? "border-red-400" : "border-ink-200"}`,
    "aria-invalid": !!errors.email
  }), errors.email && /*#__PURE__*/React.createElement("p", {
    className: errCls
  }, errors.email)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "lead-subject",
    className: "block text-[14px] font-semibold text-ink-700 mb-1.5"
  }, "\u05DE\u05D4 \u05DE\u05E2\u05E0\u05D9\u05D9\u05DF \u05D0\u05D5\u05EA\u05DA?"), /*#__PURE__*/React.createElement("select", {
    id: "lead-subject",
    value: form.subject,
    onChange: set("subject"),
    className: `${inputCls} border-ink-200 appearance-none`,
    style: {
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A9987A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "left 1rem center",
      backgroundSize: "16px 16px"
    }
  }, LEAD_SUBJECTS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.value,
    value: s.value,
    disabled: s.value === ""
  }, s.label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    htmlFor: "lead-goal",
    className: "block text-[14px] font-semibold text-ink-700 mb-1.5"
  }, "\u05DE\u05D4 \u05D0\u05EA/\u05D4 \u05E8\u05D5\u05E6\u05D4 \u05DC\u05D4\u05E9\u05D9\u05D2?"), /*#__PURE__*/React.createElement("textarea", {
    id: "lead-goal",
    rows: "2",
    value: form.goal,
    onChange: set("goal"),
    placeholder: "\u05D1\u05DE\u05D9\u05DC\u05D9\u05DD \u05E9\u05DC\u05DA \u2014 \u05DE\u05D4 \u05D4\u05D9\u05D9\u05EA \u05E8\u05D5\u05E6\u05D4 \u05E9\u05D9\u05E9\u05EA\u05E0\u05D4?",
    className: `${inputCls} border-ink-200 resize-none`
  })), status === "error" && /*#__PURE__*/React.createElement("p", {
    className: "text-[14px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-center"
  }, "\u05DE\u05E9\u05D4\u05D5 \u05D4\u05E9\u05EA\u05D1\u05E9 \u05D1\u05E9\u05DC\u05D9\u05D7\u05D4. \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E0\u05E1\u05D5\u05EA \u05E9\u05D5\u05D1 \u05D0\u05D5 \u05DC\u05DB\u05EA\u05D5\u05D1 \u05DC\u05E0\u05D5 \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4."), /*#__PURE__*/React.createElement(Button, {
    as: "button",
    type: "submit",
    variant: "primary",
    size: "md",
    className: "w-full mt-1",
    disabled: status === "sending"
  }, status === "sending" ? "שולח…" : "שליחה — ונחזור אליך"), /*#__PURE__*/React.createElement("p", {
    className: "text-[12.5px] text-ink-400 text-center leading-relaxed"
  }, "\u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05E0\u05E9\u05DE\u05E8\u05D9\u05DD \u05D0\u05E6\u05DC \u05E7\u05D8\u05D9 \u05D1\u05DC\u05D1\u05D3 \u05D5\u05DC\u05D0 \u05DE\u05D5\u05E2\u05D1\u05E8\u05D9\u05DD \u05DC\u05D2\u05D5\u05E8\u05DD \u05E9\u05DC\u05D9\u05E9\u05D9. \u05DC\u05DC\u05D0 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA.")));
}
function LeadSection() {
  return /*#__PURE__*/React.createElement("section", {
    id: "lead",
    className: "py-20 sm:py-28 bg-white border-t border-ink-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05E0\u05EA\u05D7\u05D9\u05DC \u05DC\u05D3\u05D1\u05E8"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[30px] sm:text-[42px] mb-4 leading-tight"
  }, "\u05D4\u05E9\u05D0\u05D9\u05E8\u05D9 \u05E4\u05E8\u05D8\u05D9\u05DD \u2014 \u05D5\u05E0\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05DA"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[17px] leading-relaxed mb-6"
  }, "\u05DC\u05D0 \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D2\u05D9\u05E2 \u05E2\u05DD \u05EA\u05E9\u05D5\u05D1\u05D5\u05EA. \u05DE\u05E9\u05D0\u05D9\u05E8\u05D9\u05DD \u05E9\u05DD \u05D5\u05D8\u05DC\u05E4\u05D5\u05DF \u05D0\u05D5 \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC, \u05D5\u05D0\u05E0\u05D7\u05E0\u05D5 \u05D7\u05D5\u05D6\u05E8\u05D9\u05DD \u05D0\u05DC\u05D9\u05DA \u05DB\u05D3\u05D9 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05D9\u05D7\u05D3 \u05D0\u05DD \u05D4\u05E9\u05D9\u05D8\u05D4 \u05DE\u05EA\u05D0\u05D9\u05DE\u05D4 \u05DC\u05DA \u05D0\u05D5 \u05DC\u05D1\u05DF/\u05D1\u05EA \u05E9\u05DC\u05DA."), /*#__PURE__*/React.createElement("ul", {
    className: "flex flex-col gap-2.5"
  }, ["שיחת היכרות ללא עלות — בלי התחייבות", "שיחה אישית להיכרות והתאמה", "פרטיות מלאה — הנתונים שלך נשארים אצלנו"].map((t, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    className: "flex items-center gap-2.5 text-ink-700 text-[15.5px] font-medium"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle-2",
    size: 18,
    className: "text-gold-600 shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, t))))), /*#__PURE__*/React.createElement(Reveal, {
    style: {
      transitionDelay: "120ms"
    }
  }, /*#__PURE__*/React.createElement(LeadForm, null))));
}

/* ---------------------------------------------------------------- */
/* Articles — ספריית הידע (מושכת מ-/api/articles, בלוג קטי)           */
/* הוחזר אחרי שהוסר בטעות בריעצוב (commit 5c18476). ראה IMPLEMENTATION_AUDIT.md */
/* ---------------------------------------------------------------- */

function ArticlesSection() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/articles").then(r => r.ok ? r.json() : []).then(rows => {
      if (alive) setItems(Array.isArray(rows) ? rows : []);
    }).catch(() => {
      if (alive) setItems([]);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Local published articles stay visible alongside external blog posts.
  const published = [{
    "title": "שחרור חרדה מהשורש: מסע של 15 יום לשינוי עמוק",
    "link": "/articles/healing-anxiety-journey.html",
    "pubDate": "2026-10-07",
    "description": "מסע ריפוי סומטי לנוער, להורים ולכל מי שמכיר את הכבדות בחזה — כולל תוכנית תרגול אינטראקטיבית ל-15 יום."
  }, {
    "title": "חוסן רגשי בגיל ההתבגרות: מיומנות שאפשר לפתח",
    "link": "/articles/emotional-resilience-teens.html",
    "pubDate": "2026-10-01",
    "description": "כלים לוויסות רגשי, עוגן הבית, אימון מנטלי ותמיכה הורית בגיל ההתבגרות."
  }, {
    "title": "דימוי עצמי: איך מחזקים ערך פנימי ועובדים עם דפוסים אוטומטיים",
    "link": "/articles/self-image-subconscious.html",
    "pubDate": "2026-10-01",
    "description": "דרכים לחיזוק דימוי עצמי באמצעות עבודה עם אמונות, דמיון מודרך ופעולות קטנות."
  }];
  const external = Array.isArray(items) ? items.filter(a => a.link && !published.some(p => p.link === a.link) && !a.link.endsWith("blogspot.com/")) : [];
  const cards = [...published, ...external].slice(0, 6).map(a => ({
    title: a.title,
    link: a.link,
    desc: a.description
  }));
  return /*#__PURE__*/React.createElement("section", {
    id: "articles",
    className: "py-20 sm:py-28 bg-white border-t border-gold-200/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "max-w-[680px] mb-16"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05E1\u05E4\u05E8\u05D9\u05D9\u05EA \u05D4\u05D9\u05D3\u05E2 \u05E9\u05DC \u05E7\u05D8\u05D9"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[30px] sm:text-[42px]"
  }, "\u05DE\u05D0\u05DE\u05E8\u05D9\u05DD \u05D5\u05DB\u05DC\u05D9\u05DD \u05EA\u05D5\u05D3\u05E2\u05EA\u05D9\u05D9\u05DD"), /*#__PURE__*/React.createElement("a", {
    href: "/articles",
    className: "inline-flex mt-4 text-gold-700 font-heading font-semibold"
  }, "\u05DC\u05DB\u05DC \u05D4\u05DE\u05D0\u05DE\u05E8\u05D9\u05DD \u2190")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-7"
  }, cards.map((a, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    style: {
      transitionDelay: `${i * 90}ms`
    },
    className: "bg-[#FAF8F4] rounded-2xl p-8 border border-gold-200/60 shadow-softer flex flex-col gap-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-semibold text-[12.5px] tracking-wide text-gold-600"
  }, "\u05DE\u05D0\u05DE\u05E8"), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[20px] leading-tight flex-1"
  }, a.title), a.desc ? /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[15px] leading-relaxed"
  }, a.desc) : null, a.link ? /*#__PURE__*/React.createElement("a", {
    href: a.link,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "inline-flex items-center gap-1.5 self-start text-gold-700 font-heading font-semibold text-[15px]"
  }, "\u05DC\u05E7\u05E8\u05D9\u05D0\u05EA \u05D4\u05DE\u05D0\u05DE\u05E8 \u05D4\u05DE\u05DC\u05D0", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-left",
    size: 17
  })) : null)))));
}

/* ---------------------------------------------------------------- */
/* FAQ (accessible accordion) + responsibility disclaimer           */
/* ---------------------------------------------------------------- */

function Faq() {
  const [open, setOpen] = React.useState(0);
  return /*#__PURE__*/React.createElement("section", {
    id: "faq",
    className: "py-20 sm:py-28 bg-white border-t border-gold-200/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[780px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mb-12"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, CONTENT.faq.eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[28px] sm:text-[38px]"
  }, CONTENT.faq.title)), /*#__PURE__*/React.createElement(Reveal, {
    className: "flex flex-col gap-3"
  }, CONTENT.faq.items.map((it, i) => {
    const isOpen = open === i;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "bg-[#FAF8F4] border border-gold-200/70 rounded-2xl overflow-hidden"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setOpen(isOpen ? -1 : i),
      "aria-expanded": isOpen,
      className: "w-full flex items-center justify-between gap-4 text-right font-heading font-bold text-ink-800 text-[17px] transition-colors",
      style: {
        padding: "18px 22px",
        background: "transparent"
      }
    }, /*#__PURE__*/React.createElement("span", null, it.q), /*#__PURE__*/React.createElement(Icon, {
      name: isOpen ? "chevron-up" : "chevron-down",
      size: 20,
      className: "text-gold-600 shrink-0"
    })), isOpen && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 22px 20px"
      }
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-ink-600 text-[16px] leading-relaxed"
    }, it.a)));
  })), /*#__PURE__*/React.createElement(Reveal, {
    className: "mt-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rounded-2xl p-6 flex gap-3 items-start",
    style: {
      background: "rgba(184,212,227,0.18)",
      border: "1px solid rgba(184,212,227,0.5)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 20,
    className: "text-ink-500 shrink-0"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[14px] leading-relaxed"
  }, CONTENT.faq.disclaimer)))));
}

/* ---------------------------------------------------------------- */
/* Final CTA                                                        */
/* ---------------------------------------------------------------- */

function FinalCta() {
  return /*#__PURE__*/React.createElement("section", {
    id: "contact",
    className: "py-20 sm:py-28 bg-white border-t border-gold-200/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[720px] mx-auto px-5 sm:px-7 text-center"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[32px] sm:text-[44px] mb-4"
  }, CONTENT.finalCta.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[18px] mb-9"
  }, CONTENT.finalCta.text), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center gap-4"
  }, /*#__PURE__*/React.createElement(Button, {
    as: "a",
    href: "#lead",
    size: "lg",
    className: "px-10 py-4 text-[18px]"
  }, CONTENT.finalCta.ctaPrimary), /*#__PURE__*/React.createElement("a", {
    href: waLink("היי קטי! יש לי שאלה"),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "inline-flex items-center gap-2 text-ink-500 hover:text-gold-600 font-medium text-[15px] transition-colors mt-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "whatsapp",
    size: 17
  }), CONTENT.finalCta.ctaSecondaryText)))));
}

/* ---------------------------------------------------------------- */
/* Footer & Floats                                                   */
/* ---------------------------------------------------------------- */

function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    className: "bg-[#EADDC3] text-ink-800 pt-16 pb-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-10 pb-10 border-b border-white/10"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
    src: "images/logo.png",
    alt: "CureMindset",
    className: "h-11 w-auto mb-3",
    onError: e => {
      e.currentTarget.style.display = "none";
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-extrabold text-[22px] tracking-tight text-white block mb-3"
  }, "Cure", /*#__PURE__*/React.createElement("span", {
    className: "text-gold-400"
  }, "Mindset")), /*#__PURE__*/React.createElement("p", {
    className: "text-white/60 text-[14px] leading-relaxed max-w-[280px]"
  }, CONTENT.footer.tagline)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-heading font-semibold text-white mb-3 text-[15px]"
  }, "\u05E7\u05D9\u05E9\u05D5\u05E8\u05D9\u05DD"), /*#__PURE__*/React.createElement("ul", {
    className: "flex flex-col gap-2"
  }, CONTENT.nav.links.map(l => /*#__PURE__*/React.createElement("li", {
    key: l.href
  }, /*#__PURE__*/React.createElement("a", {
    href: l.href,
    className: "text-white/60 text-[14.5px] hover:text-gold-400 transition-colors"
  }, l.label)))), /*#__PURE__*/React.createElement("p", {
    className: "font-heading font-semibold text-white mt-5 mb-3 text-[15px]"
  }, "\u05D0\u05D9\u05E4\u05D4 \u05E4\u05D5\u05D2\u05E9\u05D9\u05DD"), /*#__PURE__*/React.createElement("ul", {
    className: "flex flex-col gap-2"
  }, [["/emotional-therapist-krayot", "מטפלת רגשית בקריות"], ["/anxiety-krayot", "טיפול בחרדה בקריות"], ["/nlp-haifa", "מטפלת NLP בחיפה"], ["/emotional-therapy-haifa", "טיפול רגשי בחיפה"], ["/online", "טיפול בזום לכל הארץ"]].map(([href, label]) => /*#__PURE__*/React.createElement("li", {
    key: href
  }, /*#__PURE__*/React.createElement("a", {
    href: href,
    className: "text-white/60 text-[14.5px] hover:text-gold-400 transition-colors"
  }, label))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-heading font-semibold text-white mb-3 text-[15px]"
  }, "\u05D9\u05E6\u05D9\u05E8\u05EA \u05E7\u05E9\u05E8"), /*#__PURE__*/React.createElement("ul", {
    className: "flex flex-col gap-2.5"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: `mailto:${CONTACT.email}`,
    className: "flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 16
  }), CONTACT.email)), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: `tel:${CONTACT.phoneDisplay.replace(/-/g, "")}`,
    className: "flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "phone",
    size: 16
  }), CONTACT.phoneDisplay)), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: waLink("היי קטי!"),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "whatsapp",
    size: 16
  }), "\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: MEDIA_LINKS.instagram,
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": "Instagram",
    className: "flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "instagram",
    size: 16,
    className: "shrink-0"
  }), "Instagram")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: MEDIA_LINKS.youtubeChannel,
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": "YouTube",
    className: "flex items-center gap-2 text-white/60 text-[14.5px] hover:text-gold-400 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "youtube",
    size: 16,
    className: "shrink-0"
  }), "YouTube"))))), /*#__PURE__*/React.createElement("div", {
    className: "pt-8 pb-6 border-b border-white/10"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-heading font-semibold text-white/70 mb-3 text-[13.5px]"
  }, "\u05E0\u05D5\u05E9\u05D0\u05D9\u05DD"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-x-5 gap-y-2"
  }, [{
    href: "/method",
    label: "השיטה"
  }, {
    href: "/emotional-coaching",
    label: "אימון רגשי"
  }, {
    href: "/anxiety-and-stress",
    label: "חרדה"
  }, {
    href: "/self-confidence",
    label: "ביטחון עצמי"
  }, {
    href: "/procrastination",
    label: "דחיינות"
  }, {
    href: "/cure-teens",
    label: "ליווי לנוער"
  }].map(l => /*#__PURE__*/React.createElement("a", {
    key: l.href,
    href: l.href,
    className: "text-white/55 text-[14px] hover:text-gold-400 transition-colors"
  }, l.label)))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap justify-center gap-x-5 gap-y-2 pt-8"
  }, [{
    href: "/privacy",
    label: "פרטיות"
  }, {
    href: "/terms",
    label: "תנאי שימוש"
  }, {
    href: "/accessibility",
    label: "נגישות"
  }, {
    href: "/responsibility",
    label: "הבהרת אחריות"
  }, {
    href: "/contact",
    label: "יצירת קשר"
  }].map(l => /*#__PURE__*/React.createElement("a", {
    key: l.href,
    href: l.href,
    className: "text-white/50 text-[13px] hover:text-gold-400 transition-colors"
  }, l.label))), /*#__PURE__*/React.createElement("p", {
    className: "text-white/40 text-[13px] text-center pt-5"
  }, CONTENT.footer.rights)));
}
function WhatsAppFloat() {
  return /*#__PURE__*/React.createElement("a", {
    href: waLink("היי קטי! אשמח לדבר"),
    target: "_blank",
    rel: "noopener noreferrer",
    "aria-label": "\u05E4\u05EA\u05D9\u05D7\u05EA \u05E9\u05D9\u05D7\u05D4 \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4",
    className: "fixed bottom-5 inset-inline-end-5 z-40 w-14 h-14 rounded-full bg-gold-500 text-white shadow-soft flex items-center justify-center hover:bg-gold-600 hover:scale-105 transition-all"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "whatsapp",
    size: 26
  }));
}

/* ---------------------------------------------------------------- */
/* Main Home Component                                              */
/* ---------------------------------------------------------------- */

/* ================================================================ */
/* עמוד הבית לפי HOMEPAGE_BLUEPRINT.md (קופי של Elara — לא לשכתב)   */
/* 10 סקשנים בסדר מחייב. עיצוב לפי DESIGN_TOKENS. RTL, מובייל-first. */
/* ================================================================ */

const HB_WA = () => waLink("היי קטי! הגעתי מהאתר ואשמח לשיחת היכרות");

/* SECTION 1 — HERO (עיצוב אדיטוריאלי, Good Inside × The Soke; קופי של Elara) */
function HbHero() {
  return /*#__PURE__*/React.createElement("section", {
    id: "top",
    className: "hb-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hb-hero__inner"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "hb-hero__media"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hb-hero__frame"
  }, /*#__PURE__*/React.createElement("picture", null, /*#__PURE__*/React.createElement("source", {
    srcSet: "images/kety-640.webp 640w, images/kety-920.webp 920w",
    type: "image/webp",
    sizes: "(max-width:1024px) 440px, 520px"
  }), /*#__PURE__*/React.createElement("img", {
    src: "images/kety-640.jpg",
    srcSet: "images/kety-640.jpg 640w, images/kety-920.jpg 920w",
    sizes: "(max-width:1024px) 440px, 520px",
    alt: "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 \u2014 \u05DE\u05D8\u05E4\u05DC\u05EA NLP \u05D5\u05DE\u05D0\u05DE\u05E0\u05EA \u05DE\u05E0\u05D8\u05DC\u05D9\u05EA \u05D5\u05DE\u05E4\u05EA\u05D7\u05EA \u05E9\u05D9\u05D8\u05EA CureMindset",
    width: 920,
    height: 1150,
    loading: "eager",
    decoding: "async"
  })))), /*#__PURE__*/React.createElement(Reveal, {
    className: "hb-hero__text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hb-hero__kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hb-hero__kicker-dot",
    "aria-hidden": "true"
  }), "\u05E9\u05D9\u05D8\u05EA CureMindset \xB7 \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1"), /*#__PURE__*/React.createElement("h1", {
    className: "hb-hero__title"
  }, /*#__PURE__*/React.createElement("span", null, "\u05D7\u05E8\u05D3\u05D4 \u05D5\u05E2\u05D5\u05DE\u05E1 \u05E8\u05D2\u05E9\u05D9"), /*#__PURE__*/React.createElement("span", {
    className: "hb-hero__title-em"
  }, "\u05DC\u05D0 \u05D7\u05D9\u05D9\u05D1\u05D9\u05DD \u05DC\u05E0\u05D4\u05DC \u05D0\u05EA \u05D4\u05D7\u05D9\u05D9\u05DD \u05E9\u05DC\u05DA.")), /*#__PURE__*/React.createElement("p", {
    className: "hb-hero__sub"
  }, "\u05DC\u05D9\u05D5\u05D5\u05D9 \u05E8\u05D2\u05E9\u05D9 \u05E9\u05E2\u05D5\u05D1\u05D3 \u05E2\u05DD \u05D4\u05E9\u05D5\u05E8\u05E9, \u05DC\u05D0 \u05E8\u05E7 \u05E2\u05DD \u05DE\u05D4 \u05E9\u05D1\u05D5\u05DC\u05D8 \u05DE\u05D1\u05D7\u05D5\u05E5: \u05DE\u05D9\u05E4\u05D5\u05D9 \u05E9\u05DC \u05D4\u05DE\u05E6\u05D1, \u05D6\u05D9\u05D4\u05D5\u05D9 \u05D4\u05D3\u05E4\u05D5\u05E1 \u05E9\u05DE\u05E4\u05E8\u05D9\u05E2, \u05D5\u05DB\u05DC\u05D9\u05DD \u05DE\u05E2\u05E9\u05D9\u05D9\u05DD \u05E9\u05E0\u05E9\u05D0\u05E8\u05D9\u05DD \u05D0\u05D9\u05EA\u05DA \u05D2\u05DD \u05DE\u05D7\u05D5\u05E5 \u05DC\u05DE\u05E4\u05D2\u05E9. \u05DC\u05E0\u05D5\u05E2\u05E8 (13+) \u05D5\u05DC\u05DE\u05D1\u05D5\u05D2\u05E8\u05D9\u05DD."), /*#__PURE__*/React.createElement("div", {
    className: "hb-hero__cta"
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://calendly.com/ketysegev/meet-with-me",
    target: "_blank",
    rel: "noopener",
    className: "hb-hero__btn"
  }, "\u05DC\u05E9\u05D9\u05D7\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA \u05DC\u05DC\u05D0 \u05E2\u05DC\u05D5\u05EA"), /*#__PURE__*/React.createElement("a", {
    href: "#services",
    className: "hb-hero__link"
  }, "\u05DC\u05DB\u05DC \u05D4\u05EA\u05D5\u05DB\u05E0\u05D9\u05D5\u05EA ", /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\u2190"))), /*#__PURE__*/React.createElement("ul", {
    className: "hb-hero__trust",
    "aria-label": "\u05E0\u05EA\u05D5\u05E0\u05D9 \u05D0\u05DE\u05D5\u05DF"
  }, /*#__PURE__*/React.createElement("li", null, "\u05D4\u05DB\u05E9\u05E8\u05D5\u05EA NLP \u05D1\u05D9\u05E0\u05DC\u05D0\u05D5\u05DE\u05D9\u05D5\u05EA"), /*#__PURE__*/React.createElement("li", null, "\u05DC\u05E0\u05D5\u05E2\u05E8 \xB7 \u05DC\u05DE\u05D1\u05D5\u05D2\u05E8\u05D9\u05DD \xB7 \u05DC\u05D4\u05D5\u05E8\u05D9\u05DD")))));
}

/* SECTION 2 — אולי זה מה שקורה לך */
function HbRecognize() {
  const items = ["המתבגר/ת לא נרדם/ת מרוב מחשבות וחרדה — ואת/ה ער/ה איתו/ה, בלי לדעת איך להיכנס.", "כל אתגר קטן — מבחן, ויכוח, דחייה חברתית — נגמר בסגירות או בהתפרצות, והקול המבקר בפנים רק מתחזק.", "את/ה מתפקד/ת מצוין כלפי חוץ, אבל שחוק/ה מלהחזיק הכל — עם התחושה ש\"אם אני לא אחזיק, הכל יתפרק\".", "את/ה יודע/ת מה “נכון לעשות” — אבל ברגע האמת הגוף מגיב אחרת.", "תחושה שהחיים זזים, ואתם עומדים במקום."];
  return /*#__PURE__*/React.createElement("section", {
    id: "recognize",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[820px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mb-10"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight"
  }, "\u05D6\u05D4 \u05DE\u05D5\u05DB\u05E8?")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 gap-3"
  }, items.map((t, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    style: {
      transitionDelay: `${i * 60}ms`
    },
    className: "flex items-start gap-3 bg-[#FAF8F4] border border-ink-100 rounded-xl px-5 py-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mt-1 text-gold-600 shrink-0"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check-circle-2",
    size: 20
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-800 text-[16.5px] leading-snug"
  }, t)))), /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mt-9"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-heading font-bold text-ink-800 text-[20px] sm:text-[23px] leading-snug"
  }, "\u05D6\u05D4 \u05DC\u05D0 \u05DE\u05D9 \u05E9\u05D0\u05EA/\u05D4. \u05D6\u05D5 \u05D4\u05D2\u05E0\u05D4 \u05D9\u05E9\u05E0\u05D4 \u2014 \u05D5\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E9\u05D7\u05E8\u05E8 \u05D0\u05D5\u05EA\u05D4."))));
}

/* SECTION 3 — הפתרון: מהי CureMindset */
function HbSolution() {
  const pillars = [{
    icon: "compass",
    title: "פרוטוקול CURE",
    text: "ארבעה שלבים מובנים — מהבנת הדפוס, דרך שחרורו, ועד העצמה יציבה."
  }, {
    icon: "wind",
    title: "עבודה עם התת-מודע",
    text: "שם פועלים חלק גדול מהדפוסים האוטומטיים — וזו הרמה שבה אפשר לתרגל שינוי שמחזיק."
  }, {
    icon: "sparkles",
    title: "דמיון מודרך וסאבמודלים",
    text: "שינוי ברמה החושית והתת-חושית, לא רק בהיגיון — שם הדפוס חי."
  }, {
    icon: "heart",
    title: "הטמעה ובניית חוסן",
    text: "תרגול יומי מדוד שהופך את השינוי לחלק ממי שאת/ה, לאורך זמן."
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "solution",
    className: "py-20 sm:py-28 bg-[#FAF8F4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center max-w-[720px] mx-auto mb-14"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05D4\u05E9\u05D9\u05D8\u05D4"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight mb-5"
  }, "\u05E9\u05D9\u05D8\u05D4 \u05DE\u05D5\u05D1\u05E0\u05D9\u05EA \u2014 \u05DC\u05D0 \u05DE\u05E9\u05E4\u05D8\u05D9 \u05D4\u05E9\u05E8\u05D0\u05D4"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[17.5px] leading-relaxed"
  }, "CureMindset \u05D4\u05D9\u05D0 \u05E9\u05D9\u05D8\u05EA \u05E2\u05D1\u05D5\u05D3\u05D4 \u05E9\u05E4\u05D9\u05EA\u05D7\u05D4 \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1, \u05E2\u05DC \u05D4\u05E0\u05D7\u05D4 \u05D0\u05D7\u05EA \u05DC\u05D0\u05BE\u05E9\u05D2\u05E8\u05EA\u05D9\u05EA: \u05D4\u05E7\u05E9\u05D9\u05D9\u05DD \u05E9\u05DC\u05DA \u2014 \u05D4\u05D7\u05E8\u05D3\u05D4, \u05D4\u05E2\u05D5\u05DE\u05E1 \u2014 \u05D0\u05D9\u05E0\u05DD \u05E4\u05D2\u05DD. \u05D4\u05DD \u05DE\u05E0\u05D2\u05E0\u05D5\u05E0\u05D9 \u05D4\u05D2\u05E0\u05D4 \u05E9\u05D4\u05EA\u05EA-\u05DE\u05D5\u05D3\u05E2 \u05D2\u05D9\u05D9\u05E1 \u05E4\u05E2\u05DD \u05DB\u05D3\u05D9 \u05DC\u05E9\u05DE\u05D5\u05E8 \u05E2\u05DC\u05D9\u05DA. \u05D1\u05DE\u05E7\u05D5\u05DD \u05DC\u05D4\u05D9\u05DC\u05D7\u05DD \u05D1\u05D4\u05DD, \u05D4\u05E9\u05D9\u05D8\u05D4 \u05DE\u05E7\u05E9\u05D9\u05D1\u05D4 \u05DC\u05D4\u05DD \u05D5\u05DE\u05E9\u05D7\u05E8\u05E8\u05EA \u05D0\u05D5\u05EA\u05DD \u05DE\u05D4\u05E9\u05D5\u05E8\u05E9 \u2014 \u05D1\u05E8\u05DE\u05D4 \u05D4\u05E8\u05D2\u05E9\u05D9\u05EA \u05D5\u05D4\u05D7\u05D5\u05E9\u05D9\u05EA \u05E9\u05D1\u05D4 \u05D4\u05D3\u05E4\u05D5\u05E1 \u05D1\u05D0\u05DE\u05EA \u05D7\u05D9.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
  }, pillars.map((p, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: p.title,
    style: {
      transitionDelay: `${i * 80}ms`
    },
    className: "bg-white border border-ink-100 rounded-2xl p-6 flex flex-col gap-3 hover:border-gold-300 cm-lift"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gold-100 text-gold-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[18px]"
  }, p.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[14.5px] leading-relaxed flex-1"
  }, p.text)))), /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mt-10"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/method",
    className: "font-heading font-bold text-[16px] text-gold-700 hover:text-gold-800"
  }, "\u05D4\u05E4\u05E8\u05D5\u05D8\u05D5\u05E7\u05D5\u05DC \u05D4\u05DE\u05DC\u05D0 \u05E9\u05DC \u05D4\u05E9\u05D9\u05D8\u05D4 \u2192"))));
}

/* SECTION — השירותים שלנו (Program-forward, בהשראת עזריה: גריד תוכניות מוקדם בעמוד) */
function HbServices() {
  const list = [{
    title: "ליווי אישי 1:1",
    sub: "תהליך עומק עם קטי",
    text: "עבודה ממוקדת תוצאות על השורש: מגדירים מטרה, עובדים עם הקשיים ומודדים שינוי שנשאר.",
    href: "/emotional-coaching"
  }, {
    title: "CURE Teens",
    sub: "ליווי רגשי לנוער",
    text: "חוסן, ביטחון וכלים להתמודדות — בשפה של גיל ההתבגרות, בלי טיפול ובלי תוויות.",
    href: "/cure-teens"
  }];
  const media = [{
    label: "רדיו חיפה",
    href: MEDIA_LINKS.radio
  }, {
    label: "פודקאסט",
    href: MEDIA_LINKS.spotify
  }, {
    label: "ערוץ היוטיוב",
    href: MEDIA_LINKS.youtubeChannel
  }, {
    label: "כל הקישורים",
    href: MEDIA_LINKS.linktree
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "services",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center max-w-[640px] mx-auto mb-14"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05D4\u05E9\u05D9\u05E8\u05D5\u05EA\u05D9\u05DD \u05E9\u05DC\u05E0\u05D5"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight"
  }, "\u05DB\u05DC \u05D4\u05D3\u05E8\u05DB\u05D9\u05DD \u05DC\u05E2\u05D1\u05D5\u05D3 \u05E2\u05DD \u05D4\u05E9\u05D9\u05D8\u05D4"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[16px] leading-relaxed mt-4"
  }, "\u05DE\u05D4\u05E8\u05D2\u05E2 \u05D4\u05E8\u05D0\u05E9\u05D5\u05DF \u05D1\u05E8\u05D5\u05E8 \u05D0\u05D9\u05E4\u05D4 \u05E0\u05DB\u05E0\u05E1\u05D9\u05DD \u2014 \u05D1\u05D5\u05D7\u05E8\u05D9\u05DD \u05D0\u05EA \u05D4\u05D3\u05E8\u05DA \u05E9\u05DE\u05EA\u05D0\u05D9\u05DE\u05D4 \u05DC\u05DA.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
  }, list.map((w, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: w.title,
    style: {
      transitionDelay: `${i * 80}ms`
    },
    className: "bg-[#FAF8F4] border border-ink-100 rounded-2xl p-6 flex flex-col gap-2 hover:border-gold-300 cm-lift"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[19px]"
  }, w.title), /*#__PURE__*/React.createElement("p", {
    className: "text-gold-700 text-[13px] font-semibold"
  }, w.sub), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[14.5px] leading-relaxed flex-1 mt-1"
  }, w.text), /*#__PURE__*/React.createElement("a", {
    href: w.href,
    className: "font-heading font-bold text-[14px] text-gold-700 hover:text-gold-800 mt-2"
  }, "\u05E4\u05E8\u05D8\u05D9\u05DD \u05DE\u05DB\u05D0\u05DF \u2190")))), /*#__PURE__*/React.createElement(Reveal, {
    className: "mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-ink-400 text-[13.5px] font-semibold"
  }, "\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05DB\u05D9\u05E8 \u05D0\u05EA \u05D4\u05E9\u05D9\u05D8\u05D4 \u05D2\u05DD \u05DB\u05D0\u05DF:"), media.map(m => /*#__PURE__*/React.createElement("a", {
    key: m.label,
    href: m.href,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "text-ink-500 text-[13.5px] font-medium hover:text-gold-700 transition-colors underline decoration-ink-100 underline-offset-4"
  }, m.label)))));
}

/* SECTION — עמודי התוכן (בהשראת זרימת Tony Robbins: Pillars) */
function HbPillars() {
  const pillars = [{
    icon: "wind",
    title: "חרדה",
    desc: "דריכות, הצפה ומחשבות שלא נעצרות — ויסות מהשורש.",
    href: "/anxiety-and-stress"
  }, {
    icon: "sparkles",
    title: "ביטחון עצמי ודימוי",
    desc: "ערך פנימי שלא תלוי במה שאחרים חושבים.",
    href: "/self-confidence"
  }, {
    icon: "footprints",
    title: "דחיינות והתנעה",
    desc: "להבין את הדפוס — ולהתחיל לזוז בצעדים קטנים.",
    href: "/procrastination"
  }, {
    icon: "graduation-cap",
    title: "חוסן רגשי לנוער",
    desc: "CURE Teens — בשפה של גיל ההתבגרות, בלי סטיגמה.",
    href: "/cure-teens"
  }, {
    icon: "heart",
    title: "אימון רגשי למבוגרים",
    desc: "עבודת עומק על דפוסים, חסימות ומטרות.",
    href: "/emotional-coaching"
  }, {
    icon: "heart-handshake",
    title: "הורים למתבגר/ת",
    desc: "להבין מה קורה לילד/ה — ולדעת איך לעזור.",
    href: "/cure-teens"
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "pillars",
    className: "py-20 sm:py-28 bg-[#FAF8F4] border-t border-ink-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center max-w-[640px] mx-auto mb-14"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05D4\u05E2\u05DE\u05D5\u05D3\u05D9\u05DD \u05DC\u05D7\u05D9\u05D9\u05DD \u05E2\u05DD \u05D9\u05D5\u05EA\u05E8 \u05E9\u05E7\u05D8 \u05E4\u05E0\u05D9\u05DE\u05D9"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight"
  }, "\u05DE\u05D4\u05DD \u05D4\u05E2\u05DE\u05D5\u05D3\u05D9\u05DD \u05E9\u05DC \u05D4\u05E9\u05E7\u05D8 \u05E9\u05DC\u05DA?"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[15.5px] mt-3"
  }, "\u05D1\u05D5\u05D7\u05E8\u05D9\u05DD \u05D0\u05EA \u05D4\u05E2\u05DE\u05D5\u05D3 \u05E9\u05DE\u05D3\u05D1\u05E8 \u05D0\u05DC\u05D9\u05DA \u2014 \u05D5\u05DE\u05E9\u05DD \u05DE\u05EA\u05D7\u05D9\u05DC\u05D9\u05DD \u05DC\u05E2\u05D1\u05D5\u05D3.")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
  }, pillars.map((p, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: p.title,
    style: {
      transitionDelay: `${i * 70}ms`
    },
    className: "bg-white border border-ink-100 rounded-2xl p-7 flex flex-col gap-2 hover:border-gold-300 cm-lift"
  }, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gold-100 text-gold-700"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: p.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[19px]"
  }, p.title), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-500 text-[14.5px] flex-1"
  }, p.desc), /*#__PURE__*/React.createElement("a", {
    href: p.href,
    className: "font-heading font-bold text-[14px] text-gold-700 hover:text-gold-800 mt-1"
  }, "\u05DC\u05D7\u05E7\u05D5\u05E8 \u2190"))))));
}

/* SECTION — קולות מתוך תהליך (בהשראת TR: Testimonials) */
function HbVoices() {
  return /*#__PURE__*/React.createElement("section", {
    id: "voices",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center max-w-[640px] mx-auto mb-14"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, CONTENT.testimonials.eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight"
  }, CONTENT.testimonials.title)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-7"
  }, CONTENT.testimonials.quotes.map((q, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    style: {
      transitionDelay: `${i * 90}ms`
    },
    className: "bg-[#FAF8F4] rounded-2xl p-8 border border-gold-200/60 shadow-softer flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-heading font-extrabold text-gold-300 text-[44px] leading-[0.6] block mb-4"
  }, "\u201C"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-700 text-[16.5px] leading-relaxed font-medium mb-6"
  }, q.text), /*#__PURE__*/React.createElement("p", {
    className: "text-gold-700 text-[14.5px] font-semibold"
  }, "\u2014 ", q.who))))));
}

/* SECTION — נתוני תוצאות (בהשראת TR: Robbins equals results) */
function HbStats() {
  const stats = [{
    n: "6+",
    l: "שנות ניסיון קליני"
  }, {
    n: "מאות",
    l: "תהליכי עומק"
  }, {
    n: "4",
    l: "שלבים מובנים — פרוטוקול CURE"
  }, {
    n: "24/7",
    l: "המרחב הדיגיטלי שלך"
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "results",
    className: "py-16 sm:py-20 bg-white border-y border-gold-200/50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mb-10"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-extrabold text-ink-800 text-[24px] sm:text-[30px]"
  }, "CureMindset = \u05EA\u05D5\u05E6\u05D0\u05D5\u05EA")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 lg:grid-cols-4 gap-5"
  }, stats.map((st, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: st.l,
    style: {
      transitionDelay: `${i * 70}ms`
    },
    className: "bg-[#FAF8F4] rounded-2xl border border-ink-100 p-6 text-center shadow-softer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-heading font-extrabold text-gold-600 text-[34px] leading-tight"
  }, st.n), /*#__PURE__*/React.createElement("div", {
    className: "text-ink-500 text-[13.5px] mt-1"
  }, st.l)))), /*#__PURE__*/React.createElement("p", {
    className: "text-center text-ink-400 text-[13px] mt-6"
  }, "\u05D4\u05EA\u05D5\u05E6\u05D0\u05D5\u05EA \u05DE\u05E9\u05EA\u05E0\u05D5\u05EA \u05DE\u05D0\u05D3\u05DD \u05DC\u05D0\u05D3\u05DD, \u05D5\u05D4\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA \u05E0\u05DE\u05D3\u05D3\u05EA \u05D9\u05D7\u05D3 \u05DE\u05D5\u05DC \u05D4\u05DE\u05D8\u05E8\u05D4 \u05D4\u05D0\u05D9\u05E9\u05D9\u05EA \u05E9\u05DC\u05DA.")));
}

/* SECTION 5 — איך זה עובד? (פרוטוקול CURE) */
function HbHow() {
  const stages = [{
    k: "C",
    name: "Clarity",
    text: "פוגשים את “שומר הראש” ומבינים מפני מה הוא שם."
  }, {
    k: "U",
    name: "Unblock",
    text: "משחררים את העומס שהצטבר במערכת העצבים."
  }, {
    k: "R",
    name: "Rewire",
    text: "המוח כותב מחדש את פרוטוקול הביטחון שלו."
  }, {
    k: "E",
    name: "Empower",
    text: "יוצאים עם מערכת הפעלה פנימית שמחזיקה."
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "how",
    className: "py-20 sm:py-28 bg-[#FAF8F4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center max-w-[680px] mx-auto mb-14"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05D0\u05D9\u05DA \u05D6\u05D4 \u05E2\u05D5\u05D1\u05D3"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight"
  }, "\u05D0\u05E8\u05D1\u05E2\u05D4 \u05E9\u05DC\u05D1\u05D9\u05DD \u2014 \u05DC\u05D0 \u05DC\u05D5\u05D7 \u05D6\u05DE\u05E0\u05D9\u05DD, \u05DE\u05E1\u05E2")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
  }, stages.map((s, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: s.k,
    style: {
      transitionDelay: `${i * 80}ms`
    },
    className: "bg-white border border-ink-100 rounded-2xl p-7 text-center shadow-softer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-14 h-14 rounded-full bg-gold-500 text-white font-heading font-extrabold text-[24px] flex items-center justify-center mx-auto mb-4"
  }, s.k), /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[19px] mb-1.5"
  }, s.name), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[15px] leading-relaxed"
  }, s.text)))), /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mt-9"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/method",
    className: "font-heading font-bold text-[16px] text-gold-700 hover:text-gold-800"
  }, "\u05D4\u05E4\u05E8\u05D5\u05D8\u05D5\u05E7\u05D5\u05DC \u05D4\u05DE\u05DC\u05D0 \u2192 /method"))));
}

/* SECTION 6 — ליווי אישי עם קטי */
function HbPersonal() {
  return /*#__PURE__*/React.createElement("section", {
    id: "personal",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[760px] mx-auto px-5 sm:px-7 text-center"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05DC\u05D9\u05D5\u05D5\u05D9 \u05D0\u05D9\u05E9\u05D9"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight mb-5"
  }, "\u05EA\u05D4\u05DC\u05D9\u05DA \u05D0\u05D9\u05E9\u05D9 \u2014 \u05E2\u05D5\u05DE\u05E7, \u05DC\u05D0 \u05E8\u05E9\u05D9\u05DE\u05EA \u05D8\u05D9\u05E4\u05D9\u05DD"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[17.5px] leading-relaxed mb-8"
  }, "\u05D4\u05DC\u05D9\u05D5\u05D5\u05D9 \u05DE\u05EA\u05D7\u05D9\u05DC \u05D1\u05E9\u05D9\u05D7\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA \u05D1\u05DC\u05D9 \u05E2\u05DC\u05D5\u05EA: \u05DE\u05D6\u05D4\u05D9\u05DD \u05D9\u05D7\u05D3 \u05D0\u05EA \u05D4\u05D3\u05E4\u05D5\u05E1 \u05D5\u05DE\u05D4 \u05D4\u05D5\u05D0 \u05D1\u05D0 \u05DC\u05D4\u05D2\u05DF, \u05D5\u05D1\u05D5\u05E0\u05D9\u05DD \u05DB\u05D9\u05D5\u05D5\u05DF \u05D5\u05E7\u05E6\u05D1 \u05E9\u05DE\u05EA\u05D0\u05D9\u05DE\u05D9\u05DD \u05DC\u05DA. \u05DE\u05E4\u05D2\u05E9\u05D9\u05DD \u05DE\u05E9\u05DC\u05D1\u05D9\u05DD \u05E9\u05D9\u05D7\u05D4, \u05D3\u05DE\u05D9\u05D5\u05DF \u05DE\u05D5\u05D3\u05E8\u05DA \u05D5\u05DB\u05DC\u05D9\u05DD \u05DC\u05EA\u05E8\u05D2\u05D5\u05DC \u05D9\u05D5\u05DE\u05D9. \u05DE\u05EA\u05D0\u05D9\u05DD \u05DC\u05DE\u05D1\u05D5\u05D2\u05E8\u05D9\u05DD, \u05DC\u05E0\u05D5\u05E2\u05E8 \u05D5\u05DC\u05D4\u05D5\u05E8\u05D9\u05DD."), /*#__PURE__*/React.createElement(Button, {
    as: "a",
    href: "#lead",
    size: "lg",
    className: "px-9 py-4 text-[17px]"
  }, "\u05E7\u05D1\u05D9\u05E2\u05EA \u05E9\u05D9\u05D7\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA"))));
}

/* SECTION 7 — המערכת הדיגיטלית */
function HbDigital() {
  return /*#__PURE__*/React.createElement("section", {
    id: "digital",
    className: "py-20 sm:py-28 bg-[#FAF8F4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[760px] mx-auto px-5 sm:px-7 text-center"
  }));
}

/* SECTION 7.5 — סדנאות */
function HbWorkshops() {
  const list = [{
    title: "המצפן הפנימי",
    sub: "Unleash Your Mindset",
    text: "סדנת הדגל לשחרור דפוסים ובניית מיינדסט — למבוגרים.",
    href: "/workshop-inner-compass"
  }, {
    title: "CURE Teens",
    sub: "מסע החוסן למתבגרים",
    text: "חוסן, ביטחון ותקשורת בשפה של גיל ההתבגרות.",
    href: "/workshop-cure-teens"
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "workshops",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1080px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center max-w-[640px] mx-auto mb-14"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05E1\u05D3\u05E0\u05D0\u05D5\u05EA"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight"
  }, "\u05D7\u05D5\u05D5\u05D9\u05D4 \u05E7\u05D1\u05D5\u05E6\u05EA\u05D9\u05EA \u2014 \u05D9\u05D5\u05DD \u05D0\u05D7\u05D3 \u05E9\u05E9\u05D5\u05D1\u05E8 \u05D3\u05E4\u05D5\u05E1")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-6"
  }, list.map((w, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: w.title,
    style: {
      transitionDelay: `${i * 80}ms`
    },
    className: "bg-[#FAF8F4] border border-ink-100 rounded-2xl p-7 flex flex-col gap-2 hover:border-gold-300 cm-lift"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-heading font-bold text-ink-800 text-[20px]"
  }, w.title), /*#__PURE__*/React.createElement("p", {
    className: "text-gold-700 text-[13.5px] font-semibold"
  }, w.sub), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[15.5px] leading-relaxed flex-1 mt-1"
  }, w.text), /*#__PURE__*/React.createElement("a", {
    href: w.href,
    className: "font-heading font-bold text-[14.5px] text-gold-700 hover:text-gold-800 mt-2"
  }, "\u05DC\u05E4\u05E8\u05D8\u05D9 \u05D4\u05E1\u05D3\u05E0\u05D4 \u2190"))))));
}

/* SECTION 8 — הסיפור שמאחורי השיטה (סיפור אישי של קטי, בגוף ראשון) */
function HbWhyKety() {
  return /*#__PURE__*/React.createElement("section", {
    id: "why-kety",
    className: "py-20 sm:py-28 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[1040px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("img", {
    src: "images/kety-about.jpg",
    alt: "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 \u2014 \u05DE\u05D9\u05D9\u05E1\u05D3\u05EA \u05E9\u05D9\u05D8\u05EA CureMindset",
    className: "w-full rounded-2xl object-cover shadow-[0_28px_60px_-30px_rgba(45,42,38,0.45)]",
    style: {
      aspectRatio: "4 / 5"
    },
    loading: "lazy",
    decoding: "async"
  }))), /*#__PURE__*/React.createElement(Reveal, {
    style: {
      transitionDelay: "80ms"
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05DE\u05D9 \u05D4\u05D0\u05D3\u05DD \u05DE\u05D0\u05D7\u05D5\u05E8\u05D9 \u05D4\u05E9\u05D9\u05D8\u05D4"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[32px] leading-tight mb-6"
  }, "\u05D0\u05E0\u05D9 \u05DE\u05DC\u05DE\u05D3\u05EA \u05D0\u05EA \u05DE\u05D4 \u05E9\u05D4\u05D5\u05E6\u05D9\u05D0 \u05D0\u05D5\u05EA\u05D9 \u05D4\u05D7\u05D5\u05E6\u05D4"), /*#__PURE__*/React.createElement("div", {
    className: "text-ink-600 text-[17px] leading-relaxed space-y-4"
  }, /*#__PURE__*/React.createElement("p", null, "40 \u05E9\u05E0\u05D4 \u05E9\u05DC \u05DE\u05D9\u05D2\u05E8\u05E0\u05D5\u05EA \u05E7\u05E9\u05D5\u05EA \u05DC\u05D9\u05DE\u05D3\u05D5 \u05D0\u05D5\u05EA\u05D9 \u05E9\u05D4\u05DB\u05D0\u05D1 \u05DC\u05D0 \u05D1\u05D0 \u05E0\u05D2\u05D3\u05D9 \u2014 \u05D4\u05D5\u05D0 \u05D1\u05D0 \u05DC\u05E9\u05DE\u05D5\u05E8 \u05E2\u05DC\u05D9\u05D9. \u05DE\u05D4\u05E8\u05D2\u05E2 \u05E9\u05D4\u05E4\u05E1\u05E7\u05EA\u05D9 \u05DC\u05D4\u05D9\u05DC\u05D7\u05DD \u05D1\u05D5 \u05D5\u05D4\u05EA\u05D7\u05DC\u05EA\u05D9 \u05DC\u05D4\u05E7\u05E9\u05D9\u05D1 \u05DC\u05D5, \u05D4\u05DB\u05D5\u05DC \u05D4\u05E9\u05EA\u05E0\u05D4. \u05D6\u05D5 \u05D4\u05E9\u05D9\u05D8\u05D4 \u05E9\u05D0\u05E0\u05D9 \u05DE\u05DC\u05DE\u05D3\u05EA \u05D4\u05D9\u05D5\u05DD."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-3 mt-6"
  }, /*#__PURE__*/React.createElement(Button, {
    as: "a",
    href: "/about"
  }, "\u05D4\u05E1\u05D9\u05E4\u05D5\u05E8 \u05D4\u05DE\u05DC\u05D0 \u05E9\u05DC\u05D9 \u2192"), /*#__PURE__*/React.createElement(Button, {
    as: "a",
    variant: "secondary",
    href: "https://calendly.com/ketysegev/meet-with-me",
    target: "_blank",
    rel: "noopener"
  }, "\u05DC\u05E4\u05D2\u05D5\u05E9 \u05D0\u05D5\u05EA\u05D9 \u2014 \u05E9\u05D9\u05D7\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA \u05D1\u05D7\u05D9\u05E0\u05DD")))))));
}

/* SECTION 9 — שאלות נפוצות */
const HB_FAQ = [{
  q: "מה קורה בשיחת ההיכרות?",
  a: "מזהים יחד את הדפוס ובודקים אם ומה מתאים לך. בלי עלות ובלי התחייבות."
}, {
  q: "זה טיפול פסיכולוגי?",
  a: "לא. זהו ליווי רגשי ואימון בשיטת NLP, ואינו תחליף לטיפול רפואי או נפשי. במצוקה מיידית — ער”ן 1201, מד”א 101."
}, {
  q: "צריך להאמין בזה כדי שיעבוד?",
  a: "לא. העבודה מבוססת על תהליכים של מערכת העצבים והדמיון המודרך. מתרגלים — וחווים."
}, {
  q: "כמה זמן לוקח לראות שינוי?",
  a: "כלי הוויסות פועלים מהמפגש הראשון; שחרור דפוס עמוק הוא תהליך מדורג, בקצב שלך."
}];
function HbFaq() {
  return /*#__PURE__*/React.createElement("section", {
    id: "faq",
    className: "py-20 sm:py-28 bg-[#FAF8F4]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[760px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mb-12"
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "\u05E9\u05D0\u05DC\u05D5\u05EA \u05E0\u05E4\u05D5\u05E6\u05D5\u05EA"), /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight"
  }, "\u05E9\u05D0\u05DC\u05D5\u05EA \u05E0\u05E4\u05D5\u05E6\u05D5\u05EA")), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-3"
  }, HB_FAQ.map((f, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: i,
    style: {
      transitionDelay: `${i * 50}ms`
    }
  }, /*#__PURE__*/React.createElement("details", {
    className: "group bg-white border border-ink-100 rounded-xl px-5 open:border-gold-300"
  }, /*#__PURE__*/React.createElement("summary", {
    className: "flex items-center justify-between gap-3 cursor-pointer list-none py-4 font-heading font-bold text-ink-800 text-[16.5px]"
  }, f.q, /*#__PURE__*/React.createElement("span", {
    className: "text-gold-600 shrink-0 transition-transform group-open:rotate-45"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 20
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[15.5px] leading-relaxed pb-4 -mt-1"
  }, f.a))))), /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mt-8"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/faq",
    className: "font-heading font-bold text-[16px] text-gold-700 hover:text-gold-800"
  }, "\u05DC\u05DB\u05DC \u05D4\u05E9\u05D0\u05DC\u05D5\u05EA \u05D4\u05E0\u05E4\u05D5\u05E6\u05D5\u05EA \u2192"))));
}

/* SECTION 10 — CTA סופי (עם טופס הליד) */
function HbFinalCta() {
  return /*#__PURE__*/React.createElement("section", {
    id: "lead",
    className: "py-20 sm:py-28 bg-white border-t border-ink-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-[720px] mx-auto px-5 sm:px-7"
  }, /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mb-9"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-heading font-semibold text-ink-800 text-[26px] sm:text-[34px] leading-tight mb-3"
  }, "\u05D4\u05E9\u05D9\u05E0\u05D5\u05D9 \u05DE\u05EA\u05D7\u05D9\u05DC \u05D1\u05E9\u05D9\u05D7\u05D4 \u05D0\u05D7\u05EA"), /*#__PURE__*/React.createElement("p", {
    className: "text-ink-600 text-[17.5px] leading-relaxed"
  }, "\u05D0\u05D9\u05DF \u05E6\u05D5\u05E8\u05DA \u05DC\u05D4\u05D2\u05D9\u05E2 \u05E2\u05DD \u05EA\u05E9\u05D5\u05D1\u05D5\u05EA. \u05DE\u05E9\u05D0\u05D9\u05E8\u05D9\u05DD \u05E4\u05E8\u05D8\u05D9\u05DD \u05D5\u05D1\u05D5\u05D3\u05E7\u05D9\u05DD \u05D9\u05D7\u05D3 \u05D0\u05DD \u05D6\u05D4 \u05DE\u05EA\u05D0\u05D9\u05DD \u05DC\u05DA.")), /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(LeadForm, null)), /*#__PURE__*/React.createElement(Reveal, {
    className: "text-center mt-6"
  }, /*#__PURE__*/React.createElement("a", {
    href: HB_WA(),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "inline-flex items-center gap-2 font-heading font-bold text-[15.5px] text-gold-700 hover:text-gold-800"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "whatsapp",
    size: 18
  }), " \u05D0\u05D5 \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4 \u05D9\u05E9\u05D9\u05E8"))));
}

/* ---------- דף הבית החדש — לפי חבילת התכנים (3.11.2026) ---------- */
const HM_CAL = "https://calendly.com/ketysegev/meet-with-me";
const HM_WA = "https://wa.me/972543032349";
function HmRows({
  items
}) {
  return /*#__PURE__*/React.createElement("ol", {
    className: "rows"
  }, items.map(([t, p]) => /*#__PURE__*/React.createElement("li", {
    key: t
  }, /*#__PURE__*/React.createElement("h3", null, t), /*#__PURE__*/React.createElement("p", null, p))));
}
function HmPillars() {
  const items = [["חרדה ולחץ", "כשהגוף מגיב לפני שהמחשבה מגיעה", "/anxiety-and-stress"], ["ביטחון עצמי ודימוי", "הקול הפנימי שלא מפסיק לבקר", "/self-confidence"], ["דחיינות והתנעה", "לדעת מה צריך, ולא להתחיל", "/procrastination"], ["נוער 12-17", "הנער שנראה \"בסדר\" — ולא באמת", "/cure-teens"], ["צעירים 18-25", "אחרי צבא, בתקופה של ערפל", "/young-adults"], ["מוסדות חינוך", "סדנאות המצפן הפנימי לבתי ספר", "/schools"]];
  return /*#__PURE__*/React.createElement("section", {
    className: "blk",
    id: "worlds"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05E2\u05D5\u05DC\u05DE\u05D5\u05EA \u05EA\u05D5\u05DB\u05DF"), /*#__PURE__*/React.createElement("div", {
    className: "tiles"
  }, items.map(([t, p, href]) => /*#__PURE__*/React.createElement("a", {
    className: "tile",
    href: href,
    key: href
  }, /*#__PURE__*/React.createElement("span", {
    className: "tile-body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tile-h"
  }, t), /*#__PURE__*/React.createElement("span", {
    className: "tile-p"
  }, p), /*#__PURE__*/React.createElement("span", {
    className: "go"
  }, "\u05DC\u05E2\u05DE\u05D5\u05D3 \u2190"))))));
}

/* ===== וידאו: מהאולפן ===== */
function HmWatch() {
  return /*#__PURE__*/React.createElement("section", {
    className: "blk",
    id: "keti-speaks"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05E7\u05D8\u05D9 \u05DE\u05D3\u05D1\u05E8\u05EA"), /*#__PURE__*/React.createElement("p", null, "\u05DB\u05E9\u05DE\u05D3\u05D1\u05E8\u05D9\u05DD \u05E2\u05DC \u05EA\u05EA-\u05DE\u05D5\u05D3\u05E2, \u05E2\u05DC \u05D4\u05EA\u05DE\u05DB\u05E8\u05D5\u05D9\u05D5\u05EA \u05D5\u05E2\u05DC \u05D7\u05E8\u05D3\u05D4 \u2014 \u05DC\u05D0 \u05E6\u05E8\u05D9\u05DA \u05DE\u05D5\u05E0\u05D7\u05D9\u05DD. \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05E1\u05D1\u05D9\u05E8 \u05D0\u05EA \u05D6\u05D4 \u05D1\u05E9\u05E4\u05D4 \u05E9\u05DC \u05D4\u05D7\u05D9\u05D9\u05DD."), /*#__PURE__*/React.createElement("div", {
    className: "video-embed"
  }, /*#__PURE__*/React.createElement("iframe", {
    src: "https://www.youtube.com/embed/8q_5IAAJohQ",
    title: "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 \u05D1\u05E8\u05D3\u05D9\u05D5 \u05D7\u05D9\u05E4\u05D4 \u2014 \u05DE\u05D0\u05E1\u05D8\u05E8 NLP \u05D5\u05D8\u05D9\u05E4\u05D5\u05DC \u05D1\u05EA\u05EA \u05DE\u05D5\u05D3\u05E2",
    loading: "lazy",
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    allowFullScreen: true
  })), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("a", {
    className: "go",
    href: "https://www.youtube.com/@ketynlplive/videos",
    target: "_blank",
    rel: "noopener"
  }, "\u05DC\u05E2\u05E8\u05D5\u05E5 \u05D4\u05D9\u05D5\u05D8\u05D9\u05D5\u05D1 \u2190")));
}

/* ===== קיורטי — ליווי וירטואלי ===== */
function HmPodcast() {
  return /*#__PURE__*/React.createElement("section", {
    className: "blk",
    id: "podcast"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05D4\u05E4\u05D5\u05D3\u05E7\u05D0\u05E1\u05D8: Mindset TRAINBRAIN"), /*#__PURE__*/React.createElement("p", null, "\u05E9\u05D9\u05D7\u05D5\u05EA \u05E2\u05DC \u05D4\u05DE\u05D5\u05D7, \u05E2\u05DC \u05D3\u05E4\u05D5\u05E1\u05D9\u05DD \u05D5\u05E2\u05DC \u05DE\u05D4 \u05E9\u05D1\u05D0\u05DE\u05EA \u05E2\u05D5\u05D6\u05E8 \u2014 \u05D1\u05D9\u05D5\u05D8\u05D9\u05D5\u05D1, \u05D1\u05D2\u05D5\u05D1\u05D4 \u05D4\u05E2\u05D9\u05E0\u05D9\u05D9\u05DD, \u05D1\u05DC\u05D9 \u05DE\u05D5\u05E0\u05D7\u05D9\u05DD."), /*#__PURE__*/React.createElement("div", {
    className: "video-embed"
  }, /*#__PURE__*/React.createElement("iframe", {
    src: "https://www.youtube.com/embed/videoseries?list=UURNxka7LYKNPFqko72-8U1Q",
    title: "\u05D4\u05E4\u05D5\u05D3\u05E7\u05D0\u05E1\u05D8 Mindset TRAINBRAIN \u2014 \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1",
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    referrerPolicy: "strict-origin-when-cross-origin",
    allowFullScreen: true,
    loading: "lazy"
  })), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("a", {
    className: "go",
    href: "https://www.youtube.com/@ketynlplive/videos",
    target: "_blank",
    rel: "noopener"
  }, "\u05DC\u05DB\u05DC \u05D4\u05E4\u05E8\u05E7\u05D9\u05DD \u05D1\u05E2\u05E8\u05D5\u05E5 \u05D4\u05D9\u05D5\u05D8\u05D9\u05D5\u05D1 \u2190")));
}
function HmAi() {
  return /*#__PURE__*/React.createElement("section", {
    className: "blk",
    id: "kety-ai"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05E7\u05D9\u05D5\u05E8\u05D8\u05D9 \u2014 \u05DC\u05D9\u05D5\u05D5\u05D9 \u05D5\u05D9\u05E8\u05D8\u05D5\u05D0\u05DC\u05D9"), /*#__PURE__*/React.createElement("p", null, "\u05DC\u05D0 \u05EA\u05DE\u05D9\u05D3 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D7\u05DB\u05D5\u05EA \u05DC\u05DE\u05E4\u05D2\u05E9. \u05E7\u05D9\u05D5\u05E8\u05D8\u05D9 \u05D4\u05D9\u05D0 \u05E2\u05D5\u05D6\u05E8\u05EA \u05E8\u05D2\u05E9\u05D9\u05EA \u05E9\u05DE\u05DB\u05D9\u05E8\u05D4 \u05D0\u05EA \u05D4\u05E9\u05D9\u05D8\u05D4, \u05E2\u05D5\u05E0\u05D4 \u05E2\u05DC \u05E9\u05D0\u05DC\u05D5\u05EA \u05E2\u05DC \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA, \u05D5\u05DE\u05D7\u05D6\u05D9\u05E7\u05D4 \u05DB\u05DC\u05D9\u05DD \u05E7\u05E6\u05E8\u05D9\u05DD \u05DC\u05E8\u05D2\u05E2\u05D9\u05DD \u05E9\u05DC \u05DC\u05D7\u05E5."), /*#__PURE__*/React.createElement("p", null, "\u05D4\u05D9\u05D0 \u05DC\u05D0 \u05DE\u05D0\u05D1\u05D7\u05E0\u05EA \u05D5\u05DC\u05D0 \u05DE\u05D8\u05E4\u05DC\u05EA \u2014 \u05DB\u05E9\u05D4\u05D9\u05D0 \u05DE\u05D6\u05D4\u05D4 \u05DE\u05E6\u05D1 \u05E9\u05D3\u05D5\u05E8\u05E9 \u05D0\u05D3\u05DD, \u05D4\u05D9\u05D0 \u05DE\u05E4\u05E0\u05D4 \u05D0\u05DC\u05D9\u05D9."), /*#__PURE__*/React.createElement("div", {
    className: "btnrow"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    onClick: () => window.cmOpenBot && window.cmOpenBot()
  }, "\u05DC\u05E9\u05D9\u05D7\u05D4 \u05E2\u05DD \u05E7\u05D9\u05D5\u05E8\u05D8\u05D9")));
}

/* ===== במספרים ===== */
function HmNumbers() {
  const nums = [["3", "מפגשים בקבוצת נוער"], ["עד 6", "משתתפים בקבוצה"], ["50-60", "דקות במפגש אישי"], ["12-25", "טווח הגילאים"]];
  return /*#__PURE__*/React.createElement("section", {
    className: "blk",
    id: "numbers"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05D0\u05D9\u05DA \u05D6\u05D4 \u05E0\u05E8\u05D0\u05D4 \u05D1\u05E4\u05D5\u05E2\u05DC"), /*#__PURE__*/React.createElement("div", {
    className: "num-cards"
  }, nums.map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    className: "big-stat",
    key: l
  }, /*#__PURE__*/React.createElement("b", null, n), /*#__PURE__*/React.createElement("span", null, l)))));
}
function HmBody() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "pull-quote"
  }, "\u05D4\u05D3\u05E4\u05D5\u05E1 \u05E0\u05DC\u05DE\u05D3. \u05D5\u05DC\u05DB\u05DF \u05D0\u05E4\u05E9\u05E8 \u05DC\u05DC\u05DE\u05D3 \u05D0\u05D5\u05EA\u05D5 \u05DE\u05D7\u05D3\u05E9."), /*#__PURE__*/React.createElement(HmPillars, null), /*#__PURE__*/React.createElement("section", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05DE\u05D4 \u05D1\u05E2\u05E6\u05DD \u05E7\u05D5\u05E8\u05D4 \u05E9\u05DD \u05D1\u05E4\u05E0\u05D9\u05DD?"), /*#__PURE__*/React.createElement("p", null, "\u05D7\u05E8\u05D3\u05D4, \u05E2\u05D5\u05DE\u05E1, \u05D3\u05D9\u05DE\u05D5\u05D9 \u05E2\u05E6\u05DE\u05D9 \u05E0\u05DE\u05D5\u05DA \u05D5\u05D3\u05E4\u05D5\u05E1\u05D9\u05DD \u05D7\u05D5\u05D6\u05E8\u05D9\u05DD \u05DC\u05D0 \"\u05E0\u05D5\u05E4\u05DC\u05D9\u05DD \u05E2\u05DC\u05D9\u05E0\u05D5\". \u05D4\u05DD \u05E0\u05DC\u05DE\u05D3\u05D9\u05DD."), /*#__PURE__*/React.createElement("p", null, "\u05D1\u05E9\u05E0\u05D9\u05DD \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D5\u05EA \u05DC\u05D7\u05D9\u05D9\u05DD \u05D4\u05DE\u05D5\u05D7 \u05DC\u05D5\u05DE\u05D3 \u05DE\u05D4 \u05D1\u05D8\u05D5\u05D7 \u05D5\u05DE\u05D4 \u05DC\u05D0. \u05D4\u05D1\u05D2\u05E8\u05D5\u05EA \u05DE\u05D2\u05D9\u05E2\u05D4, \u05D4\u05E1\u05D1\u05D9\u05D1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4, \u05D5\u05D4\u05D3\u05E4\u05D5\u05E1 \u05E0\u05E9\u05D0\u05E8 \u05D5\u05E4\u05D5\u05E2\u05DC \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA."), /*#__PURE__*/React.createElement("p", null, "\u05D1\u05E9\u05DC\u05D1 \u05D4\u05D6\u05D4, \u05DC\u05D3\u05D1\u05E8 \u05E2\u05DC \u05D4\u05D1\u05E2\u05D9\u05D4 \u05DC\u05D0 \u05DE\u05E1\u05E4\u05D9\u05E7. \u05E6\u05E8\u05D9\u05DA \u05DC\u05D2\u05E2\u05EA \u05D1\u05E9\u05DB\u05D1\u05D4 \u05E9\u05D1\u05D4 \u05D4\u05D9\u05D0 \u05E0\u05E9\u05DE\u05E8\u05D4: \u05D4\u05EA\u05EA-\u05DE\u05D5\u05D3\u05E2. \u05D6\u05D5 \u05D4\u05E2\u05D1\u05D5\u05D3\u05D4 \u05E9\u05DC CureMindset.")), /*#__PURE__*/React.createElement("section", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("h2", null, "CureMindset \u05D1\u05D0\u05E8\u05D1\u05E2\u05D4 \u05E9\u05DC\u05D1\u05D9\u05DD"), /*#__PURE__*/React.createElement("p", null, "\u05D1\u05D4\u05D9\u05E8\u05D5\u05EA, \u05E9\u05D7\u05E8\u05D5\u05E8, \u05D7\u05D9\u05D5\u05D5\u05D8 \u05DE\u05D7\u05D3\u05E9 \u05D5\u05D4\u05E2\u05E6\u05DE\u05D4 \u2014 \u05EA\u05D4\u05DC\u05D9\u05DA \u05D0\u05D7\u05D3 \u05E9\u05DE\u05EA\u05D7\u05D9\u05DC \u05D1\u05D4\u05D1\u05E0\u05D4 \u05D5\u05E0\u05D2\u05DE\u05E8 \u05D1\u05D9\u05DB\u05D5\u05DC\u05EA \u05E9\u05E0\u05E9\u05D0\u05E8\u05EA."), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("a", {
    className: "go",
    href: "/method"
  }, "\u05DC\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05E9\u05D9\u05D8\u05D4 \u2190"))), /*#__PURE__*/React.createElement("section", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05DC\u05DE\u05D9 \u05D6\u05D4 \u05DE\u05EA\u05D0\u05D9\u05DD?"), /*#__PURE__*/React.createElement(HmRows, {
    items: [["לנוער 12-17", "קבוצות קטנות של עד 6 נערים ונערות. חרדת בחינות, לחץ חברתי, דימוי עצמי, מסכים והתנתקות. שלושה מפגשים עם כלים שנשארים."], ["לצעירים 18-25", "אחרי צבא, בלימודים, בתחילת הדרך. ערפל, השוואה, לחץ לבחור. קבוצה קטנה או ליווי אישי."], ["למבוגרים", "ליווי אישי לתהליכי עומק: חרדה, חסמים, דפוסים חוזרים במערכות יחסים ובקריירה."], ["למוסדות חינוך וארגוני נוער", "סדנאות \"המצפן הפנימי\" לבתי ספר, מתנ\"סים ומכינות. תוכנית מובנית, מותאמת לגיל ולצרכים."]]
  }), /*#__PURE__*/React.createElement("ul", {
    className: "chips"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "/teens"
  }, "\u05DC\u05E0\u05D5\u05E2\u05E8")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "/young-adults"
  }, "\u05DC\u05E6\u05E2\u05D9\u05E8\u05D9\u05DD")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "/adults"
  }, "\u05DC\u05DE\u05D1\u05D5\u05D2\u05E8\u05D9\u05DD")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "/schools"
  }, "\u05DC\u05DE\u05D5\u05E1\u05D3\u05D5\u05EA")))), /*#__PURE__*/React.createElement(HmNumbers, null), /*#__PURE__*/React.createElement(HmAi, null), /*#__PURE__*/React.createElement("section", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05D0\u05D9\u05DA \u05E0\u05E8\u05D0\u05D4 \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05D1\u05E4\u05D5\u05E2\u05DC"), /*#__PURE__*/React.createElement(HmRows, {
    items: [["שיחת היכרות", "20 דקות, בטלפון או בזום. מספרים מה קורה, ואני אומרת בכנות אם זה מתאים."], ["תיאום ציפיות", "מה המטרה, מה המסלול, כמה מפגשים ומה קורה ביניהם."], ["העבודה עצמה", "מפגשי עומק, קבוצה או אישי, עם כלים לתרגול בבית."], ["בדיקת שינוי", "לא לפי \"איך מרגיש היום\", אלא לפי מה שהשתנה בחיים."]]
  }), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("a", {
    className: "go",
    href: "/online"
  }, "\u05E7\u05D1\u05D9\u05E2\u05EA \u05E9\u05D9\u05D7\u05D4 \u05D1\u05D6\u05D5\u05DD \u05D1\u05D9\u05D5\u05DE\u05DF \u2190"))), /*#__PURE__*/React.createElement("section", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05E2\u05DC \u05E7\u05D8\u05D9"), /*#__PURE__*/React.createElement("p", null, "\u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1, \u05DE\u05D8\u05E4\u05DC\u05EA \u05E8\u05D2\u05E9\u05D9\u05EA \u05D5\u05DE\u05D0\u05DE\u05E0\u05EA \u05DE\u05E0\u05D8\u05DC\u05D9\u05EA (NLP Master), \u05DE\u05E4\u05EA\u05D7\u05EA \u05E9\u05D9\u05D8\u05EA CureMindset. \u05D0\u05D7\u05E8\u05D9 \u05E9\u05E0\u05D9\u05DD \u05E9\u05DC \u05D7\u05D9\u05E4\u05D5\u05E9 \u05D0\u05D9\u05E9\u05D9 \u05E9\u05D4\u05D2\u05D9\u05E2 \u05E2\u05D3 \u05D4\u05E9\u05D5\u05E8\u05E9, \u05D5\u05E9\u05E0\u05D9\u05DD \u05E9\u05DC \u05E2\u05D1\u05D5\u05D3\u05D4 \u05E2\u05DD \u05E0\u05D5\u05E2\u05E8, \u05E6\u05E2\u05D9\u05E8\u05D9\u05DD \u05D5\u05DE\u05D1\u05D5\u05D2\u05E8\u05D9\u05DD."), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("a", {
    className: "go",
    href: "/about"
  }, "\u05D4\u05E1\u05D9\u05E4\u05D5\u05E8 \u05E9\u05DC\u05D9 \u2190"))), /*#__PURE__*/React.createElement("section", {
    className: "blk"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05E9\u05D0\u05DC\u05D5\u05EA \u05E9\u05E0\u05E9\u05D0\u05DC\u05D5\u05EA \u05D1\u05D3\u05E8\u05DA \u05DB\u05DC\u05DC"), /*#__PURE__*/React.createElement("div", {
    className: "faq"
  }, /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "\u05D6\u05D4 \u05D8\u05D9\u05E4\u05D5\u05DC \u05E4\u05E1\u05D9\u05DB\u05D5\u05DC\u05D5\u05D2\u05D9?"), /*#__PURE__*/React.createElement("p", null, "\u05D6\u05D4 \u05EA\u05D4\u05DC\u05D9\u05DA \u05D0\u05D9\u05DE\u05D5\u05DF \u05E8\u05D2\u05E9\u05D9 \u05DE\u05D1\u05D5\u05E1\u05E1 NLP \u05D5\u05E2\u05D1\u05D5\u05D3\u05D4 \u05E2\u05DD \u05D4\u05EA\u05EA-\u05DE\u05D5\u05D3\u05E2. \u05D4\u05D5\u05D0 \u05D0\u05D9\u05E0\u05D5 \u05DE\u05D7\u05DC\u05D9\u05E3 \u05D0\u05D1\u05D7\u05D5\u05DF \u05D0\u05D5 \u05D8\u05D9\u05E4\u05D5\u05DC \u05E8\u05E4\u05D5\u05D0\u05D9-\u05E0\u05E4\u05E9\u05D9. \u05D0\u05DD \u05E6\u05E8\u05D9\u05DA, \u05E0\u05E2\u05D1\u05D5\u05D3 \u05D1\u05E6\u05D3 \u05D5\u05D1\u05E9\u05D9\u05EA\u05D5\u05E3 \u05E2\u05DD \u05D2\u05D5\u05E8\u05DD \u05DE\u05D8\u05E4\u05DC.")), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "\u05DB\u05DE\u05D4 \u05D6\u05DE\u05DF \u05E2\u05D3 \u05E9\u05DE\u05E8\u05D2\u05D9\u05E9\u05D9\u05DD \u05E9\u05D9\u05E0\u05D5\u05D9?"), /*#__PURE__*/React.createElement("p", null, "\u05DC\u05E8\u05D5\u05D1 \u05DB\u05D1\u05E8 \u05D1\u05E9\u05DC\u05D5\u05E9\u05EA \u05D4\u05DE\u05E4\u05D2\u05E9\u05D9\u05DD \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D9\u05DD \u05D9\u05E9 \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA \u05E2\u05DD \u05D4\u05D3\u05E4\u05D5\u05E1 \u05D5\u05DB\u05DC\u05D9\u05DD \u05DC\u05D5\u05D5\u05D9\u05E1\u05D5\u05EA. \u05E9\u05D9\u05E0\u05D5\u05D9 \u05E9\u05DE\u05D7\u05D6\u05D9\u05E7 \u05E0\u05D1\u05E0\u05D4 \u05DC\u05D0\u05D5\u05E8\u05DA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA.")), /*#__PURE__*/React.createElement("details", null, /*#__PURE__*/React.createElement("summary", null, "\u05D0\u05E4\u05E9\u05E8 \u05D1\u05D6\u05D5\u05DD?"), /*#__PURE__*/React.createElement("p", null, "\u05DB\u05DF. \u05D4\u05DE\u05E4\u05D2\u05E9\u05D9\u05DD \u05DE\u05EA\u05E7\u05D9\u05D9\u05DE\u05D9\u05DD \u05D1\u05E7\u05E8\u05D9\u05D9\u05EA \u05DE\u05D5\u05E6\u05E7\u05D9\u05DF, \u05D1\u05E7\u05E8\u05D9\u05D9\u05EA \u05D7\u05D9\u05D9\u05DD \u05D0\u05D5 \u05D1\u05D6\u05D5\u05DD \u05DC\u05DB\u05DC \u05D4\u05D0\u05E8\u05E5."))), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("a", {
    className: "go",
    href: "/faq"
  }, "\u05DC\u05DB\u05DC \u05D4\u05E9\u05D0\u05DC\u05D5\u05EA \u2190"))), /*#__PURE__*/React.createElement("div", {
    className: "ctaband"
  }, /*#__PURE__*/React.createElement("h2", null, "\u05D0\u05DD \u05DE\u05E9\u05D4\u05D5 \u05DB\u05D0\u05DF \u05E0\u05D2\u05E2 \u05D1\u05DB\u05DD, \u05D6\u05D4 \u05DB\u05D1\u05E8 \u05E1\u05D9\u05DE\u05DF."), /*#__PURE__*/React.createElement("p", null, "\u05E9\u05D9\u05D7\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA \u05E7\u05E6\u05E8\u05D4, \u05D1\u05DC\u05D9 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA, \u05DB\u05D3\u05D9 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05D9\u05D7\u05D3 \u05D0\u05DD \u05D6\u05D4 \u05E0\u05DB\u05D5\u05DF \u05DC\u05DB\u05DD."), /*#__PURE__*/React.createElement("div", {
    className: "btnrow"
  }, /*#__PURE__*/React.createElement("a", {
    className: "btn primary",
    href: HM_CAL,
    target: "_blank",
    rel: "noopener"
  }, "\u05DC\u05E7\u05D1\u05D9\u05E2\u05EA \u05E9\u05D9\u05D7\u05D4"), /*#__PURE__*/React.createElement("a", {
    className: "btn ghost",
    href: HM_WA,
    target: "_blank",
    rel: "noopener"
  }, "\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4"), /*#__PURE__*/React.createElement("a", {
    className: "btn ghost",
    href: "tel:0543032349"
  }, "054-3032349"))), /*#__PURE__*/React.createElement("div", {
    className: "disclaimer"
  }, "\u05D4\u05EA\u05DB\u05E0\u05D9\u05DD \u05D1\u05D0\u05EA\u05E8 \u05D0\u05D9\u05E0\u05DD \u05DE\u05D4\u05D5\u05D5\u05D9\u05DD \u05D9\u05D9\u05E2\u05D5\u05E5 \u05D0\u05D5 \u05D8\u05D9\u05E4\u05D5\u05DC \u05E8\u05E4\u05D5\u05D0\u05D9."));
}
function Home({
  onEnterApp
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Nav, {
    onEnterApp: onEnterApp
  }), /*#__PURE__*/React.createElement("main", {
    className: "wrap",
    style: {
      paddingTop: 68
    }
  }, /*#__PURE__*/React.createElement(HmHero, null), /*#__PURE__*/React.createElement(HmBody, null)), /*#__PURE__*/React.createElement(Footer, null));
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
