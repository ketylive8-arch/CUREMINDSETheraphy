// CureMindset — Member Area / personal protocol app (Babel-in-browser).
// Wrapped in an IIFE so top-level declarations never collide with app.js's globals;
// communication with app.js happens only through window.* (Icon, Button, CONTACT).
(function () {
  "use strict";

  const { useState, useEffect } = React;
  const Icon = window.Icon;
  const Button = window.Button;
  const ResilienceDashboard = window.ResilienceDashboard;

  /* ---------------------------------------------------------------- */
  /* Persistence                                                       */
  /* ---------------------------------------------------------------- */

  const PROGRESS_KEY = "cm_protocol_progress";
  const SESSIONS_KEY = "cm_grounding_sessions";

  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      return { unlocked: raw && raw.unlocked ? raw.unlocked : 1, completed: (raw && raw.completed) || [] };
    } catch (e) {
      return { unlocked: 1, completed: [] };
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
      list.push({ date: new Date().toISOString(), score });
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

  const AGE_GROUP_KEY = "cm_age_group_set";
  const AUTH_TOKEN_KEY = "cm_auth_token";
  const AUTH_NAME_KEY = "cm_auth_name";

  function getAuthToken() {
    try { return localStorage.getItem(AUTH_TOKEN_KEY) || ""; } catch (e) { return ""; }
  }
  function setAuth(token, name) {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      if (name) localStorage.setItem(AUTH_NAME_KEY, name);
    } catch (e) {}
  }
  function clearAuth() {
    try { localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem(AUTH_NAME_KEY); } catch (e) {}
  }

  // חבר מביא חבר — קולטים ?ref= מהקישור בכניסה ושומרים אותו עד ההרשמה.
  const REF_KEY = "cm_ref";
  (function captureRef() {
    try {
      const r = (new URLSearchParams(location.search).get("ref") || "").trim();
      if (r) localStorage.setItem(REF_KEY, r.toUpperCase().slice(0, 12));
    } catch (e) {}
  })();
  function getRef() {
    try { return localStorage.getItem(REF_KEY) || ""; } catch (e) { return ""; }
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
        q.delete("cm_oauth"); q.delete("cm_name"); q.delete("cm_oauth_error");
        const clean = location.pathname + (q.toString() ? "?" + q.toString() : "") + location.hash;
        history.replaceState(null, "", clean);
      }
    } catch (e) {}
  })();

  // התחברות חברתית — מציג כפתור Google/Facebook רק אם הספק מוגדר בשרת.
  // כך אין "בקרוב": הכפתור מופיע אוטומטית ברגע שקטי מוסיפה את המפתחות ב-Render.
  const GoogleMark = () => (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
  const FacebookMark = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.36c0-3.01 1.79-4.68 4.53-4.68 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z"/>
    </svg>
  );
  function SocialLogin() {
    const [providers, setProviders] = useState([]);
    useEffect(() => {
      let alive = true;
      const defs = [
        { id: "google", label: "המשך עם Google", Mark: GoogleMark },
        { id: "facebook", label: "המשך עם Facebook", Mark: FacebookMark },
      ];
      Promise.all(
        defs.map((d) => fetch("/api/auth/oauth/" + d.id).then((r) => (r.ok ? d : null)).catch(() => null))
      ).then((res) => { if (alive) setProviders(res.filter(Boolean)); });
      return () => { alive = false; };
    }, []);
    function go(id) {
      fetch("/api/auth/oauth/" + id)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && d.url) window.location.href = d.url; })
        .catch(() => {});
    }
    if (!providers.length) return null;
    return (
      <div className="au-social">
        <div className="au-social__div">או</div>
        {providers.map((p) => (
          <button key={p.id} type="button" className="au-social__btn" onClick={() => go(p.id)}>
            <p.Mark /> <span>{p.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // חבר מביא חבר — כרטיס שיתוף ויראלי: שיתוף בוואטסאפ + קישור הפניה אישי.
  function ShareInvite() {
    const [me, setMe] = useState(null);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
      let alive = true;
      fetch("/api/auth/me", { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (alive) setMe(d); })
        .catch(() => {});
      return () => { alive = false; };
    }, []);
    const origin = (typeof location !== "undefined" && location.origin) || "https://ketysegev.com";
    const link = me && me.refCode ? `${origin}/?ref=${me.refCode}` : origin;
    const waText = `גיליתי משהו ששווה — CURE MINDSET של קטי שגב, שיטה לחוסן רגשי וביטחון עצמי 🌿 מוזמנ/ת להתחיל כאן: ${link}`;
    const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    function copyLink() {
      try {
        navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
      } catch (e) {}
    }
    return (
      <div className="cm-slide-up-in rounded-3xl border border-gold-200 bg-white px-5 py-5 space-y-3">
        <p className="font-heading font-bold text-[15px] text-ink-800">אהבת? שתפי את זה הלאה 🌿</p>
        <p className="text-[13px] text-ink-600 leading-relaxed">
          כל מי שיצטרפ/ה דרך הקישור האישי שלך יתחיל/תתחיל את המסע — ואת עוזרת להם לצמוח.
        </p>
        <a
          href={waHref} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-heading font-bold text-[14px] hover:opacity-90 transition-opacity"
        >
          <Icon name="whatsapp" size={18} /> שיתוף בוואטסאפ
        </a>
        <div className="flex items-center gap-2">
          <input
            readOnly value={link} dir="ltr" onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-[12.5px] text-ink-600 outline-none"
          />
          <button
            type="button" onClick={copyLink}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gold-500 text-white font-heading font-bold text-[13px] hover:bg-gold-600 transition-colors"
          >
            {copied ? "הועתק ✓" : "העתקה"}
          </button>
        </div>
        {me && me.referrals > 0 ? (
          <p className="text-[12.5px] text-gold-700 font-semibold text-center">כבר הזמנת {me.referrals} אנשים — כל הכבוד! 💛</p>
        ) : null}
      </div>
    );
  }

  // "היעדים שלי" — יעדים אישיים (מודל האדם השלם) + מעקב התקדמות. נשמר בכרטיס הלקוח.
  function GoalsCard() {
    const [goals, setGoals] = useState([]);
    const [areas, setAreas] = useState([]);
    const [title, setTitle] = useState("");
    const [area, setArea] = useState("");
    const [busy, setBusy] = useState(false);

    function load() {
      fetch("/api/goals", { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : { goals: [], areas: [] }))
        .then((d) => { setGoals(d.goals || []); setAreas(d.areas || []); setArea((a) => a || (d.areas && d.areas[0]) || ""); })
        .catch(() => {});
    }
    useEffect(load, []);

    function addGoal(e) {
      e.preventDefault();
      if (title.trim().length < 2 || busy) return;
      setBusy(true);
      fetch("/api/goals", { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ title, area }) })
        .then((r) => r.json()).then(() => { setTitle(""); load(); }).finally(() => setBusy(false));
    }
    function bump(g, delta) {
      const p = Math.max(0, Math.min(100, g.progress + delta));
      fetch(`/api/goals/${g.id}`, { method: "PUT", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ progress: p }) })
        .then((r) => r.json()).then(load);
    }
    function remove(g) {
      fetch(`/api/goals/${g.id}`, { method: "DELETE", headers: authHeaders() }).then(load);
    }

    const active = goals.filter((g) => g.status !== "archived");
    return (
      <div className="cm-slide-up-in rounded-3xl border border-gold-200 bg-white px-5 py-5 space-y-3.5">
        <div>
          <p className="font-heading font-bold text-[15px] text-ink-800">🎯 היעדים שלי</p>
          <p className="text-[12.5px] text-ink-500 mt-1">2–5 יעדים אישיים שאנחנו עוקבים אחריהם יחד — הצמיחה שלך, מדידה.</p>
        </div>

        {active.map((g) => (
          <div key={g.id} className="rounded-2xl bg-gold-50 border border-gold-100 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-heading font-semibold text-[14px] text-ink-800 leading-snug">{g.title}</p>
                <span className="text-[11.5px] text-gold-700 font-medium">{g.area}</span>
              </div>
              <button type="button" onClick={() => remove(g)} aria-label="מחיקת יעד" className="shrink-0 text-ink-300 hover:text-red-500 transition-colors">
                <Icon name="trash-2" size={15} />
              </button>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full rounded-full bg-gold-500 transition-all duration-500" style={{ width: `${g.progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1.5">
                <button type="button" onClick={() => bump(g, -10)} className="w-7 h-7 rounded-lg bg-white border border-ink-200 text-ink-600 font-bold hover:border-gold-400">−</button>
                <button type="button" onClick={() => bump(g, 10)} className="w-7 h-7 rounded-lg bg-white border border-ink-200 text-ink-600 font-bold hover:border-gold-400">+</button>
              </div>
              <span className="text-[12.5px] font-heading font-bold text-gold-700">{g.progress}%{g.status === "done" ? " ✓ הושלם" : ""}</span>
            </div>
          </div>
        ))}

        {active.length < 5 && (
          <form onSubmit={addGoal} className="space-y-2 pt-1">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="יעד חדש (למשל: לומר את דעתי בלי לחשוש)"
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-300 outline-none focus:border-gold-500"
            />
            <div className="flex gap-2">
              <select value={area} onChange={(e) => setArea(e.target.value)} className="flex-1 min-w-0 rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-[13px] text-ink-700 outline-none focus:border-gold-500">
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button type="submit" disabled={busy || title.trim().length < 2} className="shrink-0 px-4 py-2.5 rounded-xl bg-gold-500 text-white font-heading font-bold text-[13px] hover:bg-gold-600 transition-colors disabled:opacity-40">
                הוספה
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }
  // כותרות לכל קריאה לשרת: מזהה מכשיר + אסימון התחברות (אם מחוברים).
  function authHeaders(extra) {
    const h = Object.assign({ "X-Device-Token": getDeviceToken() }, extra || {});
    const t = getAuthToken();
    if (t) h["X-Auth-Token"] = t;
    return h;
  }

  /* ---------------------------------------------------------------- */
  /* Age group onboarding                                              */
  /* ---------------------------------------------------------------- */

  function AgeGroupOnboarding({ onDone }) {
    const [selected, setSelected] = useState(null);
    const [saving, setSaving] = useState(false);

    function confirm() {
      if (!selected) return;
      setSaving(true);
      fetch("/api/profile", {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ageGroup: selected }),
      })
        .catch(() => {})
        .finally(() => {
          localStorage.setItem(AGE_GROUP_KEY, "1");
          onDone(selected);
        });
    }

    const options = [
      { value: "adult", label: "מבוגר/ת", desc: "18+", icon: "user-round" },
      { value: "youth", label: "נוער", desc: "עד גיל 18", icon: "users" },
    ];

    return (
      <div className="absolute inset-0 z-[70] bg-white flex flex-col items-center gap-6 px-8 py-10 text-center overflow-y-auto" dir="rtl">
        <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center mx-auto">
          <Icon name="sparkles" size={26} className="text-gold-600" />
        </div>
        <div>
          <p className="font-heading font-bold text-[18px] text-ink-800">ברוכ/ה הבא/ה לאזור האישי</p>
          <p className="text-[13px] text-ink-500 mt-1">כדי שאתאים את השפה והתכנים עבורך, ספר/י לי מי את/ה:</p>
        </div>
        <div className="flex gap-4 w-full">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`flex-1 flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${
                selected === opt.value
                  ? "border-gold-500 bg-gold-50"
                  : "border-ink-200 bg-ink-50 hover:border-gold-300"
              }`}
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center ${selected === opt.value ? "bg-gold-500 text-white" : "bg-ink-200 text-ink-600"}`}>
                <Icon name={opt.icon} size={20} />
              </span>
              <span className={`font-heading font-bold text-[15px] ${selected === opt.value ? "text-gold-700" : "text-ink-700"}`}>{opt.label}</span>
              <span className="text-[12px] text-ink-400">{opt.desc}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!selected || saving}
          onClick={confirm}
          className="w-full py-3.5 rounded-2xl bg-gold-500 text-white font-heading font-bold text-[15px] disabled:opacity-40 transition-opacity hover:bg-gold-600"
        >
          {saving ? "שומר..." : "מתחילים"}
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Access gate — 14-day trial + personal access code                 */
  /* ---------------------------------------------------------------- */

  // Shown as a blocking overlay when the trial expired (dismissible=false), or as a
  // dismissible sheet when the client taps "יש לי קוד" from the trial banner.
  function AccessGate({ expired, onUnlocked, onClose, onExit, onShowSummary }) {
    const [code, setCode] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | error
    const [errorMsg, setErrorMsg] = useState("");

    function redeem() {
      const trimmed = code.trim();
      if (!trimmed || status === "loading") return;
      setStatus("loading");
      fetch("/api/access/redeem", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ code: trimmed }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error || "משהו השתבש, נסי שוב");
          onUnlocked(data);
        })
        .catch((e) => {
          setStatus("error");
          setErrorMsg(e.message);
        });
    }

    return (
      <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center gap-5 px-7 text-center" dir="rtl">
        <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center">
          <Icon name="shield-check" size={26} className="text-gold-600" />
        </div>
        <div>
          <p className="font-heading font-bold text-[18px] text-ink-800">
            {expired ? "תקופת ההתנסות שלך הסתיימה" : "הפעלת קוד אישי"}
          </p>
          <p className="text-[13.5px] text-ink-500 mt-1.5 leading-relaxed">
            {expired
              ? "כדי להמשיך את המסע — בחרי מסלול ובצעי תשלום, ומיד תקבלי ממני קוד אישי לכניסה."
              : "קיבלת קוד אישי מקטי? הקלידי אותו כאן והגישה שלך תיפתח."}
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setStatus("idle"); }}
            onKeyDown={(e) => e.key === "Enter" && redeem()}
            placeholder="CM-XXXX-XXXX"
            dir="ltr"
            className="w-full text-center tracking-widest font-heading font-bold text-[16px] py-3.5 rounded-2xl border-2 border-ink-200 focus:border-gold-500 outline-none text-ink-800 placeholder:text-ink-300"
          />
          {status === "error" && <p className="text-[13px] text-red-500 font-medium">{errorMsg}</p>}
          <button
            type="button"
            disabled={!code.trim() || status === "loading"}
            onClick={redeem}
            className="w-full py-3.5 rounded-2xl bg-gold-500 text-white font-heading font-bold text-[15px] disabled:opacity-40 transition-opacity hover:bg-gold-600"
          >
            {status === "loading" ? "בודק..." : "הפעלת הקוד"}
          </button>
        </div>

        {expired ? (
          <div className="w-full flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onShowSummary}
              className="w-full py-3 rounded-2xl bg-gold-50 border border-gold-300 text-gold-700 font-heading font-bold text-[14px] hover:bg-gold-100 transition-colors"
            >
              מה עברתי במסע — הסיכום שלי
            </button>
            <button
              type="button"
              onClick={onExit}
              className="w-full py-3 rounded-2xl bg-gold-500 text-white font-heading font-semibold text-[14px] hover:bg-gold-600 transition-colors"
            >
              לצפייה במסלולים ולתשלום
            </button>
            <a
              href="https://wa.me/972543032349?text=%D7%94%D7%99%D7%99%20%D7%A7%D7%98%D7%99!%20%D7%A1%D7%99%D7%99%D7%9E%D7%AA%D7%99%20%D7%90%D7%AA%20%D7%AA%D7%A7%D7%95%D7%A4%D7%AA%20%D7%94%D7%A0%D7%99%D7%A1%D7%99%D7%95%D7%9F%20%D7%95%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%94%D7%9E%D7%A9%D7%99%D7%9A%20%F0%9F%8C%BF"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl border border-gold-300 text-gold-700 bg-gold-50 font-heading font-semibold text-[14px] hover:bg-gold-100 transition-colors"
            >
              דברי איתי בוואטסאפ
            </a>
          </div>
        ) : (
          <button type="button" onClick={onClose} className="text-[13px] text-ink-400 underline">
            סגירה
          </button>
        )}
      </div>
    );
  }

  // End-of-trial motivational summary: what the client did, wins, patterns, and a
  // warm CTA to continue — reachable from the paywall gate and the trial banner.
  function JourneySummary({ onClose, onExit }) {
    const [data, setData] = useState(null);

    useEffect(() => {
      fetch("/api/journey-summary", { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then(setData)
        .catch(() => {});
    }, []);

    if (!data) {
      return (
        <div className="absolute inset-0 z-50 bg-white flex items-center justify-center" dir="rtl">
          <p className="text-[13px] text-ink-400">אוספת את המסע שלך...</p>
        </div>
      );
    }

    const s = data.stats;
    const statItems = [
      { value: data.journeyDay, label: "ימים במסע" },
      { value: s.checkins, label: "שיחות צ'ק-אין" },
      { value: s.groundingSessions, label: "תרגילי קרקוע" },
      { value: s.tasksDone, label: "משימות שהושלמו" },
    ].filter((it) => it.value > 0 || it.label === "ימים במסע");

    const emailBody = [
      `סיכום המסע שלי ב-CureMindset · ${data.journeyDay} ימים`,
      "",
      `שיחות צ'ק-אין: ${s.checkins}`,
      `תרגילי קרקוע: ${s.groundingSessions}${s.avgRelief ? ` (ירידה ממוצעת של ${s.avgRelief}% בעומס)` : ""}`,
      `משימות יומיות שהושלמו: ${s.tasksDone} מתוך ${s.tasksTotal}`,
      "",
      data.wins.length ? "הניצחונות שלי:\n" + data.wins.map((w) => `• ${w.title || w.text}`).join("\n") : "",
      data.patterns.length ? "\nדפוסים שזיהינו יחד:\n" + data.patterns.map((p) => `• ${p.title}`).join("\n") : "",
      "",
      "CureMindset · שיטת קטי שגב",
    ].join("\n");
    const mailtoHref = `mailto:?subject=${encodeURIComponent("סיכום המסע שלי ב-CureMindset")}&body=${encodeURIComponent(emailBody)}`;

    return (
      <div className="absolute inset-0 z-50 bg-white overflow-y-auto" dir="rtl">
        <div className="px-6 py-8 flex flex-col gap-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-3">
              <Icon name="sparkles" size={26} className="text-gold-600" />
            </div>
            <p className="font-heading font-extrabold text-[22px] text-ink-800">המסע שלך עד כאן</p>
            <p className="text-[13.5px] text-ink-500 mt-1">תראי כמה עשית — כל אחד מהמספרים האלה הוא בחירה שלך בעצמך.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {statItems.map((it) => (
              <div key={it.label} className="rounded-2xl bg-gold-50 border border-gold-200 py-4 text-center">
                <p className="font-heading font-extrabold text-[28px] text-gold-600 leading-none">{it.value}</p>
                <p className="text-[12.5px] text-ink-500 mt-1.5">{it.label}</p>
              </div>
            ))}
          </div>

          {s.avgRelief != null && (
            <div className="rounded-2xl bg-gold-500 py-4 px-5 text-center">
              <p className="font-heading font-extrabold text-[26px] text-white leading-none">{s.avgRelief}%</p>
              <p className="text-[12.5px] text-white mt-1.5">ירידה ממוצעת בעומס הרגשי אחרי תרגול</p>
            </div>
          )}

          {data.wins.length > 0 && (
            <div>
              <p className="font-heading font-bold text-[15px] text-ink-800 mb-2.5">הניצחונות שלך</p>
              <ul className="flex flex-col gap-2">
                {data.wins.map((w, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-xl bg-ink-50 px-3.5 py-3 text-[13.5px] text-ink-700 leading-snug">
                    <Icon name="shield-check" size={16} className="text-gold-500 mt-0.5 shrink-0" />
                    <span>
                      <span className="font-semibold">{w.title || w.text}</span>
                      {w.description ? <span className="text-ink-500"> — {w.description}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.patterns.length > 0 && (
            <div>
              <p className="font-heading font-bold text-[15px] text-ink-800 mb-2.5">דפוסים שזיהינו יחד</p>
              <ul className="flex flex-col gap-2">
                {data.patterns.map((p, i) => (
                  <li key={i} className="rounded-xl border border-ink-100 px-3.5 py-3 text-[13.5px] text-ink-600 leading-snug">
                    <span className="font-semibold text-ink-800">{p.title}</span>
                    {p.description ? ` — ${p.description}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl bg-gold-50 border border-gold-200 px-5 py-5 text-center">
            <p className="font-heading font-bold text-[16px] text-ink-800">זה רק השער הראשון של המסע</p>
            <p className="text-[13px] text-ink-600 mt-1.5 leading-relaxed">
              העבודה האמיתית על הדפוס שזיהינו מתחילה עכשיו. בליווי הדיגיטלי נמשיך יחד — יום אחר יום, בקצב שלך.
            </p>
            <button
              type="button"
              onClick={onExit}
              className="w-full mt-4 py-3.5 rounded-full bg-gold-500 text-white font-heading font-bold text-[15px] hover:bg-gold-600 transition-colors"
            >
              להמשך המסע — למסלולים
            </button>
            <a href={mailtoHref} className="block w-full mt-2.5 py-3 rounded-full border border-gold-300 text-gold-700 font-heading font-semibold text-[13.5px] hover:bg-gold-100 transition-colors">
              שליחת הסיכום למייל שלי
            </a>
          </div>

          <button type="button" onClick={onClose} className="text-[13px] text-ink-400 underline mx-auto pb-2">
            חזרה
          </button>
        </div>
      </div>
    );
  }

  // Thin banner above the stages while on a free trial: warm days-left note only.
  // (The access-code entry lives in the settings sheet — a new client shouldn't be
  // confronted with a "personal code" prompt they don't have yet.)
  function TrialBanner({ daysLeft }) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gold-50 border-b border-gold-200">
        <span className="text-[12.5px] text-gold-700 font-medium">
          🌿 המסע שלך פתוח — {daysLeft === 1 ? "יום אחרון בהתנסות" : `נותרו ${daysLeft} ימי התנסות`}
        </span>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage metadata                                                    */
  /* ---------------------------------------------------------------- */

  const STAGES = [
    { id: 1, icon: "anchor", title: "עוגן", subtitle: "יצירת יציבות ראשונית ועוגן רגשי" },
    { id: 2, icon: "compass", title: "גבול ההבחנה", subtitle: "הפרדה בין רגש, מחשבה ומציאות" },
    { id: 3, icon: "footprints", title: "קרקוע", subtitle: "חזרה לגוף ולכאן ועכשיו" },
    { id: 4, icon: "sparkles", title: "מדד חוסן", subtitle: "השיקוף האישי שלך", alwaysUnlocked: true },
    { id: 5, icon: "message-circle", title: "צ'ק-אין", subtitle: "שיחה חמה איתי, ברגע הזה", alwaysUnlocked: true },
    { id: 6, icon: "book-open", title: "החומרים שלי", subtitle: "חומרים שהוקצו לך אישית", alwaysUnlocked: true },
    { id: 7, icon: "check-circle", title: "משימות יומיות", subtitle: "המשימות שנקבעו לך מהצ'ק-אין", alwaysUnlocked: true },
    { id: 8, icon: "graduation-cap", title: "התוכנית שלי", subtitle: "מסע CURE MINDSET · 14 יום במודולים", alwaysUnlocked: true },
  ];

  /* ---------------------------------------------------------------- */
  /* Shared bits                                                       */
  /* ---------------------------------------------------------------- */

  function Field({ icon, label, value, onChange, placeholder, textarea }) {
    const inputClass =
      "w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300";
    return (
      <label className="block">
        <span className="flex items-center gap-2 mb-2 text-[13px] font-heading font-semibold text-ink-700">
          {icon ? <Icon name={icon} size={16} className="text-gold-600 shrink-0" /> : null}
          {label}
        </span>
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClass}
          />
        )}
      </label>
    );
  }

  function Chip({ active, onClick, children }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3.5 py-2 rounded-full text-[13px] font-heading font-semibold border transition-colors ${
          active ? "bg-gold-500 text-white border-gold-500" : "bg-white text-ink-600 border-ink-200 hover:border-gold-300"
        }`}
      >
        {children}
      </button>
    );
  }

  function StepDots({ total, current }) {
    return (
      <div className="flex items-center justify-center gap-1.5 mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i + 1 === current ? "w-6 bg-gold-500" : "w-1.5 bg-ink-200"}`}
          />
        ))}
      </div>
    );
  }

  function BreathingOrb({ label }) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="cm-breathe w-24 h-24 rounded-full bg-gradient-to-br from-gold-200 to-gold-400 shadow-soft flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/70" />
        </div>
        {label ? <p className="mt-4 text-[13px] text-ink-500 text-center">{label}</p> : null}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 1 — Anchoring                                                */
  /* ---------------------------------------------------------------- */

  function AnchorStage({ onComplete }) {
    const [anchorWord, setAnchorWord] = useState("");
    const canContinue = anchorWord.trim().length >= 2;
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">בניית עוגן רגשי</h3>
          <p className="text-[14px] text-ink-600 leading-relaxed">
            לפני שמתחילים תהליך, חשוב לבנות עוגן אחד יציב — תחושה, מילה או נשימה שאפשר לחזור אליה בכל רגע שמרגישים גודש.
          </p>
        </div>
        <BreathingOrb label="נשמו לאט: שאיפה ל-4 שניות, נשיפה ל-6 שניות. עקבו אחרי קצב העיגול." />
        <Field
          icon="anchor"
          label="המילה או התחושה שמייצגת עבורך יציבות"
          value={anchorWord}
          onChange={setAnchorWord}
          placeholder="לדוגמה: 'אני יציב/ה', 'שורש', 'בית'"
        />
        <Button
          as="button"
          type="button"
          variant="primary"
          className="w-full"
          icon="arrow-left"
          iconPos="end"
          disabled={!canContinue}
          onClick={() => canContinue && onComplete(anchorWord.trim())}
          style={!canContinue ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
        >
          השלמתי את העוגן · למעבר לשלב הבא
        </Button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 2 — Differentiation Border                                  */
  /* ---------------------------------------------------------------- */

  function BorderStage({ onComplete }) {
    const [emotion, setEmotion] = useState("");
    const [thought, setThought] = useState("");
    const [reality, setReality] = useState("");
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">גבול ההבחנה</h3>
          <p className="text-[14px] text-ink-600 leading-relaxed">
            כשמרגישים גודש, קל לבלבל בין שלושה דברים שונים. בואו נפריד אותם, אחד אחד.
          </p>
        </div>
        <div className="space-y-4">
          <Field
            icon="heart"
            label="הרגש — מה אני מרגיש/ה עכשיו?"
            value={emotion}
            onChange={setEmotion}
            placeholder="לדוגמה: חרדה, עצב, כעס, לחץ"
            textarea
          />
          <Field
            icon="brain"
            label="המחשבה — מה עולה לי בראש?"
            value={thought}
            onChange={setThought}
            placeholder="לדוגמה: 'אני לא אצליח', 'משהו רע יקרה'"
            textarea
          />
          <Field
            icon="compass"
            label="המציאות — מה קורה בפועל, בלי פרשנות?"
            value={reality}
            onChange={setReality}
            placeholder="לדוגמה: 'אני יושב/ת בבית, בטוח/ה, ולפניי מבחן מחר'"
            textarea
          />
        </div>
        <p className="text-[13px] text-ink-500 bg-gold-50 border border-gold-100 rounded-2xl px-4 py-3 leading-relaxed">
          המחשבה היא לא עובדה, והרגש הוא לא המציאות — שניהם תגובה זמנית שעוברת.
        </p>
        <Button as="button" type="button" variant="primary" className="w-full" icon="arrow-left" iconPos="end" onClick={() => onComplete({ emotion, thought, reality })}>
          סיימתי את ההבחנה · למעבר לקרקוע
        </Button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 3 — Grounding (3-2-1 protocol)                               */
  /* ---------------------------------------------------------------- */

  const TENSION_AREAS = ["כתפיים", "חזה", "בטן", "צוואר וגרון", "ידיים", "ראש"];

  function GroundStage({ onComplete }) {
    const [step, setStep] = useState(1);
    const [tension, setTension] = useState([]);
    const [seen, setSeen] = useState(["", "", ""]);
    const [heard, setHeard] = useState(["", ""]);
    const [felt, setFelt] = useState("");
    const [score, setScore] = useState(50);
    const [saved, setSaved] = useState(false);
    const [sessionsCount, setSessionsCount] = useState(() => loadSessions().length);

    function toggleTension(area) {
      setTension((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
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
      setSessionsCount((c) => c + 1);
      setSaved(true);
      onComplete();
    }

    return (
      <div className="space-y-5">
        <StepDots total={4} current={step} />

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">שלב 1 · בדיקת גוף</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">
                הניחו את שתי כפות הרגליים על הרצפה. הרגישו את המשקל יורד מטה, ואת המגע של הרגליים עם הקרקע.
              </p>
            </div>
            <div>
              <p className="text-[13px] font-heading font-semibold text-ink-700 mb-2.5">באיזה אזור בגוף מורגש מתח? (אפשר לבחור כמה)</p>
              <div className="flex flex-wrap gap-2">
                {TENSION_AREAS.map((area) => (
                  <Chip key={area} active={tension.includes(area)} onClick={() => toggleTension(area)}>
                    {area}
                  </Chip>
                ))}
              </div>
            </div>
            <Button as="button" type="button" variant="primary" className="w-full" icon="arrow-left" iconPos="end" onClick={() => setStep(2)}>
              המשך לשלב 2
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">שלב 2 · תרגול 3-2-1</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">שימו לב, בלי למהר, לסביבה שלכם דרך החושים.</p>
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700">
                <Icon name="eye" size={16} className="text-gold-600" /> 3 דברים שאתם רואים
              </p>
              {seen.map((v, i) => (
                <input
                  key={i}
                  type="text"
                  value={v}
                  onChange={(e) => updateAt(seen, setSeen, i, e.target.value)}
                  placeholder={`דבר נראה ${i + 1}`}
                  className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
                />
              ))}
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700">
                <Icon name="ear" size={16} className="text-gold-600" /> 2 דברים שאתם שומעים
              </p>
              {heard.map((v, i) => (
                <input
                  key={i}
                  type="text"
                  value={v}
                  onChange={(e) => updateAt(heard, setHeard, i, e.target.value)}
                  placeholder={`קול נשמע ${i + 1}`}
                  className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
                />
              ))}
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700">
                <Icon name="hand" size={16} className="text-gold-600" /> דבר אחד שאתם מרגישים במגע
              </p>
              <input
                type="text"
                value={felt}
                onChange={(e) => setFelt(e.target.value)}
                placeholder="לדוגמה: מרקם הבד, טמפרטורת האוויר"
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
              />
            </div>
            <div className="flex gap-3">
              <Button as="button" type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                חזרה
              </Button>
              <Button as="button" type="button" variant="primary" className="flex-1" icon="arrow-left" iconPos="end" onClick={() => setStep(3)}>
                המשך
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">שלב 3 · עוגן הקרקוע</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">חזרו על המשפט לעצמכם, פעמיים, בקול או בשקט.</p>
            </div>
            <BreathingOrb />
            <p className="text-center font-heading font-bold text-xl text-ink-800 leading-snug px-2">
              "אני כאן. עכשיו.
              <br />
              אני בטוח/ה ברגע הזה."
            </p>
            <div className="flex gap-3">
              <Button as="button" type="button" variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                חזרה
              </Button>
              <Button as="button" type="button" variant="primary" className="flex-1" icon="arrow-left" iconPos="end" onClick={() => setStep(4)}>
                סיימתי את התרגול
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">כמה ירד העומס הרגשי?</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">הזיזו את המחוון להערכה שלכם — אין תשובה נכונה או שגויה.</p>
            </div>
            <div className="bg-white rounded-2xl border border-ink-200 px-5 py-6">
              <p className="text-center font-heading font-bold text-3xl text-gold-600 mb-4">{score}%</p>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-gold-500"
                disabled={saved}
              />
              <div className="flex justify-between text-[11px] text-ink-400 mt-1.5">
                <span>0% · לא ירד</span>
                <span>100% · ירד לחלוטין</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[0, 25, 50, 75, 100].map((v) => (
                  <Chip key={v} active={score === v} onClick={() => !saved && setScore(v)}>
                    {v}%
                  </Chip>
                ))}
              </div>
            </div>

            {!saved ? (
              <Button as="button" type="button" variant="primary" className="w-full" icon="check-circle-2" onClick={handleSave}>
                שמירת התוצאה
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="flex items-center justify-center gap-2 text-[14px] font-heading font-semibold text-gold-700 bg-gold-50 border border-gold-100 rounded-2xl px-4 py-3">
                  <Icon name="check-circle-2" size={18} /> התוצאה נשמרה. השלמתם {sessionsCount} תרגולי קרקוע עד כה.
                </p>
                <Button as="button" type="button" variant="secondary" className="w-full" icon="rotate-ccw" onClick={resetForAnotherRound}>
                  תרגול קרקוע נוסף
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 5 — Conversational Check-in (Behavioral Health Check)       */
  /* ---------------------------------------------------------------- */

  function ListeningWaveform() {
    return (
      <div className="flex flex-col items-center justify-center py-16 cm-fade-in-soft">
        <div className="flex items-end gap-1.5 h-14">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="cm-wave-bar w-2 rounded-full bg-gradient-to-t from-gold-300 to-gold-500"
              style={{ height: "100%", animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
        <p className="mt-6 text-[13px] text-ink-400">מקשיבה לך ברגישות...</p>
      </div>
    );
  }

  function CheckInComposer({ text, setText, onSend, disabled }) {
    const filled = text.trim().length > 0;
    return (
      <div className="cm-fade-in-soft" style={{ animationDelay: "0.15s" }}>
        <div
          className="relative rounded-3xl border backdrop-blur-xl transition-all duration-500"
          style={{
            borderColor: filled ? "rgba(211,168,87,0.65)" : "rgba(255,255,255,0.12)",
            boxShadow: filled ? "0 0 34px -6px rgba(211,168,87,0.45)" : "0 0 0 rgba(0,0,0,0)",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 4000))}
            placeholder="כתבי כאן בחופשיות, בלי לסנן את עצמך..."
            rows={5}
            disabled={disabled}
            className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed text-ink-800 placeholder:text-ink-400 focus:outline-none"
          />
          <div className="flex items-center justify-between px-4 pb-3.5">
            <span className="text-[11px] text-ink-300">{text.length}/4000</span>
            <button
              type="button"
              onClick={onSend}
              disabled={!filled || disabled}
              aria-label="שליחה"
              className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 text-ink-800 shadow-soft transition-all ${
                filled && !disabled ? "cm-send-pulse opacity-100 scale-100" : "opacity-35 scale-95"
              }`}
            >
              <Icon name="arrow-up" size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function TypedReply({ reply }) {
    const [typed, setTyped] = useState("");
    useEffect(() => {
      setTyped("");
      if (!reply) return;
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        setTyped(reply.slice(0, i));
        if (i >= reply.length) clearInterval(id);
      }, 18);
      return () => clearInterval(id);
    }, [reply]);

    return (
      <p className="text-[15px] leading-relaxed text-ink-700">
        {typed}
        {typed.length < reply.length ? <span className="cm-cursor-blink text-gold-400">▍</span> : null}
      </p>
    );
  }

  // פתיח קצר וממוקד על גמישות מוחית — נפתח כשנכנסים לצ'אט ה-AI, טקסט נקי בלי אימוג'ים.
  function NeuroplasticityIntro() {
    const [open, setOpen] = useState(false);
    return (
      <div className="cm-fade-in-soft mb-5 rounded-2xl border border-gold-200 bg-white backdrop-blur-xl overflow-hidden">
        <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-2 px-4 py-3.5 text-right">
          <span className="flex items-center gap-2">
            <Icon name="sparkles" size={14} className="text-gold-400 shrink-0" />
            <span className="font-heading font-semibold text-[14px] text-ink-800">רגע לפני שמתחילים — קצת על גמישות מוחית</span>
          </span>
          <Icon name={open ? "chevron-up" : "chevron-down"} size={16} className="text-ink-400 shrink-0" />
        </button>
        {open && (
          <div className="px-4 pb-4 text-[13.5px] leading-relaxed text-ink-600 space-y-3" dir="rtl">
            <p>
              המוח שלנו הוא איבר דינמי שמשתנה כל הזמן בתגובה לחוויות וללמידה. גמישות מוחית (Neuroplasticity) היא
              היכולת של המוח ליצור קשרים חדשים בין תאי עצב, לחזק קשרים קיימים ולשנות את מבנהו ותפקודו לאורך החיים.
            </p>
            <div>
              <p className="font-semibold text-ink-700 mb-1">איך זה קורה?</p>
              <p>כשאנחנו לומדים או חווים דברים חדשים, נוצרים קשרים חדשים בין תאי עצב. ככל שחוזרים על פעולה או מחשבה מסוימת, הקשרים מתחזקים — וכך המוח לומד, זוכר ומסתגל.</p>
            </div>
            <div>
              <p className="font-semibold text-ink-700 mb-1">מה משפיע על הגמישות המוחית?</p>
              <p>גיל (גבוהה יותר בגיל צעיר אך נמשכת גם בבגרות), סביבה עשירה בגירויים ותמיכה חברתית, פעילות גופנית סדירה, ותזונה מאוזנת.</p>
            </div>
            <p className="text-ink-500">
              בדיוק על העיקרון הזה בנויה שיטת CureMindset: כשמלמדים את המוח דפוסים חדשים, בעדינות ובעקביות — השינוי מחזיק. עכשיו, ספרי לי מה עובר עלייך.
            </p>
          </div>
        )}
      </div>
    );
  }

  // שלב 2 — פופאפ הסבר התהליך: מה קורה, ואיפה נכנס התשלום. מוצג בכניסה הראשונה.
  function ProcessIntro({ onStart }) {
    const name = (() => { try { return (localStorage.getItem(AUTH_NAME_KEY) || "").split(" ")[0]; } catch (e) { return ""; } })();
    const steps = [
      ["1", "אשאל אותך כמה שאלות", "על מה שאת מרגישה עכשיו — בגוף, ברגש ובמחשבות."],
      ["2", "תקבלי שיקוף אישי + צעד מעשי", "תובנה והכוונה מיד, מבוססות על השיטה של קטי."],
      ["3", "התוכנית המלאה נפתחת בהצטרפות", "התרגולים, החומרים האישיים והליווי המלא — עם ההצטרפות לתוכנית בתשלום."],
    ];
    return (
      <div
        className="absolute inset-0 z-40 flex flex-col items-center px-5 overflow-y-auto py-6"
        style={{ background: "rgba(253,251,247,0.98)", backdropFilter: "blur(3px)" }}
        dir="rtl"
      >
        <div className="w-full max-w-[340px] my-auto rounded-3xl bg-white border border-gold-200 shadow-[0_30px_70px_-30px_rgba(120,90,30,0.5)] p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center mx-auto mb-3">
            <Icon name="heart-handshake" size={26} />
          </div>
          <h3 className="font-heading font-extrabold text-[20px] text-ink-800">{name ? `היי ${name} 🌿 ככה זה עובד` : "איך זה עובד?"}</h3>
          <p className="text-[13px] text-ink-500 mt-1.5 mb-4">{name ? `שלושה צעדים פשוטים למסע האישי שלך, ${name}.` : "שלושה צעדים פשוטים למסע שלך עם CureMindset."}</p>
          <div className="space-y-3 text-right">
            {steps.map(([n, t, d]) => (
              <div key={n} className="flex gap-3 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-gold-500 text-white font-heading font-bold text-[13px] flex items-center justify-center">{n}</span>
                <div>
                  <p className="font-heading font-bold text-[13.5px] text-ink-800 leading-snug">{t}</p>
                  <p className="text-[12px] text-ink-500 leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button" onClick={onStart}
            className="w-full mt-5 py-3.5 rounded-2xl bg-gold-500 text-white font-heading font-bold text-[15px] hover:bg-gold-600 transition-colors"
          >
            בואו נתחיל 🌿
          </button>
          <p className="text-[10.5px] text-ink-400 mt-3 leading-relaxed">
            השירות אינו מהווה ייעוץ רפואי. בכל מצוקה יש לפנות לגורם מקצועי מוסמך.
          </p>
        </div>
      </div>
    );
  }

  function CheckInStage({ onDashboardUpdate, onNavigateStage }) {
    const [text, setText] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | done | error
    const [reply, setReply] = useState("");
    const [errMsg, setErrMsg] = useState("");
    const [dashboardData, setDashboardData] = useState(null);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showIntro, setShowIntro] = useState(() => {
      try { return !localStorage.getItem("cm_intro_seen"); } catch (e) { return true; }
    });
    function dismissIntro() {
      try { localStorage.setItem("cm_intro_seen", "1"); } catch (e) {}
      setShowIntro(false);
    }

    // פרופיל האבחון מההרשמה — מציג "המיקוד שלך" מותאם אישית (חיבור הרשמה→תוכן).
    const [profile, setProfile] = useState(null);
    useEffect(() => {
      fetch("/api/profile", { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d && d.assessment && (d.assessment.challenge || d.assessment.goal)) setProfile(d.assessment); })
        .catch(() => {});
    }, []);
    // המלצת מודול לפי האתגר שהוזן באבחון.
    function recommend(ch) {
      const c = ch || "";
      if (c.includes("חרד") || c.includes("עומס") || c.includes("הצפ")) return "מומלץ להתחיל ב‏עוגן‏ — יצירת יציבות וויסות ראשוני.";
      if (c.includes("ביצוע") || c.includes("דחיינ") || c.includes("כישל")) return "מומלץ להתחיל ב‏גבול ההבחנה‏ — הפרדת רגש ממחשבה ומעשה.";
      if (c.includes("ביקורת") || c.includes("פרפקצ") || c.includes("ספק")) return "מומלץ להתחיל ב‏דימוי עצמי‏ (שער 2 במסע) — בניית עוגן פנימי.";
      return "מומלץ להתחיל ב‏קרקוע‏ — חזרה לגוף ולכאן-ועכשיו.";
    }

    async function handleSend() {
      const trimmed = text.trim();
      if (!trimmed || status === "loading") return;
      setStatus("loading");
      setErrMsg("");
      setShowDashboard(false);
      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ text: trimmed }),
        });
        if (!res.ok) {
          // Surface WHY so it's clear what's blocking the AI (server sends a Hebrew reason).
          const errData = await res.json().catch(() => ({}));
          setErrMsg(
            res.status === 402
              ? (errData.error || "תקופת הניסיון הסתיימה — נדרש קוד גישה כדי להמשיך בליווי.") + " אפשר להזין קוד גישה במסך המסלולים."
              : errData.error ||
                  (res.status === 503
                    ? "מנוע ה-AI לא מחובר בשרת (חסר מפתח OPENAI_API_KEY ב-Render)."
                    : "מנוע ה-AI לא הצליח להשיב כרגע. נסי שוב עוד רגע.")
          );
          throw new Error("request failed");
        }
        const data = await res.json();
        setReply(data.reply || "תודה שחלקת את זה איתי. אני כאן.");
        setDashboardData(data.dashboard || null);
        if (onDashboardUpdate) onDashboardUpdate(data.dashboard || null);
        setStatus("done");
        setText("");
        setTimeout(() => setShowDashboard(true), 350);
      } catch (e) {
        setStatus("error");
      }
    }

    function startOver() {
      setStatus("idle");
      setReply("");
      setShowDashboard(false);
    }

    return (
      <div className="relative min-h-full overflow-hidden">
        {showIntro ? <ProcessIntro onStart={dismissIntro} /> : null}
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-gold-400/25 blur-3xl cm-glow-drift" />
        <div className="pointer-events-none absolute bottom-[-90px] -left-12 h-64 w-64 rounded-full bg-gold-300/15 blur-3xl cm-glow-drift-slow" />

        <div className="relative z-10 px-1 pb-4">
          {status === "idle" || status === "error" ? (
            <>
              <header className="mb-6 px-1 cm-fade-in-soft">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="message-circle" size={15} className="text-gold-400" />
                  <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-400">CureMindset · צ'ק-אין</span>
                </div>
                <p className="font-heading text-[18px] font-bold text-ink-800 leading-snug">
                  היי{profile && profile.name ? ` ${profile.name}` : ""}, אני כאן איתך.
                  <br />
                  ספרי לי איך עבר עלייך היום ומה שלומך עכשיו?
                </p>
              </header>
              {profile ? (
                <div className="cm-fade-in-soft mb-5 rounded-2xl border border-gold-200 bg-gold-50/70 px-4 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="sparkles" size={15} className="text-gold-500" />
                    <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-600">המיקוד שלך · מותאם אישית מהאבחון</span>
                  </div>
                  {profile.challenge ? <p className="text-[13.5px] text-ink-700"><b className="text-ink-800">האתגר שבחרת:</b> {profile.challenge}</p> : null}
                  {profile.goal ? <p className="text-[13.5px] text-ink-700 mt-1"><b className="text-ink-800">המטרה שלך:</b> {profile.goal}</p> : null}
                  <p className="text-[12.5px] text-gold-700 mt-2.5 leading-relaxed">{recommend(profile.challenge)}</p>
                </div>
              ) : null}
              <NeuroplasticityIntro />
              <CheckInComposer text={text} setText={setText} onSend={handleSend} disabled={status === "loading"} />
              {status === "error" ? (
                <div className="cm-fade-in-soft mt-5 rounded-2xl border border-ink-200 bg-white px-4 py-4 text-center">
                  <p className="text-[13px] leading-relaxed text-ink-600">{errMsg || "לא הצלחנו כרגע להתחבר אלייך — נסי שוב בעוד רגע."}</p>
                </div>
              ) : null}
            </>
          ) : null}

          {status === "loading" ? <ListeningWaveform /> : null}

          {status === "done" ? (
            <div className="space-y-6">
              <div className="cm-fade-in-soft rounded-3xl border border-gold-200 bg-white px-5 py-5 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-2.5">
                  <Icon name="sparkles" size={13} className="text-gold-400" />
                  <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-400">CureMindset</span>
                </div>
                <TypedReply reply={reply} />
              </div>

              {showDashboard && dashboardData ? (
                <div className="cm-slide-up-in">
                  <ResilienceDashboard data={dashboardData} onNavigateStage={onNavigateStage} />
                </div>
              ) : null}

              {showDashboard ? (
                <div className="cm-slide-up-in rounded-3xl border border-gold-400/30 bg-gold-400/[0.06] px-5 py-5 space-y-3.5">
                  <p className="font-heading font-bold text-[15px] text-ink-800">להעמיק את השינוי — הצעד הבא שלך</p>
                  <p className="text-[13px] text-ink-600 leading-relaxed">
                    קבלי את התרגול וההמלצה האישית ישירות לוואטסאפ, והצטרפי לליווי המלא של CureMindset כדי להפוך את זה לשינוי שמחזיק.
                  </p>
                  <a
                    href={`https://wa.me/972543032349?text=${encodeURIComponent("היי קטי! סיימתי שיחת ייעוץ דיגיטלית ואשמח לקבל את התרגול, הליווי וההמלצה האישית")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#25D366] text-white font-heading font-bold text-[14px] hover:opacity-90 transition-opacity"
                  >
                    <Icon name="whatsapp" size={18} /> קבלת התרגול והליווי בוואטסאפ
                  </a>
                  <a
                    href="/#plans" target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gold-500 text-white font-heading font-bold text-[14px] hover:bg-gold-600 transition-colors"
                  >
                    להצטרפות לתוכניות הליווי המלאות
                  </a>
                </div>
              ) : null}

              {showDashboard ? <GoalsCard /> : null}
              {showDashboard ? <ShareInvite /> : null}

              {showDashboard ? (
                <Button as="button" type="button" variant="secondary" className="w-full" icon="message-circle" onClick={startOver}>
                  שיחה נוספת
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 6 — Client Resources & Vault (materials assigned by therapist) */
  /* ---------------------------------------------------------------- */

  const MATERIAL_TYPE_META = {
    lesson: { icon: "book-open", label: "שיעור קצר" },
    audio: { icon: "headphones", label: "קובץ שמע" },
    worksheet: { icon: "file-text", label: "דף עבודה" },
    summary: { icon: "book-open", label: "סיכום פגישה" },
    other: { icon: "file-text", label: "חומר" },
  };

  function MaterialCard({ material }) {
    const meta = MATERIAL_TYPE_META[material.type] || MATERIAL_TYPE_META.other;
    const isLesson = material.type === "lesson";
    const hasUrl = material.url && /^(https?:|\/uploads)/.test(material.url);
    return (
      <div className="cm-fade-in-soft rounded-2xl border border-ink-100 bg-white px-4 py-4 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
            <Icon name={meta.icon} size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-heading font-semibold uppercase tracking-wider text-gold-600 mb-0.5">{meta.label}</p>
            <p className="font-heading font-bold text-[14.5px] text-ink-800 leading-snug">{material.title}</p>
            {material.notes ? (
              <p className={`mt-1 leading-relaxed ${isLesson ? "text-[13.5px] text-ink-700 whitespace-pre-line" : "text-[12.5px] text-ink-500"}`}>
                {material.notes}
              </p>
            ) : null}
          </div>
        </div>
        {material.type === "audio" && hasUrl ? (
          <div className="mt-3"><audio controls src={material.url} className="w-full" /></div>
        ) : hasUrl ? (
          <div className="mt-3">
            <a
              href={material.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-gold-600 hover:text-gold-700"
            >
              {isLesson ? "לצפייה בתוכן" : "לפתיחת הקובץ"}
              <Icon name="arrow-up-right" size={13} />
            </a>
          </div>
        ) : null}
      </div>
    );
  }

  function MaterialsStage() {
    const [materials, setMaterials] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
      fetch("/api/materials", { headers: authHeaders() })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setMaterials(Array.isArray(data) ? data : []))
        .catch(() => setError(true));
    }, []);

    return (
      <div className="space-y-4">
        <header className="mb-2 px-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="book-open" size={15} className="text-gold-600" />
            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-600">החומרים שלי</span>
          </div>
          <p className="text-[13px] text-ink-500 leading-relaxed">חומרים אישיים שהוקצו לך — דמיון מודרך, דפי עבודה וסיכומים.</p>
        </header>

        {error ? (
          <div className="rounded-2xl border border-ink-100 bg-white px-4 py-5 text-center">
            <p className="text-[13px] text-ink-500">לא הצלחנו לטעון את החומרים כרגע. נסי שוב בעוד רגע.</p>
          </div>
        ) : materials === null ? (
          <div className="rounded-2xl border border-ink-100 bg-white px-4 py-5 text-center">
            <p className="text-[13px] text-ink-400">טוענת...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="rounded-2xl border border-ink-100 bg-white px-4 py-6 text-center">
            <p className="text-[13px] text-ink-500">עוד לא הוקצו לך חומרים. כשהמטפלת תשייך לך משהו, הוא יופיע כאן.</p>
          </div>
        ) : (
          materials.map((m) => <MaterialCard key={m.id} material={m} />)
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Tasks stage                                                        */
  /* ---------------------------------------------------------------- */

  const TASK_CATEGORY_ICONS = {
    breathing: "wind",
    journaling: "pen-line",
    movement: "activity",
    social: "users",
    mindfulness: "sparkles",
  };

  const TASK_CATEGORY_LABELS = {
    breathing: "נשימה",
    journaling: "כתיבה",
    movement: "תנועה",
    social: "חברתי",
    mindfulness: "מיינדפולנס",
  };

  function TasksStage() {
    const [tasks, setTasks] = useState(null);
    const [completing, setCompleting] = useState(null);

    useEffect(() => {
      fetch("/api/tasks", { headers: authHeaders() })
        .then((r) => r.json())
        .then((data) => setTasks(Array.isArray(data) ? data : []))
        .catch(() => setTasks([]));
    }, []);

    function completeTask(id) {
      setCompleting(id);
      fetch(`/api/tasks/${id}/complete`, { method: "POST", headers: authHeaders() })
        .then(() => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: 1 } : t))))
        .finally(() => setCompleting(null));
    }

    const pending = tasks ? tasks.filter((t) => !t.completed) : [];
    const done = tasks ? tasks.filter((t) => t.completed) : [];

    return (
      <div className="space-y-4">
        <header className="mb-2 px-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="check-circle" size={15} className="text-gold-600" />
            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-600">משימות יומיות</span>
          </div>
          <p className="text-[13px] text-ink-500 leading-relaxed">משימות קטנות שנגזרו עבורך מהשיחות עם הבוט הטיפולי. צעד קטן ביום.</p>
        </header>

        {tasks === null ? (
          <div className="rounded-2xl border border-ink-100 bg-white px-4 py-5 text-center">
            <p className="text-[13px] text-ink-400">טוענת...</p>
          </div>
        ) : pending.length === 0 && done.length === 0 ? (
          <div className="rounded-2xl border border-ink-100 bg-white px-4 py-6 text-center">
            <Icon name="sparkles" size={28} className="text-gold-300 mx-auto mb-2" />
            <p className="text-[13px] text-ink-500">עוד אין משימות. אחרי הצ'ק-אין הראשון שלך תקבלי משימה יומית מותאמת אישית.</p>
          </div>
        ) : (
          <>
            {pending.map((task) => (
              <div key={task.id} className="rounded-2xl border border-gold-200 bg-gold-50 px-4 py-4 flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gold-100 text-gold-600 shrink-0 mt-0.5">
                  <Icon name={TASK_CATEGORY_ICONS[task.category] || "sparkles"} size={17} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-ink-800 text-[14px] mb-0.5">{task.title}</p>
                  <p className="text-[13px] text-ink-500 leading-snug">{task.description}</p>
                  <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 font-medium">
                    {TASK_CATEGORY_LABELS[task.category] || "כללי"}
                  </span>
                </div>
                <button
                  onClick={() => completeTask(task.id)}
                  disabled={completing === task.id}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-gold-500 text-white hover:bg-gold-600 transition-colors disabled:opacity-50"
                >
                  {completing === task.id ? "..." : "עשיתי!"}
                </button>
              </div>
            ))}
            {done.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2 px-1">הושלמו ✓</p>
                {done.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-ink-100 bg-white px-4 py-3 flex items-center gap-3 opacity-60 mb-2">
                    <Icon name="check-circle" size={18} className="text-gold-400 shrink-0" />
                    <p className="text-[13px] text-ink-500 line-through">{task.title}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Phone frame + nav                                                  */
  /* ---------------------------------------------------------------- */

  function PhoneFrame({ children }) {
    // מעטפת אפליקציה נקייה: מסך מלא במובייל; בדסקטופ עמודת אפליקציה ממורכזת על רקע
    // קרם רך עם צל — בלי מסגרת טלפון שחורה ובלי פסים אפורים.
    return (
      <div
        className="fixed inset-0 z-50 flex justify-center overflow-hidden"
        dir="rtl"
        style={{ background: "linear-gradient(160deg,#fdfbf7 0%,#f4ecdd 100%)" }}
      >
        <div className="relative w-full h-full sm:max-w-[480px] bg-ink-50 overflow-hidden flex flex-col sm:shadow-[0_40px_100px_-45px_rgba(120,90,30,0.55)] sm:border-x sm:border-gold-100">
          {children}
        </div>
      </div>
    );
  }

  function Header({ subtitle, onExit, onNotifications, onMenu }) {
    const [unread, setUnread] = useState(0);

    useEffect(() => {
      function loadUnread() {
        fetch("/api/notifications", { headers: authHeaders() })
          .then((r) => r.ok ? r.json() : [])
          .then((rows) => setUnread(rows.filter((n) => !n.read).length))
          .catch(() => {});
      }
      loadUnread();
      const id = setInterval(loadUnread, 60000);
      return () => clearInterval(id);
    }, []);

    return (
      <div className="flex items-center justify-between gap-3 px-4 pt-7 sm:pt-5 pb-3 bg-white border-b border-ink-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onMenu}
            aria-label="תפריט"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-ink-50 text-ink-700 hover:bg-ink-100 transition-colors shrink-0"
          >
            <Icon name="menu" size={20} />
          </button>
          <div>
            <p className="font-heading font-bold text-[15px] text-ink-800">CureMindset · אזור אישי</p>
            <p className="text-[12px] text-ink-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNotifications}
            aria-label="התראות"
            className="relative w-9 h-9 rounded-full flex items-center justify-center bg-ink-50 text-ink-600 hover:bg-ink-100 transition-colors shrink-0"
          >
            <Icon name="bell" size={18} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onExit}
            aria-label="סגירת האזור האישי"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-ink-50 text-ink-600 hover:bg-ink-100 transition-colors shrink-0"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      </div>
    );
  }

  // מסך הגדרות (בהשראת Curable App Settings) — חשבון, פרטיות ואבטחה, התנתקות.
  function SettingsSheet({ userName, onClose, onLogout, onManage }) {
    const [tab, setTab] = useState("main"); // main | privacy
    return (
      <div className="cm-sheet" role="dialog" aria-label="הגדרות">
        <div className="cm-sheet__scrim" onClick={onClose} />
        <div className="cm-sheet__panel">
          <div className="cm-sheet__head">
            <span className="cm-sheet__hic"><Icon name="sliders-horizontal" size={19} /></span>
            <b>{tab === "privacy" ? "פרטיות ותנאים" : "הגדרות"}</b>
            <button type="button" className="cm-sheet__x" onClick={onClose} aria-label="סגירה"><Icon name="x" size={18} /></button>
          </div>
          <div className="cm-sheet__scroll">
            {tab === "main" ? (
              <React.Fragment>
                <p className="cm-sheet__sec">חשבון</p>
                <div className="cm-sheet__row">
                  <span className="cm-sheet__ic"><Icon name="user-round" size={18} /></span>
                  <div className="cm-sheet__txt"><b>{userName || "המשתמש/ת שלי"}</b><small>הפרופיל שלך ב-CureMindset</small></div>
                </div>
                <button type="button" className="cm-sheet__row cm-sheet__row--btn" onClick={onManage}>
                  <span className="cm-sheet__ic"><Icon name="book-open" size={18} /></span>
                  <div className="cm-sheet__txt"><b>מנוי וגישה לתוכניות</b><small>ניהול הניסיון והמעבר לתוכנית בתשלום</small></div>
                  <Icon name="arrow-left" size={18} />
                </button>

                <p className="cm-sheet__sec">פרטיות ואבטחה</p>
                <button type="button" className="cm-sheet__row cm-sheet__row--btn" onClick={() => setTab("privacy")}>
                  <span className="cm-sheet__ic"><Icon name="shield-check" size={18} /></span>
                  <div className="cm-sheet__txt"><b>מדיניות פרטיות ותנאי שימוש</b><small>איך אנחנו שומרים על המידע שלך</small></div>
                  <Icon name="arrow-left" size={18} />
                </button>

                <p className="cm-sheet__sec">כללי</p>
                <button type="button" className="cm-sheet__row cm-sheet__row--btn cm-sheet__row--danger" onClick={onLogout}>
                  <span className="cm-sheet__ic"><Icon name="log-out" size={18} /></span>
                  <div className="cm-sheet__txt"><b>התנתקות</b></div>
                  <Icon name="arrow-left" size={18} />
                </button>
                <p className="cm-sheet__ver">CureMindset · השיטה של קטי שגב 🌿</p>
              </React.Fragment>
            ) : (
              <div className="cm-privacy">
                <button type="button" className="cm-privacy__back" onClick={() => setTab("main")}><Icon name="arrow-right" size={16} /> חזרה להגדרות</button>
                <h4>מדיניות פרטיות ותנאי שימוש · CureMindset</h4>
                <p className="cm-privacy__lead">הפרטיות שלך יקרה לנו. מסמך זה מסביר איזה מידע אנו אוספים, כיצד אנו משתמשים בו ושומרים עליו — במסגרת הליווי הרגשי-תודעתי בשיטת CureMindset של קטי שגב.</p>

                <p className="cm-privacy__h">1. מידע שאנו אוספים</p>
                <p>שם, פרטי קשר (מייל וטלפון), תשובות השאלון הראשוני, והשיחות שלך עם המלווה הדיגיטלי — כדי לבנות ולהתאים את מפת הדרכים האישית שלך.</p>

                <p className="cm-privacy__h">2. כיצד אנו משתמשים במידע</p>
                <p>להתאמה אישית של התכנים, התרגילים והליווי; לשליחת עדכונים והתראות הקשורים לתהליך; ולשיפור השירות. איננו מוכרים את המידע שלך.</p>

                <p className="cm-privacy__h">3. שיתוף מידע</p>
                <p>איננו משתפים את המידע האישי שלך עם צד שלישי, למעט ספקי תשתית שמאפשרים את הפעלת השירות (אחסון, שליחת הודעות) ובכפוף לחובת סודיות, או אם נדרש על-פי חוק.</p>

                <p className="cm-privacy__h">4. אחסון ואבטחה</p>
                <p>הגישה מוגנת בסיסמה ובאימות טלפון (קוד חד-פעמי ב-SMS). המידע נשמר בשרתים מאובטחים. אף שיטה אינה מוגנת ב-100%, ואנו פועלים לשמור על המידע באמצעים מקובלים.</p>

                <p className="cm-privacy__h">5. הזכויות שלך</p>
                <p>באפשרותך לעיין במידע שלך, לתקן אותו או לבקש את מחיקתו בכל עת — בפנייה אלינו.</p>

                <p className="cm-privacy__h">6. קטינים</p>
                <p>שימוש של בני נוער נעשה בליווי ובהסכמת הורה/אפוטרופוס, האחראים לפרטיות הקטין/ה.</p>

                <p className="cm-privacy__note">⚠️ <b>הבהרה רפואית:</b> CureMindset הוא ליווי רגשי-תודעתי ואינו מהווה ייעוץ, אבחון או טיפול רפואי או נפשי, ואינו תחליף לגורם מקצועי. במצב מצוקה חריפה או חירום — יש לפנות מיד לגורם מקצועי, לרופא/ה, או לקו סיוע.</p>

                <p className="cm-privacy__h">7. שינויים ויצירת קשר</p>
                <p>אנו רשאים לעדכן מסמך זה מעת לעת. לכל שאלה בנושא פרטיות — ketyse@gmail.com.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // תפריט צד (Drawer) בסגנון Curable — נפתח מהכותרת, מעל כל המסכים.
  function Drawer({ open, onClose, userName, onLogout, onSettings, onStories }) {
    const items = [
      { icon: "sliders-horizontal", label: "הגדרות ופרופיל", run: onSettings },
      { icon: "star", label: "סיפורי הצלחה", run: onStories },
      { icon: "message-circle", label: "עזרה ותמיכה",
        run: () => window.open("https://wa.me/972543032349?text=" + encodeURIComponent("היי קטי, אשמח לעזרה 🙏"), "_blank", "noopener") },
      { icon: "log-out", label: "התנתקות", run: onLogout },
    ];
    return (
      <div className={`cm-drawer${open ? " cm-drawer--open" : ""}`} aria-hidden={!open}>
        <div className="cm-drawer__scrim" onClick={onClose} />
        <aside className="cm-drawer__panel" role="dialog" aria-label="תפריט">
          <div className="cm-drawer__head">
            <div className="cm-drawer__avatar"><Icon name="user-round" size={22} /></div>
            <div>
              <b>{userName || "המרחב שלך"}</b>
              <span>CureMindset · אזור אישי</span>
            </div>
            <button type="button" className="cm-drawer__x" onClick={onClose} aria-label="סגירה"><Icon name="x" size={18} /></button>
          </div>
          <nav className="cm-drawer__nav">
            {items.map((it) => (
              <button type="button" key={it.label} className="cm-drawer__item"
                onClick={() => { onClose(); if (it.run) it.run(); }}>
                <span className="cm-drawer__ic"><Icon name={it.icon} size={19} /></span>
                {it.label}
              </button>
            ))}
          </nav>
          <p className="cm-drawer__foot">CureMindset · השיטה של קטי שגב 🌿</p>
        </aside>
      </div>
    );
  }

  // שלבי הפרוטוקול הישן (עוגן / גבול ההבחנה / קרקוע) אינם חלק ממערכת CureMindset
  // ואינם מוצגים למשתמש — נשארים בקוד לתאימות, אך מחוץ למסע.
  const LEGACY_STAGE_IDS = [1, 2, 3];

  function StageNav({ stages, progress, current, onSelect }) {
    // מציגים רק את שלבי מערכת CureMindset (לא את הפרוטוקול הישן), וגם הם בהדרגה.
    const visible = stages.filter(
      (s) => !LEGACY_STAGE_IDS.includes(s.id) && (s.alwaysUnlocked || s.id <= progress.unlocked)
    );
    return (
      <div className="flex items-center px-4 py-3.5 gap-1 border-b border-ink-100 bg-white shrink-0">
        {visible.map((s, i) => {
          const done = progress.completed.includes(s.id);
          const locked = !s.alwaysUnlocked && s.id > progress.unlocked;
          const isCurrent = s.id === current;
          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => !locked && onSelect(s.id)}
                className={`flex flex-col items-center gap-1.5 flex-1 py-1 rounded-xl transition-colors ${
                  locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gold-50"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    isCurrent ? "bg-gold-500 text-white" : done ? "bg-gold-100 text-gold-600" : "bg-ink-100 text-ink-400"
                  }`}
                >
                  <Icon name={locked ? "lock" : done && !isCurrent ? "check-circle-2" : s.icon} size={16} />
                </span>
                <span className={`text-[10.5px] font-heading font-semibold ${isCurrent ? "text-ink-800" : "text-ink-400"}`}>{s.title}</span>
              </button>
              {i < visible.length - 1 ? <span className="h-px w-3 bg-ink-100 mt-[-14px]" aria-hidden="true" /> : null}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Notifications panel                                               */
  /* ---------------------------------------------------------------- */

  function NotificationsPanel({ onClose }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch("/api/notifications", { headers: authHeaders() })
        .then((r) => r.ok ? r.json() : [])
        .then((rows) => { setNotifications(rows); setLoading(false); })
        .catch(() => setLoading(false));
    }, []);

    function markAllRead() {
      fetch("/api/notifications/read-all", { method: "POST", headers: authHeaders() });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    }

    function markRead(id) {
      fetch(`/api/notifications/${id}/read`, { method: "POST", headers: authHeaders() });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: 1 } : n));
    }

    const typeIcon = { reminder: "clock", win: "trophy", info: "info" };

    return (
      <div className="absolute inset-0 z-30 bg-white flex flex-col" dir="rtl">
        <div className="flex items-center justify-between px-5 pt-7 sm:pt-5 pb-3 border-b border-ink-100 shrink-0">
          <p className="font-heading font-bold text-[15px] text-ink-800">התראות</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={markAllRead} className="text-[11px] text-gold-600 font-semibold hover:underline">סמן הכל כנקרא</button>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-ink-50 text-ink-600 hover:bg-ink-100">
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-ink-50">
          {loading && <p className="text-center text-ink-400 text-sm py-10">טוען...</p>}
          {!loading && notifications.length === 0 && <p className="text-center text-ink-400 text-sm py-10">אין התראות</p>}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markRead(n.id)}
              className={`w-full text-right flex gap-3 px-5 py-4 transition-colors hover:bg-gold-50 ${n.read ? "opacity-60" : "bg-gold-50/40"}`}
            >
              <span className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === "win" ? "bg-gold-100 text-gold-600" : "bg-ink-100 text-ink-500"}`}>
                <Icon name={typeIcon[n.type] || "bell"} size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] leading-snug ${n.read ? "text-ink-500" : "text-ink-800 font-medium"}`}>{n.message}</p>
                <p className="text-[11px] text-ink-400 mt-1">{new Date(n.created_at).toLocaleDateString("he-IL")}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-gold-500 mt-1.5 shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Root                                                               */
  /* ---------------------------------------------------------------- */

  /* ---------------------------------------------------------------- */
  /* Auth gate — הרשמה והתחברות עם מייל וסיסמה                          */
  /* ---------------------------------------------------------------- */

  // שאלון אבחון אינטראקטיבי (בהשראת Curable): מטרה → משך → תובנה → הרשמה.
  // CureMindset Companion — אבחון שיחתי בהשראת Clara של Curable, בתוכן ובעיצוב של CureMindset.
  // 3 שאלות + שם, תובנה דינמית, ובסיום מעבר להרשמה (מחובר ל-notifyLead/send-lead במייל).
  function OnboardingQuiz({ onComplete, onExit }) {
    const SCRIPT = [
      { key: "name", type: "text", ph: "השם שלך",
        q: "היי, אני כאן איתך מטעם CureMindset 🌿 יחד נזהה את הדפוס שמעכב אותך, ונתחיל לבנות חוסן וביטחון אמיתי — כזה שמחזיק. ספרי לי, איך קוראים לך?" },
      { key: "challenge",
        q: "נעים להכיר! מה האתגר המרכזי שתרצי/ה לשחרר כרגע?",
        opts: ["עומס, הצפה רגשית ותקיעות", "חרדת ביצוע, פחד מכישלון או דחיינות", "ביקורת עצמית גבוהה ופרפקציוניזם", "ספק עצמי וחוסר שקט פנימי"] },
      { key: "impact",
        q: "הבנתי אותך. ואיך האתגר הזה משפיע על הניסיון שלך לפעול ולהתקדם ביום-יום?",
        opts: ["משתק אותי לחלוטין", "גורם לי להימנעות ודחיינות", "מייצר עייפות ושחיקה", "גורם לי להטיל ספק בשינוי"] },
      { key: "goal",
        q: "תודה על השיתוף. ב-CureMindset אנחנו מבינים שזה אינו חוסר מוטיבציה, אלא מנגנון הגנה של תת-המודע. מה המטרה העיקרית שלך בתהליך?",
        opts: ["וויסות ושקט פנימי", "שחרור חסמים תת-מודעים", "חיזוק החוסן והביטחון", "בניית שגרת פריצת דרך"] },
    ];

    const [answers, setAnswers] = useState({});
    const [stage, setStage] = useState(0); // איזו שאלה ממתינה למענה
    const [typing, setTyping] = useState(false);
    const [text, setText] = useState("");
    const scrollRef = React.useRef(null);

    const done = stage >= SCRIPT.length;

    const DISCLAIMER =
      "עוד לפני שנצלול 🌿 חשוב לי שתדעי: המרחב הזה הוא ליווי רגשי-תודעתי בשיטת CureMindset, ואינו תחליף לייעוץ או טיפול רפואי/נפשי מקצועי. אם את/ה במצוקה חריפה או במצב חירום — מומלץ מאוד לפנות לגורם מקצועי או לקו סיוע. וכעת, נמשיך יחד 💛";
    const INSIGHT =
      "אני כבר רואה את התמונה שלך 🌿 המערכת שלך פשוט עובדת שעות נוספות כדי להגן עלייך — וזה בדיוק מה שמייצר את התקיעות. בשיטת CureMindset נחליף יחד את המאמץ הזה בחיווט מחדש, בעדינות ובקצב שלך.";
    const FINAL =
      "איזה כיף להכיר אותך 🌿 כבר יש לי תמונה ראשונית שלך והכיוון שמתאים לך. בואי ניצור לך מרחב אישי ונשמור את מה שהתחלנו — כדי לקבל את התוכנית שלך:";

    // גלילה אוטומטית לתחתית עם כל הודעה חדשה
    useEffect(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, [stage, typing]);

    function answer(val) {
      const v = String(val).trim();
      if (!v) return;
      const key = SCRIPT[stage].key;
      setAnswers((a) => ({ ...a, [key]: v }));
      setText("");
      setTyping(true);
      setTimeout(() => { setTyping(false); setStage((s) => s + 1); }, 800);
    }

    function finish() {
      const a = answers;
      const summary =
        `שם: ${a.name || "—"} · אתגר: ${a.challenge || "—"} · השפעה: ${a.impact || "—"} · מטרה: ${a.goal || "—"}`;
      onComplete(summary, a.name || "");
    }

    // בניית תמלול השיחה עד לשלב הנוכחי
    const bubbles = [];
    for (let i = 0; i <= stage && i < SCRIPT.length; i++) {
      // הבהרה רפואית — מופיעה אחרי השם, ממש לפני השאלה הראשונה.
      if (i === 1) bubbles.push({ id: "disc", sender: "bot", text: DISCLAIMER });
      const q = typeof SCRIPT[i].q === "function" ? SCRIPT[i].q(answers) : SCRIPT[i].q;
      bubbles.push({ id: "b" + i, sender: "bot", text: q });
      if (answers[SCRIPT[i].key] !== undefined)
        bubbles.push({ id: "u" + i, sender: "user", text: answers[SCRIPT[i].key] });
    }
    if (done) {
      bubbles.push({ id: "insight", sender: "bot", text: INSIGHT });
      bubbles.push({ id: "final", sender: "bot", text: FINAL });
    }

    const cur = done ? null : SCRIPT[stage];
    const pct = Math.round((Math.min(stage, SCRIPT.length) / SCRIPT.length) * 100);

    return (
      <div className="chat-onb">
        <div className="chat-onb__head">
          <div className="chat-onb__avatar"><Icon name="sparkles" size={20} /></div>
          <div className="chat-onb__id">
            <b>CureMindset Companion</b>
            <span>{typing ? "מקליד…" : "כאן איתך, ברגע הזה"}</span>
          </div>
          <button type="button" className="chat-onb__exit" onClick={onExit} aria-label="חזרה לאתר">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="chat-onb__bar"><span style={{ width: pct + "%" }} /></div>

        <div className="chat-onb__scroll" ref={scrollRef}>
          {bubbles.map((b) => (
            <div key={b.id} className={`chat-bub chat-bub--${b.sender}`}>{b.text}</div>
          ))}
          {typing && (
            <div className="chat-bub chat-bub--bot chat-bub--typing"><span /><span /><span /></div>
          )}
        </div>

        <div className="chat-onb__foot">
          {done ? (
            <button type="button" className="chat-onb__cta" onClick={finish}>
              להרשמה וקבלת התוכנית האישית
            </button>
          ) : cur.type === "text" ? (
            <form className="chat-onb__inrow" onSubmit={(e) => { e.preventDefault(); answer(text); }}>
              <input className="chat-onb__input" value={text} onChange={(e) => setText(e.target.value)}
                     placeholder={cur.ph} autoFocus maxLength={40} />
              <button type="submit" className="chat-onb__send" disabled={!text.trim()} aria-label="שליחה">
                <Icon name="arrow-left" size={18} />
              </button>
            </form>
          ) : (
            <div className="chat-onb__opts">
              {cur.opts.map((o) => (
                <button type="button" key={o} className="chat-onb__opt" onClick={() => answer(o)}>{o}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // שחזור סיסמה: מייל → קוד איפוס (במייל) → סיסמה חדשה.
  function ForgotPassword({ onBack, initialEmail }) {
    const [step, setStep] = useState("request"); // request | reset | done
    const [email, setEmail] = useState(initialEmail || "");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("idle");
    const [err, setErr] = useState("");

    function request(e) {
      if (e) e.preventDefault();
      if (!email.trim()) return;
      setStatus("loading"); setErr("");
      fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) })
        .then(() => { setStatus("idle"); setStep("reset"); })
        .catch(() => { setStatus("idle"); setStep("reset"); });
    }
    function reset(e) {
      if (e) e.preventDefault();
      if (code.trim().length < 4 || password.length < 6) { setErr("הזיני קוד וסיסמה בת 6 תווים לפחות"); return; }
      setStatus("loading"); setErr("");
      fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), code: code.trim(), password }) })
        .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "שגיאה"); setStep("done"); })
        .catch((e2) => { setStatus("idle"); setErr(e2.message); });
    }

    return (
      <div className="au-card" style={{ gridTemplateColumns: "1fr" }}>
        <div className="au-form-col">
          <div className="au-form-col__head">
            <h3>{step === "done" ? "הסיסמה עודכנה 🌿" : "שחזור סיסמה"}</h3>
            <p>{step === "request" ? "נשלח לך קוד איפוס למייל." : step === "reset" ? "הזיני את הקוד שקיבלת במייל וסיסמה חדשה." : "מעכשיו אפשר להתחבר עם הסיסמה החדשה."}</p>
          </div>
          {step === "request" ? (
            <form className="au-form" onSubmit={request}>
              <input className="au-input" type="email" dir="ltr" placeholder="כתובת המייל שלך" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ textAlign: "right" }} />
              <button type="submit" className="au-submit" disabled={status === "loading" || !email.trim()}>{status === "loading" ? "רק רגע..." : "שליחת קוד איפוס"}</button>
            </form>
          ) : step === "reset" ? (
            <form className="au-form" onSubmit={reset}>
              <input className="au-input" dir="ltr" placeholder="קוד בן 6 ספרות" value={code} onChange={(e) => setCode(e.target.value)} required style={{ textAlign: "center", letterSpacing: "0.3em" }} />
              <input className="au-input" type="password" placeholder="סיסמה חדשה (6+ תווים)" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {err ? <p className="au-err">{err}</p> : null}
              <button type="submit" className="au-submit" disabled={status === "loading"}>{status === "loading" ? "רק רגע..." : "עדכון סיסמה"}</button>
              <button type="button" className="au-back" onClick={() => setStep("request")}>לא קיבלתי קוד — שליחה מחדש</button>
            </form>
          ) : (
            <button type="button" className="au-submit" onClick={onBack}>לכניסה עם הסיסמה החדשה</button>
          )}
          <button type="button" className="au-back" onClick={onBack}>חזרה לכניסה</button>
        </div>
      </div>
    );
  }

  function AuthGate({ onAuthed, onExit }) {
    const [mode, setMode] = useState("register"); // register | login
    const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
    const [status, setStatus] = useState("idle"); // idle | loading | error
    const [errorMsg, setErrorMsg] = useState("");
    const [agreed, setAgreed] = useState(false); // הסכמה לתנאים (חובה בהרשמה)
    const [showTerms, setShowTerms] = useState(false); // מודל תנאים מלאים
    const [step, setStep] = useState("form"); // form | otp
    const [otp, setOtp] = useState({ email: "", phoneHint: "", code: "" });
    const [resent, setResent] = useState(false);
    const [onbDone, setOnbDone] = useState(false); // האם סיימו את שאלון האבחון (הרשמה)
    const [onbSummary, setOnbSummary] = useState(""); // תשובות האבחון לשמירה בכרטיס
    const [postRegQuiz, setPostRegQuiz] = useState(false); // שאלון היכרות אחרי ההרשמה (סגנון Curable)

    function update(field, value) {
      setForm((f) => ({ ...f, [field]: value }));
      if (status === "error") setStatus("idle");
    }

    function finishAuth(data) {
      setAuth(data.token, data.fullName);
      // סגנון Curable: אחרי הרשמה חדשה — קודם השאלון האישי, ואז כניסה למערכת.
      // בהתחברות של משתמש קיים — נכנסים ישר.
      if (mode === "register") setPostRegQuiz(true);
      else onAuthed();
    }

    function submit(e) {
      e.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? { ...form, ref: getRef(), onboarding: onbSummary } : { email: form.email, password: form.password };
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error || "משהו השתבש, נסי שוב");
          if (data.needsOtp) {
            // נדרש אימות טלפון — עוברים למסך הזנת הקוד.
            setOtp({ email: data.email, phoneHint: data.phoneHint || "", code: "" });
            setStep("otp");
            setStatus("idle");
            return;
          }
          finishAuth(data);
        })
        .catch((err) => { setStatus("error"); setErrorMsg(err.message); });
    }

    function submitOtp(e) {
      e.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otp.email, code: otp.code }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error || "קוד שגוי, נסי שוב");
          finishAuth(data);
        })
        .catch((err) => { setStatus("error"); setErrorMsg(err.message); });
    }

    function resendOtp() {
      setResent(false);
      fetch("/api/auth/resend-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otp.email }),
      })
        .then(async (r) => { if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "שליחה נכשלה"); } setResent(true); })
        .catch((err) => { setStatus("error"); setErrorMsg(err.message); });
    }

    const isReg = mode === "register";

    // ── שאלון היכרות — אחרי יצירת החשבון (סגנון Curable: קודם הרשמה, ואז השאלון) ──
    if (postRegQuiz) {
      return (
        <div className="au-overlay">
          <OnboardingQuiz
            onExit={() => onAuthed()}
            onComplete={(summary) => {
              // המשתמש כבר מחובר — שומרים את השאלון בשרת ונכנסים למערכת.
              if (summary) {
                fetch("/api/onboarding", {
                  method: "POST",
                  headers: authHeaders({ "Content-Type": "application/json" }),
                  body: JSON.stringify({ onboarding: summary }),
                }).catch(() => {});
              }
              onAuthed();
            }}
          />
        </div>
      );
    }

    // ── שחזור סיסמה ──
    if (mode === "forgot") {
      return (
        <div className="au-overlay">
          <ForgotPassword initialEmail={form.email} onBack={() => { setMode("login"); setStatus("idle"); }} />
        </div>
      );
    }

    // ── מסך אימות טלפון (OTP) ──
    if (step === "otp") {
      return (
        <div className="au-overlay">
          <div className="au-card" style={{ gridTemplateColumns: "1fr" }}>
            <div className="au-form-col">
              <div className="au-form-col__head" style={{ textAlign: "center" }}>
                <div className="au-brand__logo" style={{ margin: "0 auto 14px" }}><Icon name="message-circle" size={26} /></div>
                <h3>אימות מספר הטלפון</h3>
                <p>
                  שלחנו קוד בן 6 ספרות ב-SMS
                  {otp.phoneHint ? <> למספר שמסתיים ב-<b dir="ltr">{otp.phoneHint}</b></> : null}. הזיני אותו כאן להשלמת ההרשמה.
                </p>
              </div>
              <form onSubmit={submitOtp} className="au-form">
                <input
                  type="text" inputMode="numeric" autoComplete="one-time-code" required
                  value={otp.code}
                  onChange={(e) => { setOtp((o) => ({ ...o, code: e.target.value.replace(/\D/g, "").slice(0, 6) })); if (status === "error") setStatus("idle"); }}
                  placeholder="●  ●  ●  ●  ●  ●"
                  className="au-input"
                  style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: "22px", fontWeight: 700, direction: "ltr" }}
                />
                {status === "error" && <p className="au-err">{errorMsg}</p>}
                {resent && <p style={{ color: "#6f9268", fontSize: "13.5px", fontWeight: 600, textAlign: "center", margin: 0 }}>נשלח קוד חדש ✓</p>}
                <button type="submit" className="au-submit" disabled={status === "loading" || otp.code.length < 4}>
                  {status === "loading" ? "מאמת…" : "אימות והמשך"}
                </button>
              </form>
              <p className="au-switch">
                לא קיבלת קוד?{" "}
                <button type="button" onClick={resendOtp}>שליחה חוזרת</button>
              </p>
              <button type="button" onClick={() => { setStep("form"); setStatus("idle"); }} className="au-back">
                טעות במספר? חזרה
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="au-overlay">
        <div className="au-card">
          {/* Form column (appears on the right in RTL) */}
          <div className="au-form-col">
            <div className="au-form-col__head">
              <h3>{isReg ? "בוא/י נתחיל את פריצת הדרך שלך 🌿" : "כניסה לאזור האישי"}</h3>
              <p>
                {isReg
                  ? "מרחב אישי ומאובטח — 14 ימי ניסיון חינם, בלי התחייבות. הפרטים שלך נשמרים בפרטיות מלאה."
                  : "טוב לראות אותך שוב. התחברי כדי להמשיך מהמקום שעצרת."}
              </p>
            </div>

            <form onSubmit={submit} className="au-form">
              {isReg && (
                <input type="text" name="name" autoComplete="name" required value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)} placeholder="איך קוראים לך?" className="au-input" />
              )}
              <input type="email" name="email" autoComplete="email" required value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder={isReg ? "לאן לשלוח את מפת הדרכים האישית שלך?" : "כתובת מייל"} dir="ltr"
                className="au-input" style={{ textAlign: "right" }} />
              {isReg && (
                <input type="tel" name="tel" autoComplete="tel" required value={form.phone}
                  onChange={(e) => update("phone", e.target.value)} placeholder="טלפון נייד (לשליחת קוד אבטחה)" dir="ltr"
                  className="au-input" style={{ textAlign: "right" }} />
              )}
              <input type="password" name="password" autoComplete={isReg ? "new-password" : "current-password"} required
                value={form.password} onChange={(e) => update("password", e.target.value)}
                placeholder={isReg ? "מפתח אישי למרחב השקט שלך (6+ תווים)" : "הסיסמה שלך"} className="au-input" />

              {/* consent — one clean line + modal link (no grey scroll box) */}
              {isReg && (
                <label className="au-consent">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                  <span className="au-consent__txt">
                    נרשמ/ת ומאשר/ת את תנאי השימוש והצהרת ה-AI (השירות אינו מהווה ייעוץ רפואי).{" "}
                    <button type="button" className="au-terms-link" onClick={() => setShowTerms(true)}>
                      לצפייה בתנאים המלאים
                    </button>
                  </span>
                </label>
              )}

              {status === "error" && <p className="au-err">{errorMsg}</p>}
              <button type="submit" className="au-submit" disabled={status === "loading" || (isReg && !agreed)}>
                {status === "loading" ? "רק רגע..." : isReg ? "מתחילים את פריצת הדרך" : "כניסה"}
              </button>
            </form>

            <SocialLogin />

            <p className="au-switch">
              {isReg ? "כבר יש לך חשבון? " : "עדיין אין לך חשבון? "}
              <button type="button" onClick={() => { setMode(isReg ? "login" : "register"); setStatus("idle"); }}>
                {isReg ? "להתחברות" : "להרשמה"}
              </button>
            </p>
            {!isReg && (
              <button type="button" className="au-back" onClick={() => { setMode("forgot"); setStatus("idle"); }}>שכחת סיסמה?</button>
            )}
            <button type="button" onClick={onExit} className="au-back">חזרה לאתר</button>
          </div>

          {/* Brand / welcome panel (appears on the left in RTL) */}
          <div className="au-brand">
            <svg className="au-brand__rose" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="100" cy="100" r="92" /><circle cx="100" cy="100" r="60" />
              <path d="M100 8 L112 100 L100 192 L88 100 Z" fill="currentColor" stroke="none" opacity="0.6" />
              <path d="M8 100 L100 112 L192 100 L100 88 Z" fill="currentColor" stroke="none" opacity="0.35" />
            </svg>
            <div className="au-brand__logo"><Icon name="heart-handshake" size={26} /></div>
            <h2>{isReg ? "ברוכה הבאה ל־CureMindset" : "המרחב האישי שלך מחכה לך"}</h2>
            <p className="au-brand__sub">
              האזור האישי שלך — מרחב בטוח ומוצפן לתרגול, לצמיחה ולמסע הפנימי, בליווי מבוסס השיטה של קטי שגב.
            </p>
            <ul className="au-benefits">
              <li><span className="au-tick"><Icon name="check-circle-2" size={14} /></span>14 ימי ניסיון חינם — בלי התחייבות</li>
              <li><span className="au-tick"><Icon name="check-circle-2" size={14} /></span>שיחות פרטיות ומוצפנות — רק את רואה אותן</li>
              <li><span className="au-tick"><Icon name="check-circle-2" size={14} /></span>ליווי AI מבוסס השיטה והתכנים של קטי</li>
            </ul>
            <p className="au-brand__trust"><Icon name="shield-check" size={14} /> הפרטים שלך מאובטחים ומוצפנים</p>
          </div>
        </div>

        {/* full terms modal */}
        {showTerms && (
          <div className="au-modal-bg" onClick={() => setShowTerms(false)}>
            <div className="au-modal" onClick={(e) => e.stopPropagation()}>
              <h4>תנאי שימוש, הצהרת AI ואי־ייעוץ רפואי</h4>
              <section><p><b>1. מהות השירות ואינטראקציית AI:</b> מערכת זו מופעלת באמצעות בינה מלאכותית (AI) על בסיס מודל התוכן המקצועי של קטי שגב. המערכת פועלת אוטומטית ועלולה להציג מידע לא מדויק.</p></section>
              <section><p><b>2. אי־חלופה לייעוץ רפואי:</b> התכנים והתרגילים אינם מהווים ייעוץ רפואי, אבחנה או טיפול נפשי/פסיכיאטרי, ואינם מחליפים התייעצות עם רופא או מטפל מוסמך. השימוש באחריות המשתמש/ת בלבד. בכל מצוקה יש לפנות לגורם מקצועי מוסמך.</p></section>
              <section><p><b>3. פרטיות:</b> נתוני הרישום נשמרים בבסיס נתונים מאובטח, ותוכן השיחה מעובד באופן מאובטח לצורך מתן המענה בלבד.</p></section>
              <button type="button" className="au-modal__close" onClick={() => setShowTerms(false)}>הבנתי, סגירה</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 8 — Structured program: CURE MINDSET 14-day journey          */
  /* ---------------------------------------------------------------- */

  const PROGRAM_GATES = [
    {
      gate: "שער 1 · ימים 1–3",
      title: "חוסן רגשי ועוגן",
      days: [
        { day: 1, title: "מד העומס הפנימי", focus: "לזהות איפה בגוף יושב הלחץ ומה עוצמתו.", practice: "שלוש נשימות עמוקות + יד על הלב — בוקר וערב." },
        { day: 2, title: "העוגן האישי שלך", focus: "לבחור מילה או תחושה שמחזירה רוגע ברגע קשה.", practice: "להפעיל את העוגן פעם אחת ביום קושי." },
        { day: 3, title: "עצירה לפני תגובה", focus: "לשים רווח קטן בין הטריגר לבין התגובה.", practice: "לפני שמגיבים — לעצור, לנשום, להפעיל עוגן." },
      ],
    },
    {
      gate: "שער 2 · ימים 4–7",
      title: "דימוי עצמי",
      days: [
        { day: 4, title: "זיהוי האמונה המגבילה", focus: "לתפוס את המשפט הביקורתי שחוזר על עצמו.", practice: "לכתוב משפט אחד של ביקורת עצמית שעלה היום." },
        { day: 5, title: "מאיפה זה הגיע?", focus: "לחקור בעדינות מתי נולדה האמונה הזו.", practice: "לשאול את עצמך: מתי למדתי לחשוב ככה?" },
        { day: 6, title: "מסגור מחדש", focus: "להפוך \"אני לא מסוגל\" ל\"עדיין לא מצאתי איך\".", practice: "לנסח מחדש משפט מגביל אחד." },
        { day: 7, title: "יומן ניצחונות", focus: "לאסוף ראיות שסותרות את האמונה הישנה.", practice: "לכתוב ניצחון קטן אחד מהיום." },
      ],
    },
    {
      gate: "שער 3 · ימים 8–11",
      title: "שחרור חסמים וחמלה",
      days: [
        { day: 8, title: "הפרדה מהדפוס", focus: "לראות את הקושי מבחוץ, כמו צופה בסרט.", practice: "לתאר את הקושי בגוף שלישי, במשפט אחד." },
        { day: 9, title: "חמלה עצמית", focus: "לדבר לעצמך כמו לחבר טוב, לא כמו שופט.", practice: "משפט חמלה אחד לעצמך היום." },
        { day: 10, title: "שחרור מהצורך באישור", focus: "למקד ב\"איך אני מרגיש\" במקום \"מה חושבים עליי\".", practice: "לעשות פעולה קטנה אחת בלי לבקש אישור." },
        { day: 11, title: "גבולות רכים", focus: "להגיד \"לא\" בלי אשמה מיותרת.", practice: "לתרגל \"לא\" קטן ומכבד אחד." },
      ],
    },
    {
      gate: "שער 4 · ימים 12–14",
      title: "עוגני עוצמה לחיים",
      days: [
        { day: 12, title: "עוגן ניצחונות", focus: "לעגן בגוף זיכרון של הצלחה אמיתית.", practice: "להיזכר בהצלחה + מגע יד, ולהחזיק 30 שניות." },
        { day: 13, title: "חזון קדימה", focus: "לדמיין את הגרסה החזקה והשלווה שלך.", practice: "לכתוב משפט חזון אחד בהווה: \"אני...\"." },
        { day: 14, title: "ארגז הכלים שלי", focus: "לסכם את הכלים שעבדו לך הכי טוב.", practice: "לבחור 3 כלים לחיים ולקבוע שיחת המשך." },
      ],
    },
  ];

  const PROGRAM_KEY = "cm_program_done";
  function loadProgramDone() {
    try { return JSON.parse(localStorage.getItem(PROGRAM_KEY)) || []; } catch { return []; }
  }

  // ספריית 12 התרגילים של CureMindset, מסודרת ל-3 השלבים. תוכן קבוע (לא נשמר בשרת).
  const CUREMINDSET_STAGES = [
    {
      key: 1, title: "ניצחון על חרדות ופחדים", sub: "שחרור העומס הרגשי", icon: "wind",
      exercises: [
        { title: "זיהוי שורש הפחד", type: "כתיבה", min: 15, desc: "כתיבה חופשית לאיתור טריגרים ותחושות גופניות — מה מפעיל את הפחד ואיפה הוא יושב בגוף." },
        { title: "מדיטציית הרפיה ונשימה", type: "מדיטציה", min: 10, desc: "נשימה 4-4-6 (שאיפה 4, החזקה 4, נשיפה 6) להורדת עוררות מערכת העצבים." },
        { title: "דמיון מודרך — מקום בטוח", type: "דמיון", min: 12, desc: "בניית מרחב פנימי בטוח לוויסות מיידי ברגעי הצפה." },
        { title: "פירוק דפוסי תת-מודע", type: "CBT", min: 20, desc: "זיהוי דפוסים חוזרים והחלפתם באלטרנטיבות מיטיבות." },
      ],
    },
    {
      key: 2, title: "בניית דימוי עצמי מנצח", sub: "חיזוק הערך העצמי", icon: "star",
      exercises: [
        { title: "זיהוי אמונות מגבילות", type: "כתיבה", min: 15, desc: "רישום אמונות מגבילות ובחינתן מול המציאות." },
        { title: "דיאלוג פנימי מיטיב", type: "CBT", min: 15, desc: "החלפת הקול הביקורתי הפנימי בקול תומך ומחזק." },
        { title: "דמיון מודרך — העצמי העתידי", type: "דמיון", min: 15, desc: "התחברות לגרסה העתידית, החזקה והמעצימה של עצמך." },
        { title: "התקנת עוגן ביטחון", type: "עיגון", min: 10, desc: "יצירת עוגן סומטי (מגע/תנוחה) שמפעיל ביטחון באופן מיידי." },
      ],
    },
    {
      key: 3, title: "כלים לחיים וחוסן רגשי", sub: "חוסן לטווח ארוך", icon: "trophy",
      exercises: [
        { title: "ויסות רגשי בזמן אמת", type: "CBT", min: 10, desc: "כלים מהירים להחזרה לאיזון תוך דקות ברגע של לחץ." },
        { title: "מדיטציית חוסן ויציבות", type: "מדיטציה", min: 15, desc: "הטמעת גישה למצבי משאב גבוהים — רוגע, ביטחון, עוצמה." },
        { title: "יומן רגשות", type: "כתיבה", min: 10, desc: "כתיבה יומית לחיזוק מודעות רגשית ובחירה מודעת." },
        { title: "תרגול עוגנים יומיומיים", type: "עיגון", min: 5, desc: "הפעלת העוגנים במצבי לחץ אמיתיים בשגרה." },
      ],
    },
  ];

  // כפתור "האזנה" — ממיר טקסט לדיבור בעברית ישירות במכשיר (Web Speech API).
  // לא מייצר קובץ; משתמש בקול המובנה (למשל Carmit — קול אישה של אפל). חינמי ומיידי.
  function SpeakButton({ text, label }) {
    const [speaking, setSpeaking] = useState(false);
    const supported = typeof window !== "undefined" && "speechSynthesis" in window;
    useEffect(() => () => { try { if (supported) window.speechSynthesis.cancel(); } catch (e) {} }, []);
    function pickHebrewVoice() {
      const voices = window.speechSynthesis.getVoices() || [];
      const he = voices.filter((v) => /(^|[^a-z])he|iw|hebrew|עברית/i.test(v.lang + " " + v.name));
      const female = he.find((v) => /carmit|female|woman|נקבה/i.test(v.name));
      return female || he[0] || null;
    }
    function toggle() {
      if (!supported) return;
      const synth = window.speechSynthesis;
      if (speaking) { synth.cancel(); setSpeaking(false); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text || ""));
      u.lang = "he-IL";
      const v = pickHebrewVoice();
      if (v) u.voice = v;
      u.rate = 0.94; u.pitch = 1.06;
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      synth.speak(u);
    }
    if (!supported) return null;
    return (
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-heading font-semibold text-[12px] transition-colors ${
          speaking ? "bg-gold-500 text-white" : "border border-gold-200 text-gold-700 hover:bg-gold-50"
        }`}
        aria-label={speaking ? "עצירת ההאזנה" : "האזנה לתוכן"}
      >
        <Icon name={speaking ? "pause" : "headphones"} size={13} /> {speaking ? "עצירה" : label || "האזנה"}
      </button>
    );
  }

  // מודול מודרך בסגנון Curable (Learn / Write / Calm) — מותאם לעולם הרגשי של CureMindset.
  // התוכן מבוסס על מסמך המלל של קטי, בהתאמה מ"כאב פיזי" ל"עומס רגשי / חרדה".
  const LEARN_TEXT =
    "דמייני שהמוח שלך הוא כמו מערכת אזעקה של בית. אחרי תקופה של לחץ, חרדה או עומס רגשי — האזעקה הפכה רגישה מדי. היא מצפצפת גם כשרוח קלה נושבת על החלון, גם כשאין באמת סכנה. המטרה שלנו ב-CureMindset היא לא לכבות את האזעקה — היא נועדה להגן עלייך — אלא לכוון אותה מחדש, בעדינות, כך שתפעל רק כשצריך. ככל שתתרגלי, המערכת העצבית לומדת מחדש שהיא בטוחה, והעוצמה של החרדה יורדת.";

  function BreathingGuide() {
    const [on, setOn] = useState(false);
    const [phase, setPhase] = useState(0);
    useEffect(() => {
      if (!on) { setPhase(0); return; }
      const id = setInterval(() => setPhase((p) => (p + 1) % 4), 4000);
      return () => clearInterval(id);
    }, [on]);
    const PHASES = [
      { label: "שאיפה", scale: 1.18 },
      { label: "החזקה", scale: 1.18 },
      { label: "נשיפה", scale: 0.72 },
      { label: "המתנה", scale: 0.72 },
    ];
    const cur = PHASES[phase];
    return (
      <div className="flex flex-col items-center gap-4">
        <div style={{
          width: 132, height: 132, borderRadius: "50%", display: "grid", placeItems: "center",
          background: "radial-gradient(circle, #f6ecd6, #e6cf9f)", border: "2px solid #c2974a",
          color: "#a9791f", fontFamily: "Rubik, sans-serif", fontWeight: 800, fontSize: 17,
          transform: `scale(${on ? cur.scale : 0.85})`, transition: "transform 3.7s ease-in-out",
        }}>
          {on ? cur.label : "מוכנה?"}
        </div>
        <button type="button" onClick={() => setOn((o) => !o)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[13px] hover:bg-gold-600 transition-colors">
          <Icon name={on ? "pause" : "play"} size={14} /> {on ? "עצירה" : "נשימת קופסה · 4-4-4-4"}
        </button>
      </div>
    );
  }

  function GuidedModule() {
    const NOTE_KEY = "cm_module1_letter";
    const [letter, setLetter] = useState(() => { try { return localStorage.getItem(NOTE_KEY) || ""; } catch (e) { return ""; } });
    const [saved, setSaved] = useState(false);
    function saveLetter() {
      try { localStorage.setItem(NOTE_KEY, letter); } catch (e) {}
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    }
    return (
      <div className="rounded-3xl border border-gold-200 bg-white overflow-hidden mb-7">
        <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,#c2974a,#a9791f)", color: "#fff" }}>
          <p className="font-heading font-semibold text-[11.5px] tracking-[0.16em] opacity-90">מודול פתיחה · CURE MINDSET</p>
          <h3 className="font-heading font-extrabold text-[19px]">להבין את האזעקה</h3>
          <p className="text-[12.5px] opacity-90 mt-0.5">שלושה צעדים קצרים: ללמוד · לכתוב · להירגע</p>
        </div>
        <div className="p-5 space-y-6">
          {/* 1. Learn */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-heading font-bold text-[12px]">1</span>
              <span className="font-heading font-bold text-[14.5px] text-ink-800">ללמוד</span>
              <span className="text-[11.5px] text-ink-400">· אודיו · 3 דק׳</span>
            </div>
            <p className="text-[13.5px] text-ink-600 leading-relaxed mb-2.5">{LEARN_TEXT}</p>
            <SpeakButton text={LEARN_TEXT} label="האזנה לשיעור" />
          </div>
          {/* 2. Write */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-heading font-bold text-[12px]">2</span>
              <span className="font-heading font-bold text-[14.5px] text-ink-800">לכתוב</span>
              <span className="text-[11.5px] text-ink-400">· 5 דק׳</span>
            </div>
            <p className="text-[13.5px] text-ink-600 leading-relaxed mb-2.5">כתבי מכתב קצר לעומס הרגשי שלך. אל תנסי להיות נחמדה — תגידי לו מה הוא מונע ממך לעשות ואיך הוא גורם לך להרגיש. הוצאת הרגשות האלה על הנייר היא הצעד הראשון להורדת העומס מהמערכת העצבית.</p>
            <textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={4}
              placeholder="היקר/ה שלי, עומס..." className="w-full rounded-2xl border border-ink-200 px-3.5 py-2.5 text-[13px] text-ink-700 resize-none focus:outline-none focus:border-gold-300" />
            <button type="button" onClick={saveLetter}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[13px] hover:bg-gold-600 transition-colors">
              {saved ? "נשמר 🌿" : "שמירה"}
            </button>
          </div>
          {/* 3. Calm */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-heading font-bold text-[12px]">3</span>
              <span className="font-heading font-bold text-[14.5px] text-ink-800">להירגע</span>
              <span className="text-[11.5px] text-ink-400">· 2 דק׳</span>
            </div>
            <BreathingGuide />
          </div>
        </div>
      </div>
    );
  }

  function ExerciseLibrary({ onNavigateStage }) {
    return (
      <div className="pt-2">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="font-heading font-bold text-[20px] text-ink-800">ספריית התרגילים</h2>
        </div>
        <p className="text-[13px] text-ink-500 mb-5 leading-relaxed">12 תרגילים מעשיים, מסודרים ל-3 שלבי המסע. בחרי תרגיל — ובקשי מה-AI ללוות אותך דרכו.</p>
        <div className="space-y-6">
          {CUREMINDSET_STAGES.map((st) => (
            <div key={st.key}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="shrink-0 w-8 h-8 rounded-full bg-gold-50 border border-gold-200 text-gold-600 flex items-center justify-center"><Icon name={st.icon} size={16} /></span>
                <div>
                  <p className="font-heading font-bold text-[14.5px] text-ink-800">שלב {st.key} · {st.title}</p>
                  <p className="text-[12px] text-ink-500">{st.sub}</p>
                </div>
              </div>
              <div className="space-y-3">
                {st.exercises.map((ex, i) => (
                  <div key={i} className="rounded-2xl border border-ink-100 bg-white px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-heading font-bold text-[14px] text-ink-800">{ex.title}</p>
                      <span className="shrink-0 text-[11px] font-heading font-semibold text-gold-700 bg-gold-50 border border-gold-200 rounded-full px-2.5 py-0.5">{ex.type} · {ex.min} דק׳</span>
                    </div>
                    <p className="text-[12.5px] text-ink-600 leading-relaxed">{ex.desc}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <SpeakButton text={`${ex.title}. ${ex.desc}`} />
                      <button
                        type="button"
                        onClick={() => onNavigateStage(5)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold-200 text-gold-700 font-heading font-semibold text-[12px] hover:bg-gold-50 transition-colors"
                      >
                        <Icon name="message-circle" size={13} /> ליווי AI לתרגיל
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // מעקב יומי: רמת חרדה, מצב רוח ואיכות שינה — עם גרף מגמה. תוספת ל"מדד חוסן".
  const MOOD_OPTIONS = [
    { key: "calm", label: "רגוע", emoji: "😌" },
    { key: "positive", label: "טוב", emoji: "🙂" },
    { key: "neutral", label: "ניטרלי", emoji: "😐" },
    { key: "anxious", label: "חרד/ה", emoji: "😟" },
    { key: "overwhelmed", label: "מוצף/ת", emoji: "😰" },
  ];

  function MoodTrendChart({ log }) {
    const pts = log.filter((r) => Number.isFinite(r.anxiety) || Number.isFinite(r.sleep)).slice(-14);
    if (pts.length < 2) {
      return <p className="text-[12.5px] text-ink-400 text-center py-3">רשמי לפחות שני ימים כדי לראות מגמה 🌱</p>;
    }
    const W = 300, H = 120, pad = 10;
    const x = (i) => pad + (i * (W - 2 * pad)) / (pts.length - 1);
    const y = (v) => H - pad - ((v - 1) / 9) * (H - 2 * pad);
    const line = (key) =>
      pts.map((r, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(r[key] || 1).toFixed(1)}`).join(" ");
    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 260 }} aria-label="גרף מגמה">
          {[1, 5, 10].map((g) => (
            <line key={g} x1={pad} x2={W - pad} y1={y(g)} y2={y(g)} stroke="#eee7d6" strokeWidth="1" />
          ))}
          <path d={line("anxiety")} fill="none" stroke="#c2974a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={line("sleep")} fill="none" stroke="#8aa899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map((r, i) => (
            <g key={i}>
              {Number.isFinite(r.anxiety) && <circle cx={x(i)} cy={y(r.anxiety)} r="2.5" fill="#c2974a" />}
              {Number.isFinite(r.sleep) && <circle cx={x(i)} cy={y(r.sleep)} r="2.5" fill="#8aa899" />}
            </g>
          ))}
        </svg>
        <div className="flex items-center justify-center gap-4 mt-1 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded-full" style={{ background: "#c2974a" }} /> חרדה</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded-full" style={{ background: "#8aa899" }} /> איכות שינה</span>
        </div>
      </div>
    );
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
      return fetch("/api/mood", { headers: authHeaders() })
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => { if (Array.isArray(d)) setLog(d); })
        .catch(() => {});
    }
    useEffect(() => { let alive = true; refresh().then(() => { if (!alive) return; }); return () => { alive = false; }; }, []);

    function save() {
      setSaving(true);
      fetch("/api/mood", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ anxiety, sleep, mood, note }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then(() => refresh())
        .then(() => { setSaved(true); setNote(""); setTimeout(() => setSaved(false), 2500); })
        .catch(() => {})
        .finally(() => setSaving(false));
    }

    const Slider = ({ label, value, setValue, color }) => (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-heading font-semibold text-ink-700">{label}</span>
          <span className="text-[13px] font-heading font-bold" style={{ color }}>{value}/10</span>
        </div>
        <input type="range" min="1" max="10" value={value} onChange={(e) => setValue(Number(e.target.value))}
          className="w-full" style={{ accentColor: color }} />
      </div>
    );

    return (
      <div className="rounded-3xl border border-gold-200 bg-white px-5 py-5 space-y-4">
        <div>
          <h3 className="font-heading font-bold text-[16px] text-ink-800">צ׳ק-אין יומי</h3>
          <p className="text-[12.5px] text-ink-500 mt-0.5">איך את/ה מרגיש/ה היום? רגע קצר של מודעות — ונראה את המגמה לאורך זמן.</p>
        </div>

        <Slider label="רמת חרדה" value={anxiety} setValue={setAnxiety} color="#c2974a" />
        <Slider label="איכות שינה" value={sleep} setValue={setSleep} color="#8aa899" />

        <div>
          <span className="text-[13px] font-heading font-semibold text-ink-700 block mb-2">מצב הרוח</span>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button key={m.key} type="button" onClick={() => setMood(m.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12.5px] font-heading font-semibold transition-colors ${mood === m.key ? "border-gold-400 bg-gold-50 text-gold-700" : "border-ink-200 text-ink-600 hover:border-gold-300"}`}>
                <span>{m.emoji}</span> {m.label}
              </button>
            ))}
          </div>
        </div>

        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          placeholder="משהו שתרצה/י לרשום להיום? (לא חובה)"
          className="w-full rounded-2xl border border-ink-200 px-3.5 py-2.5 text-[13px] text-ink-700 resize-none focus:outline-none focus:border-gold-300" />

        <button type="button" onClick={save} disabled={saving}
          className="w-full rounded-full bg-gold-500 text-white font-heading font-bold text-[14px] py-3 hover:bg-gold-600 transition-colors disabled:opacity-60">
          {saving ? "שומר..." : saved ? "נשמר! 🌿" : "שמירת הצ׳ק-אין"}
        </button>

        <div className="pt-1">
          <p className="text-[12.5px] font-heading font-semibold text-ink-600 mb-1.5">המגמה שלך</p>
          <MoodTrendChart log={log} />
        </div>
      </div>
    );
  }

  function ProgramStage({ onNavigateStage }) {
    const [done, setDone] = useState(loadProgramDone);
    const total = 14;
    const completed = done.length;
    function toggle(day) {
      setDone((prev) => {
        const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
        try { localStorage.setItem(PROGRAM_KEY, JSON.stringify(next)); } catch (e) {}
        return next;
      });
    }
    return (
      <div className="space-y-7">
        <GuidedModule />
        <div>
          <p className="font-heading font-semibold text-[12px] tracking-[0.18em] text-gold-600 mb-1">CURE MINDSET</p>
          <h2 className="font-heading font-bold text-[22px] text-ink-800">התוכנית שלך · מסע 14 יום</h2>
          <p className="text-[13.5px] text-ink-500 mt-1.5 leading-relaxed">תוכנית מובנית, יום אחרי יום — עם תרגול קצר ושיחת AI ממוקדת בכל שלב. בקצב שלך.</p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px] text-ink-500 mb-1.5">
              <span>{completed} מתוך {total} ימים הושלמו</span>
              <span>{Math.round((completed / total) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full bg-gold-500 rounded-full transition-all duration-500" style={{ width: `${(completed / total) * 100}%` }} />
            </div>
          </div>
        </div>

        {PROGRAM_GATES.map((g) => (
          <div key={g.gate}>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="font-heading font-semibold text-[12px] text-gold-600">{g.gate}</span>
              <span className="font-heading font-bold text-[15px] text-ink-800">· {g.title}</span>
            </div>
            <div className="space-y-3">
              {g.days.map((d) => {
                const isDone = done.includes(d.day);
                return (
                  <div key={d.day} className={`rounded-2xl border px-4 py-4 transition-colors ${isDone ? "border-gold-300 bg-gold-50" : "border-ink-100 bg-white"}`}>
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => toggle(d.day)}
                        aria-label={isDone ? "בטל סימון" : "סמן כהושלם"}
                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-[14px] transition-colors ${isDone ? "bg-gold-500 text-white" : "bg-gold-50 text-gold-600 border border-gold-200"}`}
                      >
                        {isDone ? <Icon name="check-circle" size={18} /> : d.day}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-[15px] text-ink-800">יום {d.day} · {d.title}</p>
                        <p className="text-[13px] text-ink-600 mt-1 leading-relaxed">{d.focus}</p>
                        <p className="text-[12.5px] text-gold-700 mt-1.5"><span className="font-semibold">תרגול:</span> {d.practice}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => onNavigateStage(5)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[12.5px] hover:bg-gold-600 transition-colors"
                          >
                            <Icon name="message-circle" size={14} /> שיחת AI ליום זה
                          </button>
                          <button
                            type="button"
                            onClick={() => toggle(d.day)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-ink-200 text-ink-600 font-heading font-semibold text-[12.5px] hover:border-gold-300 transition-colors"
                          >
                            {isDone ? "בטל סימון" : "סמן כהושלם"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <ExerciseLibrary onNavigateStage={onNavigateStage} />
      </div>
    );
  }

  function MemberArea({ onExit }) {
    const [loggedIn, setLoggedIn] = useState(() => !!getAuthToken());
    const [progress, setProgress] = useState(loadProgress);
    // Open on the AI check-in (stage 5, "צ'ק-אין") so a client who registers
    // immediately meets the AI that asks questions — not the anchor exercise.
    const [current, setCurrent] = useState(5);
    const [serverDashboard, setServerDashboard] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(AGE_GROUP_KEY));
    // access: null = still checking; { status: "trial"|"code"|"expired", daysLeft }
    const [access, setAccess] = useState(null);
    const [showCodeEntry, setShowCodeEntry] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const userName = (() => { try { return localStorage.getItem(AUTH_NAME_KEY) || ""; } catch (e) { return ""; } })();

    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }, []);

    useEffect(() => {
      if (!loggedIn) return;
      fetch("/api/access", { headers: authHeaders() })
        .then((res) => (res.ok ? res.json() : { status: "trial", daysLeft: 14 }))
        .then(setAccess)
        .catch(() => setAccess({ status: "trial", daysLeft: 14 }));
    }, [loggedIn]);

    useEffect(() => {
      if (!loggedIn) return;
      fetch("/api/dashboard", { headers: authHeaders() })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setServerDashboard(data))
        .catch(() => {});
    }, [loggedIn]);

    function logout() {
      fetch("/api/auth/logout", { method: "POST", headers: authHeaders() }).catch(() => {});
      clearAuth();
      setLoggedIn(false);
      onExit();
    }

    function unlock(stageId, nextUnlocked) {
      setProgress((prev) => {
        const completed = prev.completed.includes(stageId) ? prev.completed : [...prev.completed, stageId];
        const unlocked = Math.max(prev.unlocked, nextUnlocked);
        const next = { completed, unlocked };
        saveProgress(next);
        return next;
      });
    }

    function navigateToStage(stageId) {
      const target = STAGES.find((s) => s.id === stageId);
      setCurrent(target && (target.alwaysUnlocked || stageId <= progress.unlocked) ? stageId : progress.unlocked);
    }

    const stage = STAGES.find((s) => s.id === current);

    // ── מנגנון ניסיון מבוסס-מודולים: 2 מודולי ליבה חינם, ואז Paywall ──
    // מודולי הליבה הם השלבים המודרכים (1-3). מנוי בתשלום (code/paid) פותח הכל.
    const FREE_MODULES = 2;
    const paid = access && (access.status === "code" || access.status === "paid");
    const modulesUsed = progress.completed.filter((id) => id >= 1 && id <= 3).length;
    const trialLocked = !paid && modulesUsed >= FREE_MODULES;
    // ה-Paywall נחסם כאשר תקופת הניסיון פגה (זמן) או שנוצלו 2 המודולים.
    const expired = (access && access.status === "expired") || trialLocked;

    // שער כניסה: בלי חשבון מחובר — אין גישה לאזור האישי.
    if (!loggedIn) {
      return (
        <PhoneFrame>
          <AuthGate onAuthed={() => setLoggedIn(true)} onExit={onExit} />
        </PhoneFrame>
      );
    }

    return (
      <PhoneFrame>
        <Header subtitle={stage ? stage.subtitle : ""} onExit={logout} onNotifications={() => setShowNotifications(true)} onMenu={() => setShowDrawer(true)} />
        <Drawer
          open={showDrawer}
          onClose={() => setShowDrawer(false)}
          userName={userName}
          onLogout={logout}
          onSettings={() => setShowSettings(true)}
          onStories={() => { onExit(); setTimeout(() => { const el = document.getElementById("testimonials"); if (el) el.scrollIntoView({ behavior: "smooth" }); }, 400); }}
        />
        {showSettings && <SettingsSheet userName={userName} onClose={() => setShowSettings(false)} onLogout={logout} onManage={() => { setShowSettings(false); setShowCodeEntry(true); }} />}
        {access && access.status === "trial" && <TrialBanner daysLeft={access.daysLeft} />}
        <StageNav stages={STAGES} progress={progress} current={current} onSelect={setCurrent} />
        {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
        {(expired || showCodeEntry) && (
          <AccessGate
            expired={expired}
            onUnlocked={(next) => { setAccess(next); setShowCodeEntry(false); }}
            onClose={() => setShowCodeEntry(false)}
            onExit={onExit}
            onShowSummary={() => setShowSummary(true)}
          />
        )}
        {showSummary && <JourneySummary onClose={() => setShowSummary(false)} onExit={onExit} />}
        {!expired && showOnboarding && <AgeGroupOnboarding onDone={() => setShowOnboarding(false)} />}
        {showOnboarding && !expired ? (
          <div className="flex-1" />
        ) : current === 8 ? (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <ProgramStage onNavigateStage={navigateToStage} />
          </div>
        ) : current === 4 ? (
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-ink-50 space-y-6">
            <MoodTracker />
            <ResilienceDashboard progress={progress} sessions={loadSessions()} data={serverDashboard} onNavigateStage={navigateToStage} />
          </div>
        ) : current === 5 ? (
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-ink-50">
            <CheckInStage onDashboardUpdate={setServerDashboard} onNavigateStage={navigateToStage} />
          </div>
        ) : current === 6 ? (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <MaterialsStage />
          </div>
        ) : current === 7 ? (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <TasksStage />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {current === 1 ? (
              <AnchorStage
                onComplete={() => {
                  unlock(1, 2);
                  setCurrent(2);
                }}
              />
            ) : null}
            {current === 2 ? (
              <BorderStage
                onComplete={() => {
                  unlock(2, 3);
                  setCurrent(3);
                }}
              />
            ) : null}
            {current === 3 ? <GroundStage onComplete={() => unlock(3, 3)} /> : null}
          </div>
        )}
      </PhoneFrame>
    );
  }

  window.MemberArea = MemberArea;
})();
