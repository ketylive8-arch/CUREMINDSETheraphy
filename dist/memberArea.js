// CureMindset — Member Area / personal protocol app (Babel-in-browser).
// Wrapped in an IIFE so top-level declarations never collide with app.js's globals;
// communication with app.js happens only through window.* (Icon, Button, CONTACT).
(function () {
  "use strict";

  const {
    useState,
    useEffect
  } = React;
  const Icon = window.Icon;
  const Button = window.Button;
  const ResilienceDashboard = window.ResilienceDashboard;

  /* ---------------------------------------------------------------- */
  /* Persistence */
  /* ---------------------------------------------------------------- */

  const PROGRESS_KEY = "cm_protocol_progress";
  const SESSIONS_KEY = "cm_grounding_sessions";
  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      return {
        unlocked: raw && raw.unlocked ? raw.unlocked : 1,
        completed: raw && raw.completed || []
      };
    } catch (e) {
      return {
        unlocked: 1,
        completed: []
      };
    }
  }
  function saveProgress(progress) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {}
  }
  function loadSessions() {
    try {
      return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function saveSession(score) {
    try {
      const list = loadSessions();
      list.push({
        date: new Date().toISOString(),
        score
      });
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(-30)));
      return list;
    } catch (e) {
      return [];
    }
  }
  const DEVICE_TOKEN_KEY = "cm_device_token";

  // The device token is the client's private credential: a random 122-bit UUID.
  // Every server query is scoped to it, so data is readable only with this exact
  // token. If localStorage is blocked we still mint a unique in-memory token —
  // never a shared constant, which would leak one visitor's data to another.
  let inMemoryToken = null;
  function getDeviceToken() {
    try {
      let token = localStorage.getItem(DEVICE_TOKEN_KEY);
      if (!token) {
        token = crypto.randomUUID();
        localStorage.setItem(DEVICE_TOKEN_KEY, token);
      }
      return token;
    } catch (e) {
      if (!inMemoryToken) inMemoryToken = crypto.randomUUID();
      return inMemoryToken;
    }
  }
  const AUTH_TOKEN_KEY = "cm_auth_token";
  const AUTH_NAME_KEY = "cm_auth_name";

  // ── פלטת המותג של השכבה הקלינית (A→D) ──────────────────────────────────
  // אפור בהיר סגלגל · תכלת · זהב · כתמתם/משמש. מוגדרת פעם אחת ומשמשת את כל
  // הרכיבים החכמים החדשים, כדי שכולם ידברו באותה שפה חזותית.
  const CM = {
    lavender: "#8B86A0",
    // אפור בהיר סגלגל — עמוק (טקסט/אקסנט)
    lavenderSoft: "#F2F1F7",
    // רקע סגלגל בהיר
    lavenderLine: "#DED9EA",
    // מסגרת סגלגלה
    sky: "#4FA6D0",
    // תכלת
    skySoft: "#E6F2F9",
    gold: "#C2974A",
    // זהב (המשך המותג הקיים)
    goldSoft: "#F4EEDE",
    apricot: "#E58C4E",
    // כתמתם/משמש
    apricotSoft: "#FBEBDD",
    ink: "#2D2A26"
  };
  function getAuthToken() {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function setAuth(token, name) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      if (name) localStorage.setItem(AUTH_NAME_KEY, name);
    } catch (e) {}
  }
  function clearAuth() {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_NAME_KEY);
    } catch (e) {}
  }

  // חבר מביא חבר — קולטים?ref= מהקישור בכניסה ושומרים אותו עד ההרשמה.
  const REF_KEY = "cm_ref";
  (function captureRef() {
    try {
      const r = (new URLSearchParams(location.search).get("ref") || "").trim();
      if (r) localStorage.setItem(REF_KEY, r.toUpperCase().slice(0, 12));
    } catch (e) {}
  })();
  function getRef() {
    try {
      return localStorage.getItem(REF_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  // התחברות חברתית — קליטת הטוקן שחזר מ-Google/Facebook דרך ה-callback בשרת.
  // מאחסן את הטוקן, מנקה את הכתובת, ומסמן שיש לפתוח את האזור האישי מחובר.
  (function captureOAuth() {
    try {
      const q = new URLSearchParams(location.search);
      const token = q.get("cm_oauth");
      const err = q.get("cm_oauth_error");
      if (token) {
        setAuth(token, q.get("cm_name") || "");
        window.__cmOpenApp = true;
      }
      if (err) window.__cmOauthError = err;
      if (token || err) {
        // מסירים את הפרמטרים מה-URL כדי שלא יישארו/יישלחו בשיתוף
        q.delete("cm_oauth");
        q.delete("cm_name");
        q.delete("cm_oauth_error");
        const clean = location.pathname + (q.toString() ? "?" + q.toString() : "") + location.hash;
        history.replaceState(null, "", clean);
      }
    } catch (e) {}
  })();

  // התחברות חברתית — מציג כפתור Google/Facebook רק אם הספק מוגדר בצד השרת.
  // הכפתור מופיע אוטומטית ברגע שההתחברות החברתית מופעלת.
  const GoogleMark = () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 48 48",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "#EA4335",
    d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#4285F4",
    d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#FBBC05",
    d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
  }), /*#__PURE__*/React.createElement("path", {
    fill: "#34A853",
    d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
  }));
  const FacebookMark = () => /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    fill: "#1877F2",
    d: "M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.36c0-3.01 1.79-4.68 4.53-4.68 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z"
  }));
  function SocialLogin() {
    const [providers, setProviders] = useState([]);
    useEffect(() => {
      let alive = true;
      const defs = [{
        id: "google",
        label: "המשך עם Google",
        Mark: GoogleMark
      }, {
        id: "facebook",
        label: "המשך עם Facebook",
        Mark: FacebookMark
      }];
      Promise.all(defs.map(d => fetch("/api/auth/oauth/" + d.id).then(r => r.ok ? d : null).catch(() => null))).then(res => {
        if (alive) setProviders(res.filter(Boolean));
      });
      return () => {
        alive = false;
      };
    }, []);
    function go(id) {
      fetch("/api/auth/oauth/" + id).then(r => r.ok ? r.json() : null).then(d => {
        if (d && d.url) window.location.href = d.url;
      }).catch(() => {});
    }
    if (!providers.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "au-social"
    }, /*#__PURE__*/React.createElement("div", {
      className: "au-social__div"
    }, "\u05D0\u05D5"), providers.map(p => /*#__PURE__*/React.createElement("button", {
      key: p.id,
      type: "button",
      className: "au-social__btn",
      onClick: () => go(p.id)
    }, /*#__PURE__*/React.createElement(p.Mark, null), " ", /*#__PURE__*/React.createElement("span", null, p.label))));
  }

  // חבר מביא חבר — כרטיס שיתוף ויראלי: שיתוף בוואטסאפ + קישור הפניה אישי.
  function ShareInvite() {
    const [me, setMe] = useState(null);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
      let alive = true;
      fetch("/api/auth/me", {
        headers: authHeaders()
      }).then(r => r.ok ? r.json() : null).then(d => {
        if (alive) setMe(d);
      }).catch(() => {});
      return () => {
        alive = false;
      };
    }, []);
    const origin = typeof location !== "undefined" && location.origin || "https://ketysegev.com";
    const link = me && me.refCode ? `${origin}/?ref=${me.refCode}` : origin;
    const waText = `גיליתי משהו ששווה — CURE MINDSET של קטי שגב, שיטה לחוסן רגשי וביטחון עצמי מוזמנ/ת להתחיל כאן: ${link}`;
    const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    function copyLink() {
      try {
        navigator.clipboard.writeText(link).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } catch (e) {}
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "cm-slide-up-in rounded-3xl border border-gold-200 bg-white px-5 py-5 space-y-3"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800"
    }, "\u05D0\u05D4\u05D1\u05EA? \u05E9\u05EA\u05E4\u05D9 \u05D0\u05EA \u05D6\u05D4 \u05D4\u05DC\u05D0\u05D4 "), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-600 leading-relaxed"
    }, "\u05DB\u05DC \u05DE\u05D9 \u05E9\u05D9\u05E6\u05D8\u05E8\u05E4/\u05D4 \u05D3\u05E8\u05DA \u05D4\u05E7\u05D9\u05E9\u05D5\u05E8 \u05D4\u05D0\u05D9\u05E9\u05D9 \u05E9\u05DC\u05DA \u05D9\u05EA\u05D7\u05D9\u05DC/\u05EA\u05EA\u05D7\u05D9\u05DC \u05D0\u05EA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u2014 \u05D5\u05D0\u05EA \u05E2\u05D5\u05D6\u05E8\u05EA \u05DC\u05D4\u05DD \u05DC\u05E6\u05DE\u05D5\u05D7."), /*#__PURE__*/React.createElement("a", {
      href: waHref,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-heading font-bold text-[14px] hover:opacity-90 transition-opacity"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "whatsapp",
      size: 18
    }), " \u05E9\u05D9\u05EA\u05D5\u05E3 \u05D1\u05D5\u05D5\u05D0\u05D8\u05E1\u05D0\u05E4"), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("input", {
      readOnly: true,
      value: link,
      dir: "ltr",
      onFocus: e => e.target.select(),
      className: "flex-1 min-w-0 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-[12.5px] text-ink-600 outline-none"
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: copyLink,
      className: "shrink-0 px-4 py-2.5 rounded-xl bg-gold-500 text-white font-heading font-bold text-[13px] hover:bg-gold-600 transition-colors"
    }, copied ? "הועתק ✓" : "העתקה")), me && me.referrals > 0 ? /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] text-gold-700 font-semibold text-center"
    }, "\u05DB\u05D1\u05E8 \u05D4\u05D6\u05DE\u05E0\u05EA ", me.referrals, " \u05D0\u05E0\u05E9\u05D9\u05DD \u2014 \u05DB\u05DC \u05D4\u05DB\u05D1\u05D5\u05D3!") : null);
  }

  // "היעדים שלי" — יעדים אישיים (מודל האדם השלם) + מעקב התקדמות. נשמר בכרטיס הלקוח.
  function GoalsCard() {
    const [goals, setGoals] = useState([]);
    const [areas, setAreas] = useState([]);
    const [title, setTitle] = useState("");
    const [area, setArea] = useState("");
    const [busy, setBusy] = useState(false);
    function load() {
      fetch("/api/goals", {
        headers: authHeaders()
      }).then(r => r.ok ? r.json() : {
        goals: [],
        areas: []
      }).then(d => {
        setGoals(d.goals || []);
        setAreas(d.areas || []);
        setArea(a => a || d.areas && d.areas[0] || "");
      }).catch(() => {});
    }
    useEffect(load, []);
    function addGoal(e) {
      e.preventDefault();
      if (title.trim().length < 2 || busy) return;
      setBusy(true);
      fetch("/api/goals", {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          title,
          area
        })
      }).then(r => r.json()).then(() => {
        setTitle("");
        load();
      }).finally(() => setBusy(false));
    }
    function bump(g, delta) {
      const p = Math.max(0, Math.min(100, g.progress + delta));
      fetch(`/api/goals/${g.id}`, {
        method: "PUT",
        headers: authHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          progress: p
        })
      }).then(r => r.json()).then(load);
    }
    function remove(g) {
      fetch(`/api/goals/${g.id}`, {
        method: "DELETE",
        headers: authHeaders()
      }).then(load);
    }
    const active = goals.filter(g => g.status !== "archived");
    return /*#__PURE__*/React.createElement("div", {
      className: "cm-slide-up-in rounded-3xl border border-gold-200 bg-white px-5 py-5 space-y-3.5"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800"
    }, " \u05D4\u05D9\u05E2\u05D3\u05D9\u05DD \u05E9\u05DC\u05D9"), /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] text-ink-500 mt-1"
    }, "2\u20135 \u05D9\u05E2\u05D3\u05D9\u05DD \u05D0\u05D9\u05E9\u05D9\u05D9\u05DD \u05E9\u05D0\u05E0\u05D7\u05E0\u05D5 \u05E2\u05D5\u05E7\u05D1\u05D9\u05DD \u05D0\u05D7\u05E8\u05D9\u05D4\u05DD \u05D9\u05D7\u05D3 \u2014 \u05D4\u05E6\u05DE\u05D9\u05D7\u05D4 \u05E9\u05DC\u05DA, \u05DE\u05D3\u05D9\u05D3\u05D4.")), active.map(g => /*#__PURE__*/React.createElement("div", {
      key: g.id,
      className: "rounded-2xl bg-gold-50 border border-gold-100 p-3.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between gap-2"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-semibold text-[14px] text-ink-800 leading-snug"
    }, g.title), /*#__PURE__*/React.createElement("span", {
      className: "text-[11.5px] text-gold-700 font-medium"
    }, g.area)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => remove(g),
      "aria-label": "\u05DE\u05D7\u05D9\u05E7\u05EA \u05D9\u05E2\u05D3",
      className: "shrink-0 text-ink-300 hover:text-red-500 transition-colors"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash-2",
      size: 15
    }))), /*#__PURE__*/React.createElement("div", {
      className: "mt-2.5 h-2 rounded-full bg-ink-100 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full rounded-full bg-gold-500 transition-all duration-500",
      style: {
        width: `${g.progress}%`
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between mt-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex gap-1.5"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => bump(g, -10),
      className: "w-7 h-7 rounded-lg bg-white border border-ink-200 text-ink-600 font-bold hover:border-gold-400"
    }, "\u2212"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => bump(g, 10),
      className: "w-7 h-7 rounded-lg bg-white border border-ink-200 text-ink-600 font-bold hover:border-gold-400"
    }, "+")), /*#__PURE__*/React.createElement("span", {
      className: "text-[12.5px] font-heading font-bold text-gold-700"
    }, g.progress, "%", g.status === "done" ? " ✓ הושלם" : "")))), active.length < 5 && /*#__PURE__*/React.createElement("form", {
      onSubmit: addGoal,
      className: "space-y-2 pt-1"
    }, /*#__PURE__*/React.createElement("input", {
      value: title,
      onChange: e => setTitle(e.target.value),
      placeholder: "\u05D9\u05E2\u05D3 \u05D7\u05D3\u05E9 (\u05DC\u05DE\u05E9\u05DC: \u05DC\u05D5\u05DE\u05E8 \u05D0\u05EA \u05D3\u05E2\u05EA\u05D9 \u05D1\u05DC\u05D9 \u05DC\u05D7\u05E9\u05D5\u05E9)",
      className: "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-300 outline-none focus:border-gold-500"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, /*#__PURE__*/React.createElement("select", {
      value: area,
      onChange: e => setArea(e.target.value),
      className: "flex-1 min-w-0 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-[13px] text-ink-700 outline-none focus:border-gold-500"
    }, areas.map(a => /*#__PURE__*/React.createElement("option", {
      key: a,
      value: a
    }, a))), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      disabled: busy || title.trim().length < 2,
      className: "shrink-0 px-4 py-2.5 rounded-xl bg-gold-500 text-white font-heading font-bold text-[13px] hover:bg-gold-600 transition-colors disabled:opacity-40"
    }, "\u05D4\u05D5\u05E1\u05E4\u05D4"))));
  }
  // כותרות לכל קריאה לשרת: מזהה מכשיר + אסימון התחברות (אם מחוברים).
  function authHeaders(extra) {
    const h = Object.assign({
      "X-Device-Token": getDeviceToken()
    }, extra || {});
    const t = getAuthToken();
    if (t) h["X-Auth-Token"] = t;
    return h;
  }
  const INTAKE_KEY = "cm_intake";

  /* ---------------------------------------------------------------- */
  /* Access gate — 3-day (72h) trial + personal access code */
  /* ---------------------------------------------------------------- */

  // Shown as a blocking overlay when the trial expired (dismissible=false), or as a
  // dismissible sheet when the client taps "יש לי קוד" from the trial banner.
  function AccessGate({
    expired,
    onUnlocked,
    onClose,
    onExit,
    onShowSummary
  }) {
    const [code, setCode] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | error
    const [errorMsg, setErrorMsg] = useState("");
    const [showCode, setShowCode] = useState(!expired); // בהתנסות שהסתיימה — התשלום ראשי, הקוד משני
    // לינק התשלום הורד זמנית (בקשת קטי) בזמן שעובדים על עיצוב אזור ההרשמה — נופל לוואטסאפ במקום.
    const PAY_LINK = "";
    const PAY_FALLBACK = "https://wa.me/972543032349?text=" + encodeURIComponent("היי קטי! אשמח להמשיך את התהליך המלא");
    const firstName = (() => {
      try {
        return (localStorage.getItem(AUTH_NAME_KEY) || "").split(" ")[0];
      } catch (e) {
        return "";
      }
    })();
    function redeem() {
      const trimmed = code.trim();
      if (!trimmed || status === "loading") return;
      setStatus("loading");
      fetch("/api/access/redeem", {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          code: trimmed
        })
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "משהו השתבש, נסי שוב");
        onUnlocked(data);
      }).catch(e => {
        setStatus("error");
        setErrorMsg(e.message);
      });
    }
    const CodeBox = /*#__PURE__*/React.createElement("div", {
      className: "w-full flex flex-col gap-2.5"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: code,
      onChange: e => {
        setCode(e.target.value);
        setStatus("idle");
      },
      onKeyDown: e => e.key === "Enter" && redeem(),
      placeholder: "CM-XXXX-XXXX",
      dir: "ltr",
      className: "w-full text-center tracking-widest font-heading font-bold text-[16px] py-3.5 rounded-2xl border-2 border-ink-200 focus:border-gold-500 outline-none text-ink-800 placeholder:text-ink-300"
    }), status === "error" && /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-red-500 font-medium"
    }, errorMsg), /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: !code.trim() || status === "loading",
      onClick: redeem,
      className: "w-full py-3.5 rounded-2xl bg-gold-500 text-white font-heading font-bold text-[15px] disabled:opacity-40 transition-opacity hover:bg-gold-600"
    }, status === "loading" ? "בודק..." : "הפעלת הקוד"));

    // ── מסך "התהליך שלך רק התחיל" — מעבר טבעי ורגשי לתשלום (לא וואטסאפ) ──
    if (expired) {
      return /*#__PURE__*/React.createElement("div", {
        className: "absolute inset-0 z-50 overflow-y-auto",
        style: {
          background: "linear-gradient(180deg,#ffffff 0%,#FBF6EC 100%)"
        },
        dir: "rtl"
      }, /*#__PURE__*/React.createElement("div", {
        className: "min-h-full flex flex-col items-center justify-center px-7 py-10 text-center max-w-[440px] mx-auto w-full"
      }, /*#__PURE__*/React.createElement("div", {
        className: "w-16 h-16 rounded-full flex items-center justify-center mb-4",
        style: {
          background: "linear-gradient(135deg,#c2974a,#a9791f)"
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "sparkles",
        size: 28,
        className: "text-white"
      })), /*#__PURE__*/React.createElement("h2", {
        className: "font-heading font-extrabold text-[24px] text-ink-800 mb-2"
      }, firstName ? `${firstName}, ` : "", "\u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05DC\u05DA \u05E8\u05E7 \u05D4\u05EA\u05D7\u05D9\u05DC "), /*#__PURE__*/React.createElement("p", {
        className: "text-[14.5px] text-ink-500 leading-relaxed mb-6"
      }, "3 \u05D4\u05D9\u05DE\u05D9\u05DD \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D9\u05DD \u05D4\u05D9\u05D5 \u05E8\u05E7 \u05D4\u05E4\u05EA\u05D9\u05D7\u05D4. \u05D4\u05DE\u05D5\u05D3\u05D5\u05DC\u05D9\u05DD, \u05D4\u05EA\u05E8\u05D2\u05D9\u05DC\u05D9\u05DD \u05D5\u05D4\u05DE\u05DC\u05D5\u05D5\u05D4 \u05E9\u05DE\u05DB\u05D9\u05E8 \u05D0\u05D5\u05EA\u05DA \u2014 \u05DB\u05D5\u05DC\u05DD \u05DE\u05DE\u05E9\u05D9\u05DB\u05D9\u05DD \u05D0\u05D9\u05EA\u05DA. \u05D1\u05D5\u05D0\u05D9 \u05E0\u05DE\u05E9\u05D9\u05DA \u05D9\u05D7\u05D3 \u05D0\u05EA \u05D4\u05D3\u05E8\u05DA."), /*#__PURE__*/React.createElement("div", {
        className: "w-full space-y-2.5 mb-7 text-right"
      }, ["המשך התהליך המלא — כל 14 המודולים והתרגילים", "המלווה החכם שמכיר אותך, זמין 24/7", "מעקב רגשי יומי והחומרים האישיים שלך"].map(t => /*#__PURE__*/React.createElement("div", {
        key: t,
        className: "flex items-start gap-2.5"
      }, /*#__PURE__*/React.createElement("span", {
        className: "shrink-0 mt-0.5 text-gold-600"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "check-circle-2",
        size: 17
      })), /*#__PURE__*/React.createElement("span", {
        className: "text-[13.5px] text-ink-700 leading-relaxed"
      }, t)))), /*#__PURE__*/React.createElement("a", {
        href: PAY_LINK || PAY_FALLBACK,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "w-full py-4 rounded-2xl bg-gold-500 text-white font-heading font-extrabold text-[16px] hover:bg-gold-600 transition-colors shadow-[0_14px_30px_-14px_rgba(194,151,74,0.9)]"
      }, "\u05DC\u05D4\u05DE\u05E9\u05D9\u05DA \u05D0\u05EA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u2192"), /*#__PURE__*/React.createElement("p", {
        className: "mt-2 text-[12.5px] text-ink-500"
      }, "\u05DE\u05E0\u05D5\u05D9 \u05D7\u05D5\u05D3\u05E9\u05D9 \xB7 \u20AA278 \u05D1\u05D7\u05D9\u05D5\u05D1 \u05D7\u05D5\u05D3\u05E9\u05D9 \xB7 \u05E0\u05D9\u05EA\u05DF \u05DC\u05D1\u05D8\u05DC \u05D1\u05DB\u05DC \u05E2\u05EA"), /*#__PURE__*/React.createElement("p", {
        className: "mt-2.5 flex items-center justify-center gap-1.5 text-[12.5px] text-gold-700 font-semibold"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "shield-check",
        size: 15,
        className: "text-gold-600"
      }), "\u05D4\u05D7\u05D6\u05E8 \u05DB\u05E1\u05E4\u05D9 \u05DE\u05DC\u05D0 \u05EA\u05D5\u05DA 15 \u05D9\u05D5\u05DD \u2014 \u05D1\u05DC\u05D9 \u05E9\u05D0\u05DC\u05D5\u05EA"), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: onExit,
        className: "mt-2.5 w-full py-3 rounded-2xl border border-gold-300 text-gold-700 bg-gold-50 font-heading font-semibold text-[14px] hover:bg-gold-100 transition-colors"
      }, "\u05DC\u05E6\u05E4\u05D9\u05D9\u05D4 \u05D1\u05DB\u05DC \u05D4\u05DE\u05E1\u05DC\u05D5\u05DC\u05D9\u05DD"), /*#__PURE__*/React.createElement("div", {
        className: "mt-6 w-full"
      }, showCode ? /*#__PURE__*/React.createElement("div", {
        className: "w-full"
      }, /*#__PURE__*/React.createElement("p", {
        className: "text-[12.5px] text-ink-500 mb-2"
      }, "\u05E7\u05D9\u05D1\u05DC\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05E9\u05D9 \u05DE\u05E7\u05D8\u05D9? \u05D4\u05D6\u05D9\u05E0\u05D9 \u05D0\u05D5\u05EA\u05D5 \u05DB\u05D0\u05DF:"), CodeBox) : /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => setShowCode(true),
        className: "text-[13px] text-gold-700 underline font-semibold"
      }, "\u05DB\u05D1\u05E8 \u05D9\u05E9 \u05DC\u05DA \u05E7\u05D5\u05D3 \u05D2\u05D9\u05E9\u05D4?")), /*#__PURE__*/React.createElement("div", {
        className: "mt-6 flex flex-col items-center gap-2"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: onShowSummary,
        className: "text-[13px] text-ink-500 underline"
      }, "\u05D4\u05E1\u05D9\u05DB\u05D5\u05DD \u05E9\u05DC\u05D9 \u05DE\u05D4\u05EA\u05D4\u05DC\u05D9\u05DA "), /*#__PURE__*/React.createElement("a", {
        href: "https://wa.me/972543032349?text=%D7%94%D7%99%D7%99%20%D7%A7%D7%98%D7%99%20%F0%9F%8C%BF",
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-[12.5px] text-ink-400 underline"
      }, "\u05E9\u05D0\u05DC\u05D4 \u05DC\u05E4\u05E0\u05D9 \u05E9\u05DE\u05DE\u05E9\u05D9\u05DB\u05D9\u05DD? \u05DB\u05EA\u05D1\u05D9 \u05DC\u05D9"))));
    }

    // ── מסך שדרוג/הזנת קוד (כשלוחצים "יש לי קוד" או "להמשיך בתשלום" מתוך שער נעול — לא חסימה) ──
    return /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 z-50 overflow-y-auto bg-white",
      dir: "rtl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "min-h-full flex flex-col items-center justify-center gap-5 px-7 py-10 text-center max-w-[440px] mx-auto w-full"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield-check",
      size: 26,
      className: "text-gold-600"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[18px] text-ink-800"
    }, "\u05E9\u05D3\u05E8\u05D5\u05D2 \u05DC\u05DE\u05E1\u05DC\u05D5\u05DC \u05D4\u05DE\u05DC\u05D0"), /*#__PURE__*/React.createElement("p", {
      className: "text-[13.5px] text-ink-500 mt-1.5 leading-relaxed"
    }, "\u05E9\u05E2\u05E8\u05D9\u05DD 2-4 \u05E4\u05EA\u05D5\u05D7\u05D9\u05DD \u05D1\u05DE\u05E0\u05D5\u05D9 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9 \u2014 \u05DB\u05DC 14 \u05D4\u05DE\u05D5\u05D3\u05D5\u05DC\u05D9\u05DD, \u05D4\u05EA\u05E8\u05D2\u05D9\u05DC\u05D9\u05DD \u05D5\u05D4\u05DE\u05DC\u05D5\u05D5\u05D4 \u05D4\u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9, \u05D6\u05DE\u05D9\u05DF 24/7.")), /*#__PURE__*/React.createElement("a", {
      href: PAY_LINK || PAY_FALLBACK,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "w-full py-4 rounded-2xl bg-gold-500 text-white font-heading font-extrabold text-[16px] hover:bg-gold-600 transition-colors shadow-[0_14px_30px_-14px_rgba(194,151,74,0.9)]"
    }, "\u05DC\u05D4\u05DE\u05E9\u05D9\u05DA \u05D1\u05EA\u05E9\u05DC\u05D5\u05DD \u2192"), /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] text-ink-500 -mt-2"
    }, "\u05DE\u05E0\u05D5\u05D9 \u05D7\u05D5\u05D3\u05E9\u05D9 \xB7 \u20AA278 \u05D1\u05D7\u05D9\u05D5\u05D1 \u05D7\u05D5\u05D3\u05E9\u05D9 \xB7 \u05E0\u05D9\u05EA\u05DF \u05DC\u05D1\u05D8\u05DC \u05D1\u05DB\u05DC \u05E2\u05EA"), showCode ? /*#__PURE__*/React.createElement("div", {
      className: "w-full pt-2 border-t border-ink-100"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] text-ink-500 mb-2 mt-4"
    }, "\u05E7\u05D9\u05D1\u05DC\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D9\u05E9\u05D9 \u05DE\u05E7\u05D8\u05D9? \u05D4\u05E7\u05DC\u05D9\u05D3\u05D9 \u05D0\u05D5\u05EA\u05D5 \u05DB\u05D0\u05DF:"), CodeBox) : /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setShowCode(true),
      className: "text-[13px] text-gold-700 underline font-semibold"
    }, "\u05DB\u05D1\u05E8 \u05D9\u05E9 \u05DC\u05DA \u05E7\u05D5\u05D3 \u05D2\u05D9\u05E9\u05D4?"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClose,
      className: "text-[13px] text-ink-400 underline"
    }, "\u05E1\u05D2\u05D9\u05E8\u05D4")));
  }

  // End-of-trial motivational summary: what the client did, wins, patterns, and a
  // warm CTA to continue — reachable from the paywall gate and the trial banner.
  function JourneySummary({
    onClose,
    onExit
  }) {
    const [data, setData] = useState(null);
    useEffect(() => {
      fetch("/api/journey-summary", {
        headers: authHeaders()
      }).then(r => r.ok ? r.json() : null).then(setData).catch(() => {});
    }, []);
    if (!data) {
      return /*#__PURE__*/React.createElement("div", {
        className: "absolute inset-0 z-50 bg-white flex items-center justify-center",
        dir: "rtl"
      }, /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] text-ink-400"
      }, "\u05D0\u05D5\u05E1\u05E4\u05EA \u05D0\u05EA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05DC\u05DA..."));
    }
    const s = data.stats;
    const statItems = [{
      value: data.journeyDay,
      label: "ימים בתהליך"
    }, {
      value: s.checkins,
      label: "שיחות צ'ק-אין"
    }, {
      value: s.groundingSessions,
      label: "תרגילי קרקוע"
    }, {
      value: s.tasksDone,
      label: "משימות שהושלמו"
    }].filter(it => it.value > 0 || it.label === "ימים בתהליך");
    const emailBody = [`סיכום התהליך שלי ב-CureMindset · ${data.journeyDay} ימים`, "", `שיחות צ'ק-אין: ${s.checkins}`, `תרגילי קרקוע: ${s.groundingSessions}${s.avgRelief ? ` (ירידה ממוצעת של ${s.avgRelief}% בעומס)` : ""}`, `משימות יומיות שהושלמו: ${s.tasksDone} מתוך ${s.tasksTotal}`, "", data.wins.length ? "הניצחונות שלי:\n" + data.wins.map(w => `• ${w.title || w.text}`).join("\n") : "", data.patterns.length ? "\nדפוסים שזיהינו יחד:\n" + data.patterns.map(p => `• ${p.title}`).join("\n") : "", "", "CureMindset · שיטת קטי שגב"].join("\n");
    const mailtoHref = `mailto:?subject=${encodeURIComponent("סיכום התהליך שלי ב-CureMindset")}&body=${encodeURIComponent(emailBody)}`;
    return /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 z-50 bg-white overflow-y-auto",
      dir: "rtl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "px-6 py-8 flex flex-col gap-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-center"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-3"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 26,
      className: "text-gold-600"
    })), /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-extrabold text-[22px] text-ink-800"
    }, "\u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05DC\u05DA \u05E2\u05D3 \u05DB\u05D0\u05DF"), /*#__PURE__*/React.createElement("p", {
      className: "text-[13.5px] text-ink-500 mt-1"
    }, "\u05EA\u05E8\u05D0\u05D9 \u05DB\u05DE\u05D4 \u05E2\u05E9\u05D9\u05EA \u2014 \u05DB\u05DC \u05D0\u05D7\u05D3 \u05DE\u05D4\u05DE\u05E1\u05E4\u05E8\u05D9\u05DD \u05D4\u05D0\u05DC\u05D4 \u05D4\u05D5\u05D0 \u05D1\u05D7\u05D9\u05E8\u05D4 \u05E9\u05DC\u05DA \u05D1\u05E2\u05E6\u05DE\u05DA.")), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 md:grid-cols-4 gap-3"
    }, statItems.map(it => /*#__PURE__*/React.createElement("div", {
      key: it.label,
      className: "rounded-2xl bg-gold-50 border border-gold-200 py-4 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-extrabold text-[28px] text-gold-600 leading-none"
    }, it.value), /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] text-ink-500 mt-1.5"
    }, it.label)))), s.avgRelief != null && /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl bg-gold-500 py-4 px-5 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-extrabold text-[26px] text-white leading-none"
    }, s.avgRelief, "%"), /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] text-white mt-1.5"
    }, "\u05D9\u05E8\u05D9\u05D3\u05D4 \u05DE\u05DE\u05D5\u05E6\u05E2\u05EA \u05D1\u05E2\u05D5\u05DE\u05E1 \u05D4\u05E8\u05D2\u05E9\u05D9 \u05D0\u05D7\u05E8\u05D9 \u05EA\u05E8\u05D2\u05D5\u05DC")), data.wins.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800 mb-2.5"
    }, "\u05D4\u05E0\u05D9\u05E6\u05D7\u05D5\u05E0\u05D5\u05EA \u05E9\u05DC\u05DA"), /*#__PURE__*/React.createElement("ul", {
      className: "flex flex-col gap-2"
    }, data.wins.map((w, i) => /*#__PURE__*/React.createElement("li", {
      key: i,
      className: "flex items-start gap-2.5 rounded-xl bg-ink-50 px-3.5 py-3 text-[13.5px] text-ink-700 leading-snug"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield-check",
      size: 16,
      className: "text-gold-500 mt-0.5 shrink-0"
    }), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "font-semibold"
    }, w.title || w.text), w.description ? /*#__PURE__*/React.createElement("span", {
      className: "text-ink-500"
    }, " \u2014 ", w.description) : null))))), data.patterns.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800 mb-2.5"
    }, "\u05D3\u05E4\u05D5\u05E1\u05D9\u05DD \u05E9\u05D6\u05D9\u05D4\u05D9\u05E0\u05D5 \u05D9\u05D7\u05D3"), /*#__PURE__*/React.createElement("ul", {
      className: "flex flex-col gap-2"
    }, data.patterns.map((p, i) => /*#__PURE__*/React.createElement("li", {
      key: i,
      className: "rounded-xl border border-ink-100 px-3.5 py-3 text-[13.5px] text-ink-600 leading-snug"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-semibold text-ink-800"
    }, p.title), p.description ? ` — ${p.description}` : "")))), /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl bg-gold-50 border border-gold-200 px-5 py-5 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[16px] text-ink-800"
    }, "\u05D6\u05D4 \u05E8\u05E7 \u05D4\u05E9\u05E2\u05E8 \u05D4\u05E8\u05D0\u05E9\u05D5\u05DF \u05E9\u05DC \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA"), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-600 mt-1.5 leading-relaxed"
    }, "\u05D4\u05E2\u05D1\u05D5\u05D3\u05D4 \u05D4\u05D0\u05DE\u05D9\u05EA\u05D9\u05EA \u05E2\u05DC \u05D4\u05D3\u05E4\u05D5\u05E1 \u05E9\u05D6\u05D9\u05D4\u05D9\u05E0\u05D5 \u05DE\u05EA\u05D7\u05D9\u05DC\u05D4 \u05E2\u05DB\u05E9\u05D9\u05D5. \u05D1\u05DC\u05D9\u05D5\u05D5\u05D9 \u05D4\u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9 \u05E0\u05DE\u05E9\u05D9\u05DA \u05D9\u05D7\u05D3 \u2014 \u05D9\u05D5\u05DD \u05D0\u05D7\u05E8 \u05D9\u05D5\u05DD, \u05D1\u05E7\u05E6\u05D1 \u05E9\u05DC\u05DA."), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onExit,
      className: "w-full mt-4 py-3.5 rounded-full bg-gold-500 text-white font-heading font-bold text-[15px] hover:bg-gold-600 transition-colors"
    }, "\u05DC\u05D4\u05DE\u05E9\u05DA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u2014 \u05DC\u05DE\u05E1\u05DC\u05D5\u05DC\u05D9\u05DD"), /*#__PURE__*/React.createElement("a", {
      href: mailtoHref,
      className: "block w-full mt-2.5 py-3 rounded-full border border-gold-300 text-gold-700 font-heading font-semibold text-[13.5px] hover:bg-gold-100 transition-colors"
    }, "\u05E9\u05DC\u05D9\u05D7\u05EA \u05D4\u05E1\u05D9\u05DB\u05D5\u05DD \u05DC\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05D9")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClose,
      className: "text-[13px] text-ink-400 underline mx-auto pb-2"
    }, "\u05D7\u05D6\u05E8\u05D4")));
  }

  // Thin banner above the stages while on a free trial: warm days-left note only.
  // (The access-code entry lives in the settings sheet — a new client shouldn't be
  // confronted with a "personal code" prompt they don't have yet.)
  function TrialBanner({
    daysLeft
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-center gap-2 px-4 py-2 bg-gold-50 border-b border-gold-200"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[12.5px] text-gold-700 font-medium"
    }, "\u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05DC\u05DA \u05E4\u05EA\u05D5\u05D7 \u2014 ", daysLeft === 1 ? "יום אחרון בהתנסות · אחר כך תוכלי להמשיך לתוכנית המלאה" : `נותרו ${daysLeft} ימי התנסות`));
  }

  /* ---------------------------------------------------------------- */
  /* Stage metadata */
  /* ---------------------------------------------------------------- */

  const STAGES = [{
    id: 0,
    icon: "home",
    title: "היום שלי",
    subtitle: "הצעד הבא שלך להיום",
    alwaysUnlocked: true
  }, {
    id: 1,
    icon: "anchor",
    title: "עוגן",
    subtitle: "יצירת יציבות ראשונית ועוגן רגשי",
    alwaysUnlocked: true
  }, {
    id: 2,
    icon: "compass",
    title: "גבול ההבחנה",
    subtitle: "הפרדה בין רגש, מחשבה ומציאות"
  }, {
    id: 3,
    icon: "footprints",
    title: "קרקוע",
    subtitle: "חזרה לגוף ולכאן ועכשיו"
  }, {
    id: 4,
    icon: "sparkles",
    title: "מדד חוסן",
    subtitle: "השיקוף האישי שלך",
    alwaysUnlocked: true
  }, {
    id: 6,
    icon: "book-open",
    title: "החומרים שלי",
    subtitle: "חומרים שהוקצו לך אישית",
    alwaysUnlocked: true
  }, {
    id: 7,
    icon: "check-circle",
    title: "משימות יומיות",
    subtitle: "המשימות שלי לתרגול היומי",
    alwaysUnlocked: true
  }, {
    id: 9,
    icon: "video",
    title: "המפגש שלי",
    subtitle: "מפגש זום אישי וחי עם קטי",
    alwaysUnlocked: true
  }];

  // קישור קביעת מפגש (Calendly של קטי) — המפגש הווירטואלי החי.
  const CALENDAR_LINK = "https://calendly.com/ketysegev/meet-with-me";

  /* ---------------------------------------------------------------- */
  /* TodayStage — "היום שלי": מסך תרגול יומי (אפיון §17.4 / §18.3).    */
  /* פעולה אחת, עד 3 המלצות, SOS גלוי ו"אני צריכה אדם" נגישים תמיד.    */
  /* ---------------------------------------------------------------- */
  function TodayStage({
    firstName,
    onNavigateStage,
    onNeedHuman
  }) {
    // התאמה אישית מתוך האינטייק: מצב (1–10), זמן פנוי והעדפת פורמט.
    const intake = (() => {
      try {
        return JSON.parse(localStorage.getItem(INTAKE_KEY)) || {};
      } catch (e) {
        return {};
      }
    })();
    const mood = Number(intake.mood) || 0;
    const lowMood = mood > 0 && mood <= 4;
    const wantsAudio = intake.format === "audio";
    const shortTime = intake.time === "5";

    // עד 3 המלצות — כל אחת עם duration, נושא וסיבה שקופה (למה הוצעה).
    // כשהמצב נמוך — פותחים ברוגע. אחרת — צ'ק-אין קודם.
    const recs = lowMood ? [{
      icon: "heart",
      label: "נתחיל ברוגע",
      title: "עוגן SOS — הרגעה מהירה",
      time: "2 דק'",
      reason: `כי סימנת ${mood}/10 — קודם מורידים עוצמה, אחר כך מדברים.`,
      stage: 1
    }, {
      icon: "sparkles",
      label: "אחר כך",
      title: "מדד חוסן — השיקוף שלך",
      time: "5 דק'",
      reason: "לראות במספרים איפה את עומדת היום.",
      stage: 4
    }, {
      icon: "footprints",
      label: "אם מתאים",
      title: "תרגול קרקוע",
      time: "5 דק'",
      reason: "מחזיר את הגוף לכאן ועכשיו.",
      stage: 3
    }] : [{
      icon: "sparkles",
      label: "הצעד הבא שלך",
      title: "מדד חוסן — השיקוף שלך",
      time: "5 דק'",
      reason: mood ? `סימנת ${mood}/10 היום — נראה את התמונה המלאה.` : "כדי שנדע מאיפה להמשיך היום.",
      stage: 4
    }, {
      icon: "footprints",
      label: "אם יש לך 5 דקות",
      title: wantsAudio ? "תרגול קרקוע מודרך (אודיו)" : "תרגול קרקוע קצר",
      time: "5 דק'",
      reason: wantsAudio ? "בחרת פורמט אודיו — נלווה אותך בהקשבה." : "מחזיר את הגוף לכאן ועכשיו כשיש עומס.",
      stage: 3
    }, {
      icon: "graduation-cap",
      label: shortTime ? "כשיהיה לך עוד רגע" : "אם יש לך יותר זמן",
      title: "המשך התוכנית שלך",
      time: "10–15 דק'",
      reason: "צעד אחד קדימה במסלול המודרך.",
      stage: 8
    }];
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-5"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-extrabold text-[22px] text-ink-800"
    }, firstName ? `היי ${firstName}, טוב שחזרת` : "טוב שחזרת"), /*#__PURE__*/React.createElement("p", {
      className: "text-[13.5px] text-ink-500 mt-1"
    }, lowMood ? "אני כאן איתך. נתחיל בעדינות, צעד אחד קטן." : "מה שחשוב עכשיו — צעד אחד קטן. בלי עומס.")), recs.map((r, i) => /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      onClick: () => onNavigateStage(r.stage),
      className: "w-full text-right bg-white rounded-2xl border border-ink-100 shadow-sm p-5 flex items-start gap-4 hover:border-gold-300 transition-colors"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-11 h-11 rounded-xl bg-gold-100 text-gold-600 flex items-center justify-center shrink-0"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: r.icon,
      size: 20
    })), /*#__PURE__*/React.createElement("span", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("span", {
      className: "block text-[12px] font-heading font-semibold text-gold-600 mb-0.5"
    }, r.label, " \xB7 ", r.time), /*#__PURE__*/React.createElement("span", {
      className: "block font-heading font-bold text-[16.5px] text-ink-800"
    }, r.title), /*#__PURE__*/React.createElement("span", {
      className: "block text-[13px] text-ink-500 mt-1 leading-relaxed"
    }, r.reason)), /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 18,
      className: "text-ink-300 shrink-0 mt-1"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-3 pt-1"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onNavigateStage(1),
      className: "rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center",
      style: {
        background: "rgba(184,212,227,0.22)",
        border: "1px solid rgba(184,212,227,0.55)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "heart",
      size: 20,
      className: "text-ink-600"
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-bold text-[14px] text-ink-800"
    }, "\u05E2\u05D5\u05D2\u05DF SOS"), /*#__PURE__*/React.createElement("span", {
      className: "text-[11.5px] text-ink-500 leading-snug"
    }, "\u05E8\u05D2\u05E2 \u05E9\u05DC \u05D4\u05E6\u05E4\u05D4? \u05D4\u05E8\u05D2\u05E2\u05D4 \u05DE\u05D4\u05D9\u05E8\u05D4")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onNeedHuman,
      className: "rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center bg-gold-50 border border-gold-200"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "heart-handshake",
      size: 20,
      className: "text-gold-600"
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-bold text-[14px] text-ink-800"
    }, "\u05D0\u05E0\u05D9 \u05E6\u05E8\u05D9\u05DB\u05D4 \u05D0\u05D3\u05DD"), /*#__PURE__*/React.createElement("span", {
      className: "text-[11.5px] text-ink-500 leading-snug"
    }, "\u05DC\u05EA\u05D9\u05D0\u05D5\u05DD \u05E9\u05D9\u05D7\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA \u05E2\u05DD \u05E7\u05D8\u05D9"))), /*#__PURE__*/React.createElement("p", {
      className: "text-[11.5px] text-ink-400 text-center leading-relaxed pt-1"
    }, "CureMindset \u05D4\u05D5\u05D0 \u05DB\u05DC\u05D9 \u05DC\u05D0\u05D9\u05DE\u05D5\u05DF \u05D5\u05EA\u05E8\u05D2\u05D5\u05DC, \u05DC\u05D0 \u05EA\u05D7\u05DC\u05D9\u05E3 \u05DC\u05D8\u05D9\u05E4\u05D5\u05DC. \u05D1\u05DE\u05E6\u05D5\u05E7\u05D4 \u05DE\u05D9\u05D9\u05D3\u05D9\u05EA: \u05E2\u05E8\"\u05DF 1201 \xB7 \u05DE\u05D3\"\u05D0 101."));
  }

  /* ---------------------------------------------------------------- */
  /* Shared bits */
  /* ---------------------------------------------------------------- */

  function Field({
    icon,
    label,
    value,
    onChange,
    placeholder,
    textarea
  }) {
    const inputClass = "w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300";
    return /*#__PURE__*/React.createElement("label", {
      className: "block"
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-2 mb-2 text-[13px] font-heading font-semibold text-ink-700"
    }, icon ? /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 16,
      className: "text-gold-600 shrink-0"
    }) : null, label), textarea ? /*#__PURE__*/React.createElement("textarea", {
      value: value,
      onChange: e => onChange(e.target.value),
      placeholder: placeholder,
      rows: 2,
      className: `${inputClass} resize-none`
    }) : /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: value,
      onChange: e => onChange(e.target.value),
      placeholder: placeholder,
      className: inputClass
    }));
  }
  function Chip({
    active,
    onClick,
    children
  }) {
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClick,
      className: `px-3.5 py-2 rounded-full text-[13px] font-heading font-semibold border transition-colors ${active ? "bg-gold-500 text-white border-gold-500" : "bg-white text-ink-600 border-ink-200 hover:border-gold-300"}`
    }, children);
  }
  function StepDots({
    total,
    current
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-center gap-1.5 mb-5"
    }, Array.from({
      length: total
    }).map((_, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      className: `h-1.5 rounded-full transition-all ${i + 1 === current ? "w-6 bg-gold-500" : "w-1.5 bg-ink-200"}`
    })));
  }
  function BreathingOrb({
    label
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col items-center justify-center py-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cm-breathe w-24 h-24 rounded-full bg-gradient-to-br from-gold-200 to-gold-400 shadow-soft flex items-center justify-center"
    }, /*#__PURE__*/React.createElement("div", {
      className: "w-14 h-14 rounded-full bg-white/70"
    })), label ? /*#__PURE__*/React.createElement("p", {
      className: "mt-4 text-[13px] text-ink-500 text-center"
    }, label) : null);
  }

  /* ---------------------------------------------------------------- */
  /* Stage 1 — Anchoring */
  /* ---------------------------------------------------------------- */

  function AnchorStage({
    onComplete
  }) {
    const [anchorWord, setAnchorWord] = useState("");
    const canContinue = anchorWord.trim().length >= 2;
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-6"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-lg text-ink-800 mb-2"
    }, "\u05D1\u05E0\u05D9\u05D9\u05EA \u05E2\u05D5\u05D2\u05DF \u05E8\u05D2\u05E9\u05D9"), /*#__PURE__*/React.createElement("p", {
      className: "text-[14px] text-ink-600 leading-relaxed"
    }, "\u05DC\u05E4\u05E0\u05D9 \u05E9\u05DE\u05EA\u05D7\u05D9\u05DC\u05D9\u05DD \u05EA\u05D4\u05DC\u05D9\u05DA, \u05D7\u05E9\u05D5\u05D1 \u05DC\u05D1\u05E0\u05D5\u05EA \u05E2\u05D5\u05D2\u05DF \u05D0\u05D7\u05D3 \u05D9\u05E6\u05D9\u05D1 \u2014 \u05EA\u05D7\u05D5\u05E9\u05D4, \u05DE\u05D9\u05DC\u05D4 \u05D0\u05D5 \u05E0\u05E9\u05D9\u05DE\u05D4 \u05E9\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D7\u05D6\u05D5\u05E8 \u05D0\u05DC\u05D9\u05D4 \u05D1\u05DB\u05DC \u05E8\u05D2\u05E2 \u05E9\u05DE\u05E8\u05D2\u05D9\u05E9\u05D9\u05DD \u05D2\u05D5\u05D3\u05E9.")), /*#__PURE__*/React.createElement(BreathingOrb, {
      label: "\u05E0\u05E9\u05DE\u05D5 \u05DC\u05D0\u05D8: \u05E9\u05D0\u05D9\u05E4\u05D4 \u05DC-4 \u05E9\u05E0\u05D9\u05D5\u05EA, \u05E0\u05E9\u05D9\u05E4\u05D4 \u05DC-6 \u05E9\u05E0\u05D9\u05D5\u05EA. \u05E2\u05E7\u05D1\u05D5 \u05D0\u05D7\u05E8\u05D9 \u05E7\u05E6\u05D1 \u05D4\u05E2\u05D9\u05D2\u05D5\u05DC."
    }), /*#__PURE__*/React.createElement(Field, {
      icon: "anchor",
      label: "\u05D4\u05DE\u05D9\u05DC\u05D4 \u05D0\u05D5 \u05D4\u05EA\u05D7\u05D5\u05E9\u05D4 \u05E9\u05DE\u05D9\u05D9\u05E6\u05D2\u05EA \u05E2\u05D1\u05D5\u05E8\u05DA \u05D9\u05E6\u05D9\u05D1\u05D5\u05EA",
      value: anchorWord,
      onChange: setAnchorWord,
      placeholder: "\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: '\u05D0\u05E0\u05D9 \u05D9\u05E6\u05D9\u05D1/\u05D4', '\u05E9\u05D5\u05E8\u05E9', '\u05D1\u05D9\u05EA'"
    }), /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      className: "w-full",
      icon: "arrow-left",
      iconPos: "end",
      disabled: !canContinue,
      onClick: () => canContinue && onComplete(anchorWord.trim()),
      style: !canContinue ? {
        opacity: 0.45,
        cursor: "not-allowed"
      } : undefined
    }, "\u05D4\u05E9\u05DC\u05DE\u05EA\u05D9 \u05D0\u05EA \u05D4\u05E2\u05D5\u05D2\u05DF \xB7 \u05DC\u05DE\u05E2\u05D1\u05E8 \u05DC\u05E9\u05DC\u05D1 \u05D4\u05D1\u05D0"));
  }

  /* ---------------------------------------------------------------- */
  /* Stage 2 — Differentiation Border */
  /* ---------------------------------------------------------------- */

  function BorderStage({
    onComplete
  }) {
    const [emotion, setEmotion] = useState("");
    const [thought, setThought] = useState("");
    const [reality, setReality] = useState("");
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-6"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-lg text-ink-800 mb-2"
    }, "\u05D2\u05D1\u05D5\u05DC \u05D4\u05D4\u05D1\u05D7\u05E0\u05D4"), /*#__PURE__*/React.createElement("p", {
      className: "text-[14px] text-ink-600 leading-relaxed"
    }, "\u05DB\u05E9\u05DE\u05E8\u05D2\u05D9\u05E9\u05D9\u05DD \u05D2\u05D5\u05D3\u05E9, \u05E7\u05DC \u05DC\u05D1\u05DC\u05D1\u05DC \u05D1\u05D9\u05DF \u05E9\u05DC\u05D5\u05E9\u05D4 \u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05D5\u05E0\u05D9\u05DD. \u05D1\u05D5\u05D0\u05D5 \u05E0\u05E4\u05E8\u05D9\u05D3 \u05D0\u05D5\u05EA\u05DD, \u05D0\u05D7\u05D3 \u05D0\u05D7\u05D3.")), /*#__PURE__*/React.createElement("div", {
      className: "space-y-4"
    }, /*#__PURE__*/React.createElement(Field, {
      icon: "heart",
      label: "\u05D4\u05E8\u05D2\u05E9 \u2014 \u05DE\u05D4 \u05D0\u05E0\u05D9 \u05DE\u05E8\u05D2\u05D9\u05E9/\u05D4 \u05E2\u05DB\u05E9\u05D9\u05D5?",
      value: emotion,
      onChange: setEmotion,
      placeholder: "\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: \u05D7\u05E8\u05D3\u05D4, \u05E2\u05E6\u05D1, \u05DB\u05E2\u05E1, \u05E2\u05D5\u05DE\u05E1",
      textarea: true
    }), /*#__PURE__*/React.createElement(Field, {
      icon: "brain",
      label: "\u05D4\u05DE\u05D7\u05E9\u05D1\u05D4 \u2014 \u05DE\u05D4 \u05E2\u05D5\u05DC\u05D4 \u05DC\u05D9 \u05D1\u05E8\u05D0\u05E9?",
      value: thought,
      onChange: setThought,
      placeholder: "\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: '\u05D0\u05E0\u05D9 \u05DC\u05D0 \u05D0\u05E6\u05DC\u05D9\u05D7', '\u05DE\u05E9\u05D4\u05D5 \u05E8\u05E2 \u05D9\u05E7\u05E8\u05D4'",
      textarea: true
    }), /*#__PURE__*/React.createElement(Field, {
      icon: "compass",
      label: "\u05D4\u05DE\u05E6\u05D9\u05D0\u05D5\u05EA \u2014 \u05DE\u05D4 \u05E7\u05D5\u05E8\u05D4 \u05D1\u05E4\u05D5\u05E2\u05DC, \u05D1\u05DC\u05D9 \u05E4\u05E8\u05E9\u05E0\u05D5\u05EA?",
      value: reality,
      onChange: setReality,
      placeholder: "\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: '\u05D0\u05E0\u05D9 \u05D9\u05D5\u05E9\u05D1/\u05EA \u05D1\u05D1\u05D9\u05EA, \u05D1\u05D8\u05D5\u05D7/\u05D4, \u05D5\u05DC\u05E4\u05E0\u05D9\u05D9 \u05DE\u05D1\u05D7\u05DF \u05DE\u05D7\u05E8'",
      textarea: true
    })), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500 bg-gold-50 border border-gold-100 rounded-2xl px-4 py-3 leading-relaxed"
    }, "\u05D4\u05DE\u05D7\u05E9\u05D1\u05D4 \u05D4\u05D9\u05D0 \u05DC\u05D0 \u05E2\u05D5\u05D1\u05D3\u05D4, \u05D5\u05D4\u05E8\u05D2\u05E9 \u05D4\u05D5\u05D0 \u05DC\u05D0 \u05D4\u05DE\u05E6\u05D9\u05D0\u05D5\u05EA \u2014 \u05E9\u05E0\u05D9\u05D4\u05DD \u05EA\u05D2\u05D5\u05D1\u05D4 \u05D6\u05DE\u05E0\u05D9\u05EA \u05E9\u05E2\u05D5\u05D1\u05E8\u05EA."), /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      className: "w-full",
      icon: "arrow-left",
      iconPos: "end",
      onClick: () => onComplete({
        emotion,
        thought,
        reality
      })
    }, "\u05E1\u05D9\u05D9\u05DE\u05EA\u05D9 \u05D0\u05EA \u05D4\u05D4\u05D1\u05D7\u05E0\u05D4 \xB7 \u05DC\u05DE\u05E2\u05D1\u05E8 \u05DC\u05E7\u05E8\u05E7\u05D5\u05E2"));
  }

  /* ---------------------------------------------------------------- */
  /* Stage 3 — Grounding (3-2-1 protocol) */
  /* ---------------------------------------------------------------- */

  const TENSION_AREAS = ["כתפיים", "חזה", "בטן", "צוואר וגרון", "ידיים", "ראש"];
  function GroundStage({
    onComplete
  }) {
    const [step, setStep] = useState(1);
    const [tension, setTension] = useState([]);
    const [seen, setSeen] = useState(["", "", ""]);
    const [heard, setHeard] = useState(["", ""]);
    const [felt, setFelt] = useState("");
    const [score, setScore] = useState(50);
    const [saved, setSaved] = useState(false);
    const [sessionsCount, setSessionsCount] = useState(() => loadSessions().length);
    function toggleTension(area) {
      setTension(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
    }
    function updateAt(list, setList, index, value) {
      const next = [...list];
      next[index] = value;
      setList(next);
    }
    function resetForAnotherRound() {
      setStep(1);
      setTension([]);
      setSeen(["", "", ""]);
      setHeard(["", ""]);
      setFelt("");
      setScore(50);
      setSaved(false);
    }
    function handleSave() {
      saveSession(score);
      setSessionsCount(c => c + 1);
      setSaved(true);
      onComplete();
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-5"
    }, /*#__PURE__*/React.createElement(StepDots, {
      total: 4,
      current: step
    }), step === 1 ? /*#__PURE__*/React.createElement("div", {
      className: "space-y-5"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-lg text-ink-800 mb-2"
    }, "\u05E9\u05DC\u05D1 1 \xB7 \u05D1\u05D3\u05D9\u05E7\u05EA \u05D2\u05D5\u05E3"), /*#__PURE__*/React.createElement("p", {
      className: "text-[14px] text-ink-600 leading-relaxed"
    }, "\u05D4\u05E0\u05D9\u05D7\u05D5 \u05D0\u05EA \u05E9\u05EA\u05D9 \u05DB\u05E4\u05D5\u05EA \u05D4\u05E8\u05D2\u05DC\u05D9\u05D9\u05DD \u05E2\u05DC \u05D4\u05E8\u05E6\u05E4\u05D4. \u05D4\u05E8\u05D2\u05D9\u05E9\u05D5 \u05D0\u05EA \u05D4\u05DE\u05E9\u05E7\u05DC \u05D9\u05D5\u05E8\u05D3 \u05DE\u05D8\u05D4, \u05D5\u05D0\u05EA \u05D4\u05DE\u05D2\u05E2 \u05E9\u05DC \u05D4\u05E8\u05D2\u05DC\u05D9\u05D9\u05DD \u05E2\u05DD \u05D4\u05E7\u05E8\u05E7\u05E2.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] font-heading font-semibold text-ink-700 mb-2.5"
    }, "\u05D1\u05D0\u05D9\u05D6\u05D4 \u05D0\u05D6\u05D5\u05E8 \u05D1\u05D2\u05D5\u05E3 \u05DE\u05D5\u05E8\u05D2\u05E9 \u05DE\u05EA\u05D7? (\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D1\u05D7\u05D5\u05E8 \u05DB\u05DE\u05D4)"), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2"
    }, TENSION_AREAS.map(area => /*#__PURE__*/React.createElement(Chip, {
      key: area,
      active: tension.includes(area),
      onClick: () => toggleTension(area)
    }, area)))), /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      className: "w-full",
      icon: "arrow-left",
      iconPos: "end",
      onClick: () => setStep(2)
    }, "\u05D4\u05DE\u05E9\u05DA \u05DC\u05E9\u05DC\u05D1 2")) : null, step === 2 ? /*#__PURE__*/React.createElement("div", {
      className: "space-y-5"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-lg text-ink-800 mb-2"
    }, "\u05E9\u05DC\u05D1 2 \xB7 \u05EA\u05E8\u05D2\u05D5\u05DC 3-2-1"), /*#__PURE__*/React.createElement("p", {
      className: "text-[14px] text-ink-600 leading-relaxed"
    }, "\u05E9\u05D9\u05DE\u05D5 \u05DC\u05D1, \u05D1\u05DC\u05D9 \u05DC\u05DE\u05D4\u05E8, \u05DC\u05E1\u05D1\u05D9\u05D1\u05D4 \u05E9\u05DC\u05DB\u05DD \u05D3\u05E8\u05DA \u05D4\u05D7\u05D5\u05E9\u05D9\u05DD.")), /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, /*#__PURE__*/React.createElement("p", {
      className: "flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "eye",
      size: 16,
      className: "text-gold-600"
    }), " 3 \u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05D0\u05EA\u05DD \u05E8\u05D5\u05D0\u05D9\u05DD"), seen.map((v, i) => /*#__PURE__*/React.createElement("input", {
      key: i,
      type: "text",
      value: v,
      onChange: e => updateAt(seen, setSeen, i, e.target.value),
      placeholder: `דבר נראה ${i + 1}`,
      className: "w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, /*#__PURE__*/React.createElement("p", {
      className: "flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "ear",
      size: 16,
      className: "text-gold-600"
    }), " 2 \u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05D0\u05EA\u05DD \u05E9\u05D5\u05DE\u05E2\u05D9\u05DD"), heard.map((v, i) => /*#__PURE__*/React.createElement("input", {
      key: i,
      type: "text",
      value: v,
      onChange: e => updateAt(heard, setHeard, i, e.target.value),
      placeholder: `קול נשמע ${i + 1}`,
      className: "w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, /*#__PURE__*/React.createElement("p", {
      className: "flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "hand",
      size: 16,
      className: "text-gold-600"
    }), " \u05D3\u05D1\u05E8 \u05D0\u05D7\u05D3 \u05E9\u05D0\u05EA\u05DD \u05DE\u05E8\u05D2\u05D9\u05E9\u05D9\u05DD \u05D1\u05DE\u05D2\u05E2"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: felt,
      onChange: e => setFelt(e.target.value),
      placeholder: "\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: \u05DE\u05E8\u05E7\u05DD \u05D4\u05D1\u05D3, \u05D8\u05DE\u05E4\u05E8\u05D8\u05D5\u05E8\u05EA \u05D4\u05D0\u05D5\u05D5\u05D9\u05E8",
      className: "w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-3"
    }, /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "secondary",
      className: "flex-1",
      onClick: () => setStep(1)
    }, "\u05D7\u05D6\u05E8\u05D4"), /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      className: "flex-1",
      icon: "arrow-left",
      iconPos: "end",
      onClick: () => setStep(3)
    }, "\u05D4\u05DE\u05E9\u05DA"))) : null, step === 3 ? /*#__PURE__*/React.createElement("div", {
      className: "space-y-5"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-lg text-ink-800 mb-2"
    }, "\u05E9\u05DC\u05D1 3 \xB7 \u05E2\u05D5\u05D2\u05DF \u05D4\u05E7\u05E8\u05E7\u05D5\u05E2"), /*#__PURE__*/React.createElement("p", {
      className: "text-[14px] text-ink-600 leading-relaxed"
    }, "\u05D7\u05D6\u05E8\u05D5 \u05E2\u05DC \u05D4\u05DE\u05E9\u05E4\u05D8 \u05DC\u05E2\u05E6\u05DE\u05DB\u05DD, \u05E4\u05E2\u05DE\u05D9\u05D9\u05DD, \u05D1\u05E7\u05D5\u05DC \u05D0\u05D5 \u05D1\u05E9\u05E7\u05D8.")), /*#__PURE__*/React.createElement(BreathingOrb, null), /*#__PURE__*/React.createElement("p", {
      className: "text-center font-heading font-bold text-xl text-ink-800 leading-snug px-2"
    }, "\"\u05D0\u05E0\u05D9 \u05DB\u05D0\u05DF. \u05E2\u05DB\u05E9\u05D9\u05D5.", /*#__PURE__*/React.createElement("br", null), "\u05D0\u05E0\u05D9 \u05D1\u05D8\u05D5\u05D7/\u05D4 \u05D1\u05E8\u05D2\u05E2 \u05D4\u05D6\u05D4.\""), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-3"
    }, /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "secondary",
      className: "flex-1",
      onClick: () => setStep(2)
    }, "\u05D7\u05D6\u05E8\u05D4"), /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      className: "flex-1",
      icon: "arrow-left",
      iconPos: "end",
      onClick: () => setStep(4)
    }, "\u05E1\u05D9\u05D9\u05DE\u05EA\u05D9 \u05D0\u05EA \u05D4\u05EA\u05E8\u05D2\u05D5\u05DC"))) : null, step === 4 ? /*#__PURE__*/React.createElement("div", {
      className: "space-y-6"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-lg text-ink-800 mb-2"
    }, "\u05DB\u05DE\u05D4 \u05D9\u05E8\u05D3 \u05D4\u05E2\u05D5\u05DE\u05E1 \u05D4\u05E8\u05D2\u05E9\u05D9?"), /*#__PURE__*/React.createElement("p", {
      className: "text-[14px] text-ink-600 leading-relaxed"
    }, "\u05D4\u05D6\u05D9\u05D6\u05D5 \u05D0\u05EA \u05D4\u05DE\u05D7\u05D5\u05D5\u05DF \u05DC\u05D4\u05E2\u05E8\u05DB\u05D4 \u05E9\u05DC\u05DB\u05DD \u2014 \u05D0\u05D9\u05DF \u05EA\u05E9\u05D5\u05D1\u05D4 \u05E0\u05DB\u05D5\u05E0\u05D4 \u05D0\u05D5 \u05E9\u05D2\u05D5\u05D9\u05D4.")), /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-2xl border border-ink-200 px-5 py-6"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-center font-heading font-bold text-3xl text-gold-600 mb-4"
    }, score, "%"), /*#__PURE__*/React.createElement("input", {
      type: "range",
      min: "0",
      max: "100",
      step: "5",
      value: score,
      onChange: e => setScore(Number(e.target.value)),
      className: "w-full accent-gold-500",
      disabled: saved
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between text-[11px] text-ink-400 mt-1.5"
    }, /*#__PURE__*/React.createElement("span", null, "0% \xB7 \u05DC\u05D0 \u05D9\u05E8\u05D3"), /*#__PURE__*/React.createElement("span", null, "100% \xB7 \u05D9\u05E8\u05D3 \u05DC\u05D7\u05DC\u05D5\u05D8\u05D9\u05DF")), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2 justify-center mt-4"
    }, [0, 25, 50, 75, 100].map(v => /*#__PURE__*/React.createElement(Chip, {
      key: v,
      active: score === v,
      onClick: () => !saved && setScore(v)
    }, v, "%")))), !saved ? /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      className: "w-full",
      icon: "check-circle-2",
      onClick: handleSave
    }, "\u05E9\u05DE\u05D9\u05E8\u05EA \u05D4\u05EA\u05D5\u05E6\u05D0\u05D4") : /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, /*#__PURE__*/React.createElement("p", {
      className: "flex items-center justify-center gap-2 text-[14px] font-heading font-semibold text-gold-700 bg-gold-50 border border-gold-100 rounded-2xl px-4 py-3"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle-2",
      size: 18
    }), " \u05D4\u05EA\u05D5\u05E6\u05D0\u05D4 \u05E0\u05E9\u05DE\u05E8\u05D4. \u05D4\u05E9\u05DC\u05DE\u05EA\u05DD ", sessionsCount, " \u05EA\u05E8\u05D2\u05D5\u05DC\u05D9 \u05E7\u05E8\u05E7\u05D5\u05E2 \u05E2\u05D3 \u05DB\u05D4."), /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "secondary",
      className: "w-full",
      icon: "rotate-ccw",
      onClick: resetForAnotherRound
    }, "\u05EA\u05E8\u05D2\u05D5\u05DC \u05E7\u05E8\u05E7\u05D5\u05E2 \u05E0\u05D5\u05E1\u05E3"))) : null);
  }

  /* ---------------------------------------------------------------- */
  /* Stage 6 — Client Resources & Vault (materials assigned by therapist) */
  /* ---------------------------------------------------------------- */

  const MATERIAL_TYPE_META = {
    lesson: {
      icon: "book-open",
      label: "שיעור קצר"
    },
    audio: {
      icon: "headphones",
      label: "קובץ שמע"
    },
    worksheet: {
      icon: "file-text",
      label: "דף עבודה"
    },
    summary: {
      icon: "book-open",
      label: "סיכום פגישה"
    },
    other: {
      icon: "file-text",
      label: "חומר"
    }
  };
  function MaterialCard({
    material
  }) {
    const meta = MATERIAL_TYPE_META[material.type] || MATERIAL_TYPE_META.other;
    const isLesson = material.type === "lesson";
    const hasUrl = material.url && /^(https?:|\/uploads)/.test(material.url);
    return /*#__PURE__*/React.createElement("div", {
      className: "cm-fade-in-soft rounded-2xl border border-ink-100 bg-white px-4 py-4 shadow-soft"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start gap-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-10 h-10 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center shrink-0"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: meta.icon,
      size: 17
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[10.5px] font-heading font-semibold uppercase tracking-wider text-gold-600 mb-0.5"
    }, meta.label), /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[14.5px] text-ink-800 leading-snug"
    }, material.title), material.notes ? /*#__PURE__*/React.createElement("p", {
      className: `mt-1 leading-relaxed ${isLesson ? "text-[13.5px] text-ink-700 whitespace-pre-line" : "text-[12.5px] text-ink-500"}`
    }, material.notes) : null)), material.type === "audio" && hasUrl ? /*#__PURE__*/React.createElement("div", {
      className: "mt-3"
    }, /*#__PURE__*/React.createElement("audio", {
      controls: true,
      src: material.url,
      className: "w-full"
    })) : hasUrl ? /*#__PURE__*/React.createElement("div", {
      className: "mt-3"
    }, /*#__PURE__*/React.createElement("a", {
      href: material.url,
      target: "_blank",
      rel: "noreferrer",
      className: "inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-gold-600 hover:text-gold-700"
    }, isLesson ? "לצפייה בתוכן" : "לפתיחת הקובץ", /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-up-right",
      size: 13
    }))) : null);
  }
  function MaterialsStage() {
    const [materials, setMaterials] = useState(null);
    const [error, setError] = useState(false);
    useEffect(() => {
      fetch("/api/materials", {
        headers: authHeaders()
      }).then(res => res.ok ? res.json() : Promise.reject()).then(data => setMaterials(Array.isArray(data) ? data : [])).catch(() => setError(true));
    }, []);
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-4"
    }, /*#__PURE__*/React.createElement("header", {
      className: "mb-2 px-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "book-open",
      size: 15,
      className: "text-gold-600"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-600"
    }, "\u05D4\u05D7\u05D5\u05DE\u05E8\u05D9\u05DD \u05E9\u05DC\u05D9")), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500 leading-relaxed"
    }, "\u05D7\u05D5\u05DE\u05E8\u05D9\u05DD \u05D0\u05D9\u05E9\u05D9\u05D9\u05DD \u05E9\u05D4\u05D5\u05E7\u05E6\u05D5 \u05DC\u05DA \u2014 \u05D3\u05DE\u05D9\u05D5\u05DF \u05DE\u05D5\u05D3\u05E8\u05DA, \u05D3\u05E4\u05D9 \u05E2\u05D1\u05D5\u05D3\u05D4 \u05D5\u05E1\u05D9\u05DB\u05D5\u05DE\u05D9\u05DD.")), error ? /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-ink-100 bg-white px-4 py-5 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500"
    }, "\u05DC\u05D0 \u05D4\u05E6\u05DC\u05D7\u05E0\u05D5 \u05DC\u05D8\u05E2\u05D5\u05DF \u05D0\u05EA \u05D4\u05D7\u05D5\u05DE\u05E8\u05D9\u05DD \u05DB\u05E8\u05D2\u05E2. \u05E0\u05E1\u05D9 \u05E9\u05D5\u05D1 \u05D1\u05E2\u05D5\u05D3 \u05E8\u05D2\u05E2.")) : materials === null ? /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-ink-100 bg-white px-4 py-5 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-400"
    }, "\u05D8\u05D5\u05E2\u05E0\u05EA...")) : materials.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-ink-100 bg-white px-4 py-6 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500"
    }, "\u05E2\u05D5\u05D3 \u05DC\u05D0 \u05D4\u05D5\u05E7\u05E6\u05D5 \u05DC\u05DA \u05D7\u05D5\u05DE\u05E8\u05D9\u05DD. \u05DB\u05E9\u05D4\u05DE\u05D8\u05E4\u05DC\u05EA \u05EA\u05E9\u05D9\u05D9\u05DA \u05DC\u05DA \u05DE\u05E9\u05D4\u05D5, \u05D4\u05D5\u05D0 \u05D9\u05D5\u05E4\u05D9\u05E2 \u05DB\u05D0\u05DF.")) : materials.map(m => /*#__PURE__*/React.createElement(MaterialCard, {
      key: m.id,
      material: m
    })));
  }

  /* ---------------------------------------------------------------- */
  /* Tasks stage */
  /* ---------------------------------------------------------------- */

  const TASK_CATEGORY_ICONS = {
    breathing: "wind",
    journaling: "pen-line",
    movement: "activity",
    social: "users",
    mindfulness: "sparkles"
  };
  const TASK_CATEGORY_LABELS = {
    breathing: "נשימה",
    journaling: "כתיבה",
    movement: "תנועה",
    social: "חברתי",
    mindfulness: "מיינדפולנס"
  };
  function TasksStage() {
    const [tasks, setTasks] = useState(null);
    const [completing, setCompleting] = useState(null);
    useEffect(() => {
      fetch("/api/tasks", {
        headers: authHeaders()
      }).then(r => r.json()).then(data => setTasks(Array.isArray(data) ? data : [])).catch(() => setTasks([]));
    }, []);
    function completeTask(id) {
      setCompleting(id);
      fetch(`/api/tasks/${id}/complete`, {
        method: "POST",
        headers: authHeaders()
      }).then(() => setTasks(prev => prev.map(t => t.id === id ? {
        ...t,
        completed: 1
      } : t))).finally(() => setCompleting(null));
    }
    const pending = tasks ? tasks.filter(t => !t.completed) : [];
    const done = tasks ? tasks.filter(t => t.completed) : [];
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-4"
    }, /*#__PURE__*/React.createElement("header", {
      className: "mb-2 px-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle",
      size: 15,
      className: "text-gold-600"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-600"
    }, "\u05DE\u05E9\u05D9\u05DE\u05D5\u05EA \u05D9\u05D5\u05DE\u05D9\u05D5\u05EA")), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500 leading-relaxed"
    }, "\u05DE\u05E9\u05D9\u05DE\u05D5\u05EA \u05E7\u05D8\u05E0\u05D5\u05EA \u05E9\u05E0\u05D2\u05D6\u05E8\u05D5 \u05E2\u05D1\u05D5\u05E8\u05DA \u05DE\u05D4\u05E9\u05D9\u05D7\u05D5\u05EA \u05E2\u05DD \u05D4\u05DC\u05D9\u05D5\u05D5\u05D9 \u05D4\u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9. \u05E6\u05E2\u05D3 \u05E7\u05D8\u05DF \u05D1\u05D9\u05D5\u05DD.")), tasks === null ? /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-ink-100 bg-white px-4 py-5 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-400"
    }, "\u05D8\u05D5\u05E2\u05E0\u05EA...")) : pending.length === 0 && done.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-ink-100 bg-white px-4 py-6 text-center"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 28,
      className: "text-gold-300 mx-auto mb-2"
    }), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500"
    }, "\u05E2\u05D5\u05D3 \u05D0\u05D9\u05DF \u05DE\u05E9\u05D9\u05DE\u05D5\u05EA. \u05D0\u05D7\u05E8\u05D9 \u05D4\u05E6'\u05E7-\u05D0\u05D9\u05DF \u05D4\u05E8\u05D0\u05E9\u05D5\u05DF \u05E9\u05DC\u05DA \u05EA\u05E7\u05D1\u05DC\u05D9 \u05DE\u05E9\u05D9\u05DE\u05D4 \u05D9\u05D5\u05DE\u05D9\u05EA \u05DE\u05D5\u05EA\u05D0\u05DE\u05EA \u05D0\u05D9\u05E9\u05D9\u05EA.")) : /*#__PURE__*/React.createElement(React.Fragment, null, pending.map(task => /*#__PURE__*/React.createElement("div", {
      key: task.id,
      className: "rounded-2xl border border-gold-200 bg-gold-50 px-4 py-4 flex items-start gap-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gold-100 text-gold-600 shrink-0 mt-0.5"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: TASK_CATEGORY_ICONS[task.category] || "sparkles",
      size: 17
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-semibold text-ink-800 text-[14px] mb-0.5"
    }, task.title), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500 leading-snug"
    }, task.description), /*#__PURE__*/React.createElement("span", {
      className: "inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 font-medium"
    }, TASK_CATEGORY_LABELS[task.category] || "כללי")), /*#__PURE__*/React.createElement("button", {
      onClick: () => completeTask(task.id),
      disabled: completing === task.id,
      className: "shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-gold-500 text-white hover:bg-gold-600 transition-colors disabled:opacity-50"
    }, completing === task.id ? "..." : "עשיתי!"))), done.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2 px-1"
    }, "\u05D4\u05D5\u05E9\u05DC\u05DE\u05D5 \u2713"), done.map(task => /*#__PURE__*/React.createElement("div", {
      key: task.id,
      className: "rounded-2xl border border-ink-100 bg-white px-4 py-3 flex items-center gap-3 opacity-60 mb-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle",
      size: 18,
      className: "text-gold-400 shrink-0"
    }), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500 line-through"
    }, task.title))))));
  }

  /* ---------------------------------------------------------------- */
  /* Phone frame + nav */
  /* ---------------------------------------------------------------- */

  function PhoneFrame({
    children
  }) {
    // מעטפת אפליקציה נקייה: מסך מלא במובייל; בדסקטופ עמודת אפליקציה ממורכזת על רקע
    // קרם רך עם צל — בלי מסגרת טלפון שחורה ובלי פסים אפורים.
    // maxWidth/shadow/border כ-inline styles — ה-classes של Tailwind עם sm:
    // וערכים שרירותיים לא נכללו ב-CSS המהודר, ולכן במחשב האתר נמתח על כל הרוחב.
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 z-50 flex justify-center overflow-hidden",
      dir: "rtl",
      style: {
        background: "linear-gradient(160deg,#fdfbf7 0%,#f4ecdd 100%)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "relative bg-ink-50 overflow-hidden flex flex-col",
      style: {
        width: "100%",
        maxWidth: 480,
        height: "100%",
        boxShadow: "0 40px 100px -45px rgba(120,90,30,0.55)",
        borderLeft: "1px solid #f0e6d2",
        borderRight: "1px solid #f0e6d2"
      }
    }, children));
  }
  function Header({
    subtitle,
    onExit,
    onNotifications,
    onMenu
  }) {
    const [unread, setUnread] = useState(0);
    useEffect(() => {
      function loadUnread() {
        fetch("/api/notifications", {
          headers: authHeaders()
        }).then(r => r.ok ? r.json() : []).then(rows => setUnread(rows.filter(n => !n.read).length)).catch(() => {});
      }
      loadUnread();
      const id = setInterval(loadUnread, 60000);
      return () => clearInterval(id);
    }, []);
    return /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between gap-3 px-4 pt-7 sm:pt-5 pb-3 bg-white border-b border-ink-100 shrink-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onMenu,
      "aria-label": "\u05EA\u05E4\u05E8\u05D9\u05D8",
      className: "w-9 h-9 rounded-full flex items-center justify-center bg-ink-50 text-ink-700 hover:bg-ink-100 transition-colors shrink-0"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "menu",
      size: 20
    })), /*#__PURE__*/React.createElement("img", {
      src: "images/logo.png",
      alt: "CureMindset",
      className: "h-8 w-auto shrink-0",
      onError: e => {
        e.currentTarget.style.display = "none";
      }
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800"
    }, "CureMindset \xB7 \u05D0\u05D6\u05D5\u05E8 \u05D0\u05D9\u05E9\u05D9"), /*#__PURE__*/React.createElement("p", {
      className: "text-[12px] text-ink-500"
    }, subtitle))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onNotifications,
      "aria-label": "\u05D4\u05EA\u05E8\u05D0\u05D5\u05EA",
      className: "relative w-9 h-9 rounded-full flex items-center justify-center bg-ink-50 text-ink-600 hover:bg-ink-100 transition-colors shrink-0"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bell",
      size: 18
    }), unread > 0 && /*#__PURE__*/React.createElement("span", {
      className: "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
    }, unread > 9 ? "9+" : unread)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onExit,
      "aria-label": "\u05E1\u05D2\u05D9\u05E8\u05EA \u05D4\u05D0\u05D6\u05D5\u05E8 \u05D4\u05D0\u05D9\u05E9\u05D9",
      className: "w-9 h-9 rounded-full flex items-center justify-center bg-ink-50 text-ink-600 hover:bg-ink-100 transition-colors shrink-0"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 18
    }))));
  }

  // מסך הגדרות (בהשראת Curable App Settings) — חשבון, פרטיות ואבטחה, התנתקות.
  function SettingsSheet({
    userName,
    onClose,
    onLogout,
    onManage
  }) {
    const [tab, setTab] = useState("main"); // main | privacy
    const [cancelStep, setCancelStep] = useState("idle"); // idle | confirm | done
    const [cancelMsg, setCancelMsg] = useState("");
    function doCancel() {
      setCancelStep("sending");
      fetch("/api/cancel-subscription", {
        method: "POST",
        headers: authHeaders({
          "Content-Type": "application/json"
        }),
        body: "{}"
      }).then(r => r.json()).then(d => {
        setCancelMsg(d.message || d.error || "המנוי בוטל.");
        setCancelStep("done");
      }).catch(() => {
        setCancelMsg("לא הצלחנו לבטל כרגע — נסי שוב או כתבי לנו בוואטסאפ.");
        setCancelStep("done");
      });
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet",
      role: "dialog",
      "aria-label": "\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__scrim",
      onClick: onClose
    }), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__panel"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__head"
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-sheet__hic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sliders-horizontal",
      size: 19
    })), /*#__PURE__*/React.createElement("b", null, tab === "privacy" ? "פרטיות ותנאים" : "הגדרות"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cm-sheet__x",
      onClick: onClose,
      "aria-label": "\u05E1\u05D2\u05D9\u05E8\u05D4"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 18
    }))), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__scroll"
    }, tab === "main" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
      className: "cm-sheet__sec"
    }, "\u05D7\u05E9\u05D1\u05D5\u05DF"), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-sheet__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user-round",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__txt"
    }, /*#__PURE__*/React.createElement("b", null, userName || "המשתמש/ת שלי"), /*#__PURE__*/React.createElement("small", null, "\u05D4\u05E4\u05E8\u05D5\u05E4\u05D9\u05DC \u05E9\u05DC\u05DA \u05D1-CureMindset"))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cm-sheet__row cm-sheet__row--btn",
      onClick: onManage
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-sheet__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "book-open",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__txt"
    }, /*#__PURE__*/React.createElement("b", null, "\u05DE\u05E0\u05D5\u05D9 \u05D5\u05D2\u05D9\u05E9\u05D4 \u05DC\u05EA\u05D5\u05DB\u05E0\u05D9\u05D5\u05EA"), /*#__PURE__*/React.createElement("small", null, "\u05E0\u05D9\u05D4\u05D5\u05DC \u05D4\u05E0\u05D9\u05E1\u05D9\u05D5\u05DF \u05D5\u05D4\u05DE\u05E2\u05D1\u05E8 \u05DC\u05EA\u05D5\u05DB\u05E0\u05D9\u05EA \u05D1\u05EA\u05E9\u05DC\u05D5\u05DD")), /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 18
    })), /*#__PURE__*/React.createElement("p", {
      className: "cm-sheet__sec"
    }, "\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D5\u05D0\u05D1\u05D8\u05D7\u05D4"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cm-sheet__row cm-sheet__row--btn",
      onClick: () => setTab("privacy")
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-sheet__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield-check",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__txt"
    }, /*#__PURE__*/React.createElement("b", null, "\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D5\u05EA\u05E0\u05D0\u05D9 \u05E9\u05D9\u05DE\u05D5\u05E9"), /*#__PURE__*/React.createElement("small", null, "\u05D0\u05D9\u05DA \u05D0\u05E0\u05D7\u05E0\u05D5 \u05E9\u05D5\u05DE\u05E8\u05D9\u05DD \u05E2\u05DC \u05D4\u05DE\u05D9\u05D3\u05E2 \u05E9\u05DC\u05DA")), /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 18
    })), /*#__PURE__*/React.createElement("p", {
      className: "cm-sheet__sec"
    }, "\u05DB\u05DC\u05DC\u05D9"), cancelStep === "done" ? /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-sheet__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle-2",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__txt"
    }, /*#__PURE__*/React.createElement("b", null, "\u05D4\u05DE\u05E0\u05D5\u05D9 \u05D1\u05D5\u05D8\u05DC"), /*#__PURE__*/React.createElement("small", null, cancelMsg))) : cancelStep === "confirm" || cancelStep === "sending" ? /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__row",
      style: {
        flexWrap: "wrap",
        gap: "8px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__txt",
      style: {
        width: "100%"
      }
    }, /*#__PURE__*/React.createElement("b", null, "\u05DC\u05D1\u05D8\u05DC \u05D0\u05EA \u05D4\u05DE\u05E0\u05D5\u05D9?"), /*#__PURE__*/React.createElement("small", null, "\u05D4\u05D7\u05D6\u05E8 \u05DB\u05E1\u05E4\u05D9 \u05DE\u05DC\u05D0 \u05EA\u05D5\u05DA 15 \u05D9\u05D5\u05DD \u05DE\u05D4\u05D7\u05D9\u05D5\u05D1 \u05D4\u05E8\u05D0\u05E9\u05D5\u05DF.")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      disabled: cancelStep === "sending",
      onClick: doCancel,
      className: "px-4 py-2 rounded-xl bg-red-500 text-white font-heading font-bold text-[13px] disabled:opacity-50"
    }, cancelStep === "sending" ? "מבטל…" : "כן, לבטל"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setCancelStep("idle"),
      className: "px-4 py-2 rounded-xl border border-ink-200 text-ink-600 font-heading font-semibold text-[13px]"
    }, "\u05D7\u05D6\u05E8\u05D4")) : /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cm-sheet__row cm-sheet__row--btn",
      onClick: () => setCancelStep("confirm")
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-sheet__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "rotate-ccw",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__txt"
    }, /*#__PURE__*/React.createElement("b", null, "\u05D1\u05D9\u05D8\u05D5\u05DC \u05DE\u05E0\u05D5\u05D9"), /*#__PURE__*/React.createElement("small", null, "\u05D1\u05D9\u05D8\u05D5\u05DC \u05D1\u05DB\u05DC \u05E2\u05EA \xB7 \u05D4\u05D7\u05D6\u05E8 \u05DE\u05DC\u05D0 \u05EA\u05D5\u05DA 15 \u05D9\u05D5\u05DD")), /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 18
    })), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cm-sheet__row cm-sheet__row--btn cm-sheet__row--danger",
      onClick: onLogout
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-sheet__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "log-out",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      className: "cm-sheet__txt"
    }, /*#__PURE__*/React.createElement("b", null, "\u05D4\u05EA\u05E0\u05EA\u05E7\u05D5\u05EA")), /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 18
    })), /*#__PURE__*/React.createElement("p", {
      className: "cm-sheet__ver"
    }, "CureMindset \xB7 \u05D4\u05E9\u05D9\u05D8\u05D4 \u05E9\u05DC \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 ")) : /*#__PURE__*/React.createElement("div", {
      className: "cm-privacy"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cm-privacy__back",
      onClick: () => setTab("main")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-right",
      size: 16
    }), " \u05D7\u05D6\u05E8\u05D4 \u05DC\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA"), /*#__PURE__*/React.createElement("h4", null, "\u05DE\u05D3\u05D9\u05E0\u05D9\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D5\u05EA\u05E0\u05D0\u05D9 \u05E9\u05D9\u05DE\u05D5\u05E9 \xB7 CureMindset"), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__lead"
    }, "\u05D4\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05E9\u05DC\u05DA \u05D9\u05E7\u05E8\u05D4 \u05DC\u05E0\u05D5. \u05DE\u05E1\u05DE\u05DA \u05D6\u05D4 \u05DE\u05E1\u05D1\u05D9\u05E8 \u05D0\u05D9\u05D6\u05D4 \u05DE\u05D9\u05D3\u05E2 \u05D0\u05E0\u05D5 \u05D0\u05D5\u05E1\u05E4\u05D9\u05DD, \u05DB\u05D9\u05E6\u05D3 \u05D0\u05E0\u05D5 \u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD \u05D1\u05D5 \u05D5\u05E9\u05D5\u05DE\u05E8\u05D9\u05DD \u05E2\u05DC\u05D9\u05D5 \u2014 \u05D1\u05DE\u05E1\u05D2\u05E8\u05EA \u05D4\u05DC\u05D9\u05D5\u05D5\u05D9 \u05D4\u05E8\u05D2\u05E9\u05D9-\u05EA\u05D5\u05D3\u05E2\u05EA\u05D9 \u05D1\u05E9\u05D9\u05D8\u05EA CureMindset \u05E9\u05DC \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1."), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__h"
    }, "1. \u05DE\u05D9\u05D3\u05E2 \u05E9\u05D0\u05E0\u05D5 \u05D0\u05D5\u05E1\u05E4\u05D9\u05DD"), /*#__PURE__*/React.createElement("p", null, "\u05E9\u05DD, \u05E4\u05E8\u05D8\u05D9 \u05E7\u05E9\u05E8 (\u05DE\u05D9\u05D9\u05DC \u05D5\u05D8\u05DC\u05E4\u05D5\u05DF), \u05EA\u05E9\u05D5\u05D1\u05D5\u05EA \u05D4\u05E9\u05D0\u05DC\u05D5\u05DF \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D9, \u05D5\u05D4\u05E9\u05D9\u05D7\u05D5\u05EA \u05E9\u05DC\u05DA \u05E2\u05DD \u05D4\u05DE\u05DC\u05D5\u05D5\u05D4 \u05D4\u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9 \u2014 \u05DB\u05D3\u05D9 \u05DC\u05D1\u05E0\u05D5\u05EA \u05D5\u05DC\u05D4\u05EA\u05D0\u05D9\u05DD \u05D0\u05EA \u05DE\u05E4\u05EA \u05D4\u05D3\u05E8\u05DB\u05D9\u05DD \u05D4\u05D0\u05D9\u05E9\u05D9\u05EA \u05E9\u05DC\u05DA."), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__h"
    }, "2. \u05DB\u05D9\u05E6\u05D3 \u05D0\u05E0\u05D5 \u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD \u05D1\u05DE\u05D9\u05D3\u05E2"), /*#__PURE__*/React.createElement("p", null, "\u05DC\u05D4\u05EA\u05D0\u05DE\u05D4 \u05D0\u05D9\u05E9\u05D9\u05EA \u05E9\u05DC \u05D4\u05EA\u05DB\u05E0\u05D9\u05DD, \u05D4\u05EA\u05E8\u05D2\u05D9\u05DC\u05D9\u05DD \u05D5\u05D4\u05DC\u05D9\u05D5\u05D5\u05D9; \u05DC\u05E9\u05DC\u05D9\u05D7\u05EA \u05E2\u05D3\u05DB\u05D5\u05E0\u05D9\u05DD \u05D5\u05D4\u05EA\u05E8\u05D0\u05D5\u05EA \u05D4\u05E7\u05E9\u05D5\u05E8\u05D9\u05DD \u05DC\u05EA\u05D4\u05DC\u05D9\u05DA; \u05D5\u05DC\u05E9\u05D9\u05E4\u05D5\u05E8 \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA. \u05D0\u05D9\u05E0\u05E0\u05D5 \u05DE\u05D5\u05DB\u05E8\u05D9\u05DD \u05D0\u05EA \u05D4\u05DE\u05D9\u05D3\u05E2 \u05E9\u05DC\u05DA."), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__h"
    }, "3. \u05E9\u05D9\u05EA\u05D5\u05E3 \u05DE\u05D9\u05D3\u05E2"), /*#__PURE__*/React.createElement("p", null, "\u05D0\u05D9\u05E0\u05E0\u05D5 \u05DE\u05E9\u05EA\u05E4\u05D9\u05DD \u05D0\u05EA \u05D4\u05DE\u05D9\u05D3\u05E2 \u05D4\u05D0\u05D9\u05E9\u05D9 \u05E9\u05DC\u05DA \u05E2\u05DD \u05E6\u05D3 \u05E9\u05DC\u05D9\u05E9\u05D9, \u05DC\u05DE\u05E2\u05D8 \u05E1\u05E4\u05E7\u05D9 \u05EA\u05E9\u05EA\u05D9\u05EA \u05E9\u05DE\u05D0\u05E4\u05E9\u05E8\u05D9\u05DD \u05D0\u05EA \u05D4\u05E4\u05E2\u05DC\u05EA \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA (\u05D0\u05D7\u05E1\u05D5\u05DF, \u05E9\u05DC\u05D9\u05D7\u05EA \u05D4\u05D5\u05D3\u05E2\u05D5\u05EA) \u05D5\u05D1\u05DB\u05E4\u05D5\u05E3 \u05DC\u05D7\u05D5\u05D1\u05EA \u05E1\u05D5\u05D3\u05D9\u05D5\u05EA, \u05D0\u05D5 \u05D0\u05DD \u05E0\u05D3\u05E8\u05E9 \u05E2\u05DC-\u05E4\u05D9 \u05D7\u05D5\u05E7."), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__h"
    }, "4. \u05D0\u05D7\u05E1\u05D5\u05DF \u05D5\u05D0\u05D1\u05D8\u05D7\u05D4"), /*#__PURE__*/React.createElement("p", null, "\u05D4\u05D2\u05D9\u05E9\u05D4 \u05DE\u05D5\u05D2\u05E0\u05EA \u05D1\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D5\u05D1\u05D0\u05D9\u05DE\u05D5\u05EA \u05D8\u05DC\u05E4\u05D5\u05DF (\u05E7\u05D5\u05D3 \u05D7\u05D3-\u05E4\u05E2\u05DE\u05D9 \u05D1-SMS). \u05D4\u05DE\u05D9\u05D3\u05E2 \u05E0\u05E9\u05DE\u05E8 \u05D1\u05E9\u05E8\u05EA\u05D9\u05DD \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05D9\u05DD. \u05D0\u05E3 \u05E9\u05D9\u05D8\u05D4 \u05D0\u05D9\u05E0\u05D4 \u05DE\u05D5\u05D2\u05E0\u05EA \u05D1-100%, \u05D5\u05D0\u05E0\u05D5 \u05E4\u05D5\u05E2\u05DC\u05D9\u05DD \u05DC\u05E9\u05DE\u05D5\u05E8 \u05E2\u05DC \u05D4\u05DE\u05D9\u05D3\u05E2 \u05D1\u05D0\u05DE\u05E6\u05E2\u05D9\u05DD \u05DE\u05E7\u05D5\u05D1\u05DC\u05D9\u05DD."), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__h"
    }, "5. \u05D4\u05D6\u05DB\u05D5\u05D9\u05D5\u05EA \u05E9\u05DC\u05DA"), /*#__PURE__*/React.createElement("p", null, "\u05D1\u05D0\u05E4\u05E9\u05E8\u05D5\u05EA\u05DA \u05DC\u05E2\u05D9\u05D9\u05DF \u05D1\u05DE\u05D9\u05D3\u05E2 \u05E9\u05DC\u05DA, \u05DC\u05EA\u05E7\u05DF \u05D0\u05D5\u05EA\u05D5 \u05D0\u05D5 \u05DC\u05D1\u05E7\u05E9 \u05D0\u05EA \u05DE\u05D7\u05D9\u05E7\u05EA\u05D5 \u05D1\u05DB\u05DC \u05E2\u05EA \u2014 \u05D1\u05E4\u05E0\u05D9\u05D9\u05D4 \u05D0\u05DC\u05D9\u05E0\u05D5."), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__h"
    }, "6. \u05E7\u05D8\u05D9\u05E0\u05D9\u05DD"), /*#__PURE__*/React.createElement("p", null, "\u05E9\u05D9\u05DE\u05D5\u05E9 \u05E9\u05DC \u05D1\u05E0\u05D9 \u05E0\u05D5\u05E2\u05E8 \u05E0\u05E2\u05E9\u05D4 \u05D1\u05DC\u05D9\u05D5\u05D5\u05D9 \u05D5\u05D1\u05D4\u05E1\u05DB\u05DE\u05EA \u05D4\u05D5\u05E8\u05D4/\u05D0\u05E4\u05D5\u05D8\u05E8\u05D5\u05E4\u05D5\u05E1, \u05D4\u05D0\u05D7\u05E8\u05D0\u05D9\u05DD \u05DC\u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D4\u05E7\u05D8\u05D9\u05DF/\u05D4."), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__note"
    }, " ", /*#__PURE__*/React.createElement("b", null, "\u05D4\u05D1\u05D4\u05E8\u05D4 \u05E8\u05E4\u05D5\u05D0\u05D9\u05EA:"), " CureMindset \u05D4\u05D5\u05D0 \u05DC\u05D9\u05D5\u05D5\u05D9 \u05E8\u05D2\u05E9\u05D9-\u05EA\u05D5\u05D3\u05E2\u05EA\u05D9 \u05D5\u05D0\u05D9\u05E0\u05D5 \u05DE\u05D4\u05D5\u05D5\u05D4 \u05D9\u05D9\u05E2\u05D5\u05E5, \u05D0\u05D1\u05D7\u05D5\u05DF \u05D0\u05D5 \u05D8\u05D9\u05E4\u05D5\u05DC \u05E8\u05E4\u05D5\u05D0\u05D9 \u05D0\u05D5 \u05E0\u05E4\u05E9\u05D9, \u05D5\u05D0\u05D9\u05E0\u05D5 \u05EA\u05D7\u05DC\u05D9\u05E3 \u05DC\u05D2\u05D5\u05E8\u05DD \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9. \u05D1\u05DE\u05E6\u05D1 \u05DE\u05E6\u05D5\u05E7\u05D4 \u05D7\u05E8\u05D9\u05E4\u05D4 \u05D0\u05D5 \u05D7\u05D9\u05E8\u05D5\u05DD \u2014 \u05D9\u05E9 \u05DC\u05E4\u05E0\u05D5\u05EA \u05DE\u05D9\u05D3 \u05DC\u05D2\u05D5\u05E8\u05DD \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9, \u05DC\u05E8\u05D5\u05E4\u05D0/\u05D4, \u05D0\u05D5 \u05DC\u05E7\u05D5 \u05E1\u05D9\u05D5\u05E2."), /*#__PURE__*/React.createElement("p", {
      className: "cm-privacy__h"
    }, "7. \u05E9\u05D9\u05E0\u05D5\u05D9\u05D9\u05DD \u05D5\u05D9\u05E6\u05D9\u05E8\u05EA \u05E7\u05E9\u05E8"), /*#__PURE__*/React.createElement("p", null, "\u05D0\u05E0\u05D5 \u05E8\u05E9\u05D0\u05D9\u05DD \u05DC\u05E2\u05D3\u05DB\u05DF \u05DE\u05E1\u05DE\u05DA \u05D6\u05D4 \u05DE\u05E2\u05EA \u05DC\u05E2\u05EA. \u05DC\u05DB\u05DC \u05E9\u05D0\u05DC\u05D4 \u05D1\u05E0\u05D5\u05E9\u05D0 \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u2014 ketyse@gmail.com.")))));
  }

  // תפריט צד (Drawer) בסגנון Curable — נפתח מהכותרת, מעל כל המסכים.
  function Drawer({
    open,
    onClose,
    userName,
    onLogout,
    onSettings,
    onStories
  }) {
    const items = [{
      icon: "sliders-horizontal",
      label: "הגדרות ופרופיל",
      run: onSettings
    }, {
      icon: "star",
      label: "סיפורי הצלחה",
      run: onStories
    }, {
      icon: "message-circle",
      label: "עזרה ותמיכה",
      run: () => window.open("https://wa.me/972543032349?text=" + encodeURIComponent("היי קטי, אשמח לעזרה"), "_blank", "noopener")
    }, {
      icon: "log-out",
      label: "התנתקות",
      run: onLogout
    }];
    return /*#__PURE__*/React.createElement("div", {
      className: `cm-drawer${open ? " cm-drawer--open" : ""}`,
      "aria-hidden": !open
    }, /*#__PURE__*/React.createElement("div", {
      className: "cm-drawer__scrim",
      onClick: onClose
    }), /*#__PURE__*/React.createElement("aside", {
      className: "cm-drawer__panel",
      role: "dialog",
      "aria-label": "\u05EA\u05E4\u05E8\u05D9\u05D8"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cm-drawer__head"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cm-drawer__avatar"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "user-round",
      size: 22
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, userName || "המרחב שלך"), /*#__PURE__*/React.createElement("span", null, "CureMindset \xB7 \u05D0\u05D6\u05D5\u05E8 \u05D0\u05D9\u05E9\u05D9")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "cm-drawer__x",
      onClick: onClose,
      "aria-label": "\u05E1\u05D2\u05D9\u05E8\u05D4"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 18
    }))), /*#__PURE__*/React.createElement("nav", {
      className: "cm-drawer__nav"
    }, items.map(it => /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: it.label,
      className: "cm-drawer__item",
      onClick: () => {
        onClose();
        if (it.run) it.run();
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "cm-drawer__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 19
    })), it.label))), /*#__PURE__*/React.createElement("p", {
      className: "cm-drawer__foot"
    }, "CureMindset \xB7 \u05D4\u05E9\u05D9\u05D8\u05D4 \u05E9\u05DC \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1 ")));
  }

  // שלבי הפרוטוקול הישן (עוגן / גבול ההבחנה / קרקוע) אינם חלק ממערכת CureMindset
  // ואינם מוצגים למשתמש — נשארים בקוד לתאימות, אך מחוץ לתהליך.
  const LEGACY_STAGE_IDS = [1, 2, 3];
  function StageNav({
    stages,
    progress,
    current,
    onSelect
  }) {
    // מציגים רק את שלבי מערכת CureMindset (לא את הפרוטוקול הישן), וגם הם בהדרגה.
    const visible = stages.filter(s => !LEGACY_STAGE_IDS.includes(s.id) && (s.alwaysUnlocked || s.id <= progress.unlocked));
    return /*#__PURE__*/React.createElement("div", {
      className: "flex items-center px-4 py-3.5 gap-1 border-b border-ink-100 bg-white shrink-0"
    }, visible.map((s, i) => {
      const done = progress.completed.includes(s.id);
      const locked = !s.alwaysUnlocked && s.id > progress.unlocked;
      const isCurrent = s.id === current;
      return /*#__PURE__*/React.createElement(React.Fragment, {
        key: s.id
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        disabled: locked,
        onClick: () => !locked && onSelect(s.id),
        className: `flex flex-col items-center gap-1.5 flex-1 py-1 rounded-xl transition-colors ${locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gold-50"}`
      }, /*#__PURE__*/React.createElement("span", {
        className: `w-9 h-9 rounded-full flex items-center justify-center ${isCurrent ? "bg-gold-500 text-white" : done ? "bg-gold-100 text-gold-600" : "bg-ink-100 text-ink-400"}`
      }, /*#__PURE__*/React.createElement(Icon, {
        name: locked ? "lock" : done && !isCurrent ? "check-circle-2" : s.icon,
        size: 16
      })), /*#__PURE__*/React.createElement("span", {
        className: `text-[10.5px] font-heading font-semibold ${isCurrent ? "text-ink-800" : "text-ink-400"}`
      }, s.title)), i < visible.length - 1 ? /*#__PURE__*/React.createElement("span", {
        className: "h-px w-3 bg-ink-100 mt-[-14px]",
        "aria-hidden": "true"
      }) : null);
    }));
  }

  /* ---------------------------------------------------------------- */
  /* Notifications panel */
  /* ---------------------------------------------------------------- */

  function NotificationsPanel({
    onClose
  }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      fetch("/api/notifications", {
        headers: authHeaders()
      }).then(r => r.ok ? r.json() : []).then(rows => {
        setNotifications(rows);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, []);
    function markAllRead() {
      fetch("/api/notifications/read-all", {
        method: "POST",
        headers: authHeaders()
      });
      setNotifications(prev => prev.map(n => ({
        ...n,
        read: 1
      })));
    }
    function markRead(id) {
      fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: authHeaders()
      });
      setNotifications(prev => prev.map(n => n.id === id ? {
        ...n,
        read: 1
      } : n));
    }
    const typeIcon = {
      reminder: "clock",
      win: "trophy",
      info: "info"
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "absolute inset-0 z-30 bg-white flex flex-col",
      dir: "rtl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between px-5 pt-7 sm:pt-5 pb-3 border-b border-ink-100 shrink-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800"
    }, "\u05D4\u05EA\u05E8\u05D0\u05D5\u05EA"), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: markAllRead,
      className: "text-[11px] text-gold-600 font-semibold hover:underline"
    }, "\u05E1\u05DE\u05DF \u05D4\u05DB\u05DC \u05DB\u05E0\u05E7\u05E8\u05D0"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onClose,
      className: "w-8 h-8 rounded-full flex items-center justify-center bg-ink-50 text-ink-600 hover:bg-ink-100"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 16
    })))), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto divide-y divide-ink-50"
    }, loading && /*#__PURE__*/React.createElement("p", {
      className: "text-center text-ink-400 text-sm py-10"
    }, "\u05D8\u05D5\u05E2\u05DF..."), !loading && notifications.length === 0 && /*#__PURE__*/React.createElement("p", {
      className: "text-center text-ink-400 text-sm py-10"
    }, "\u05D0\u05D9\u05DF \u05D4\u05EA\u05E8\u05D0\u05D5\u05EA"), notifications.map(n => /*#__PURE__*/React.createElement("button", {
      key: n.id,
      type: "button",
      onClick: () => markRead(n.id),
      className: `w-full text-right flex gap-3 px-5 py-4 transition-colors hover:bg-gold-50 ${n.read ? "opacity-60" : "bg-gold-50/40"}`
    }, /*#__PURE__*/React.createElement("span", {
      className: `mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === "win" ? "bg-gold-100 text-gold-600" : "bg-ink-100 text-ink-500"}`
    }, /*#__PURE__*/React.createElement(Icon, {
      name: typeIcon[n.type] || "bell",
      size: 15
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: `text-[13px] leading-snug ${n.read ? "text-ink-500" : "text-ink-800 font-medium"}`
    }, n.message), /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-ink-400 mt-1"
    }, new Date(n.created_at).toLocaleDateString("he-IL"))), !n.read && /*#__PURE__*/React.createElement("span", {
      className: "w-2 h-2 rounded-full bg-gold-500 mt-1.5 shrink-0"
    })))));
  }

  /* ---------------------------------------------------------------- */
  /* Root */
  /* ---------------------------------------------------------------- */

  /* ---------------------------------------------------------------- */
  /* Auth gate — הרשמה והתחברות עם מייל וסיסמה */
  /* ---------------------------------------------------------------- */

  // שאלון אבחון אינטראקטיבי (בהשראת Curable): מטרה → משך → תובנה → הרשמה.
  // CureMindset Companion — אבחון שיחתי בהשראת Clara של Curable, בתוכן ובעיצוב של CureMindset.
  // 3 שאלות + שם, תובנה דינמית, ובסיום מעבר להרשמה (מחובר ל-notifyLead/send-lead במייל).
  function OnboardingQuiz({
    onComplete,
    onExit
  }) {
    const SCRIPT = [{
      key: "name",
      type: "text",
      ph: "השם שלך",
      q: "היי, אני כאן איתך מטעם CureMindset יחד נזהה את הדפוס שמעכב אותך, ונתחיל לבנות חוסן וביטחון אמיתי — כזה שמחזיק. ספרי לי, איך קוראים לך?"
    }, {
      key: "challenge",
      q: "נעים להכיר! מה האתגר המרכזי שתרצי/ה לשחרר כרגע?",
      opts: ["עומס, הצפה רגשית ותחושת עמידה במקום", "חרדת ביצוע, פחד מכישלון או דחיינות", "ביקורת עצמית גבוהה ופרפקציוניזם", "ספק עצמי וחוסר שקט פנימי"]
    }, {
      key: "impact",
      q: "הבנתי אותך. ואיך האתגר הזה משפיע על הניסיון שלך לפעול ולהתקדם ביום-יום?",
      opts: ["משתק אותי לחלוטין", "גורם לי לדחות ולהתרחק", "מייצר עייפות ושחיקה", "גורם לי להטיל ספק בשינוי"]
    }, {
      key: "goal",
      q: "תודה על השיתוף. ב-CureMindset אנחנו מבינים שזה אינו חוסר מוטיבציה, אלא מנגנון הגנה של תת-המודע. מה המטרה העיקרית שלך בתהליך?",
      opts: ["וויסות ושקט פנימי", "שחרור חסמים תת-מודעים", "חיזוק החוסן והביטחון", "בניית שגרת פריצת דרך"]
    }];
    const [answers, setAnswers] = useState({});
    const [stage, setStage] = useState(0); // איזו שאלה ממתינה למענה
    const [typing, setTyping] = useState(false);
    const [text, setText] = useState("");
    const scrollRef = React.useRef(null);
    const done = stage >= SCRIPT.length;
    const DISCLAIMER = "עוד לפני שנצלול חשוב לי שתדעי: המרחב הזה הוא ליווי רגשי-תודעתי בשיטת CureMindset, ואינו תחליף לייעוץ או טיפול רפואי/נפשי מקצועי. אם את/ה במצוקה חריפה או במצב חירום — מומלץ מאוד לפנות לגורם מקצועי או לקו סיוע. וכעת, נמשיך יחד";
    const INSIGHT = "אני כבר רואה את התמונה שלך המערכת שלך פשוט עובדת שעות נוספות כדי להגן עלייך — וזה בדיוק מה שמייצר את התחושה הזו. בשיטת CureMindset נחליף יחד את המאמץ הזה בחיווט מחדש, בעדינות ובקצב שלך.";
    const FINAL = "איזה כיף להכיר אותך כבר יש לי תמונה ראשונית שלך והכיוון שמתאים לך. בואי ניצור לך מרחב אישי ונשמור את מה שהתחלנו — כדי לקבל את התוכנית שלך:";

    // גלילה אוטומטית לתחתית עם כל הודעה חדשה
    useEffect(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, [stage, typing]);
    function answer(val) {
      const v = String(val).trim();
      if (!v) return;
      const key = SCRIPT[stage].key;
      setAnswers(a => ({
        ...a,
        [key]: v
      }));
      setText("");
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setStage(s => s + 1);
      }, 800);
    }
    function finish() {
      const a = answers;
      const summary = `שם: ${a.name || "—"} · אתגר: ${a.challenge || "—"} · השפעה: ${a.impact || "—"} · מטרה: ${a.goal || "—"}`;
      onComplete(summary, a.name || "");
    }

    // בניית תמלול השיחה עד לשלב הנוכחי
    const bubbles = [];
    for (let i = 0; i <= stage && i < SCRIPT.length; i++) {
      // הבהרה רפואית — מופיעה אחרי השם, ממש לפני השאלה הראשונה.
      if (i === 1) bubbles.push({
        id: "disc",
        sender: "bot",
        text: DISCLAIMER
      });
      const q = typeof SCRIPT[i].q === "function" ? SCRIPT[i].q(answers) : SCRIPT[i].q;
      bubbles.push({
        id: "b" + i,
        sender: "bot",
        text: q
      });
      if (answers[SCRIPT[i].key] !== undefined) bubbles.push({
        id: "u" + i,
        sender: "user",
        text: answers[SCRIPT[i].key]
      });
    }
    if (done) {
      bubbles.push({
        id: "insight",
        sender: "bot",
        text: INSIGHT
      });
      bubbles.push({
        id: "final",
        sender: "bot",
        text: FINAL
      });
    }
    const cur = done ? null : SCRIPT[stage];
    const pct = Math.round(Math.min(stage, SCRIPT.length) / SCRIPT.length * 100);
    return /*#__PURE__*/React.createElement("div", {
      className: "chat-onb"
    }, /*#__PURE__*/React.createElement("div", {
      className: "chat-onb__head"
    }, /*#__PURE__*/React.createElement("div", {
      className: "chat-onb__avatar"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 20
    })), /*#__PURE__*/React.createElement("div", {
      className: "chat-onb__id"
    }, /*#__PURE__*/React.createElement("b", null, "CureMindset Companion"), /*#__PURE__*/React.createElement("span", null, typing ? "מקליד…" : "כאן איתך, ברגע הזה")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "chat-onb__exit",
      onClick: onExit,
      "aria-label": "\u05D7\u05D6\u05E8\u05D4 \u05DC\u05D0\u05EA\u05E8"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 18
    }))), /*#__PURE__*/React.createElement("div", {
      className: "chat-onb__bar"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: pct + "%"
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "chat-onb__scroll",
      ref: scrollRef
    }, bubbles.map(b => /*#__PURE__*/React.createElement("div", {
      key: b.id,
      className: `chat-bub chat-bub--${b.sender}`
    }, b.text)), typing && /*#__PURE__*/React.createElement("div", {
      className: "chat-bub chat-bub--bot chat-bub--typing"
    }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null))), /*#__PURE__*/React.createElement("div", {
      className: "chat-onb__foot"
    }, done ? /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "chat-onb__cta",
      onClick: finish
    }, "\u05DC\u05D4\u05E8\u05E9\u05DE\u05D4 \u05D5\u05E7\u05D1\u05DC\u05EA \u05D4\u05EA\u05D5\u05DB\u05E0\u05D9\u05EA \u05D4\u05D0\u05D9\u05E9\u05D9\u05EA") : cur.type === "text" ? /*#__PURE__*/React.createElement("form", {
      className: "chat-onb__inrow",
      onSubmit: e => {
        e.preventDefault();
        answer(text);
      }
    }, /*#__PURE__*/React.createElement("input", {
      className: "chat-onb__input",
      value: text,
      onChange: e => setText(e.target.value),
      placeholder: cur.ph,
      autoFocus: true,
      maxLength: 40
    }), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "chat-onb__send",
      disabled: !text.trim(),
      "aria-label": "\u05E9\u05DC\u05D9\u05D7\u05D4"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "arrow-left",
      size: 18
    }))) : /*#__PURE__*/React.createElement("div", {
      className: "chat-onb__opts"
    }, cur.opts.map(o => /*#__PURE__*/React.createElement("button", {
      type: "button",
      key: o,
      className: "chat-onb__opt",
      onClick: () => answer(o)
    }, o)))));
  }

  // שחזור סיסמה: מייל → קוד איפוס (במייל) → סיסמה חדשה.
  function ForgotPassword({
    onBack,
    initialEmail
  }) {
    const [step, setStep] = useState("request"); // request | reset | done
    const [email, setEmail] = useState(initialEmail || "");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("idle");
    const [err, setErr] = useState("");
    function request(e) {
      if (e) e.preventDefault();
      if (!email.trim()) return;
      setStatus("loading");
      setErr("");
      fetch("/api/auth/forgot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim()
        })
      }).then(() => {
        setStatus("idle");
        setStep("reset");
      }).catch(() => {
        setStatus("idle");
        setStep("reset");
      });
    }
    function reset(e) {
      if (e) e.preventDefault();
      if (code.trim().length < 4 || password.length < 6) {
        setErr("הזיני קוד וסיסמה בת 6 תווים לפחות");
        return;
      }
      setStatus("loading");
      setErr("");
      fetch("/api/auth/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          password
        })
      }).then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "שגיאה");
        setStep("done");
      }).catch(e2 => {
        setStatus("idle");
        setErr(e2.message);
      });
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "au-card",
      style: {
        gridTemplateColumns: "1fr"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "au-form-col"
    }, /*#__PURE__*/React.createElement("div", {
      className: "au-form-col__head"
    }, /*#__PURE__*/React.createElement("h3", null, step === "done" ? "הסיסמה עודכנה " : "שחזור סיסמה"), /*#__PURE__*/React.createElement("p", null, step === "request" ? "נשלח לך קוד איפוס למייל." : step === "reset" ? "הזיני את הקוד שקיבלת במייל וסיסמה חדשה." : "מעכשיו אפשר להתחבר עם הסיסמה החדשה.")), step === "request" ? /*#__PURE__*/React.createElement("form", {
      className: "au-form",
      onSubmit: request
    }, /*#__PURE__*/React.createElement("input", {
      className: "au-input",
      type: "email",
      dir: "ltr",
      placeholder: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D4\u05DE\u05D9\u05D9\u05DC \u05E9\u05DC\u05DA",
      value: email,
      onChange: e => setEmail(e.target.value),
      required: true,
      style: {
        textAlign: "right"
      }
    }), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "au-submit",
      disabled: status === "loading" || !email.trim()
    }, status === "loading" ? "רק רגע..." : "שליחת קוד איפוס")) : step === "reset" ? /*#__PURE__*/React.createElement("form", {
      className: "au-form",
      onSubmit: reset
    }, /*#__PURE__*/React.createElement("input", {
      className: "au-input",
      dir: "ltr",
      placeholder: "\u05E7\u05D5\u05D3 \u05D1\u05DF 6 \u05E1\u05E4\u05E8\u05D5\u05EA",
      value: code,
      onChange: e => setCode(e.target.value),
      required: true,
      style: {
        textAlign: "center",
        letterSpacing: "0.3em"
      }
    }), /*#__PURE__*/React.createElement("input", {
      className: "au-input",
      type: "password",
      placeholder: "\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D7\u05D3\u05E9\u05D4 (6+ \u05EA\u05D5\u05D5\u05D9\u05DD)",
      value: password,
      onChange: e => setPassword(e.target.value),
      required: true
    }), err ? /*#__PURE__*/React.createElement("p", {
      className: "au-err"
    }, err) : null, /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "au-submit",
      disabled: status === "loading"
    }, status === "loading" ? "רק רגע..." : "עדכון סיסמה"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "au-back",
      onClick: () => setStep("request")
    }, "\u05DC\u05D0 \u05E7\u05D9\u05D1\u05DC\u05EA\u05D9 \u05E7\u05D5\u05D3 \u2014 \u05E9\u05DC\u05D9\u05D7\u05D4 \u05DE\u05D7\u05D3\u05E9")) : /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "au-submit",
      onClick: onBack
    }, "\u05DC\u05DB\u05E0\u05D9\u05E1\u05D4 \u05E2\u05DD \u05D4\u05E1\u05D9\u05E1\u05DE\u05D4 \u05D4\u05D7\u05D3\u05E9\u05D4"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "au-back",
      onClick: onBack
    }, "\u05D7\u05D6\u05E8\u05D4 \u05DC\u05DB\u05E0\u05D9\u05E1\u05D4")));
  }
  function AuthGate({
    onAuthed,
    onExit
  }) {
    const [mode, setMode] = useState("register"); // register | login
    const [form, setForm] = useState({
      fullName: "",
      email: "",
      phone: "",
      password: ""
    });
    const [status, setStatus] = useState("idle"); // idle | loading | error
    const [errorMsg, setErrorMsg] = useState("");
    const [agreed, setAgreed] = useState(false); // הסכמה לתנאים (חובה בהרשמה)
    const [showTerms, setShowTerms] = useState(false); // מודל תנאים מלאים
    const [step, setStep] = useState("form"); // form | otp
    const [otp, setOtp] = useState({
      email: "",
      phoneHint: "",
      code: ""
    });
    const [resent, setResent] = useState(false);
    const [onbDone, setOnbDone] = useState(false); // האם סיימו את שאלון האבחון
    const [onbSummary, setOnbSummary] = useState(""); // תשובות האבחון לשמירה בכרטיס
    const [postRegQuiz, setPostRegQuiz] = useState(false); // (deprecated) שאלון אחרי הרשמה
    // סגנון Curable/Tony: שאלון קצר *לפני* ההרשמה, שמסתיים בהמלצת מסלול מותאם.
    const [preQuiz, setPreQuiz] = useState(true);
    const [recPlan, setRecPlan] = useState(null); // המסלול המומלץ לפי תשובות השאלון

    function update(field, value) {
      setForm(f => ({
        ...f,
        [field]: value
      }));
      if (status === "error") setStatus("idle");
    }

    // ממפה את תשובות השאלון להמלצת מסלול (הסבר קצר ללקוח לפני ההרשמה).
    // המסלול היחיד שקיים בפועל הוא הליווי הדיגיטלי (server/db.js) — שם המסלול
    // כאן תיאורי בלבד, בלי מחיר מפורסם; המחיר האמיתי מוצג רק במסך התשלום עצמו.
    function recommendFromSummary(summary) {
      const s = String(summary || "");
      if (/ביקורת עצמית|פרפקציוניזם|ספק עצמי|חוסר שקט/.test(s)) return {
        name: "המרחב האישי",
        why: "תהליך מלא לחיזוק דימוי עצמי, ביטחון ושקט פנימי"
      };
      if (/עומס|הצפה|תקיעות|עמידה במקום/.test(s)) return {
        name: "המרחב האישי",
        why: "כל המודולים + מעקב וניתוח דפוסים לוויסות ולחוסן"
      };
      if (/חרדת ביצוע|כישלון|דחיינות/.test(s)) return {
        name: "המרחב האישי",
        why: "צ'אט, מודולים ועוגן לרגעי עומס — בקצב שלך"
      };
      return {
        name: "המרחב האישי",
        why: "המסלול המאוזן — תהליך מלא בקצב שלך"
      };
    }
    function finishAuth(data) {
      setAuth(data.token, data.fullName);
      // השאלון רץ עכשיו *לפני* ההרשמה (preQuiz), אז נכנסים ישר למערכת.
      // גיבוי: אם משום מה לא נעשה שאלון — עדיין נציג אותו אחרי ההרשמה.
      if (mode === "register" && !onbDone) setPostRegQuiz(true);else onAuthed();
    }
    function submit(e) {
      e.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? {
        ...form,
        ref: getRef(),
        onboarding: onbSummary
      } : {
        email: form.email,
        password: form.password
      };
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "משהו השתבש, נסי שוב");
        if (data.needsOtp) {
          // נדרש אימות טלפון — עוברים למסך הזנת הקוד.
          setOtp({
            email: data.email,
            phoneHint: data.phoneHint || "",
            code: ""
          });
          setStep("otp");
          setStatus("idle");
          return;
        }
        finishAuth(data);
      }).catch(err => {
        setStatus("error");
        setErrorMsg(err.message);
      });
    }
    function submitOtp(e) {
      e.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: otp.email,
          code: otp.code
        })
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "קוד שגוי, נסי שוב");
        finishAuth(data);
      }).catch(err => {
        setStatus("error");
        setErrorMsg(err.message);
      });
    }
    function resendOtp() {
      setResent(false);
      fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: otp.email
        })
      }).then(async r => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || "שליחה נכשלה");
        }
        setResent(true);
      }).catch(err => {
        setStatus("error");
        setErrorMsg(err.message);
      });
    }
    const isReg = mode === "register";

    // ── שאלון קצר *לפני* ההרשמה (סגנון Curable/Tony) — מסתיים בהמלצת מסלול, ואז הטופס ──
    if (isReg && preQuiz && !onbDone) {
      return /*#__PURE__*/React.createElement("div", {
        className: "au-overlay"
      }, /*#__PURE__*/React.createElement(OnboardingQuiz, {
        onExit: () => {
          setPreQuiz(false);
          setOnbDone(true);
        },
        onComplete: (summary, name) => {
          setOnbSummary(summary || "");
          if (name) update("fullName", name);
          setRecPlan(recommendFromSummary(summary));
          setOnbDone(true);
          setPreQuiz(false);
        }
      }));
    }

    // ── (גיבוי) שאלון אחרי יצירת החשבון — אם השאלון המקדים דולג ──
    if (postRegQuiz) {
      return /*#__PURE__*/React.createElement("div", {
        className: "au-overlay"
      }, /*#__PURE__*/React.createElement(OnboardingQuiz, {
        onExit: () => onAuthed(),
        onComplete: summary => {
          // המשתמש כבר מחובר — שומרים את השאלון בשרת ונכנסים למערכת.
          if (summary) {
            fetch("/api/onboarding", {
              method: "POST",
              headers: authHeaders({
                "Content-Type": "application/json"
              }),
              body: JSON.stringify({
                onboarding: summary
              })
            }).catch(() => {});
          }
          onAuthed();
        }
      }));
    }

    // ── שחזור סיסמה ──
    if (mode === "forgot") {
      return /*#__PURE__*/React.createElement("div", {
        className: "au-overlay"
      }, /*#__PURE__*/React.createElement(ForgotPassword, {
        initialEmail: form.email,
        onBack: () => {
          setMode("login");
          setStatus("idle");
        }
      }));
    }

    // ── מסך אימות טלפון (OTP) ──
    if (step === "otp") {
      return /*#__PURE__*/React.createElement("div", {
        className: "au-overlay"
      }, /*#__PURE__*/React.createElement("div", {
        className: "au-card",
        style: {
          gridTemplateColumns: "1fr"
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "au-form-col"
      }, /*#__PURE__*/React.createElement("div", {
        className: "au-form-col__head",
        style: {
          textAlign: "center"
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "au-brand__logo",
        style: {
          margin: "0 auto 14px"
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "message-circle",
        size: 26
      })), /*#__PURE__*/React.createElement("h3", null, "\u05D0\u05D9\u05DE\u05D5\u05EA \u05DE\u05E1\u05E4\u05E8 \u05D4\u05D8\u05DC\u05E4\u05D5\u05DF"), /*#__PURE__*/React.createElement("p", null, "\u05E9\u05DC\u05D7\u05E0\u05D5 \u05E7\u05D5\u05D3 \u05D1\u05DF 6 \u05E1\u05E4\u05E8\u05D5\u05EA \u05D1-SMS", otp.phoneHint ? /*#__PURE__*/React.createElement(React.Fragment, null, " \u05DC\u05DE\u05E1\u05E4\u05E8 \u05E9\u05DE\u05E1\u05EA\u05D9\u05D9\u05DD \u05D1-", /*#__PURE__*/React.createElement("b", {
        dir: "ltr"
      }, otp.phoneHint)) : null, ". \u05D4\u05D6\u05D9\u05E0\u05D9 \u05D0\u05D5\u05EA\u05D5 \u05DB\u05D0\u05DF \u05DC\u05D4\u05E9\u05DC\u05DE\u05EA \u05D4\u05D4\u05E8\u05E9\u05DE\u05D4.")), /*#__PURE__*/React.createElement("form", {
        onSubmit: submitOtp,
        className: "au-form"
      }, /*#__PURE__*/React.createElement("input", {
        type: "text",
        inputMode: "numeric",
        autoComplete: "one-time-code",
        required: true,
        value: otp.code,
        onChange: e => {
          setOtp(o => ({
            ...o,
            code: e.target.value.replace(/\D/g, "").slice(0, 6)
          }));
          if (status === "error") setStatus("idle");
        },
        placeholder: "\u25CF \u25CF \u25CF \u25CF \u25CF \u25CF",
        className: "au-input",
        style: {
          textAlign: "center",
          letterSpacing: "0.5em",
          fontSize: "22px",
          fontWeight: 700,
          direction: "ltr"
        }
      }), status === "error" && /*#__PURE__*/React.createElement("p", {
        className: "au-err"
      }, errorMsg), resent && /*#__PURE__*/React.createElement("p", {
        style: {
          color: "#6f9268",
          fontSize: "13.5px",
          fontWeight: 600,
          textAlign: "center",
          margin: 0
        }
      }, "\u05E0\u05E9\u05DC\u05D7 \u05E7\u05D5\u05D3 \u05D7\u05D3\u05E9 \u2713"), /*#__PURE__*/React.createElement("button", {
        type: "submit",
        className: "au-submit",
        disabled: status === "loading" || otp.code.length < 4
      }, status === "loading" ? "מאמת…" : "אימות והמשך")), /*#__PURE__*/React.createElement("p", {
        className: "au-switch"
      }, "\u05DC\u05D0 \u05E7\u05D9\u05D1\u05DC\u05EA \u05E7\u05D5\u05D3?", " ", /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: resendOtp
      }, "\u05E9\u05DC\u05D9\u05D7\u05D4 \u05D7\u05D5\u05D6\u05E8\u05EA")), /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => {
          setStep("form");
          setStatus("idle");
        },
        className: "au-back"
      }, "\u05D8\u05E2\u05D5\u05EA \u05D1\u05DE\u05E1\u05E4\u05E8? \u05D7\u05D6\u05E8\u05D4"))));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "au-overlay"
    }, /*#__PURE__*/React.createElement("div", {
      className: "au-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "au-form-col"
    }, /*#__PURE__*/React.createElement("div", {
      className: "au-form-col__head"
    }, /*#__PURE__*/React.createElement("h3", null, isReg ? "בוא/י נתחיל את פריצת הדרך שלך " : "כניסה לאזור האישי"), /*#__PURE__*/React.createElement("p", null, isReg ? "מרחב אישי ומאובטח להתנסות ולצמיחה, בלי התחייבות. הפרטים שלך נשמרים בפרטיות מלאה." : "טוב לראות אותך שוב. התחברי כדי להמשיך מהמקום שעצרת.")), isReg && recPlan && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#f7ecd5",
        border: "1px solid #e4cfa0",
        borderRadius: 14,
        padding: "12px 14px",
        margin: "0 0 14px",
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 16,
      className: "text-gold-600"
    }), /*#__PURE__*/React.createElement("b", {
      style: {
        color: "#8a6a1e",
        fontSize: 14
      }
    }, "\u05D4\u05DE\u05E1\u05DC\u05D5\u05DC \u05E9\u05DE\u05EA\u05D0\u05D9\u05DD \u05DC\u05DA: ", recPlan.name)), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12.5,
        color: "#6b5726",
        margin: 0,
        lineHeight: 1.5
      }
    }, recPlan.why, ".")), /*#__PURE__*/React.createElement("form", {
      onSubmit: submit,
      className: "au-form"
    }, isReg && /*#__PURE__*/React.createElement("input", {
      type: "text",
      name: "name",
      autoComplete: "name",
      required: true,
      value: form.fullName,
      onChange: e => update("fullName", e.target.value),
      placeholder: "\u05D0\u05D9\u05DA \u05E7\u05D5\u05E8\u05D0\u05D9\u05DD \u05DC\u05DA?",
      className: "au-input"
    }), /*#__PURE__*/React.createElement("input", {
      type: "email",
      name: "email",
      autoComplete: "email",
      required: true,
      value: form.email,
      onChange: e => update("email", e.target.value),
      placeholder: isReg ? "לאן לשלוח את מפת הדרכים האישית שלך?" : "כתובת מייל",
      dir: "ltr",
      className: "au-input",
      style: {
        textAlign: "right"
      }
    }), isReg && /*#__PURE__*/React.createElement("input", {
      type: "tel",
      name: "tel",
      autoComplete: "tel",
      required: true,
      value: form.phone,
      onChange: e => update("phone", e.target.value),
      placeholder: "\u05D8\u05DC\u05E4\u05D5\u05DF \u05E0\u05D9\u05D9\u05D3 (\u05DC\u05E9\u05DC\u05D9\u05D7\u05EA \u05E7\u05D5\u05D3 \u05D0\u05D1\u05D8\u05D7\u05D4)",
      dir: "ltr",
      className: "au-input",
      style: {
        textAlign: "right"
      }
    }), /*#__PURE__*/React.createElement("input", {
      type: "password",
      name: "password",
      autoComplete: isReg ? "new-password" : "current-password",
      required: true,
      value: form.password,
      onChange: e => update("password", e.target.value),
      placeholder: isReg ? "מפתח אישי למרחב השקט שלך (6+ תווים)" : "הסיסמה שלך",
      className: "au-input"
    }), isReg && /*#__PURE__*/React.createElement("label", {
      className: "au-consent"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: agreed,
      onChange: e => setAgreed(e.target.checked)
    }), /*#__PURE__*/React.createElement("span", {
      className: "au-consent__txt"
    }, "\u05E0\u05E8\u05E9\u05DE/\u05EA \u05D5\u05DE\u05D0\u05E9\u05E8/\u05EA \u05D0\u05EA \u05EA\u05E0\u05D0\u05D9 \u05D4\u05E9\u05D9\u05DE\u05D5\u05E9 \u05D5\u05D4\u05E6\u05D4\u05E8\u05EA \u05D4-AI (\u05D4\u05E9\u05D9\u05E8\u05D5\u05EA \u05D0\u05D9\u05E0\u05D5 \u05DE\u05D4\u05D5\u05D5\u05D4 \u05D9\u05D9\u05E2\u05D5\u05E5 \u05E8\u05E4\u05D5\u05D0\u05D9, \u05D5\u05DE\u05E9\u05DC\u05D9\u05DD \u05D8\u05D9\u05E4\u05D5\u05DC \u05E8\u05D2\u05E9\u05D9 \u05D0\u05D5 \u05E0\u05E4\u05E9\u05D9 \u05E7\u05D9\u05D9\u05DD \u05D5\u05DC\u05D0 \u05DE\u05D7\u05DC\u05D9\u05E3 \u05D0\u05D5\u05EA\u05D5 \u2014 \u05D4\u05D4\u05E9\u05EA\u05EA\u05E4\u05D5\u05EA \u05E2\u05DC \u05D0\u05D7\u05E8\u05D9\u05D5\u05EA\u05D9).", " ", /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "au-terms-link",
      onClick: () => setShowTerms(true)
    }, "\u05DC\u05E6\u05E4\u05D9\u05D9\u05D4 \u05D1\u05EA\u05E0\u05D0\u05D9\u05DD \u05D4\u05DE\u05DC\u05D0\u05D9\u05DD"))), status === "error" && /*#__PURE__*/React.createElement("p", {
      className: "au-err"
    }, errorMsg), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "au-submit",
      disabled: status === "loading" || isReg && !agreed
    }, status === "loading" ? "רק רגע..." : isReg ? "מתחילים את פריצת הדרך" : "כניסה")), /*#__PURE__*/React.createElement(SocialLogin, null), /*#__PURE__*/React.createElement("p", {
      className: "au-switch"
    }, isReg ? "כבר יש לך חשבון? " : "עדיין אין לך חשבון? ", /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => {
        setMode(isReg ? "login" : "register");
        setStatus("idle");
      }
    }, isReg ? "להתחברות" : "להרשמה")), !isReg && /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "au-back",
      onClick: () => {
        setMode("forgot");
        setStatus("idle");
      }
    }, "\u05E9\u05DB\u05D7\u05EA \u05E1\u05D9\u05E1\u05DE\u05D4?"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onExit,
      className: "au-back"
    }, "\u05D7\u05D6\u05E8\u05D4 \u05DC\u05D0\u05EA\u05E8")), /*#__PURE__*/React.createElement("div", {
      className: "au-brand"
    }, /*#__PURE__*/React.createElement("svg", {
      className: "au-brand__rose",
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
      r: "60"
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
    })), /*#__PURE__*/React.createElement("div", {
      className: "au-brand__logo"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "heart-handshake",
      size: 26
    })), /*#__PURE__*/React.createElement("h2", null, isReg ? "ברוכה הבאה ל־CureMindset" : "המרחב האישי שלך מחכה לך"), /*#__PURE__*/React.createElement("p", {
      className: "au-brand__sub"
    }, "\u05D4\u05D0\u05D6\u05D5\u05E8 \u05D4\u05D0\u05D9\u05E9\u05D9 \u05E9\u05DC\u05DA \u2014 \u05DE\u05E8\u05D7\u05D1 \u05D1\u05D8\u05D5\u05D7 \u05D5\u05DE\u05D5\u05E6\u05E4\u05DF \u05DC\u05EA\u05E8\u05D2\u05D5\u05DC, \u05DC\u05E6\u05DE\u05D9\u05D7\u05D4 \u05D5\u05DC\u05EA\u05D4\u05DC\u05D9\u05DA \u05D4\u05E4\u05E0\u05D9\u05DE\u05D9, \u05D1\u05DC\u05D9\u05D5\u05D5\u05D9 \u05DE\u05D1\u05D5\u05E1\u05E1 \u05D4\u05E9\u05D9\u05D8\u05D4 \u05E9\u05DC \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1."), /*#__PURE__*/React.createElement("ul", {
      className: "au-benefits"
    }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "au-tick"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle-2",
      size: 14
    })), "\u05DE\u05E8\u05D7\u05D1 \u05DC\u05D4\u05EA\u05E0\u05E1\u05D5\u05EA \u05D5\u05DC\u05E6\u05DE\u05D9\u05D7\u05D4, \u05D1\u05DC\u05D9 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA"), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "au-tick"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle-2",
      size: 14
    })), "\u05E9\u05D9\u05D7\u05D5\u05EA \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA \u05D5\u05DE\u05D5\u05E6\u05E4\u05E0\u05D5\u05EA \u2014 \u05E8\u05E7 \u05D0\u05EA \u05E8\u05D5\u05D0\u05D4 \u05D0\u05D5\u05EA\u05DF"), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
      className: "au-tick"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check-circle-2",
      size: 14
    })), "\u05DC\u05D9\u05D5\u05D5\u05D9 AI \u05DE\u05D1\u05D5\u05E1\u05E1 \u05D4\u05E9\u05D9\u05D8\u05D4 \u05D5\u05D4\u05EA\u05DB\u05E0\u05D9\u05DD \u05E9\u05DC \u05E7\u05D8\u05D9")), /*#__PURE__*/React.createElement("p", {
      className: "au-brand__trust"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield-check",
      size: 14
    }), " \u05D4\u05E4\u05E8\u05D8\u05D9\u05DD \u05E9\u05DC\u05DA \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7\u05D9\u05DD \u05D5\u05DE\u05D5\u05E6\u05E4\u05E0\u05D9\u05DD"))), showTerms && /*#__PURE__*/React.createElement("div", {
      className: "au-modal-bg",
      onClick: () => setShowTerms(false)
    }, /*#__PURE__*/React.createElement("div", {
      className: "au-modal",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("h4", null, "\u05EA\u05E0\u05D0\u05D9 \u05E9\u05D9\u05DE\u05D5\u05E9, \u05D4\u05E6\u05D4\u05E8\u05EA AI \u05D5\u05D0\u05D9\u05BE\u05D9\u05D9\u05E2\u05D5\u05E5 \u05E8\u05E4\u05D5\u05D0\u05D9"), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "1. \u05DE\u05D4\u05D5\u05EA \u05D4\u05E9\u05D9\u05E8\u05D5\u05EA \u05D5\u05D0\u05D9\u05E0\u05D8\u05E8\u05D0\u05E7\u05E6\u05D9\u05D9\u05EA AI:"), " \u05DE\u05E2\u05E8\u05DB\u05EA \u05D6\u05D5 \u05DE\u05D5\u05E4\u05E2\u05DC\u05EA \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA \u05D1\u05D9\u05E0\u05D4 \u05DE\u05DC\u05D0\u05DB\u05D5\u05EA\u05D9\u05EA (AI) \u05E2\u05DC \u05D1\u05E1\u05D9\u05E1 \u05DE\u05D5\u05D3\u05DC \u05D4\u05EA\u05D5\u05DB\u05DF \u05D4\u05DE\u05E7\u05E6\u05D5\u05E2\u05D9 \u05E9\u05DC \u05E7\u05D8\u05D9 \u05E9\u05D2\u05D1. \u05D4\u05DE\u05E2\u05E8\u05DB\u05EA \u05E4\u05D5\u05E2\u05DC\u05EA \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA \u05D5\u05E2\u05DC\u05D5\u05DC\u05D4 \u05DC\u05D4\u05E6\u05D9\u05D2 \u05DE\u05D9\u05D3\u05E2 \u05DC\u05D0 \u05DE\u05D3\u05D5\u05D9\u05E7.")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "2. \u05D0\u05D9\u05BE\u05D7\u05DC\u05D5\u05E4\u05D4 \u05DC\u05D9\u05D9\u05E2\u05D5\u05E5 \u05E8\u05E4\u05D5\u05D0\u05D9:"), " \u05D4\u05EA\u05DB\u05E0\u05D9\u05DD \u05D5\u05D4\u05EA\u05E8\u05D2\u05D9\u05DC\u05D9\u05DD \u05D0\u05D9\u05E0\u05DD \u05DE\u05D4\u05D5\u05D5\u05D9\u05DD \u05D9\u05D9\u05E2\u05D5\u05E5 \u05E8\u05E4\u05D5\u05D0\u05D9, \u05D0\u05D1\u05D7\u05E0\u05D4 \u05D0\u05D5 \u05D8\u05D9\u05E4\u05D5\u05DC \u05E0\u05E4\u05E9\u05D9/\u05E4\u05E1\u05D9\u05DB\u05D9\u05D0\u05D8\u05E8\u05D9, \u05D5\u05D0\u05D9\u05E0\u05DD \u05DE\u05D7\u05DC\u05D9\u05E4\u05D9\u05DD \u05D4\u05EA\u05D9\u05D9\u05E2\u05E6\u05D5\u05EA \u05E2\u05DD \u05E8\u05D5\u05E4\u05D0 \u05D0\u05D5 \u05DE\u05D8\u05E4\u05DC \u05DE\u05D5\u05E1\u05DE\u05DA. \u05DE\u05D3\u05D5\u05D1\u05E8 \u05D1\u05EA\u05D4\u05DC\u05D9\u05DA \u05D0\u05D9\u05DE\u05D5\u05DF \u05E8\u05D2\u05E9\u05D9 \u05D3\u05E8\u05DA \u05E2\u05D1\u05D5\u05D3\u05D4 \u05E2\u05DD \u05D4\u05EA\u05EA-\u05DE\u05D5\u05D3\u05E2, \u05E9\u05E0\u05D1\u05D7\u05E8 \u05DE\u05E8\u05E6\u05D5\u05DF \u05D5\u05DE\u05D9\u05D5\u05E2\u05D3 \u05DC\u05D4\u05E9\u05DC\u05D9\u05DD \u05D8\u05D9\u05E4\u05D5\u05DC \u05E8\u05D2\u05E9\u05D9 \u05D0\u05D5 \u05E0\u05E4\u05E9\u05D9 \u05E7\u05D9\u05D9\u05DD \u2014 \u05DC\u05D0 \u05DC\u05D4\u05D7\u05DC\u05D9\u05E3 \u05D0\u05D5\u05EA\u05D5. \u05D4\u05E9\u05D9\u05DE\u05D5\u05E9 \u05D5\u05D4\u05D4\u05E9\u05EA\u05EA\u05E4\u05D5\u05EA \u05D1\u05EA\u05D4\u05DC\u05D9\u05DA \u05D4\u05DD \u05D1\u05D0\u05D7\u05E8\u05D9\u05D5\u05EA \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9/\u05EA \u05D1\u05DC\u05D1\u05D3. \u05D1\u05DB\u05DC \u05DE\u05E6\u05D5\u05E7\u05D4 \u05D9\u05E9 \u05DC\u05E4\u05E0\u05D5\u05EA \u05DC\u05D2\u05D5\u05E8\u05DD \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9 \u05DE\u05D5\u05E1\u05DE\u05DA.")), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "3. \u05E4\u05E8\u05D8\u05D9\u05D5\u05EA:"), " \u05E0\u05EA\u05D5\u05E0\u05D9 \u05D4\u05E8\u05D9\u05E9\u05D5\u05DD \u05E0\u05E9\u05DE\u05E8\u05D9\u05DD \u05D1\u05D1\u05E1\u05D9\u05E1 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7, \u05D5\u05EA\u05D5\u05DB\u05DF \u05D4\u05E9\u05D9\u05D7\u05D4 \u05DE\u05E2\u05D5\u05D1\u05D3 \u05D1\u05D0\u05D5\u05E4\u05DF \u05DE\u05D0\u05D5\u05D1\u05D8\u05D7 \u05DC\u05E6\u05D5\u05E8\u05DA \u05DE\u05EA\u05DF \u05D4\u05DE\u05E2\u05E0\u05D4 \u05D1\u05DC\u05D1\u05D3.")), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "au-modal__close",
      onClick: () => setShowTerms(false)
    }, "\u05D4\u05D1\u05E0\u05EA\u05D9, \u05E1\u05D2\u05D9\u05E8\u05D4"))));
  }

  /* ---------------------------------------------------------------- */
  /* Stage 8 — Structured program: CURE MINDSET guided journey */
  /* ---------------------------------------------------------------- */

  const PROGRAM_GATES = [{
    gate: "שער 1 · ימים 1–3",
    title: "חוסן רגשי ועוגן",
    paidRequired: false,
    days: [{
      day: 1,
      title: "מד העומס הפנימי",
      focus: "לזהות איפה בגוף יושב העומס ומה עוצמתו.",
      practice: "שלוש נשימות עמוקות + יד על הלב — בוקר וערב."
    }, {
      day: 2,
      title: "העוגן האישי שלך",
      focus: "לבחור מילה או תחושה שמחזירה רוגע ברגע קשה.",
      practice: "להפעיל את העוגן פעם אחת ביום קושי."
    }, {
      day: 3,
      title: "עצירה לפני תגובה",
      focus: "לשים רווח קטן בין הטריגר לבין התגובה.",
      practice: "לפני שמגיבים — לעצור, לנשום, להפעיל עוגן."
    }]
  }, {
    gate: "שער 2 · ימים 4–7",
    title: "דימוי עצמי",
    paidRequired: true,
    days: [{
      day: 4,
      title: "זיהוי האמונה המגבילה",
      focus: "לתפוס את המשפט הביקורתי שחוזר על עצמו.",
      practice: "לכתוב משפט אחד של ביקורת עצמית שעלה היום."
    }, {
      day: 5,
      title: "מאיפה זה הגיע?",
      focus: "לחקור בעדינות מתי נולדה האמונה הזו.",
      practice: "לשאול את עצמך: מתי למדתי לחשוב ככה?"
    }, {
      day: 6,
      title: "מסגור מחדש",
      focus: "להפוך \"אני לא מסוגל\" ל\"עדיין לא מצאתי איך\".",
      practice: "לנסח מחדש משפט מגביל אחד."
    }, {
      day: 7,
      title: "יומן ניצחונות",
      focus: "לאסוף ראיות שסותרות את האמונה הישנה.",
      practice: "לכתוב ניצחון קטן אחד מהיום."
    }]
  }, {
    gate: "שער 3 · ימים 8–11",
    title: "שחרור חסמים וחמלה",
    paidRequired: true,
    days: [{
      day: 8,
      title: "הפרדה מהדפוס",
      focus: "לראות את הקושי מבחוץ, כמו צופה בסרט.",
      practice: "לתאר את הקושי בגוף שלישי, במשפט אחד."
    }, {
      day: 9,
      title: "חמלה עצמית",
      focus: "לדבר לעצמך כמו לחבר טוב, לא כמו שופט.",
      practice: "משפט חמלה אחד לעצמך היום."
    }, {
      day: 10,
      title: "שחרור מהצורך באישור",
      focus: "למקד ב\"איך אני מרגיש\" במקום \"מה חושבים עליי\".",
      practice: "לעשות פעולה קטנה אחת בלי לבקש אישור."
    }, {
      day: 11,
      title: "גבולות רכים",
      focus: "להגיד \"לא\" בלי אשמה מיותרת.",
      practice: "לתרגל \"לא\" קטן ומכבד אחד."
    }]
  }, {
    gate: "שער 4 · ימים 12–14",
    title: "עוגני עוצמה לחיים",
    paidRequired: true,
    days: [{
      day: 12,
      title: "עוגן ניצחונות",
      focus: "לעגן בגוף זיכרון של הצלחה אמיתית.",
      practice: "להיזכר בהצלחה + מגע יד, ולהחזיק 30 שניות."
    }, {
      day: 13,
      title: "חזון קדימה",
      focus: "לדמיין את הגרסה החזקה והשלווה שלך.",
      practice: "לכתוב משפט חזון אחד בהווה: \"אני...\"."
    }, {
      day: 14,
      title: "ארגז הכלים שלי",
      focus: "לסכם את הכלים שעבדו לך הכי טוב.",
      practice: "לבחור 3 כלים לחיים ולקבוע שיחת המשך."
    }]
  }];
  const PROGRAM_KEY = "cm_program_done";
  function loadProgramDone() {
    try {
      return JSON.parse(localStorage.getItem(PROGRAM_KEY)) || [];
    } catch {
      return [];
    }
  }

  // ספריית 12 התרגילים של CureMindset, מסודרת ל-3 השלבים. תוכן קבוע (לא נשמר בשרת).
  const CUREMINDSET_STAGES = [{
    key: 1,
    title: "ניצחון על חרדות ופחדים",
    sub: "שחרור העומס הרגשי",
    icon: "wind",
    exercises: [{
      title: "זיהוי שורש הפחד",
      type: "כתיבה",
      min: 15,
      desc: "כתיבה חופשית לאיתור טריגרים ותחושות גופניות — מה מפעיל את הפחד ואיפה הוא יושב בגוף."
    }, {
      title: "מדיטציית הרפיה ונשימה",
      type: "מדיטציה",
      min: 10,
      desc: "נשימה 4-4-6 (שאיפה 4, החזקה 4, נשיפה 6) להורדת עוררות מערכת העצבים."
    }, {
      title: "דמיון מודרך — מקום בטוח",
      type: "דמיון",
      min: 12,
      desc: "בניית מרחב פנימי בטוח לוויסות מיידי ברגעי הצפה."
    }, {
      title: "פירוק דפוסי תת-מודע",
      type: "CBT",
      min: 20,
      desc: "זיהוי דפוסים חוזרים והחלפתם באלטרנטיבות מיטיבות."
    }]
  }, {
    key: 2,
    title: "בניית דימוי עצמי מנצח",
    sub: "חיזוק הערך העצמי",
    icon: "star",
    exercises: [{
      title: "זיהוי אמונות מגבילות",
      type: "כתיבה",
      min: 15,
      desc: "רישום אמונות מגבילות ובחינתן מול המציאות."
    }, {
      title: "דיאלוג פנימי מיטיב",
      type: "CBT",
      min: 15,
      desc: "החלפת הקול הביקורתי הפנימי בקול תומך ומחזק."
    }, {
      title: "דמיון מודרך — העצמי העתידי",
      type: "דמיון",
      min: 15,
      desc: "התחברות לגרסה העתידית, החזקה והמעצימה של עצמך."
    }, {
      title: "התקנת עוגן ביטחון",
      type: "עיגון",
      min: 10,
      desc: "יצירת עוגן סומטי (מגע/תנוחה) שמפעיל ביטחון באופן מיידי."
    }]
  }, {
    key: 3,
    title: "כלים לחיים וחוסן רגשי",
    sub: "חוסן לטווח ארוך",
    icon: "trophy",
    exercises: [{
      title: "ויסות רגשי בזמן אמת",
      type: "CBT",
      min: 10,
      desc: "כלים מהירים להחזרה לאיזון תוך דקות ברגע של עומס."
    }, {
      title: "מדיטציית חוסן ויציבות",
      type: "מדיטציה",
      min: 15,
      desc: "הטמעת גישה למצבי משאב גבוהים — רוגע, ביטחון, עוצמה."
    }, {
      title: "יומן רגשות",
      type: "כתיבה",
      min: 10,
      desc: "כתיבה יומית לחיזוק מודעות רגשית ובחירה מודעת."
    }, {
      title: "תרגול עוגנים יומיומיים",
      type: "עיגון",
      min: 5,
      desc: "הפעלת העוגנים במצבי עומס אמיתיים בשגרה."
    }]
  }];

  // כפתור "האזנה" — ממיר טקסט לדיבור בעברית ישירות במכשיר (Web Speech API).
  // לא מייצר קובץ; משתמש בקול המובנה (למשל Carmit — קול אישה של אפל). חינמי ומיידי.
  function SpeakButton({
    text,
    label
  }) {
    const [speaking, setSpeaking] = useState(false);
    const supported = typeof window !== "undefined" && "speechSynthesis" in window;
    useEffect(() => () => {
      try {
        if (supported) window.speechSynthesis.cancel();
      } catch (e) {}
    }, []);
    function pickHebrewVoice() {
      const voices = window.speechSynthesis.getVoices() || [];
      const he = voices.filter(v => /(^|[^a-z])he|iw|hebrew|עברית/i.test(v.lang + " " + v.name));
      const female = he.find(v => /carmit|female|woman|נקבה/i.test(v.name));
      return female || he[0] || null;
    }
    function toggle() {
      if (!supported) return;
      const synth = window.speechSynthesis;
      if (speaking) {
        synth.cancel();
        setSpeaking(false);
        return;
      }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text || ""));
      u.lang = "he-IL";
      const v = pickHebrewVoice();
      if (v) u.voice = v;
      u.rate = 0.94;
      u.pitch = 1.06;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(u);
    }
    if (!supported) return null;
    return /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: toggle,
      className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-heading font-semibold text-[12px] transition-colors ${speaking ? "bg-gold-500 text-white" : "border border-gold-200 text-gold-700 hover:bg-gold-50"}`,
      "aria-label": speaking ? "עצירת ההאזנה" : "האזנה לתוכן"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: speaking ? "pause" : "headphones",
      size: 13
    }), " ", speaking ? "עצירה" : label || "האזנה");
  }

  // מודול מודרך בסגנון Curable (Learn / Write / Calm) — מותאם לעולם הרגשי של CureMindset.
  // התוכן מבוסס על מסמך המלל של קטי, בהתאמה מ"כאב פיזי" ל"עומס רגשי / חרדה".
  const LEARN_TEXT = "דמייני שהמוח שלך הוא כמו מערכת התראה של בית. אחרי תקופה של מתח, חרדה או עומס רגשי — המערכת הפכה רגישה מדי. היא מצפצפת גם כשרוח קלה נושבת על החלון, גם כשאין באמת סכנה. המטרה שלנו ב-CureMindset היא לא לכבות את המערכת — היא נועדה להגן עלייך — אלא לכוון אותה מחדש, בעדינות, כך שתפעל רק כשצריך. ככל שתתרגלי, המערכת העצבית לומדת מחדש שהיא בטוחה, והעוצמה של החרדה יורדת.";
  function BreathingGuide() {
    const [on, setOn] = useState(false);
    const [phase, setPhase] = useState(0);
    useEffect(() => {
      if (!on) {
        setPhase(0);
        return;
      }
      const id = setInterval(() => setPhase(p => (p + 1) % 4), 4000);
      return () => clearInterval(id);
    }, [on]);
    const PHASES = [{
      label: "שאיפה",
      scale: 1.18
    }, {
      label: "החזקה",
      scale: 1.18
    }, {
      label: "נשיפה",
      scale: 0.72
    }, {
      label: "המתנה",
      scale: 0.72
    }];
    const cur = PHASES[phase];
    return /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col items-center gap-4"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 132,
        height: 132,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(circle, #f6ecd6, #e6cf9f)",
        border: "2px solid #c2974a",
        color: "#a9791f",
        fontFamily: "Rubik, sans-serif",
        fontWeight: 800,
        fontSize: 17,
        transform: `scale(${on ? cur.scale : 0.85})`,
        transition: "transform 3.7s ease-in-out"
      }
    }, on ? cur.label : "מוכנה?"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setOn(o => !o),
      className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[13px] hover:bg-gold-600 transition-colors"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: on ? "pause" : "play",
      size: 14
    }), " ", on ? "עצירה" : "נשימת קופסה · 4-4-4-4"));
  }

  // סדרת מודולים מודרכים (יום אחר יום), בסגנון Curable ובתוכן השיטה של קטי.
  const GUIDED_MODULES = [{
    id: 1,
    title: "להבין מה קורה בגוף",
    learnMin: 3,
    learn: LEARN_TEXT,
    write: "כתבי מכתב קצר לעומס הרגשי שלך. אל תנסי להיות נחמדה — תגידי לו מה הוא מונע ממך לעשות ואיך הוא גורם לך להרגיש. הוצאת הרגשות האלה על הנייר היא הצעד הראשון להורדת העומס מהמערכת העצבית.",
    writePh: "היקר/ה שלי, עומס...",
    calm: {
      type: "breath"
    }
  }, {
    id: 2,
    title: "העוגן שלך",
    learnMin: 3,
    learn: "לכל אחת מאיתנו יש רגע שבו הרגשנו בטוחות, חזקות, רגועות לגמרי — והגוף זוכר את זה. עוגן הוא דרך לחבר את התחושה הזו לתנועה קטנה, כמו לחיצה עדינה של האגודל והאצבע. ככה, ברגע של עומס או חרדה, במקום להיסחף — נוכל להפעיל את הרוגע והביטחון הזה בשנייה אחת. ככל שנתרגל, המוח לומד: התנועה הזו = בטוחה.",
    write: "כתבי על רגע אחד בחיים שבו הרגשת בטוחה ועוצמתית לגמרי. איפה היית? מה ראית, שמעת, והרגשת בגוף? ככל שתיכנסי לפרטים — העוגן יהיה חזק יותר.",
    writePh: "הרגע שבו הרגשתי חזקה היה...",
    calm: {
      type: "practice",
      text: "עצמי עיניים לרגע. חזרי אל הרגע שכתבת עליו — ראי אותו, שמעי אותו, הרגישי אותו בגוף. וכשהתחושה הכי חזקה — לחצי בעדינות אגודל ואצבע יחד, וספרי עד חמש. שחררי. כך העוגן שלך נטמע. חזרי על זה שלוש פעמים."
    }
  }, {
    id: 3,
    title: "הקול הפנימי המיטיב",
    learnMin: 4,
    learn: "יש בתוכנו קול שמבקר — 'לא מספיק טוב', 'לא אצליח', 'משהו לא בסדר איתי'. הקול הזה חושב שהוא מגן עלינו, אבל בפועל הוא מחליש. הבשורה: אפשר ללמד את המוח קול חדש — קול של חברה טובה. אותה חמלה, אותה עדינות שהיינו נותנות למישהי שאנחנו אוהבות — מגיעה גם לנו. זה לא מזייף; זה מאמן את המוח לדפוס חדש.",
    write: "כתבי משפט אחד שהקול המבקר אומר לך לאחרונה. ועכשיו — כתבי מה חברה טובה, שאוהבת אותך באמת, הייתה אומרת לך במקום.",
    writePh: "הקול המבקר אומר לי... / חברה טובה הייתה אומרת...",
    calm: {
      type: "practice",
      text: "הניחי יד על הלב. שלוש נשימות עמוקות ואיטיות. ועכשיו אמרי לעצמך, בקול רך ואוהב, את המשפט התומך שכתבת. שמעי אותו. תני לו להתיישב בגוף."
    }
  }];
  function GuidedModuleItem({
    mod,
    idx,
    open,
    onToggle
  }) {
    const NOTE_KEY = "cm_module" + mod.id + "_write";
    const [text, setText] = useState(() => {
      try {
        return localStorage.getItem(NOTE_KEY) || "";
      } catch (e) {
        return "";
      }
    });
    const [saved, setSaved] = useState(false);
    function save() {
      try {
        localStorage.setItem(NOTE_KEY, text);
      } catch (e) {}
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl border border-gold-200 bg-white overflow-hidden"
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: onToggle,
      "aria-expanded": open,
      className: "w-full flex items-center gap-3 px-5 py-4 text-right",
      style: {
        background: "linear-gradient(135deg,#c2974a,#a9791f)",
        color: "#fff"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 w-8 h-8 rounded-full bg-white/25 flex items-center justify-center font-heading font-extrabold text-[14px]"
    }, mod.id), /*#__PURE__*/React.createElement("span", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("span", {
      className: "block font-heading font-semibold text-[10.5px] tracking-[0.16em] opacity-90"
    }, "\u05DE\u05D5\u05D3\u05D5\u05DC ", mod.id, " \xB7 CURE MINDSET"), /*#__PURE__*/React.createElement("span", {
      className: "block font-heading font-extrabold text-[17px]"
    }, mod.title)), /*#__PURE__*/React.createElement("span", {
      className: "shrink-0",
      style: {
        transition: "transform.3s",
        transform: open ? "rotate(180deg)" : "none"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-down",
      size: 20
    }))), open ? /*#__PURE__*/React.createElement("div", {
      className: "p-5 space-y-6"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-heading font-bold text-[12px]"
    }, "1"), /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-bold text-[14.5px] text-ink-800"
    }, "\u05DC\u05DC\u05DE\u05D5\u05D3"), /*#__PURE__*/React.createElement("span", {
      className: "text-[11.5px] text-ink-400"
    }, "\xB7 \u05D0\u05D5\u05D3\u05D9\u05D5 \xB7 ", mod.learnMin, " \u05D3\u05E7\u05F3")), /*#__PURE__*/React.createElement("p", {
      className: "text-[13.5px] text-ink-600 leading-relaxed mb-2.5"
    }, mod.learn), /*#__PURE__*/React.createElement(SpeakButton, {
      text: mod.learn,
      label: "\u05D4\u05D0\u05D6\u05E0\u05D4 \u05DC\u05E9\u05D9\u05E2\u05D5\u05E8"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-heading font-bold text-[12px]"
    }, "2"), /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-bold text-[14.5px] text-ink-800"
    }, "\u05DC\u05DB\u05EA\u05D5\u05D1"), /*#__PURE__*/React.createElement("span", {
      className: "text-[11.5px] text-ink-400"
    }, "\xB7 5 \u05D3\u05E7\u05F3")), /*#__PURE__*/React.createElement("p", {
      className: "text-[13.5px] text-ink-600 leading-relaxed mb-2.5"
    }, mod.write), /*#__PURE__*/React.createElement("textarea", {
      value: text,
      onChange: e => setText(e.target.value),
      rows: 4,
      placeholder: mod.writePh,
      className: "w-full rounded-2xl border border-ink-200 px-3.5 py-2.5 text-[13px] text-ink-700 resize-none focus:outline-none focus:border-gold-300"
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: save,
      className: "mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[13px] hover:bg-gold-600 transition-colors"
    }, saved ? "נשמר " : "שמירה")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-heading font-bold text-[12px]"
    }, "3"), /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-bold text-[14.5px] text-ink-800"
    }, "\u05DC\u05D4\u05D9\u05E8\u05D2\u05E2"), /*#__PURE__*/React.createElement("span", {
      className: "text-[11.5px] text-ink-400"
    }, "\xB7 2 \u05D3\u05E7\u05F3")), mod.calm.type === "breath" ? /*#__PURE__*/React.createElement(BreathingGuide, null) : /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl bg-gold-50 border border-gold-200 px-4 py-3.5"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[13.5px] text-ink-700 leading-relaxed mb-2.5"
    }, mod.calm.text), /*#__PURE__*/React.createElement(SpeakButton, {
      text: mod.calm.text,
      label: "\u05D4\u05D0\u05D6\u05E0\u05D4 \u05DC\u05D4\u05E0\u05D7\u05D9\u05D4"
    })))) : null);
  }
  function GuidedModule() {
    const [openId, setOpenId] = useState(1);
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-3 mb-2"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      className: "font-heading font-bold text-[20px] text-ink-800"
    }, "\u05D4\u05DE\u05D5\u05D3\u05D5\u05DC\u05D9\u05DD \u05D4\u05DE\u05D5\u05D3\u05E8\u05DB\u05D9\u05DD"), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500 mt-0.5"
    }, "\u05EA\u05D4\u05DC\u05D9\u05DA \u05E6\u05E2\u05D3-\u05D0\u05D7\u05E8-\u05E6\u05E2\u05D3: \u05D1\u05DB\u05DC \u05DE\u05D5\u05D3\u05D5\u05DC \u05DC\u05DC\u05DE\u05D5\u05D3 \xB7 \u05DC\u05DB\u05EA\u05D5\u05D1 \xB7 \u05DC\u05D4\u05D9\u05E8\u05D2\u05E2. \u05D0\u05E4\u05E9\u05E8 \u05D2\u05DD \u05DC\u05D4\u05D0\u05D6\u05D9\u05DF.")), GUIDED_MODULES.map((mod, idx) => /*#__PURE__*/React.createElement(GuidedModuleItem, {
      key: mod.id,
      mod: mod,
      idx: idx,
      open: openId === mod.id,
      onToggle: () => setOpenId(cur => cur === mod.id ? 0 : mod.id)
    })));
  }
  function ExerciseLibrary({
    onNavigateStage
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "pt-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-baseline gap-2 mb-1"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "font-heading font-bold text-[20px] text-ink-800"
    }, "\u05E1\u05E4\u05E8\u05D9\u05D9\u05EA \u05D4\u05EA\u05E8\u05D2\u05D9\u05DC\u05D9\u05DD")), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500 mb-5 leading-relaxed"
    }, "12 \u05EA\u05E8\u05D2\u05D9\u05DC\u05D9\u05DD \u05DE\u05E2\u05E9\u05D9\u05D9\u05DD, \u05DE\u05E1\u05D5\u05D3\u05E8\u05D9\u05DD \u05DC-3 \u05E9\u05DC\u05D1\u05D9 \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA. \u05D1\u05D7\u05E8\u05D9 \u05EA\u05E8\u05D2\u05D9\u05DC \u2014 \u05D5\u05D1\u05E7\u05E9\u05D9 \u05DE\u05D4-AI \u05DC\u05DC\u05D5\u05D5\u05EA \u05D0\u05D5\u05EA\u05DA \u05D3\u05E8\u05DB\u05D5."), /*#__PURE__*/React.createElement("div", {
      className: "space-y-6"
    }, CUREMINDSET_STAGES.map(st => /*#__PURE__*/React.createElement("div", {
      key: st.key
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2.5 mb-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 w-8 h-8 rounded-full bg-gold-50 border border-gold-200 text-gold-600 flex items-center justify-center"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: st.icon,
      size: 16
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[14.5px] text-ink-800"
    }, "\u05E9\u05DC\u05D1 ", st.key, " \xB7 ", st.title), /*#__PURE__*/React.createElement("p", {
      className: "text-[12px] text-ink-500"
    }, st.sub))), /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, st.exercises.map((ex, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "rounded-2xl border border-ink-100 bg-white px-4 py-3.5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between gap-2 mb-1"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[14px] text-ink-800"
    }, ex.title), /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 text-[11px] font-heading font-semibold text-gold-700 bg-gold-50 border border-gold-200 rounded-full px-2.5 py-0.5"
    }, ex.type, " \xB7 ", ex.min, " \u05D3\u05E7\u05F3")), /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] text-ink-600 leading-relaxed"
    }, ex.desc), /*#__PURE__*/React.createElement("div", {
      className: "mt-2.5 flex flex-wrap gap-2"
    }, /*#__PURE__*/React.createElement(SpeakButton, {
      text: `${ex.title}. ${ex.desc}`
    })))))))));
  }

  // ── שלב B: מנוע ההתאמה — ההמלצה החכמה לרגע הזה ─────────────────────────────
  // מושך את /api/recommendation ומציג כרטיס אחד, מדויק, בקול הקומפניון: מה כדאי
  // לתרגל *עכשיו* ולמה — עם כפתור שמוביל ישר לפעולה. נגזר מהתמונה הקלינית (שלב A).
  function SmartRecommendation({
    onGo
  }) {
    const [rec, setRec] = useState(null);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
      let alive = true;
      fetch("/api/recommendation", {
        headers: authHeaders()
      }).then(r => r.ok ? r.json() : null).then(d => {
        if (alive) {
          setRec(d);
          setLoaded(true);
        }
      }).catch(() => {
        if (alive) setLoaded(true);
      });
      return () => {
        alive = false;
      };
    }, []);
    if (!loaded || !rec || !rec.title) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl px-5 py-5 space-y-3",
      style: {
        background: `linear-gradient(135deg, ${CM.lavenderSoft} 0%, ${CM.apricotSoft} 100%)`,
        border: `1px solid ${CM.lavenderLine}`
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
      style: {
        color: "#fff",
        background: CM.apricot
      }
    }, "\u05D4\u05DE\u05DC\u05E6\u05D4 \u05D7\u05DB\u05DE\u05D4 \u05E2\u05DB\u05E9\u05D9\u05D5")), rec.reason ? /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] leading-relaxed",
      style: {
        color: CM.lavender
      }
    }, rec.reason) : null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-[17px]",
      style: {
        color: CM.ink
      }
    }, rec.title), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] leading-relaxed mt-1",
      style: {
        color: CM.ink
      }
    }, rec.description)), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        if (onGo && rec.targetStage) onGo(rec.targetStage);
      },
      className: "w-full rounded-2xl py-3 font-heading font-bold text-[14px] text-white transition-transform active:scale-[0.98]",
      style: {
        background: CM.gold
      }
    }, rec.ctaLabel || "בואי נתחיל", " \u2190"));
  }

  // ── שלב A: התמונה הקלינית — השיקוף החכם שהמערכת לומדת מכל צ'ק-אין ומצב-רוח ──
  // מושך את /api/clinical-profile ומציג תובנות אנושיות + שבבי-מדד. תוספת ל"מדד חוסן",
  // לא שוברת כלום. אם אין מספיק נתונים — מציג הודעה עדינה ומזמינה במקום כרטיס ריק.
  function ClinicalInsights() {
    const [profile, setProfile] = useState(null);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
      let alive = true;
      fetch("/api/clinical-profile", {
        headers: authHeaders()
      }).then(r => r.ok ? r.json() : null).then(d => {
        if (alive) {
          setProfile(d);
          setLoaded(true);
        }
      }).catch(() => {
        if (alive) setLoaded(true);
      });
      return () => {
        alive = false;
      };
    }, []);
    if (!loaded) return null;
    const TONE = {
      positive: {
        accent: CM.sky,
        emoji: "🌿"
      },
      care: {
        accent: CM.apricot,
        emoji: "🧡"
      },
      neutral: {
        accent: CM.gold,
        emoji: "•"
      }
    };
    const hasData = profile && profile.dataPoints > 0;
    const anx = profile && profile.anxiety;
    const anxLabel = anx && {
      improving: "בירידה ↓",
      worsening: "בעלייה ↑",
      stable: "יציבה"
    }[anx.direction];

    // שבבי-מדד קומפקטיים — רק מה שבשל מספיק להצגה.
    const chips = [];
    if (hasData && anxLabel) chips.push({
      k: "מגמת חרדה",
      v: anxLabel + (anx.recentAvg != null ? ` · ${anx.recentAvg}/10` : "")
    });
    if (hasData && profile.peakTimes && profile.peakTimes.label) chips.push({
      k: "שעת שיא",
      v: profile.peakTimes.label
    });
    if (hasData && profile.topTriggers && profile.topTriggers.length) chips.push({
      k: "חוזר אצלך",
      v: profile.topTriggers[0].label
    });
    if (hasData && profile.whatHelps && profile.whatHelps.helpfulCategories.length) chips.push({
      k: "עוזר לך",
      v: profile.whatHelps.helpfulCategories[0].label
    });
    if (hasData && profile.engagement && profile.engagement.streak >= 2) chips.push({
      k: "רצף",
      v: `🔥 ${profile.engagement.streak} ימים`
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl border bg-white px-5 py-5 space-y-4",
      style: {
        borderColor: CM.lavenderLine
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between gap-2"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-[16px]",
      style: {
        color: CM.ink
      }
    }, "\u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05D4\u05E7\u05DC\u05D9\u05E0\u05D9\u05EA \u05E9\u05DC\u05DA \u2728"), profile && profile.maturity === "low" && hasData ? /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-heading font-semibold rounded-full px-2.5 py-1 shrink-0",
      style: {
        color: CM.lavender,
        background: CM.lavenderSoft,
        border: `1px solid ${CM.lavenderLine}`
      }
    }, "\u05E0\u05D1\u05E0\u05D9\u05EA") : null), !hasData ? /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-500 leading-relaxed"
    }, "\u05DB\u05D0\u05DF \u05EA\u05D9\u05D1\u05E0\u05D4 \u05D1\u05D4\u05D3\u05E8\u05D2\u05D4 \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05D4\u05D7\u05DB\u05DE\u05D4 \u05E9\u05DC\u05DA \u2014 \u05DE\u05D2\u05DE\u05D5\u05EA, \u05E9\u05E2\u05D5\u05EA \u05E9\u05D9\u05D0, \u05DE\u05D4 \u05E2\u05D5\u05D6\u05E8 \u05DC\u05DA \u05D1\u05D0\u05DE\u05EA. \u05DB\u05DC \u05E6'\u05E7-\u05D0\u05D9\u05DF \u05D5\u05DE\u05D3\u05D9\u05D3\u05EA \u05DE\u05E6\u05D1-\u05E8\u05D5\u05D7 \u05DE\u05D7\u05D3\u05D3\u05D9\u05DD \u05D0\u05D5\u05EA\u05D4. \u05D1\u05D5\u05D0\u05D9 \u05E0\u05EA\u05D7\u05D9\u05DC \uD83C\uDF31") : /*#__PURE__*/React.createElement(React.Fragment, null, chips.length ? /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2"
    }, chips.map((c, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "inline-flex items-center gap-1.5 text-[12px] rounded-full px-3 py-1.5",
      style: {
        background: CM.lavenderSoft,
        border: `1px solid ${CM.lavenderLine}`
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: CM.lavender
      }
    }, c.k), /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-bold",
      style: {
        color: CM.ink
      }
    }, c.v)))) : null, /*#__PURE__*/React.createElement("div", {
      className: "space-y-2.5"
    }, (profile.insights || []).map((ins, i) => {
      const t = TONE[ins.tone] || TONE.neutral;
      return /*#__PURE__*/React.createElement("div", {
        key: i,
        className: "flex items-start gap-2.5 rounded-2xl px-3.5 py-2.5",
        style: {
          background: CM.lavenderSoft,
          borderRight: `3px solid ${t.accent}`
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-[14px] leading-5 shrink-0"
      }, t.emoji), /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] leading-relaxed",
        style: {
          color: CM.ink
        }
      }, ins.text));
    })), /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-ink-400 leading-relaxed pt-1"
    }, "\u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05E0\u05D1\u05E0\u05D9\u05EA \u05DE\u05D4\u05E6'\u05E7-\u05D0\u05D9\u05E0\u05D9\u05DD \u05D5\u05DE\u05D3\u05D9\u05D3\u05D5\u05EA \u05DE\u05E6\u05D1-\u05D4\u05E8\u05D5\u05D7 \u05E9\u05DC\u05DA, \u05D5\u05DE\u05EA\u05E2\u05D3\u05DB\u05E0\u05EA \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA. \u05D4\u05D9\u05D0 \u05DC\u05D9\u05D5\u05D5\u05D9 \u2014 \u05DC\u05D0 \u05D0\u05D1\u05D7\u05D5\u05DF \u05E8\u05E4\u05D5\u05D0\u05D9.")));
  }

  // מעקב יומי: רמת חרדה, מצב רוח ואיכות שינה — עם גרף מגמה. תוספת ל"מדד חוסן".
  const MOOD_OPTIONS = [{
    key: "calm",
    label: "רגוע"
  }, {
    key: "positive",
    label: "טוב"
  }, {
    key: "neutral",
    label: "ניטרלי"
  }, {
    key: "anxious",
    label: "חרד/ה"
  }, {
    key: "overwhelmed",
    label: "מוצף/ת"
  }];
  function MoodTrendChart({
    log
  }) {
    const pts = log.filter(r => Number.isFinite(r.anxiety) || Number.isFinite(r.sleep)).slice(-14);
    if (pts.length < 2) {
      return /*#__PURE__*/React.createElement("p", {
        className: "text-[12.5px] text-ink-400 text-center py-3"
      }, "\u05E8\u05E9\u05DE\u05D9 \u05DC\u05E4\u05D7\u05D5\u05EA \u05E9\u05E0\u05D9 \u05D9\u05DE\u05D9\u05DD \u05DB\u05D3\u05D9 \u05DC\u05E8\u05D0\u05D5\u05EA \u05DE\u05D2\u05DE\u05D4 ");
    }
    const W = 300,
      H = 120,
      pad = 10;
    const x = i => pad + i * (W - 2 * pad) / (pts.length - 1);
    const y = v => H - pad - (v - 1) / 9 * (H - 2 * pad);
    const line = key => pts.map((r, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(r[key] || 1).toFixed(1)}`).join(" ");
    return /*#__PURE__*/React.createElement("div", {
      className: "overflow-x-auto"
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: `0 0 ${W} ${H}`,
      className: "w-full",
      style: {
        minWidth: 260
      },
      "aria-label": "\u05D2\u05E8\u05E3 \u05DE\u05D2\u05DE\u05D4"
    }, [1, 5, 10].map(g => /*#__PURE__*/React.createElement("line", {
      key: g,
      x1: pad,
      x2: W - pad,
      y1: y(g),
      y2: y(g),
      stroke: "#eee7d6",
      strokeWidth: "1"
    })), /*#__PURE__*/React.createElement("path", {
      d: line("anxiety"),
      fill: "none",
      stroke: "#c2974a",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: line("sleep"),
      fill: "none",
      stroke: "#8aa899",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }), pts.map((r, i) => /*#__PURE__*/React.createElement("g", {
      key: i
    }, Number.isFinite(r.anxiety) && /*#__PURE__*/React.createElement("circle", {
      cx: x(i),
      cy: y(r.anxiety),
      r: "2.5",
      fill: "#c2974a"
    }), Number.isFinite(r.sleep) && /*#__PURE__*/React.createElement("circle", {
      cx: x(i),
      cy: y(r.sleep),
      r: "2.5",
      fill: "#8aa899"
    })))), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-center gap-4 mt-1 text-[11.5px]"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-3 h-1 rounded-full",
      style: {
        background: "#c2974a"
      }
    }), " \u05D7\u05E8\u05D3\u05D4"), /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center gap-1.5"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-3 h-1 rounded-full",
      style: {
        background: "#8aa899"
      }
    }), " \u05D0\u05D9\u05DB\u05D5\u05EA \u05E9\u05D9\u05E0\u05D4")));
  }
  function MoodTracker() {
    const [log, setLog] = useState([]);
    const [anxiety, setAnxiety] = useState(5);
    const [sleep, setSleep] = useState(5);
    const [mood, setMood] = useState("");
    const [note, setNote] = useState("");
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    function refresh() {
      return fetch("/api/mood", {
        headers: authHeaders()
      }).then(r => r.ok ? r.json() : []).then(d => {
        if (Array.isArray(d)) setLog(d);
      }).catch(() => {});
    }
    useEffect(() => {
      let alive = true;
      refresh().then(() => {
        if (!alive) return;
      });
      return () => {
        alive = false;
      };
    }, []);
    function save() {
      setSaving(true);
      fetch("/api/mood", {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          anxiety,
          sleep,
          mood,
          note
        })
      }).then(r => r.ok ? r.json() : null).then(() => refresh()).then(() => {
        setSaved(true);
        setNote("");
        setTimeout(() => setSaved(false), 2500);
      }).catch(() => {}).finally(() => setSaving(false));
    }
    const Slider = ({
      label,
      value,
      setValue,
      color
    }) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between mb-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-[13px] font-heading font-semibold text-ink-700"
    }, label), /*#__PURE__*/React.createElement("span", {
      className: "text-[13px] font-heading font-bold",
      style: {
        color
      }
    }, value, "/10")), /*#__PURE__*/React.createElement("input", {
      type: "range",
      min: "1",
      max: "10",
      value: value,
      onChange: e => setValue(Number(e.target.value)),
      className: "w-full",
      style: {
        accentColor: color
      }
    }));

    // רצף (streak) — ימים רצופים עם צ'ק-אין. בונה הרגל, כמו קומפניון שמחכה לך כל יום.
    const firstName = (() => {
      try {
        return (localStorage.getItem(AUTH_NAME_KEY) || "").split(" ")[0];
      } catch (e) {
        return "";
      }
    })();
    const dayKeys = [...new Set(log.map(r => String(r.created_at || "").slice(0, 10)).filter(Boolean))];
    function computeStreak(keys) {
      if (!keys.length) return 0;
      const sorted = [...new Set(keys)].sort().reverse();
      const dayMs = 86400000;
      const parse = s => new Date(s + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Math.round((today - parse(sorted[0])) / dayMs) > 1) return 0; // נשבר אם עברו יותר מיום
      let streak = 1;
      for (let k = 1; k < sorted.length; k++) {
        if (Math.round((parse(sorted[k - 1]) - parse(sorted[k])) / dayMs) === 1) streak++;else break;
      }
      return streak;
    }
    const streak = computeStreak(dayKeys);
    const checkedToday = dayKeys.includes(new Date().toISOString().slice(0, 10));
    const hour = new Date().getHours();
    const greetTime = hour < 12 ? "בוקר טוב" : hour < 18 ? "צהריים טובים" : "ערב טוב";
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl border border-gold-200 bg-white px-5 py-5 space-y-4"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between gap-2"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-heading font-bold text-[16px] text-ink-800"
    }, greetTime, firstName ? ` ${firstName}` : "", " "), streak > 0 ? /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center gap-1 text-[12px] font-heading font-bold text-gold-700 bg-gold-50 border border-gold-200 rounded-full px-2.5 py-1 shrink-0"
    }, streak, " ", streak === 1 ? "יום" : "ימים", " \u05D1\u05E8\u05E6\u05E3") : null), /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] text-ink-500 mt-0.5"
    }, checkedToday ? "עשית צ׳ק-אין היום — יופי! אפשר לעדכן אם משהו השתנה." : "איך היה הלילה? איך את/ה מרגיש/ה עכשיו? רגע קצר של מודעות.")), /*#__PURE__*/React.createElement(Slider, {
      label: "\u05E8\u05DE\u05EA \u05D7\u05E8\u05D3\u05D4",
      value: anxiety,
      setValue: setAnxiety,
      color: "#c2974a"
    }), /*#__PURE__*/React.createElement(Slider, {
      label: "\u05D0\u05D9\u05DB\u05D5\u05EA \u05E9\u05D9\u05E0\u05D4",
      value: sleep,
      setValue: setSleep,
      color: "#8aa899"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
      className: "text-[13px] font-heading font-semibold text-ink-700 block mb-2"
    }, "\u05DE\u05E6\u05D1 \u05D4\u05E8\u05D5\u05D7"), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2"
    }, MOOD_OPTIONS.map(m => /*#__PURE__*/React.createElement("button", {
      key: m.key,
      type: "button",
      onClick: () => setMood(m.key),
      className: `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[12.5px] font-heading font-semibold transition-colors ${mood === m.key ? "border-gold-400 bg-gold-50 text-gold-700" : "border-ink-200 text-ink-600 hover:border-gold-300"}`
    }, m.label)))), /*#__PURE__*/React.createElement("textarea", {
      value: note,
      onChange: e => setNote(e.target.value),
      rows: 2,
      placeholder: "\u05DE\u05E9\u05D4\u05D5 \u05E9\u05EA\u05E8\u05E6\u05D4/\u05D9 \u05DC\u05E8\u05E9\u05D5\u05DD \u05DC\u05D4\u05D9\u05D5\u05DD? (\u05DC\u05D0 \u05D7\u05D5\u05D1\u05D4)",
      className: "w-full rounded-2xl border border-ink-200 px-3.5 py-2.5 text-[13px] text-ink-700 resize-none focus:outline-none focus:border-gold-300"
    }), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: save,
      disabled: saving,
      className: "w-full rounded-full bg-gold-500 text-white font-heading font-bold text-[14px] py-3 hover:bg-gold-600 transition-colors disabled:opacity-60"
    }, saving ? "שומר..." : saved ? "נשמר! " : "שמירת הצ׳ק-אין"), /*#__PURE__*/React.createElement("div", {
      className: "pt-1"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] font-heading font-semibold text-ink-600 mb-1.5"
    }, "\u05D4\u05DE\u05D2\u05DE\u05D4 \u05E9\u05DC\u05DA"), /*#__PURE__*/React.createElement(MoodTrendChart, {
      log: log
    })));
  }
  function ProgramStage({
    onNavigateStage,
    paid,
    onUpgrade
  }) {
    const [done, setDone] = useState(loadProgramDone);
    const [currentDay, setCurrentDay] = useState(1); // היום שנפתח לפי ימים מההרשמה
    const total = 14;
    const completed = done.length;
    const firstName = (() => {
      try {
        return (localStorage.getItem(AUTH_NAME_KEY) || "").split(" ")[0];
      } catch (e) {
        return "";
      }
    })();
    // פתיחה הדרגתית: יום N נפתח N ימים אחרי ההרשמה. מחשבים מ-trialStartAt.
    useEffect(() => {
      fetch("/api/profile", {
        headers: authHeaders()
      }).then(r => r.ok ? r.json() : null).then(d => {
        if (!d || !d.trialStartAt) return;
        const start = new Date(String(d.trialStartAt).replace(" ", "T"));
        if (isNaN(start)) return;
        const days = Math.floor((Date.now() - start.getTime()) / 86400000) + 1;
        setCurrentDay(Math.min(14, Math.max(1, days)));
      }).catch(() => {});
    }, []);
    function toggle(day) {
      setDone(prev => {
        const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
        try {
          localStorage.setItem(PROGRAM_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
    const todayTitle = (() => {
      for (const g of PROGRAM_GATES) {
        const hit = g.days.find(x => x.day === currentDay);
        if (hit) return hit.title;
      }
      return "";
    })();
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-7"
    }, /*#__PURE__*/React.createElement(GuidedModule, null), /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl px-5 py-4 flex items-center gap-3",
      style: {
        background: "linear-gradient(135deg,#c2974a,#a9791f)",
        color: "#fff"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 w-11 h-11 rounded-full bg-white/25 flex items-center justify-center"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 22
    })), /*#__PURE__*/React.createElement("div", {
      className: "min-w-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-extrabold text-[16px]"
    }, firstName ? `היי ${firstName}, ` : "", "\u05D9\u05D5\u05DD ", currentDay, " \u05E9\u05DC\u05DA \u05DE\u05D7\u05DB\u05D4 "), /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] opacity-90 truncate"
    }, todayTitle ? `היום: ${todayTitle}` : "מוכנה להמשיך את התהליך?"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-semibold text-[12px] tracking-[0.18em] text-gold-600 mb-1"
    }, "CURE MINDSET"), /*#__PURE__*/React.createElement("h2", {
      className: "font-heading font-bold text-[22px] text-ink-800"
    }, "\u05D4\u05EA\u05D5\u05DB\u05E0\u05D9\u05EA \u05E9\u05DC\u05DA \xB7 \u05EA\u05D4\u05DC\u05D9\u05DA 14 \u05D9\u05D5\u05DD"), /*#__PURE__*/React.createElement("p", {
      className: "text-[13.5px] text-ink-500 mt-1.5 leading-relaxed"
    }, "3 \u05D4\u05D9\u05DE\u05D9\u05DD \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D9\u05DD (\u05E9\u05E2\u05E8 1) \u05E4\u05EA\u05D5\u05D7\u05D9\u05DD \u05D1\u05D4\u05EA\u05E0\u05E1\u05D5\u05EA \u05D4\u05D7\u05D9\u05E0\u05DE\u05D9\u05EA. \u05DE\u05D9\u05D5\u05DD 4 \u05DE\u05DE\u05E9\u05D9\u05DB\u05D9\u05DD \u05D1\u05DE\u05E1\u05DC\u05D5\u05DC \u05D4\u05DE\u05DC\u05D0 \u05D1\u05EA\u05E9\u05DC\u05D5\u05DD \u2014 \u05DB\u05DC \u05D9\u05D5\u05DD \u05DE\u05D5\u05D3\u05D5\u05DC \u05D7\u05D3\u05E9, \u05EA\u05E8\u05D2\u05D5\u05DC \u05E7\u05E6\u05E8 \u05D5\u05E9\u05D9\u05D7\u05EA AI \u05DE\u05DE\u05D5\u05E7\u05D3\u05EA."), /*#__PURE__*/React.createElement("div", {
      className: "mt-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between text-[12px] text-ink-500 mb-1.5"
    }, /*#__PURE__*/React.createElement("span", null, completed, " \u05DE\u05EA\u05D5\u05DA ", total, " \u05D9\u05DE\u05D9\u05DD \u05D4\u05D5\u05E9\u05DC\u05DE\u05D5"), /*#__PURE__*/React.createElement("span", null, Math.round(completed / total * 100), "%")), /*#__PURE__*/React.createElement("div", {
      className: "h-2 rounded-full bg-ink-100 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "h-full bg-gold-500 rounded-full transition-all duration-500",
      style: {
        width: `${completed / total * 100}%`
      }
    })))), PROGRAM_GATES.map(g => /*#__PURE__*/React.createElement("div", {
      key: g.gate
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-baseline gap-2 mb-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-semibold text-[12px] text-gold-600"
    }, g.gate), /*#__PURE__*/React.createElement("span", {
      className: "font-heading font-bold text-[15px] text-ink-800"
    }, "\xB7 ", g.title), /*#__PURE__*/React.createElement("span", {
      className: `text-[10.5px] font-heading font-bold px-2 py-0.5 rounded-full ${g.paidRequired ? "bg-ink-100 text-ink-500" : "bg-gold-50 text-gold-700"}`
    }, g.paidRequired ? "בתשלום" : "חינם")), /*#__PURE__*/React.createElement("div", {
      className: "space-y-3"
    }, g.days.map(d => {
      const isDone = done.includes(d.day);
      const paywalled = g.paidRequired && !paid;
      const locked = d.day > currentDay || paywalled;
      const isToday = d.day === currentDay && !paywalled;
      if (paywalled) {
        return /*#__PURE__*/React.createElement("button", {
          key: d.day,
          type: "button",
          onClick: onUpgrade,
          className: "w-full text-right rounded-2xl border border-gold-200 bg-gold-50/50 px-4 py-3.5 hover:border-gold-300 transition-colors"
        }, /*#__PURE__*/React.createElement("div", {
          className: "flex items-center gap-3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "shrink-0 w-9 h-9 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center"
        }, /*#__PURE__*/React.createElement(Icon, {
          name: "lock",
          size: 16
        })), /*#__PURE__*/React.createElement("div", {
          className: "flex-1 min-w-0"
        }, /*#__PURE__*/React.createElement("p", {
          className: "font-heading font-bold text-[14px] text-ink-700"
        }, "\u05D9\u05D5\u05DD ", d.day, " \xB7 ", d.title), /*#__PURE__*/React.createElement("p", {
          className: "text-[12px] text-gold-700 mt-0.5 font-semibold"
        }, "\u05D1\u05EA\u05E9\u05DC\u05D5\u05DD \xB7 \u05DC\u05D4\u05DE\u05E9\u05D9\u05DA \u05D0\u05EA \u05D4\u05EA\u05D5\u05DB\u05E0\u05D9\u05EA \u05D4\u05DE\u05DC\u05D0\u05D4 \u2190"))));
      }
      if (locked) {
        return /*#__PURE__*/React.createElement("div", {
          key: d.day,
          className: "rounded-2xl border border-ink-100 bg-ink-50/60 px-4 py-3.5 opacity-90"
        }, /*#__PURE__*/React.createElement("div", {
          className: "flex items-center gap-3"
        }, /*#__PURE__*/React.createElement("span", {
          className: "shrink-0 w-9 h-9 rounded-full bg-ink-100 text-ink-400 flex items-center justify-center"
        }, /*#__PURE__*/React.createElement(Icon, {
          name: "lock",
          size: 16
        })), /*#__PURE__*/React.createElement("div", {
          className: "flex-1 min-w-0"
        }, /*#__PURE__*/React.createElement("p", {
          className: "font-heading font-bold text-[14px] text-ink-500"
        }, "\u05D9\u05D5\u05DD ", d.day, " \xB7 ", d.title), /*#__PURE__*/React.createElement("p", {
          className: "text-[12px] text-gold-600 mt-0.5 font-semibold"
        }, "\u05E0\u05E4\u05EA\u05D7 \u05D1\u05E2\u05D5\u05D3 ", d.day - currentDay, " ", d.day - currentDay === 1 ? "יום" : "ימים", " "))));
      }
      return /*#__PURE__*/React.createElement("div", {
        key: d.day,
        className: `rounded-2xl border px-4 py-4 transition-colors ${isDone ? "border-gold-300 bg-gold-50" : isToday ? "border-gold-400 bg-gold-50/60 shadow-[0_8px_24px_-14px_rgba(194,151,74,0.8)]" : "border-ink-100 bg-white"}`
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-start gap-3"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => toggle(d.day),
        "aria-label": isDone ? "בטל סימון" : "סמן כהושלם",
        className: `shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-[14px] transition-colors ${isDone ? "bg-gold-500 text-white" : "bg-gold-50 text-gold-600 border border-gold-200"}`
      }, isDone ? /*#__PURE__*/React.createElement(Icon, {
        name: "check-circle",
        size: 18
      }) : d.day), /*#__PURE__*/React.createElement("div", {
        className: "flex-1 min-w-0"
      }, /*#__PURE__*/React.createElement("p", {
        className: "font-heading font-bold text-[15px] text-ink-800"
      }, "\u05D9\u05D5\u05DD ", d.day, " \xB7 ", d.title, isToday ? /*#__PURE__*/React.createElement("span", {
        className: "mr-2 align-middle text-[10.5px] font-heading font-bold text-white bg-gold-500 rounded-full px-2 py-0.5"
      }, "\u05D4\u05D9\u05D5\u05DD") : null), /*#__PURE__*/React.createElement("p", {
        className: "text-[13px] text-ink-600 mt-1 leading-relaxed"
      }, d.focus), /*#__PURE__*/React.createElement("p", {
        className: "text-[12.5px] text-gold-700 mt-1.5"
      }, /*#__PURE__*/React.createElement("span", {
        className: "font-semibold"
      }, "\u05EA\u05E8\u05D2\u05D5\u05DC:"), " ", d.practice), /*#__PURE__*/React.createElement("div", {
        className: "flex flex-wrap gap-2 mt-3"
      }, /*#__PURE__*/React.createElement("button", {
        type: "button",
        onClick: () => toggle(d.day),
        className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-ink-200 text-ink-600 font-heading font-semibold text-[12.5px] hover:border-gold-300 transition-colors"
      }, isDone ? "בטל סימון" : "סמן כהושלם")))));
    })))), /*#__PURE__*/React.createElement(ExerciseLibrary, {
      onNavigateStage: onNavigateStage
    }));
  }

  // מפגש וירטואלי חי עם קטי דרך זום — כלול במסלול פרימיום, קביעה דרך היומן.
  function VirtualSessionStage({
    paid,
    onNavigateStage
  }) {
    const firstName = (() => {
      try {
        return (localStorage.getItem(AUTH_NAME_KEY) || "").split(" ")[0];
      } catch (e) {
        return "";
      }
    })();
    const waBook = "https://wa.me/972543032349?text=" + encodeURIComponent("היי קטי! אשמח לקבוע מפגש זום אישי");
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-5"
    }, /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl bg-gradient-to-br from-gold-400 to-gold-600 text-white px-6 py-7 shadow-soft"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "video",
      size: 20
    })), /*#__PURE__*/React.createElement("span", {
      className: "text-[12px] font-heading font-semibold uppercase tracking-wider text-white/85"
    }, "\u05DE\u05E4\u05D2\u05E9 \u05D0\u05D9\u05E9\u05D9 \xB7 \u05E4\u05E0\u05D9\u05DD \u05D0\u05DC \u05E4\u05E0\u05D9\u05DD \u05D1\u05D6\u05D5\u05DD")), /*#__PURE__*/React.createElement("h2", {
      className: "font-heading font-extrabold text-[24px] leading-tight"
    }, firstName ? `${firstName}, ` : "", "\u05DE\u05E4\u05D2\u05E9 \u05D7\u05D9 \u05E2\u05DD \u05E7\u05D8\u05D9 \u2014 \u05DC\u05D0 \u05E8\u05E7 \u05E6'\u05D0\u05D8"), /*#__PURE__*/React.createElement("p", {
      className: "text-[14.5px] text-white/90 leading-relaxed mt-2"
    }, "\u05E4\u05E2\u05DD \u05D1\u05D7\u05D5\u05D3\u05E9 \u05D0\u05EA/\u05D4 \u05D9\u05D5\u05E9\u05D1/\u05EA \u05DE\u05D5\u05DC \u05E7\u05D8\u05D9 \u05D1\u05E9\u05D9\u05D7\u05EA \u05D5\u05D9\u05D3\u05D0\u05D5 \u05D0\u05D9\u05E9\u05D9\u05EA: \u05DC\u05D5\u05E7\u05D7\u05D9\u05DD \u05D0\u05EA \u05DE\u05D4 \u05E9\u05E2\u05DC\u05D4 \u05D1\u05E6'\u05D0\u05D8 \u05D5\u05D1\u05EA\u05D4\u05DC\u05D9\u05DA, \u05DE\u05E2\u05DE\u05D9\u05E7\u05D9\u05DD \u05D9\u05D7\u05D3 \u05D5\u05D1\u05D5\u05E0\u05D9\u05DD \u05D0\u05EA \u05D4\u05E6\u05E2\u05D3 \u05D4\u05D1\u05D0 \u2014 \u05D1\u05DC\u05D9\u05D5\u05D5\u05D9 \u05D0\u05E0\u05D5\u05E9\u05D9 \u05D0\u05DE\u05D9\u05EA\u05D9.")), /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl border border-gold-200 bg-white px-5 py-5"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800 mb-3"
    }, "\u05D0\u05D9\u05DA \u05D6\u05D4 \u05E2\u05D5\u05D1\u05D3"), /*#__PURE__*/React.createElement("ul", {
      className: "space-y-3"
    }, [["calendar", "בוחרים מועד שנוח לך", "קובעים דרך היומן — המפגש נכנס אוטומטית עם קישור זום."], ["video", "נפגשים בזום, 45 דקות", "שיחת עומק אישית — ממשיכים בדיוק מאיפה שהצ'אט עצר."], ["heart", "יוצאים עם תוכנית", "צעד ברור להמשך, שנשמר גם באזור האישי שלך."]].map(([ic, t, d], i) => /*#__PURE__*/React.createElement("li", {
      key: i,
      className: "flex items-start gap-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "shrink-0 w-9 h-9 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center border border-gold-200"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 17
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[14px] text-ink-800"
    }, t), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-600 leading-relaxed"
    }, d)))))), paid ? /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl border border-gold-300 bg-gold-50 px-5 py-5 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800 mb-1"
    }, "\u05D4\u05DE\u05E4\u05D2\u05E9 \u05E9\u05DC\u05DA \u05DB\u05DC\u05D5\u05DC \u05D1\u05DE\u05E1\u05DC\u05D5\u05DC"), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-600 mb-4"
    }, "\u05D1\u05D7\u05E8\u05D5 \u05DE\u05D5\u05E2\u05D3 \u05E2\u05DB\u05E9\u05D9\u05D5 \u2014 \u05E0\u05EA\u05E8\u05D0\u05D4 \u05D1\u05D6\u05D5\u05DD."), /*#__PURE__*/React.createElement("a", {
      href: CALENDAR_LINK,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gold-500 text-white font-heading font-bold text-[15px] hover:bg-gold-600 transition-colors"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "calendar",
      size: 18
    }), " \u05DC\u05E7\u05D1\u05D9\u05E2\u05EA \u05DE\u05E4\u05D2\u05E9 \u05D4\u05D6\u05D5\u05DD \u05E9\u05DC\u05D9")) : /*#__PURE__*/React.createElement("div", {
      className: "rounded-3xl border border-gold-300 bg-gold-50 px-5 py-5 text-center"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-heading font-bold text-[15px] text-ink-800 mb-1"
    }, "\u05D4\u05DE\u05E4\u05D2\u05E9 \u05D4\u05D7\u05D9 \u05DB\u05DC\u05D5\u05DC \u05D1\u05DE\u05E1\u05DC\u05D5\u05DC \u05D4\u05E4\u05E8\u05D9\u05DE\u05D9\u05D5\u05DD"), /*#__PURE__*/React.createElement("p", {
      className: "text-[13px] text-ink-600 mb-4"
    }, "\u05DE\u05E9\u05D3\u05E8\u05D2\u05D9\u05DD \u05DC\u05DE\u05E1\u05DC\u05D5\u05DC \u05E4\u05E8\u05D9\u05DE\u05D9\u05D5\u05DD \u05D5\u05DE\u05E7\u05D1\u05DC\u05D9\u05DD \u05DE\u05E4\u05D2\u05E9 \u05D6\u05D5\u05DD \u05D0\u05D9\u05E9\u05D9 \u05DE\u05D3\u05D9 \u05D7\u05D5\u05D3\u05E9 \u2014 \u05D9\u05D7\u05D3 \u05E2\u05DD \u05DB\u05DC \u05D4\u05EA\u05DB\u05E0\u05D9\u05DD."), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => onNavigateStage && onNavigateStage(8),
      className: "flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gold-500 text-white font-heading font-bold text-[15px] hover:bg-gold-600 transition-colors mb-2.5"
    }, "\u05DC\u05E6\u05E4\u05D9\u05D9\u05D4 \u05D1\u05DE\u05E1\u05DC\u05D5\u05DC\u05D9\u05DD \u05D5\u05DC\u05E9\u05D3\u05E8\u05D5\u05D2"), /*#__PURE__*/React.createElement("a", {
      href: waBook,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-gold-300 text-gold-700 font-heading font-semibold text-[14px] hover:bg-white transition-colors"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "whatsapp",
      size: 17
    }), " \u05DC\u05EA\u05D9\u05D0\u05D5\u05DD \u05E9\u05D9\u05D7\u05EA \u05D4\u05D9\u05DB\u05E8\u05D5\u05EA \u05E7\u05E6\u05E8\u05D4")), /*#__PURE__*/React.createElement("p", {
      className: "text-[11.5px] text-ink-400 text-center leading-relaxed px-2"
    }, "\u05D4\u05DE\u05E4\u05D2\u05E9 \u05D4\u05D5\u05D5\u05D9\u05E8\u05D8\u05D5\u05D0\u05DC\u05D9 \u05D4\u05D5\u05D0 \u05DC\u05D9\u05D5\u05D5\u05D9 \u05E8\u05D2\u05E9\u05D9-\u05EA\u05D5\u05D3\u05E2\u05EA\u05D9 \u05D1\u05E9\u05D9\u05D8\u05EA CureMindset \u05D5\u05D0\u05D9\u05E0\u05D5 \u05EA\u05D7\u05DC\u05D9\u05E3 \u05DC\u05D8\u05D9\u05E4\u05D5\u05DC \u05E8\u05E4\u05D5\u05D0\u05D9/\u05E0\u05E4\u05E9\u05D9 \u05DE\u05E7\u05E6\u05D5\u05E2\u05D9."));
  }
  function MemberArea({
    onExit
  }) {
    // בקשת קטי: להוריד את חומת ההרשמה — נכנסים ישר לבוט. השרת כבר תומך בגלישה
    // אנונימית לפי מזהה המכשיר (deviceToken.js, "נופלים חזרה למזהה המכשיר לגלישת
    // ניסיון אנונימית") — 7 ימי הניסיון רצים גם בלי חשבון. AuthGate נשאר מוגדר
    // למטה ולא נמחק, למקרה שנרצה נתיב הרשמה אופציונלי (שמירת התקדמות/קוד גישה).
    const [loggedIn, setLoggedIn] = useState(true);
    const [progress, setProgress] = useState(loadProgress);
    // נפתח על "היום שלי" (שלב 0). הצ'אט של קיורטי הורד מהאתר —
    // הצ'אט לגולשים חי בעמוד /talk ואינו תלוי באזור החברים.
    const [current, setCurrent] = useState(0);
    const [serverDashboard, setServerDashboard] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    // access: null = still checking; { status: "trial"|"code"|"expired", daysLeft }
    const [access, setAccess] = useState(null);
    const [showCodeEntry, setShowCodeEntry] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const userName = (() => {
      try {
        return localStorage.getItem(AUTH_NAME_KEY) || "";
      } catch (e) {
        return "";
      }
    })();
    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }, []);
    useEffect(() => {
      if (!loggedIn) return;
      const loadAccess = () => fetch("/api/access", {
        headers: authHeaders()
      }).then(res => res.ok ? res.json() : Promise.reject(new Error("access_" + res.status)));
      // שרת הוא מקור האמת לגבי ההתנסות: בכשל רוחב פעם אחת, ורק אז נחסום (בעבר זויף ניסיון של 14 יום)
      loadAccess().then(setAccess).catch(() => loadAccess().then(setAccess)).catch(() => setAccess({
        status: "expired",
        daysLeft: 0
      }));
    }, [loggedIn]);
    useEffect(() => {
      if (!loggedIn) return;
      fetch("/api/dashboard", {
        headers: authHeaders()
      }).then(res => res.ok ? res.json() : null).then(data => data && setServerDashboard(data)).catch(() => {});
    }, [loggedIn]);
    function logout() {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: authHeaders()
      }).catch(() => {});
      clearAuth();
      setLoggedIn(false);
      onExit();
    }
    function unlock(stageId, nextUnlocked) {
      setProgress(prev => {
        const completed = prev.completed.includes(stageId) ? prev.completed : [...prev.completed, stageId];
        const unlocked = Math.max(prev.unlocked, nextUnlocked);
        const next = {
          completed,
          unlocked
        };
        saveProgress(next);
        return next;
      });
    }
    function navigateToStage(stageId) {
      const target = STAGES.find(s => s.id === stageId);
      setCurrent(target && (target.alwaysUnlocked || stageId <= progress.unlocked) ? stageId : progress.unlocked);
    }
    const stage = STAGES.find(s => s.id === current);

    // ── מנגנון ניסיון מבוסס-מודולים: 2 מודולי ליבה חינם, ואז Paywall ──
    // מודולי הליבה הם השלבים המודרכים (1-3). מנוי בתשלום (code/paid) פותח הכל.
    const FREE_MODULES = 2;
    const paid = access && (access.status === "code" || access.status === "paid");
    const modulesUsed = progress.completed.filter(id => id >= 1 && id <= 3).length;
    const trialLocked = !paid && modulesUsed >= FREE_MODULES;
    // ה-Paywall נחסם כאשר תקופת הניסיון פגה (זמן) או שנוצלו 2 המודולים.
    const expired = access && access.status === "expired" || trialLocked;

    // שער כניסה: בלי חשבון מחובר — אין גישה לאזור האישי.
    // הפתיח (קרוסלת ברוכה הבאה) הוסר — ישר לטופס ההרשמה/כניסה (בקשת קטי).
    // שער ההרשמה הוסר (loggedIn מוגדר true תמיד למעלה) — נכנסים ישר לתוכן.

    return /*#__PURE__*/React.createElement(PhoneFrame, null, /*#__PURE__*/React.createElement(Header, {
      subtitle: stage ? stage.subtitle : "",
      onExit: logout,
      onNotifications: () => setShowNotifications(true),
      onMenu: () => setShowDrawer(true)
    }), /*#__PURE__*/React.createElement(Drawer, {
      open: showDrawer,
      onClose: () => setShowDrawer(false),
      userName: userName,
      onLogout: logout,
      onSettings: () => setShowSettings(true),
      onStories: () => {
        onExit();
        setTimeout(() => {
          const el = document.getElementById("testimonials");
          if (el) el.scrollIntoView({
            behavior: "smooth"
          });
        }, 400);
      }
    }), showSettings && /*#__PURE__*/React.createElement(SettingsSheet, {
      userName: userName,
      onClose: () => setShowSettings(false),
      onLogout: logout,
      onManage: () => {
        setShowSettings(false);
        setShowCodeEntry(true);
      }
    }), access && access.status === "trial" && /*#__PURE__*/React.createElement(TrialBanner, {
      daysLeft: access.daysLeft
    }), /*#__PURE__*/React.createElement(StageNav, {
      stages: STAGES,
      progress: progress,
      current: current,
      onSelect: setCurrent
    }), showNotifications && /*#__PURE__*/React.createElement(NotificationsPanel, {
      onClose: () => setShowNotifications(false)
    }), (expired || showCodeEntry) && /*#__PURE__*/React.createElement(AccessGate, {
      expired: expired,
      onUnlocked: next => {
        setAccess(next);
        setShowCodeEntry(false);
      },
      onClose: () => setShowCodeEntry(false),
      onExit: onExit,
      onShowSummary: () => setShowSummary(true)
    }), showSummary && /*#__PURE__*/React.createElement(JourneySummary, {
      onClose: () => setShowSummary(false),
      onExit: onExit
    }), current === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto px-5 py-6 bg-ink-50"
    }, /*#__PURE__*/React.createElement(TodayStage, {
      firstName: (userName || "").split(" ")[0],
      onNavigateStage: navigateToStage,
      onNeedHuman: () => window.open(CALENDAR_LINK, "_blank", "noopener")
    })) : current === 9 ? /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto px-5 py-6"
    }, /*#__PURE__*/React.createElement(VirtualSessionStage, {
      paid: paid,
      onNavigateStage: navigateToStage
    })) : current === 4 ? /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto px-4 py-6 bg-ink-50 space-y-6"
    }, /*#__PURE__*/React.createElement(SmartRecommendation, {
      onGo: navigateToStage
    }), /*#__PURE__*/React.createElement(ClinicalInsights, null), /*#__PURE__*/React.createElement(MoodTracker, null), /*#__PURE__*/React.createElement(ResilienceDashboard, {
      progress: progress,
      sessions: loadSessions(),
      data: serverDashboard,
      onNavigateStage: navigateToStage
    })) : current === 6 ? /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto px-5 py-6"
    }, /*#__PURE__*/React.createElement(MaterialsStage, null)) : current === 7 ? /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto px-5 py-6"
    }, /*#__PURE__*/React.createElement(TasksStage, null)) : /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto px-5 py-6"
    }, current === 1 ? /*#__PURE__*/React.createElement(AnchorStage, {
      onComplete: () => {
        unlock(1, 2);
        setCurrent(2);
      }
    }) : null, current === 2 ? /*#__PURE__*/React.createElement(BorderStage, {
      onComplete: () => {
        unlock(2, 3);
        setCurrent(3);
      }
    }) : null, current === 3 ? /*#__PURE__*/React.createElement(GroundStage, {
      onComplete: () => unlock(3, 3)
    }) : null));
  }
  window.MemberArea = MemberArea;
})();
