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
      { value: "adult", label: "מבוגר/ת", desc: "18+", icon: "user" },
      { value: "youth", label: "נוער", desc: "עד גיל 18", icon: "users" },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-white flex flex-col items-center justify-center gap-6 px-8 text-center" dir="rtl">
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

  // Thin banner above the stages while on a free trial: days left + code entry shortcut.
  function TrialBanner({ daysLeft, onEnterCode }) {
    return (
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-gold-50 border-b border-gold-200">
        <span className="text-[12.5px] text-gold-700 font-medium">
          ניסיון חינם — {daysLeft === 1 ? "יום אחרון" : `נותרו ${daysLeft} ימים`}
        </span>
        <button type="button" onClick={onEnterCode} className="text-[12.5px] font-bold text-gold-700 underline shrink-0">
          יש לי קוד אישי
        </button>
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

  function CheckInStage({ onDashboardUpdate, onNavigateStage }) {
    const [text, setText] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | done | error
    const [reply, setReply] = useState("");
    const [errMsg, setErrMsg] = useState("");
    const [dashboardData, setDashboardData] = useState(null);
    const [showDashboard, setShowDashboard] = useState(false);

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
          // Surface WHY so it's clear when the AI engine isn't connected on the server.
          setErrMsg(
            res.status === 503
              ? "מנוע ה-AI לא מחובר בשרת (חסר מפתח OPENAI_API_KEY ב-Render). ברגע שהמפתח יוגדר — התשובות המקצועיות יעבדו."
              : res.status === 502
              ? "מנוע ה-AI לא הצליח להשיב כרגע (ייתכן שהמפתח שגוי או שנגמר הקרדיט ב-OpenAI). נסי שוב עוד רגע."
              : "השירות אינו זמין כרגע. נסי שוב עוד רגע."
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
                  היי, אני כאן איתך.
                  <br />
                  ספרי לי איך עבר עלייך היום ומה שלומך עכשיו?
                </p>
              </header>
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
    audio: { icon: "headphones", label: "קובץ שמע" },
    worksheet: { icon: "file-text", label: "דף עבודה" },
    summary: { icon: "book-open", label: "סיכום פגישה" },
    other: { icon: "file-text", label: "חומר" },
  };

  function MaterialCard({ material }) {
    const meta = MATERIAL_TYPE_META[material.type] || MATERIAL_TYPE_META.other;
    return (
      <div className="cm-fade-in-soft rounded-2xl border border-ink-100 bg-white px-4 py-4 shadow-soft">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
            <Icon name={meta.icon} size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-heading font-semibold uppercase tracking-wider text-gold-600 mb-0.5">{meta.label}</p>
            <p className="font-heading font-bold text-[14.5px] text-ink-800 leading-snug">{material.title}</p>
            {material.notes ? <p className="text-[12.5px] text-ink-500 mt-1 leading-relaxed">{material.notes}</p> : null}
          </div>
        </div>
        <div className="mt-3">
          {material.type === "audio" ? (
            <audio controls src={material.url} className="w-full" />
          ) : (
            <a
              href={material.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-gold-600 hover:text-gold-700"
            >
              לפתיחת הקובץ
              <Icon name="arrow-up-right" size={13} />
            </a>
          )}
        </div>
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
    return (
      <div className="fixed inset-0 z-50 bg-ink-100 flex items-center justify-center sm:p-8" dir="rtl">
        <div className="relative w-full h-full sm:w-[390px] sm:h-[800px] sm:rounded-[40px] bg-ink-50 overflow-hidden sm:border-[10px] sm:border-ink-700 sm:shadow-2xl flex flex-col">
          <div className="hidden sm:flex absolute top-0 inset-x-0 h-6 items-center justify-center z-20 pointer-events-none">
            <div className="w-28 h-5 bg-ink-700 rounded-b-2xl" />
          </div>
          {children}
        </div>
      </div>
    );
  }

  function Header({ subtitle, onExit, onNotifications }) {
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
      <div className="flex items-center justify-between gap-3 px-5 pt-7 sm:pt-5 pb-3 bg-white border-b border-ink-100 shrink-0">
        <div>
          <p className="font-heading font-bold text-[15px] text-ink-800">CureMindset · אזור אישי</p>
          <p className="text-[12px] text-ink-500">{subtitle}</p>
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

  function StageNav({ stages, progress, current, onSelect }) {
    return (
      <div className="flex items-center px-4 py-3.5 gap-1 border-b border-ink-100 bg-white shrink-0">
        {stages.map((s, i) => {
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
              {i < stages.length - 1 ? <span className="h-px w-3 bg-ink-100 mt-[-14px]" aria-hidden="true" /> : null}
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

    function update(field, value) {
      setForm((f) => ({ ...f, [field]: value }));
      if (status === "error") setStatus("idle");
    }

    function finishAuth(data) {
      setAuth(data.token, data.fullName);
      onAuthed();
    }

    function submit(e) {
      e.preventDefault();
      if (status === "loading") return;
      setStatus("loading");
      const url = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? { ...form, ref: getRef() } : { email: form.email, password: form.password };
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
              <h3>{isReg ? "יוצרים חשבון ומתחילים" : "כניסה לאזור האישי"}</h3>
              <p>
                {isReg
                  ? "חשבון אישי ומאובטח — 14 ימי ניסיון חינם, בלי התחייבות."
                  : "טוב לראות אותך שוב. התחברי כדי להמשיך מהמקום שעצרת."}
              </p>
            </div>

            <form onSubmit={submit} className="au-form">
              {isReg && (
                <input type="text" name="name" autoComplete="name" required value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)} placeholder="שם מלא" className="au-input" />
              )}
              <input type="email" name="email" autoComplete="email" required value={form.email}
                onChange={(e) => update("email", e.target.value)} placeholder="כתובת מייל" dir="ltr"
                className="au-input" style={{ textAlign: "right" }} />
              {isReg && (
                <input type="tel" name="tel" autoComplete="tel" required value={form.phone}
                  onChange={(e) => update("phone", e.target.value)} placeholder="טלפון נייד" dir="ltr"
                  className="au-input" style={{ textAlign: "right" }} />
              )}
              <input type="password" name="password" autoComplete={isReg ? "new-password" : "current-password"} required
                value={form.password} onChange={(e) => update("password", e.target.value)}
                placeholder="סיסמה (לפחות 6 תווים)" className="au-input" />

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
                {status === "loading" ? "רק רגע..." : isReg ? "יוצרים חשבון ומתחילים" : "כניסה"}
              </button>
            </form>

            <p className="au-switch">
              {isReg ? "כבר יש לך חשבון? " : "עדיין אין לך חשבון? "}
              <button type="button" onClick={() => { setMode(isReg ? "login" : "register"); setStatus("idle"); }}>
                {isReg ? "להתחברות" : "להרשמה"}
              </button>
            </p>
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

    const expired = access && access.status === "expired";

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
        <Header subtitle={stage ? stage.subtitle : ""} onExit={logout} onNotifications={() => setShowNotifications(true)} />
        {access && access.status === "trial" && (
          <TrialBanner daysLeft={access.daysLeft} onEnterCode={() => setShowCodeEntry(true)} />
        )}
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
        {current === 8 ? (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <ProgramStage onNavigateStage={navigateToStage} />
          </div>
        ) : current === 4 ? (
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-ink-50">
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
