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

  function ClinicList({ authHeader, onOpenPatient, onLogout }) {
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
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-ink-100 px-4 py-2.5 text-[13px] font-heading font-semibold text-ink-600 hover:bg-ink-50"
          >
            <Icon name="log-out" size={15} />
            יציאה
          </button>
        </header>

        <main className="max-w-2xl mx-auto px-5 py-7 space-y-3">
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
            const MOOD_LABELS = { calm: "😌 רגוע", positive: "🙂 טוב", neutral: "😐 ניטרלי", anxious: "😟 חרד", overwhelmed: "😰 מוצף" };
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
        onLogout={handleLogout}
      />
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<AdminApp />);
})();
