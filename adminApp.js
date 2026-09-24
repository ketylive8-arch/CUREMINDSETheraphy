// CureMindset — Therapist CRM ("הקליניקה שלי"). Standalone Babel-in-browser app,
// wrapped in an IIFE so its top-level declarations never collide with app.js/memberArea.js
// (this page never loads those files). Talks to the Basic-Auth-gated /api/admin/* routes.
(function () {
  "use strict";

  const { useState, useEffect } = React;
  const Icon = window.Icon;

  const AUTH_KEY = "cm_admin_auth";

  const STATUS_DOT = { green: "bg-emerald-500", yellow: "bg-amber-500", red: "bg-rose-500" };
  const MATERIAL_TYPES = [
    { value: "lesson", label: "שיעור קצר / מיקרו-לרנינג (טקסט)", icon: "book-open" },
    { value: "audio", label: "קובץ שמע (דמיון מודרך)", icon: "headphones" },
    { value: "worksheet", label: "דף עבודה (NLP)", icon: "file-text" },
    { value: "summary", label: "סיכום פגישה", icon: "book-open" },
    { value: "other", label: "חומר אחר", icon: "file-text" },
  ];

  function materialMeta(type) {
    return MATERIAL_TYPES.find((t) => t.value === type) || MATERIAL_TYPES[3];
  }

  function formatDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso.replace(" ", "T") + (iso.includes("Z") ? "" : "Z"));
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("he-IL", { dateStyle: "medium", timeStyle: "short" });
  }

  /* ---------------------------------------------------------------- */
  /* Auth                                                              */
  /* ---------------------------------------------------------------- */

  function loadAuthHeader() {
    try {
      return sessionStorage.getItem(AUTH_KEY) || null;
    } catch {
      return null;
    }
  }

  function saveAuthHeader(header) {
    try {
      sessionStorage.setItem(AUTH_KEY, header);
    } catch {}
  }

  function clearAuthHeader() {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {}
  }

  function LoginScreen({ onAuthed }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | error
    async function handleSubmit(e) {
      e.preventDefault();
      if (!username || !password) return;
      setStatus("loading");
      const header = "Basic " + btoa(`${username}:${password}`);
      try {
        const res = await fetch("/api/admin/patients", { headers: { Authorization: header } });
        if (!res.ok) throw new Error("unauthorized");
        saveAuthHeader(header);
        onAuthed(header);
      } catch {
        setStatus("error");
      }
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-800 px-5">
        <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl px-7 py-9 shadow-soft">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="shield-check" size={16} className="text-gold-400" />
            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-400">CureMindset · אזור מטפלת</span>
          </div>
          <h1 className="font-heading text-[22px] font-bold text-white mb-6">כניסה להקליניקה שלי</h1>

          <label className="block text-[12.5px] font-heading font-semibold text-white/70 mb-1.5">שם משתמש</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full mb-4 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold-400/60"
          />

          <label className="block text-[12.5px] font-heading font-semibold text-white/70 mb-1.5">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full mb-2 rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-gold-400/60"
          />

          {status === "error" ? <p className="text-[12.5px] text-rose-400 mb-3">שם המשתמש או הסיסמה אינם נכונים.</p> : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[15px] px-6 py-3.5 transition-all hover:bg-gold-600 disabled:opacity-60"
          >
            {status === "loading" ? "מתחברת..." : "כניסה"}
          </button>
        </form>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Clinic list ("הקליניקה שלי")                                      */
  /* ---------------------------------------------------------------- */

  function PatientRow({ patient, onOpen }) {
    const name = patient.displayName || `מטופל/ת · ${patient.deviceToken.slice(0, 8)}`;
    return (
      <button
        type="button"
        onClick={() => onOpen(patient.deviceToken)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-ink-100 hover:border-gold-300 hover:-translate-y-0.5 transition-all shadow-softer text-right"
      >
        <span className="w-11 h-11 rounded-full bg-ink-50 text-ink-500 flex items-center justify-center shrink-0">
          <Icon name="user-round" size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-bold text-[15px] text-ink-800 truncate">{name}</span>
          <span className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[patient.statusColor] || STATUS_DOT.green}`} />
            <span className="text-[12.5px] text-ink-500 truncate">{patient.status}</span>
          </span>
        </span>
        <Icon name="arrow-up-right" size={16} className="text-ink-300 shrink-0 rtl-flip" />
      </button>
    );
  }

  // Access-code panel: Kety generates a personal code after a client pays,
  // sends it in WhatsApp, and the client unlocks the member area with it.
  function AccessCodesPanel({ authHeader }) {
    const [codes, setCodes] = useState([]);
    const [plan, setPlan] = useState("digital");
    const [months, setMonths] = useState("");
    const [note, setNote] = useState("");
    const [creating, setCreating] = useState(false);
    const [open, setOpen] = useState(false);
    const [justCreated, setJustCreated] = useState(null);

    function load() {
      fetch("/api/admin/codes", { headers: { Authorization: authHeader } })
        .then((r) => (r.ok ? r.json() : []))
        .then(setCodes)
        .catch(() => {});
    }
    useEffect(load, []);

    function create() {
      if (creating) return;
      setCreating(true);
      fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ plan, note, months: months || null }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          setJustCreated(data.code);
          setNote("");
          load();
        })
        .catch(() => {})
        .finally(() => setCreating(false));
    }

    const planNames = { digital: "ליווי דיגיטלי", youth: "מפגשי נוער", recommended: "ליווי אישי", premium: "פרימיום" };

    return (
      <section className="bg-white rounded-2xl border border-ink-100 p-5">
        <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="shield-check" size={17} className="text-gold-600" />
            <h2 className="font-heading font-bold text-[16px] text-ink-800">קודי גישה ללקוחות</h2>
          </div>
          <Icon name={open ? "chevron-up" : "chevron-down"} size={17} className="text-ink-400" />
        </button>

        {open && (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-end gap-2.5">
              <label className="flex flex-col gap-1 text-[12px] text-ink-500">
                מסלול
                <select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-xl border border-ink-200 px-3 py-2 text-[13px] text-ink-700 bg-white">
                  <option value="digital">ליווי דיגיטלי</option>
                  <option value="youth">מפגשי נוער</option>
                  <option value="recommended">ליווי אישי</option>
                  <option value="premium">פרימיום</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[12px] text-ink-500">
                תוקף בחודשים (ריק = ללא הגבלה)
                <input type="number" min="1" max="36" value={months} onChange={(e) => setMonths(e.target.value)} className="w-32 rounded-xl border border-ink-200 px-3 py-2 text-[13px]" />
              </label>
              <label className="flex flex-col gap-1 text-[12px] text-ink-500 flex-1 min-w-[140px]">
                הערה (שם הלקוחה)
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="למשל: דנה לוי" className="rounded-xl border border-ink-200 px-3 py-2 text-[13px]" />
              </label>
              <button
                type="button"
                onClick={create}
                disabled={creating}
                className="rounded-full bg-gold-500 text-white font-heading font-semibold text-[13px] px-5 py-2.5 hover:bg-gold-600 disabled:opacity-40"
              >
                {creating ? "יוצרת..." : "צרי קוד חדש"}
              </button>
            </div>

            {justCreated && (
              <div className="rounded-xl bg-gold-50 border border-gold-200 px-4 py-3 text-center">
                <p className="text-[12px] text-gold-700 mb-1">הקוד נוצר! שלחי אותו ללקוחה בוואטסאפ:</p>
                <p className="font-heading font-extrabold text-[20px] tracking-widest text-ink-800" dir="ltr">{justCreated}</p>
              </div>
            )}

            {codes.length > 0 && (
              <ul className="divide-y divide-ink-50 max-h-64 overflow-y-auto">
                {codes.map((c) => (
                  <li key={c.code} className="py-2.5 flex items-center justify-between gap-3 text-[13px]">
                    <div className="min-w-0">
                      <span className="font-heading font-bold text-ink-800 ml-2" dir="ltr">{c.code}</span>
                      <span className="text-ink-400">
                        {planNames[c.plan] || c.plan}
                        {c.note ? ` · ${c.note}` : ""}
                        {c.months ? ` · ${c.months} חוד'` : ""}
                      </span>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${c.redeemed_by ? "bg-ink-100 text-ink-500" : "bg-gold-50 text-gold-700 border border-gold-200"}`}>
                      {c.redeemed_by ? "נוצל" : "פנוי"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    );
  }

  // נרשמות חדשות לסדנאות — מהטופס בדף הבית (פתוח כברירת מחדל = תיבת הלידים)
  function AIStatusPanel({ authHeader }) {
    const [st, setSt] = useState(null);
    const [loading, setLoading] = useState(true);
    function check() {
      setLoading(true);
      fetch("/api/admin/ai-status", { headers: { Authorization: authHeader } })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { setSt(d); setLoading(false); })
        .catch(() => setLoading(false));
    }
    useEffect(() => { check(); }, []);
    const ok = st && st.working;
    const border = ok ? "#6f9268" : "#c9922f";
    const bg = ok ? "#eef4ec" : "#fdf6e6";
    const tint = ok ? "#4b6b45" : "#8a6414";
    return (
      <div className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="font-heading font-bold text-[15px] text-ink-800 flex items-center gap-1.5">
            <Icon name="sparkles" size={14} className="text-gold-600" /> מנוע ה-AI
          </h2>
          <button type="button" onClick={check} className="text-[12px] font-semibold underline" style={{ color: tint }}>בדיקה מחדש</button>
        </div>
        {loading ? (
          <p className="text-[13px] text-ink-500">בודק את החיבור ל-GPT...</p>
        ) : st ? (
          <div>
            <span className="inline-block text-[13px] font-heading font-bold" style={{ color: tint }}>
              {ok ? "מנוע ה-AI המתקדם פעיל — עונה עם המתודה המלאה" : st.configured ? "המפתח מוגדר אך אינו עובד — יש לבדוק אותו" : "מצב מקומי (המנוע המתקדם אינו פעיל)"}
            </span>
            {!ok && st.reason ? <p className="text-[12.5px] text-ink-600 mt-1.5 leading-relaxed">{st.reason}</p> : null}
            {!ok ? <p className="text-[11.5px] text-ink-400 mt-1.5">הלקוחות עדיין מקבלים תשובות מהמנוע המקומי (עובד, אך פשוט יותר). כדי להפעיל את מנוע ה-AI המתקדם — יש להשלים את הגדרת המנוע בהגדרות האירוח.</p> : null}
          </div>
        ) : (
          <p className="text-[13px] text-ink-500">לא ניתן היה לבדוק כרגע.</p>
        )}
      </div>
    );
  }

  function WorkshopSignupsPanel({ authHeader }) {
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(true);

    useEffect(() => {
      fetch("/api/admin/signups", { headers: { Authorization: authHeader } })
        .then((r) => (r.ok ? r.json() : []))
        .then(setRows)
        .catch(() => {});
    }, []);

    return (
      <section className="bg-white rounded-2xl border border-ink-100 p-5">
        <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="calendar" size={17} className="text-gold-600" />
            <h2 className="font-heading font-bold text-[16px] text-ink-800">
              נרשמות לסדנאות
              {rows.length > 0 && (
                <span className="mr-2 px-2 py-0.5 rounded-full bg-gold-50 border border-gold-200 text-gold-700 text-[12px] font-semibold">
                  {rows.length}
                </span>
              )}
            </h2>
          </div>
          <Icon name={open ? "chevron-up" : "chevron-down"} size={17} className="text-ink-400" />
        </button>

        {open && (
          <ul className="mt-4 divide-y divide-ink-50 max-h-80 overflow-y-auto">
            {rows.length === 0 && <li className="py-3 text-[13px] text-ink-400 text-center">עדיין אין נרשמות</li>}
            {rows.map((s) => (
              <li key={s.id} className="py-3 flex flex-col gap-0.5 text-[13.5px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-heading font-bold text-ink-800">{s.full_name}</span>
                  <span className="text-ink-400 text-[12px] shrink-0">{formatDateTime(s.created_at)}</span>
                </div>
                <span className="text-ink-600">
                  {s.workshop} · <a href={`tel:${s.phone}`} className="text-gold-700 font-semibold">{s.phone}</a>
                  {s.email ? ` · ${s.email}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  function ClinicList({ authHeader, onOpenPatient, onOpenDistribution, onLogout }) {
    const [patients, setPatients] = useState(null);
    const [error, setError] = useState(false);

    function load() {
      fetch("/api/admin/patients", { headers: { Authorization: authHeader } })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then(setPatients)
        .catch((status) => {
          if (status === 401) return onLogout();
          setError(true);
        });
    }

    useEffect(load, []);

    return (
      <div className="min-h-screen bg-ink-50">
        <header className="bg-white border-b border-ink-100 px-6 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="heart-handshake" size={15} className="text-gold-600" />
              <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-600">CureMindset</span>
            </div>
            <h1 className="font-heading text-[24px] font-bold text-ink-800">הקליניקה שלי</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDistribution}
              className="inline-flex items-center gap-2 rounded-full bg-gold-500 text-white px-4 py-2.5 text-[13px] font-heading font-semibold hover:bg-gold-600"
            >
              <Icon name="sliders-horizontal" size={15} />
              מנוע הפצה
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-ink-100 px-4 py-2.5 text-[13px] font-heading font-semibold text-ink-600 hover:bg-ink-50"
            >
              <Icon name="log-out" size={15} />
              יציאה
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 py-7 space-y-3">
          <AIStatusPanel authHeader={authHeader} />
          <WorkshopSignupsPanel authHeader={authHeader} />
          <AccessCodesPanel authHeader={authHeader} />
          {error ? (
            <p className="text-center text-[13px] text-ink-500 py-10">לא הצלחנו לטעון את רשימת המטופלים. נסי לרענן.</p>
          ) : patients === null ? (
            <p className="text-center text-[13px] text-ink-400 py-10">טוענת...</p>
          ) : patients.length === 0 ? (
            <p className="text-center text-[13px] text-ink-500 py-10">עדיין אין מטופלים פעילים במערכת.</p>
          ) : (
            patients.map((p) => <PatientRow key={p.deviceToken} patient={p} onOpen={onOpenPatient} />)
          )}
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Client Profile View — unified chronological activity feed         */
  /* ---------------------------------------------------------------- */

  function intensityLabel(intensity) {
    return { low: "עוצמה נמוכה", medium: "עוצמה בינונית", high: "עוצמה גבוהה" }[intensity] || "";
  }

  function AnalysisChip({ icon, text, hint }) {
    if (!text) return null;
    return (
      <span
        title={hint || undefined}
        className="inline-flex items-center gap-1.5 max-w-full px-2.5 py-1.5 rounded-full bg-ink-800 text-gold-300 text-[11.5px] font-heading font-semibold"
      >
        <Icon name={icon} size={11} className="text-gold-400 shrink-0" />
        <span className="truncate">{text}</span>
      </span>
    );
  }

  function AnalysisChips({ checkin }) {
    const chips = [
      ...checkin.triggers.map((t) => ({
        key: `trig-${t.id}`,
        icon: "flame",
        text: t.area,
        hint: [intensityLabel(t.intensity), t.note].filter(Boolean).join(" · "),
      })),
      ...checkin.patterns.map((p) => ({ key: `pat-${p.id}`, icon: "brain", text: p.title, hint: p.description })),
      ...checkin.balanceAlerts.map((b) => ({ key: `alert-${b.id}`, icon: "alert-circle", text: b.message })),
      ...checkin.wins.map((w) => ({ key: `win-${w.id}`, icon: "star", text: w.title, hint: w.description })),
    ].filter((c) => c.text);
    if (!chips.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {chips.map((c) => (
          <AnalysisChip key={c.key} icon={c.icon} text={c.text} hint={c.hint} />
        ))}
      </div>
    );
  }

  function FeedCheckinCard({ checkin }) {
    return (
      <article className="rounded-2xl border border-ink-100 bg-white px-5 py-4 shadow-softer">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold uppercase tracking-wider text-ink-400">
            <Icon name="message-circle" size={12} className="text-gold-600" />
            צ'ק-אין
          </span>
          <span className="text-[11.5px] text-ink-400 shrink-0">{formatDateTime(checkin.createdAt)}</span>
        </div>
        <p className="text-[14px] text-ink-800 leading-relaxed whitespace-pre-wrap mb-3">{checkin.text}</p>
        {checkin.aiReply ? (
          <div className="rounded-xl bg-ink-800 border-r-[3px] border-gold-400 px-4 py-3 mb-1">
            <p className="flex items-center gap-1.5 text-[10.5px] font-heading font-semibold uppercase tracking-wider text-gold-400 mb-1">
              <Icon name="sparkles" size={11} />
              תגובת קטי · AI
            </p>
            <p className="text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap">{checkin.aiReply}</p>
          </div>
        ) : null}
        <AnalysisChips checkin={checkin} />
      </article>
    );
  }

  function FeedMaterialCard({ material, authHeader, onDeleted }) {
    const meta = materialMeta(material.type);
    const [deleting, setDeleting] = useState(false);
    async function handleDelete() {
      if (!window.confirm("להסיר את החומר הזה מהמטופל/ת?")) return;
      setDeleting(true);
      try {
        const res = await fetch(`/api/admin/materials/${material.id}`, { method: "DELETE", headers: { Authorization: authHeader } });
        if (res.ok) onDeleted(material.id);
      } finally {
        setDeleting(false);
      }
    }
    return (
      <article className="rounded-2xl border border-gold-200 bg-gold-50/50 px-5 py-4 shadow-softer">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-700">
            <Icon name={meta.icon} size={12} />
            חומר טיפולי הוקצה · {meta.label}
          </span>
          <span className="text-[11.5px] text-ink-400 shrink-0">{formatDateTime(material.created_at)}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-[14.5px] text-ink-800 mb-1">{material.title}</p>
            {material.notes ? <p className="text-[13px] text-ink-600 mb-3 leading-relaxed">{material.notes}</p> : null}
            {material.type === "audio" ? (
              <audio controls src={material.url} className="w-full" />
            ) : (
              <a
                href={material.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-gold-700 hover:text-gold-800"
              >
                לפתיחת הקובץ
                <Icon name="arrow-up-right" size={13} className="rtl-flip" />
              </a>
            )}
          </div>
          <button type="button" onClick={handleDelete} disabled={deleting} className="text-gold-700/60 hover:text-rose-600 shrink-0 p-1.5 disabled:opacity-50">
            <Icon name="trash-2" size={15} />
          </button>
        </div>
      </article>
    );
  }

  const FEED_NODE = {
    checkin: { icon: "message-circle", className: "bg-gold-500 text-white" },
    lesson: { icon: "book-open", className: "bg-gold-100 text-gold-600" },
    audio: { icon: "headphones", className: "bg-ink-800 text-gold-400" },
    worksheet: { icon: "file-text", className: "bg-ink-800 text-gold-400" },
    summary: { icon: "book-open", className: "bg-ink-800 text-gold-400" },
    other: { icon: "file-text", className: "bg-ink-800 text-gold-400" },
  };

  function ActivityFeed({ profile, authHeader, onMaterialDeleted }) {
    const entries = [
      ...profile.checkins.map((c) => ({ key: `c-${c.id}`, date: c.createdAt, node: "checkin", render: () => <FeedCheckinCard checkin={c} /> })),
      ...profile.materials.map((m) => ({
        key: `m-${m.id}`,
        date: m.created_at,
        node: m.type,
        render: () => <FeedMaterialCard material={m} authHeader={authHeader} onDeleted={onMaterialDeleted} />,
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    if (!entries.length) {
      return (
        <p className="text-[13px] text-ink-500 py-10 text-center">
          עוד אין פעילות בתיק המטופל/ת — צ'ק-אינים וחומרי טיפול יופיעו כאן בסדר כרונולוגי אחד.
        </p>
      );
    }

    return (
      <div className="relative">
        <div className="absolute top-1 bottom-1 right-6 w-px bg-gradient-to-b from-ink-200 via-ink-100 to-transparent" />
        <div className="space-y-5">
          {entries.map((entry) => {
            const node = FEED_NODE[entry.node] || FEED_NODE.checkin;
            return (
              <div key={entry.key} className="relative flex gap-4">
                <span className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ring-4 ring-ink-50 ${node.className}`}>
                  <Icon name={node.icon} size={17} />
                </span>
                <div className="flex-1 min-w-0 pt-1">{entry.render()}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function UploadMaterialForm({ token, authHeader, onUploaded }) {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("lesson");
    const [notes, setNotes] = useState("");
    const [link, setLink] = useState("");
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | loading | error

    const isLesson = type === "lesson";
    const ready = title.trim() && (isLesson ? notes.trim() || link.trim() : file);

    async function handleSubmit(e) {
      e.preventDefault();
      if (!ready) return;
      setStatus("loading");
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("type", type);
      formData.append("notes", notes.trim());
      if (link.trim()) formData.append("link", link.trim());
      if (file) formData.append("file", file);
      try {
        const res = await fetch(`/api/admin/patients/${token}/materials`, {
          method: "POST",
          headers: { Authorization: authHeader },
          body: formData,
        });
        if (!res.ok) throw new Error("upload failed");
        setTitle("");
        setNotes("");
        setLink("");
        setFile(null);
        setStatus("idle");
        e.target.reset();
        onUploaded();
      } catch {
        setStatus("error");
      }
    }

    return (
      <form onSubmit={handleSubmit} className="rounded-2xl border border-dashed border-gold-300 bg-gold-50/40 px-5 py-5 space-y-3">
        <p className="font-heading font-semibold text-[13.5px] text-ink-700 flex items-center gap-1.5">
          <Icon name="upload" size={14} className="text-gold-600" />
          הוספת תוכן חדש למטופל/ת
        </p>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-[13.5px] text-ink-800 focus:outline-none focus:border-gold-400"
        >
          {MATERIAL_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isLesson ? "כותרת השיעור (לדוגמה: תרגיל נשימה 4-6)" : "כותרת (לדוגמה: דמיון מודרך - רוגע)"}
          className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-[13.5px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-gold-400"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={isLesson ? "תוכן השיעור — טקסט קצר שהמטופל/ת יקרא/תקרא (מיקרו-לרנינג)" : "הערה קצרה (אופציונלי)"}
          rows={isLesson ? 4 : 2}
          className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-[13.5px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-gold-400 resize-none"
        />
        {isLesson ? (
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="קישור (אופציונלי) — וידאו/אודיו חיצוני"
            dir="ltr"
            className="w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-[13px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:border-gold-400 text-right"
          />
        ) : (
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="w-full text-[13px] text-ink-600"
          />
        )}
        {status === "error" ? <p className="text-[12.5px] text-rose-600">ההוספה נכשלה. נסי שוב.</p> : null}
        <button
          type="submit"
          disabled={status === "loading" || !ready}
          className="inline-flex items-center gap-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[13.5px] px-5 py-2.5 hover:bg-gold-600 disabled:opacity-50"
        >
          {status === "loading" ? "שומרת..." : isLesson ? "שליחת השיעור למטופל/ת" : "שיוך החומר למטופל/ת"}
        </button>
      </form>
    );
  }

  function ClientProfile({ token, authHeader, onBack, onLogout }) {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(false);
    const [nameDraft, setNameDraft] = useState("");
    const [savingName, setSavingName] = useState(false);

    function load() {
      fetch(`/api/admin/patients/${token}`, { headers: { Authorization: authHeader } })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data) => {
          setProfile(data);
          setNameDraft(data.displayName || "");
        })
        .catch((status) => {
          if (status === 401) return onLogout();
          setError(true);
        });
    }

    useEffect(load, [token]);

    async function saveName() {
      if (!nameDraft.trim() || nameDraft.trim() === profile.displayName) return;
      setSavingName(true);
      try {
        await fetch(`/api/admin/patients/${token}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ displayName: nameDraft.trim() }),
        });
        setProfile((prev) => ({ ...prev, displayName: nameDraft.trim() }));
      } finally {
        setSavingName(false);
      }
    }

    if (error) {
      return (
        <div className="min-h-screen bg-ink-50 flex items-center justify-center px-5">
          <p className="text-[13px] text-ink-500">לא הצלחנו לטעון את תיק המטופל/ת.</p>
        </div>
      );
    }
    if (!profile) {
      return (
        <div className="min-h-screen bg-ink-50 flex items-center justify-center px-5">
          <p className="text-[13px] text-ink-400">טוענת...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-ink-50">
        <header className="bg-white border-b border-ink-100 px-6 py-6">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-ink-500 hover:text-gold-600 mb-4">
            <Icon name="arrow-right" size={14} className="rtl-flip" />
            חזרה לרשימת המטופלים
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              placeholder={`מטופל/ת · ${token.slice(0, 8)}`}
              className="font-heading text-[22px] font-bold text-ink-800 bg-transparent border-b border-dashed border-ink-200 focus:outline-none focus:border-gold-400 px-1 py-1 min-w-0"
            />
            {savingName ? <span className="text-[11px] text-ink-400">שומרת...</span> : null}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[profile.statusColor] || STATUS_DOT.green}`} />
              <span className="text-[12.5px] font-heading font-semibold text-ink-600">{profile.status}</span>
            </span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 py-7">
          <div className="mb-7">
            <h2 className="font-heading text-[13px] font-semibold uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-1.5">
              <Icon name="upload" size={13} className="text-gold-600" />
              שיוך חומר טיפולי חדש
            </h2>
            <UploadMaterialForm token={token} authHeader={authHeader} onUploaded={load} />
          </div>

          {profile.goals && profile.goals.length > 0 ? (
            <div className="mb-7">
              <h2 className="font-heading text-[13px] font-semibold uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-1.5">
                <Icon name="check-circle-2" size={13} className="text-gold-600" />
                היעדים של המטופל/ת
              </h2>
              <div className="space-y-2.5">
                {profile.goals.map((g) => (
                  <div key={g.id} className="rounded-xl bg-white border border-ink-100 p-3.5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-heading font-semibold text-[13.5px] text-ink-800 truncate">{g.title}</p>
                        <span className="text-[11px] text-gold-700">{g.area}</span>
                      </div>
                      <span className="text-[12px] font-heading font-bold text-gold-700 shrink-0">{g.progress}%{g.status === "done" ? " ✓" : ""}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gold-500" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {profile.moodLogs && profile.moodLogs.length > 0 ? (() => {
            const MOOD_LABELS = { calm: "רגוע", positive: "טוב", neutral: "ניטרלי", anxious: "חרד", overwhelmed: "מוצף" };
            const last = profile.moodLogs[profile.moodLogs.length - 1];
            return (
              <div className="mb-7">
                <h2 className="font-heading text-[13px] font-semibold uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-1.5">
                  <Icon name="sparkles" size={13} className="text-gold-600" />
                  צ׳ק-אין יומי · מגמת הלקוח ({profile.moodLogs.length})
                </h2>
                <div className="rounded-xl bg-white border border-ink-100 p-3.5 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="text-[13px] text-ink-700"><b className="text-gold-700">חרדה אחרונה:</b> {last.anxiety != null ? last.anxiety + "/10" : "—"}</span>
                  <span className="text-[13px] text-ink-700"><b className="text-gold-700">שינה:</b> {last.sleep != null ? last.sleep + "/10" : "—"}</span>
                  <span className="text-[13px] text-ink-700"><b className="text-gold-700">מצב רוח:</b> {MOOD_LABELS[last.mood] || "—"}</span>
                  <span className="text-[11.5px] text-ink-400 w-full">עודכן: {formatDateTime(last.created_at)}</span>
                  {last.note ? <span className="text-[12.5px] text-ink-600 w-full">״{last.note}״</span> : null}
                </div>
              </div>
            );
          })() : null}

          <h2 className="font-heading text-[16px] font-bold text-ink-800 mb-5 flex items-center gap-2">
            <Icon name="clock" size={15} className="text-gold-600" />
            תיק מטופל/ת · סרט הפעילות המלא
          </h2>

          <ActivityFeed
            profile={profile}
            authHeader={authHeader}
            onMaterialDeleted={(id) => setProfile((prev) => ({ ...prev, materials: prev.materials.filter((x) => x.id !== id) }))}
          />
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Distribution CRM ("מנוע הפצה") — Stage 0: manual channel pipeline  */
  /* ---------------------------------------------------------------- */

  const DIST_PRIORITY_STYLE = {
    HIGH: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    MEDIUM: "bg-amber-50 text-amber-700 border border-amber-200",
    LOW: "bg-ink-50 text-ink-500 border border-ink-200",
  };

  function distStatusStyle(status) {
    if (status === "CLIENT") return "bg-emerald-500 text-white";
    if (status === "LOST" || status === "NOT_A_FIT") return "bg-rose-100 text-rose-600";
    if (status === "AWAITING_APPROVAL") return "bg-amber-100 text-amber-700";
    return "bg-ink-100 text-ink-600";
  }

  function labelFrom(list, value) {
    const f = (list || []).find((x) => x.value === value);
    return f ? f.label : value || "";
  }

  const DIST_FIELD_INPUT =
    "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[13.5px] text-ink-800 focus:outline-none focus:border-gold-400";
  const DIST_FIELD_LABEL = "block text-[12px] font-heading font-semibold text-ink-600 mb-1";

  function emptyChannelDraft() {
    return {
      name: "", channelKind: "parent_community", oppType: "AUDIENCE_OWNER",
      region: "", audience: "", ages: "", hasTeenParents: false,
      whyYes: "", distributionMethod: "", offerModel: "",
      contactName: "", contactRole: "", emailPublic: "", phonePublic: "",
      website: "", sourceUrl: "", qrLink: "",
      audienceSize: "", audienceSizeStatus: "UNKNOWN",
      priority: "MEDIUM", priorityReason: "", measurable: false, notes: "",
    };
  }

  // Shared field set, used by both the add form and per-channel edit so the
  // schema lives in one place.
  function ChannelFields({ draft, set, meta }) {
    const m = meta || {};
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={DIST_FIELD_LABEL}>שם הגוף *</label>
          <input className={DIST_FIELD_INPUT} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="למשל: מרכז למידה אופק, חיפה" />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>סוג ערוץ</label>
          <select className={DIST_FIELD_INPUT} value={draft.channelKind} onChange={(e) => set("channelKind", e.target.value)}>
            {(m.channelKinds || []).map((k) => <option key={k.value} value={k.value}>{k.group !== "-" ? `${k.group} · ` : ""}{k.label}</option>)}
          </select>
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>סוג הזדמנות</label>
          <select className={DIST_FIELD_INPUT} value={draft.oppType} onChange={(e) => set("oppType", e.target.value)}>
            {(m.oppTypes || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>אזור</label>
          <input className={DIST_FIELD_INPUT} value={draft.region} onChange={(e) => set("region", e.target.value)} placeholder="חיפה / קריות / ..." />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>גילאי הקהל (אם ידוע)</label>
          <input className={DIST_FIELD_INPUT} value={draft.ages} onChange={(e) => set("ages", e.target.value)} placeholder="13–18" />
        </div>
        <div className="sm:col-span-2">
          <label className={DIST_FIELD_LABEL}>קהל היעד</label>
          <input className={DIST_FIELD_INPUT} value={draft.audience} onChange={(e) => set("audience", e.target.value)} placeholder="הורים לתלמידי חטיבה/תיכון" />
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 text-[13px] text-ink-700 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-gold-500" checked={!!draft.hasTeenParents} onChange={(e) => set("hasTeenParents", e.target.checked)} />
          הקהל כולל הורים למתבגרים
        </label>
        <div className="sm:col-span-2">
          <label className={DIST_FIELD_LABEL}>למה שיגידו כן? (Value Exchange)</label>
          <textarea className={DIST_FIELD_INPUT} rows={2} value={draft.whyYes} onChange={(e) => set("whyYes", e.target.value)} placeholder="מה יוצא להם מזה — בלי זה ההזדמנות תסומן עדיפות נמוכה" />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>דרך הפצה אפשרית</label>
          <input className={DIST_FIELD_INPUT} value={draft.distributionMethod} onChange={(e) => set("distributionMethod", e.target.value)} placeholder="ניוזלטר / QR בקבלה / קבוצה" />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>מודל הצעה (אופציונלי)</label>
          <select className={DIST_FIELD_INPUT} value={draft.offerModel} onChange={(e) => set("offerModel", e.target.value)}>
            <option value="">— לבחירה בפיילוט —</option>
            {(m.offerModels || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>איש קשר</label>
          <input className={DIST_FIELD_INPUT} value={draft.contactName} onChange={(e) => set("contactName", e.target.value)} />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>תפקיד</label>
          <input className={DIST_FIELD_INPUT} value={draft.contactRole} onChange={(e) => set("contactRole", e.target.value)} />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>אימייל ציבורי</label>
          <input className={DIST_FIELD_INPUT} value={draft.emailPublic} onChange={(e) => set("emailPublic", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>טלפון ציבורי</label>
          <input className={DIST_FIELD_INPUT} value={draft.phonePublic} onChange={(e) => set("phonePublic", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>אתר</label>
          <input className={DIST_FIELD_INPUT} value={draft.website} onChange={(e) => set("website", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>מקור המידע (URL)</label>
          <input className={DIST_FIELD_INPUT} value={draft.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>גודל קהל (אם ידוע)</label>
          <input className={DIST_FIELD_INPUT} value={draft.audienceSize} onChange={(e) => set("audienceSize", e.target.value)} inputMode="numeric" placeholder="מספר בלבד" />
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>מקור הנתון</label>
          <select className={DIST_FIELD_INPUT} value={draft.audienceSizeStatus} onChange={(e) => set("audienceSizeStatus", e.target.value)}>
            {(m.metricStatus || []).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>עדיפות</label>
          <select className={DIST_FIELD_INPUT} value={draft.priority} onChange={(e) => set("priority", e.target.value)}>
            {(m.priorities || []).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className={DIST_FIELD_LABEL}>נימוק העדיפות (WHY)</label>
          <input className={DIST_FIELD_INPUT} value={draft.priorityReason} onChange={(e) => set("priorityReason", e.target.value)} />
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 text-[13px] text-ink-700 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-gold-500" checked={!!draft.measurable} onChange={(e) => set("measurable", e.target.checked)} />
          ניתן למדוד את המשפך (חשיפה → ליד → שיחה)
        </label>
        <div className="sm:col-span-2">
          <label className={DIST_FIELD_LABEL}>הערות</label>
          <textarea className={DIST_FIELD_INPUT} rows={2} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
    );
  }

  function AddChannelForm({ authHeader, meta, onCreated }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(emptyChannelDraft);
    const [status, setStatus] = useState("idle"); // idle | saving | error | dup
    const [msg, setMsg] = useState("");
    const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

    async function submit(e) {
      e.preventDefault();
      if (!draft.name.trim()) { setStatus("error"); setMsg("שם הגוף הוא שדה חובה."); return; }
      setStatus("saving"); setMsg("");
      try {
        const res = await fetch("/api/admin/dist/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify(draft),
        });
        if (res.status === 409) {
          const body = await res.json().catch(() => ({}));
          setStatus("dup");
          setMsg(`הגוף כבר קיים במאגר${body.existing ? ` (${body.existing.code})` : ""}.`);
          return;
        }
        if (!res.ok) throw new Error("failed");
        setDraft(emptyChannelDraft());
        setStatus("idle");
        setOpen(false);
        onCreated && onCreated();
      } catch {
        setStatus("error"); setMsg("לא הצלחנו לשמור. נסי שוב.");
      }
    }

    if (!open) {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gold-300 bg-gold-50/40 px-5 py-4 text-[14px] font-heading font-semibold text-gold-700 hover:bg-gold-50"
        >
          <Icon name="arrow-up" size={15} />
          הוספת ערוץ הפצה חדש
        </button>
      );
    }

    return (
      <form onSubmit={submit} className="bg-white rounded-2xl border border-ink-100 p-5 shadow-softer">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-[15px] text-ink-800">ערוץ הפצה חדש</h3>
          <button type="button" onClick={() => { setOpen(false); setStatus("idle"); }} className="text-[12.5px] text-ink-400 hover:text-ink-600">ביטול</button>
        </div>
        <ChannelFields draft={draft} set={set} meta={meta} />
        {msg ? <p className={`mt-3 text-[12.5px] ${status === "dup" ? "text-amber-600" : "text-rose-500"}`}>{msg}</p> : null}
        <button
          type="submit"
          disabled={status === "saving"}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[14px] px-6 py-3 hover:bg-gold-600 disabled:opacity-60"
        >
          {status === "saving" ? "שומרת..." : "שמירת ערוץ"}
        </button>
      </form>
    );
  }

  function ChannelCard({ channel, meta, authHeader, onChanged, onLogout }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(() => ({ ...emptyChannelDraft(), ...channel, offerModel: channel.offerModel || "" }));
    const [busy, setBusy] = useState(false);
    const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

    // Outreach draft ("פנייה") — separate from the field-edit draft above.
    const [outreach, setOutreach] = useState(null);
    const [outreachOpen, setOutreachOpen] = useState(false);
    const [outreachBusy, setOutreachBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    async function prepareOutreach(regenerate) {
      setOutreachBusy(true);
      try {
        const res = await fetch(`/api/admin/dist/channels/${channel.id}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ regenerate: !!regenerate }),
        });
        if (res.status === 401) return onLogout && onLogout();
        const j = await res.json();
        if (j.draft) { setOutreach(j.draft); setOutreachOpen(true); onChanged && onChanged(); }
      } finally { setOutreachBusy(false); }
    }
    async function copyOutreach() {
      try { await navigator.clipboard.writeText(outreach.draftText); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {}
    }
    async function markSent() {
      setOutreachBusy(true);
      try {
        const res = await fetch(`/api/admin/dist/outreach/${outreach.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify({ state: "sent", editedText: outreach.draftText }),
        });
        if (res.status === 401) return onLogout && onLogout();
        setOutreachOpen(false); setOutreach(null); onChanged && onChanged();
      } finally { setOutreachBusy(false); }
    }

    async function patch(body) {
      setBusy(true);
      try {
        const res = await fetch(`/api/admin/dist/channels/${channel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify(body),
        });
        if (res.status === 401) return onLogout && onLogout();
        if (!res.ok) throw new Error("failed");
        onChanged && onChanged();
      } catch {
        /* leave state; a reload will resync */
      } finally {
        setBusy(false);
      }
    }

    async function remove() {
      if (!window.confirm(`למחוק את "${channel.name}"? הפעולה בלתי הפיכה.`)) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/admin/dist/channels/${channel.id}`, { method: "DELETE", headers: { Authorization: authHeader } });
        if (res.status === 401) return onLogout && onLogout();
        onChanged && onChanged();
      } finally { setBusy(false); }
    }

    if (editing) {
      return (
        <div className="bg-white rounded-2xl border border-gold-200 p-5 shadow-softer">
          <ChannelFields draft={draft} set={set} meta={meta} />
          <div className="flex items-center gap-2 mt-4">
            <button type="button" disabled={busy} onClick={async () => { await patch(draft); setEditing(false); }} className="inline-flex items-center gap-2 rounded-full bg-gold-500 text-white font-heading font-semibold text-[13.5px] px-5 py-2.5 hover:bg-gold-600 disabled:opacity-60">שמירה</button>
            <button type="button" onClick={() => { setDraft({ ...emptyChannelDraft(), ...channel, offerModel: channel.offerModel || "" }); setEditing(false); }} className="text-[12.5px] text-ink-400 hover:text-ink-600 px-2">ביטול</button>
          </div>
        </div>
      );
    }

    return (
      <article className="bg-white rounded-2xl border border-ink-100 p-5 shadow-softer">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-[11px] font-semibold text-gold-700 bg-gold-50 rounded px-1.5 py-0.5">{channel.channelCode}</span>
              <span className={`text-[11px] font-heading font-semibold rounded-full px-2 py-0.5 ${DIST_PRIORITY_STYLE[channel.priority] || DIST_PRIORITY_STYLE.MEDIUM}`}>{labelFrom(meta.priorities, channel.priority)}</span>
              {channel.oppType === "EVIDENCE" ? <span className="text-[11px] font-heading font-semibold rounded-full px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200">לא ליד</span> : null}
            </div>
            <h3 className="font-heading font-bold text-[15.5px] text-ink-800 truncate">{channel.name}</h3>
            <p className="text-[12.5px] text-ink-500 mt-0.5">
              {channel.channelKindLabel}{channel.region ? ` · ${channel.region}` : ""}{channel.hasTeenParents ? " · הורים למתבגרים" : ""}
            </p>
          </div>
          <span className={`shrink-0 text-[11px] font-heading font-semibold rounded-full px-2.5 py-1 ${distStatusStyle(channel.status)}`}>{labelFrom(meta.pipeline, channel.status)}</span>
        </div>

        {channel.whyYes ? (
          <p className="text-[13px] text-ink-700 bg-ink-50 rounded-xl px-3.5 py-2.5 mt-2 leading-relaxed">
            <span className="font-heading font-semibold text-ink-500 text-[11px] block mb-0.5">למה שיגידו כן</span>
            {channel.whyYes}
          </p>
        ) : (
          <p className="text-[12px] text-amber-600 mt-2">אין Value Exchange — סומן עדיפות נמוכה. הוסיפי נימוק בעריכה.</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11.5px] text-ink-500">
          <span className="rounded-full bg-ink-50 px-2 py-0.5">{labelFrom(meta.oppTypes, channel.oppType)}</span>
          {channel.measurable ? <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">מדיד</span> : <span className="rounded-full bg-ink-50 px-2 py-0.5">UNMEASURABLE</span>}
          {channel.contactName ? <span className="rounded-full bg-ink-50 px-2 py-0.5">{channel.contactName}{channel.contactRole ? ` · ${channel.contactRole}` : ""}</span> : null}
          {channel.emailPublic ? <span className="rounded-full bg-ink-50 px-2 py-0.5" dir="ltr">{channel.emailPublic}</span> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-ink-100">
          <label className="text-[11.5px] text-ink-400">שלב</label>
          <select
            value={channel.status}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value })}
            className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[12.5px] text-ink-700 focus:outline-none focus:border-gold-400"
          >
            {(meta.pipeline || []).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label className="text-[11.5px] text-ink-400 mr-1">עדיפות</label>
          <select
            value={channel.priority}
            disabled={busy}
            onChange={(e) => patch({ priority: e.target.value, priorityReason: channel.priorityReason })}
            className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[12.5px] text-ink-700 focus:outline-none focus:border-gold-400"
          >
            {(meta.priorities || []).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <div className="flex-1" />
          {channel.oppType !== "EVIDENCE" ? (
            <button type="button" onClick={() => (outreachOpen ? setOutreachOpen(false) : prepareOutreach(false))} disabled={outreachBusy} className="inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-gold-700 hover:text-gold-800 px-2 py-1 disabled:opacity-50">
              <Icon name="message-circle" size={14} /> {outreachBusy ? "מכינה..." : outreachOpen ? "סגירה" : "הכנת פנייה"}
            </button>
          ) : null}
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-ink-600 hover:text-gold-700 px-2 py-1">
            <Icon name="sliders-horizontal" size={14} /> עריכה
          </button>
          <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-rose-500 hover:text-rose-600 px-2 py-1 disabled:opacity-50">
            <Icon name="trash-2" size={14} /> מחיקה
          </button>
        </div>

        {outreachOpen && outreach ? (
          <div className="mt-3 rounded-xl border border-gold-200 bg-gold-50/50 p-3.5">
            <p className="text-[11.5px] font-heading font-semibold text-gold-700 mb-2">
              טיוטת פנייה שהכין הסוכן — עברי, ערכי אם צריך, ואז שלחי בעצמך (וואטסאפ / מייל). שום דבר לא נשלח אוטומטית.
            </p>
            <textarea
              value={outreach.draftText}
              onChange={(e) => setOutreach((o) => ({ ...o, draftText: e.target.value }))}
              rows={9}
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-[13px] text-ink-800 leading-relaxed focus:outline-none focus:border-gold-400"
            />
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <button type="button" onClick={copyOutreach} className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 text-white text-[12.5px] font-heading font-semibold px-4 py-2 hover:bg-ink-700">
                <Icon name="file-text" size={13} /> {copied ? "הועתק ✓" : "העתקה"}
              </button>
              <button type="button" onClick={markSent} disabled={outreachBusy} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 text-white text-[12.5px] font-heading font-semibold px-4 py-2 hover:bg-emerald-600 disabled:opacity-60">
                <Icon name="check-circle-2" size={13} /> שלחתי — סמני
              </button>
              <button type="button" onClick={() => prepareOutreach(true)} disabled={outreachBusy} className="inline-flex items-center gap-1.5 text-[12.5px] font-heading font-semibold text-ink-500 hover:text-ink-700 px-2 py-1">
                <Icon name="rotate-ccw" size={13} /> יצירה מחדש
              </button>
            </div>
          </div>
        ) : null}
      </article>
    );
  }

  function DistStatsStrip({ stats }) {
    if (!stats) return null;
    const cells = [
      { label: "ערוצים במאגר", value: stats.total },
      { label: "ממתינים לאישורך", value: stats.awaitingApproval },
      { label: "מפיצים בפועל", value: stats.distributing },
      { label: "לקוחות", value: stats.clients },
    ];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {cells.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-ink-100 p-3.5 shadow-softer">
            <div className="font-heading font-bold text-[24px] text-ink-800 tabular-nums">{stats.total === 0 ? "—" : c.value}</div>
            <div className="text-[11.5px] text-ink-500 mt-0.5">{c.label}</div>
            {stats.total === 0 ? <div className="text-[10px] font-heading font-semibold tracking-wide text-amber-600 mt-1">INSUFFICIENT DATA</div> : null}
          </div>
        ))}
      </div>
    );
  }

  const BRIEFING_ICON = { approve: "check-circle-2", draft: "file-text", qualify: "shield-check", contact: "user-round", empty: "arrow-up", idle: "heart-handshake" };

  function DailyBriefing({ briefing }) {
    if (!briefing) return null;
    const actions = briefing.actions || [];
    return (
      <section className="rounded-2xl bg-ink-800 text-white p-5 shadow-softer">
        <div className="flex items-center gap-2 mb-3">
          <Icon name="heart-handshake" size={16} className="text-gold-400" />
          <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-400">הסוכן · מה חשוב היום</span>
        </div>
        <div className="space-y-2.5">
          {actions.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-gold-300"><Icon name={BRIEFING_ICON[a.type] || "heart-handshake"} size={15} /></span>
              <div className="min-w-0">
                <p className="text-[14px] text-white/90 leading-relaxed">{a.text}</p>
                {a.items && a.items.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {a.items.map((it) => (
                      <span key={it.channelId} className="text-[11px] text-gold-200 bg-white/[0.06] rounded-full px-2 py-0.5">
                        <span className="font-mono">{it.channelCode}</span> · {it.channelName}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function DistributionCRM({ authHeader, onBack, onLogout }) {
    const [meta, setMeta] = useState(null);
    const [channels, setChannels] = useState(null);
    const [stats, setStats] = useState(null);
    const [briefing, setBriefing] = useState(null);
    const [error, setError] = useState(false);
    const [priorityFilter, setPriorityFilter] = useState("");
    const [agentRunning, setAgentRunning] = useState(false);
    const [agentMsg, setAgentMsg] = useState("");

    async function runAgent() {
      setAgentRunning(true); setAgentMsg("");
      try {
        const res = await fetch("/api/admin/dist/agent/run", { method: "POST", headers: { Authorization: authHeader } });
        if (res.status === 401) return onLogout();
        const j = await res.json();
        if (j.ok) setAgentMsg(`הסוכן רץ: ${j.added} חדשים · ${j.duplicates} כבר במאגר${j.emailed ? " · מייל נשלח 📩" : ""}`);
        else if (j.reason === "no_search_key") setAgentMsg("כדי שהסוכן יחפש לבד צריך לחבר מפתח חיפוש (ראי הוראות למטה).");
        else setAgentMsg("הריצה לא הצליחה כרגע. נסי שוב.");
        reload();
      } catch { setAgentMsg("שגיאה בהרצה."); }
      finally { setAgentRunning(false); }
    }

    function reload() {
      const q = priorityFilter ? `?priority=${priorityFilter}` : "";
      Promise.all([
        fetch(`/api/admin/dist/channels${q}`, { headers: { Authorization: authHeader } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch("/api/admin/dist/stats", { headers: { Authorization: authHeader } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
        fetch("/api/admin/dist/briefing", { headers: { Authorization: authHeader } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      ])
        .then(([ch, st, br]) => { setChannels(ch); setStats(st); setBriefing(br); })
        .catch((s) => { if (s === 401) return onLogout(); setError(true); });
    }

    useEffect(() => {
      fetch("/api/admin/dist/meta", { headers: { Authorization: authHeader } })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then(setMeta)
        .catch((s) => { if (s === 401) return onLogout(); setError(true); });
    }, []);

    useEffect(reload, [priorityFilter]);

    return (
      <div className="min-h-screen bg-ink-50">
        <header className="bg-white border-b border-ink-100 px-6 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="sliders-horizontal" size={15} className="text-gold-600" />
              <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-600">CureMindset</span>
            </div>
            <h1 className="font-heading text-[24px] font-bold text-ink-800">מנוע הפצה</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-ink-100 px-4 py-2.5 text-[13px] font-heading font-semibold text-ink-600 hover:bg-ink-50">
              <Icon name="arrow-right" size={15} className="rtl-flip" /> לקליניקה
            </button>
            <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-full border border-ink-100 px-4 py-2.5 text-[13px] font-heading font-semibold text-ink-600 hover:bg-ink-50">
              <Icon name="log-out" size={15} /> יציאה
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 py-7 space-y-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 px-4 py-3">
            <p className="text-[12.5px] text-ink-600 leading-relaxed">
              <span className="font-heading font-semibold text-ink-700">שלב 0 · Audit-first.</span> כאן מזינים ומקדמים ערוצי הפצה קיימים ידנית.
              אין חיפוש אוטומטי, אין שליחה, ואין מדדים מומצאים — מספרים יופיעו רק כשיהיו נתונים אמיתיים.
            </p>
          </div>

          <DailyBriefing briefing={briefing} />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runAgent}
              disabled={agentRunning}
              className="inline-flex items-center gap-2 rounded-full bg-gold-500 text-white text-[13px] font-heading font-semibold px-4 py-2.5 hover:bg-gold-600 disabled:opacity-60"
            >
              <Icon name="rotate-ccw" size={14} /> {agentRunning ? "הסוכן מחפש..." : "הרצת הסוכן עכשיו — חפש לידים"}
            </button>
            {agentMsg ? <span className="text-[12.5px] text-ink-600">{agentMsg}</span> : null}
          </div>

          <DistStatsStrip stats={stats} />

          {meta ? <AddChannelForm authHeader={authHeader} meta={meta} onCreated={reload} /> : null}

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] text-ink-400 font-heading font-semibold">סינון:</span>
            {[{ v: "", l: "הכול" }, { v: "HIGH", l: "גבוהה" }, { v: "MEDIUM", l: "בינונית" }, { v: "LOW", l: "נמוכה" }].map((f) => (
              <button
                key={f.v}
                type="button"
                onClick={() => setPriorityFilter(f.v)}
                className={`text-[12px] font-heading font-semibold rounded-full px-3 py-1.5 border ${priorityFilter === f.v ? "bg-ink-800 text-white border-ink-800" : "bg-white text-ink-600 border-ink-200 hover:border-gold-300"}`}
              >
                {f.l}
              </button>
            ))}
          </div>

          {error ? (
            <p className="text-center text-[13px] text-ink-500 py-10">לא הצלחנו לטעון את מנוע ההפצה. נסי לרענן.</p>
          ) : channels === null || meta === null ? (
            <p className="text-center text-[13px] text-ink-400 py-10">טוענת...</p>
          ) : channels.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-[14px] font-heading font-semibold text-ink-700 mb-1">המאגר עדיין ריק</p>
              <p className="text-[13px] text-ink-500">הוסיפי את הגופים שכבר יש לך גישה אליהם — קהילות הורים, מרכזי למידה, מעסיקים — ומשם נתחיל את ה-Audit.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((c) => (
                <ChannelCard key={c.id} channel={c} meta={meta} authHeader={authHeader} onChanged={reload} onLogout={onLogout} />
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Root                                                               */
  /* ---------------------------------------------------------------- */

  function AdminApp() {
    const [authHeader, setAuthHeader] = useState(loadAuthHeader);
    const [view, setView] = useState("list"); // list | profile
    const [selectedToken, setSelectedToken] = useState(null);

    function handleLogout() {
      clearAuthHeader();
      setAuthHeader(null);
      setView("list");
      setSelectedToken(null);
    }

    if (!authHeader) {
      return <LoginScreen onAuthed={setAuthHeader} />;
    }

    if (view === "distribution") {
      return <DistributionCRM authHeader={authHeader} onBack={() => setView("list")} onLogout={handleLogout} />;
    }

    if (view === "profile" && selectedToken) {
      return (
        <ClientProfile
          token={selectedToken}
          authHeader={authHeader}
          onBack={() => setView("list")}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <ClinicList
        authHeader={authHeader}
        onOpenPatient={(token) => {
          setSelectedToken(token);
          setView("profile");
        }}
        onOpenDistribution={() => setView("distribution")}
        onLogout={handleLogout}
      />
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<AdminApp />);
})();
