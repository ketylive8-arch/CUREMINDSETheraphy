/* Segev MKG · Lead System — React SPA (no build step; htm + React UMD). */
(function () {
  "use strict";
  const { useState, useEffect, useCallback } = React;
  const html = htm.bind(React.createElement);

  // ---------- API ----------
  const TOKEN_KEY = "segev_token";
  const token = {
    get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; } },
    set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch (e) {} },
    clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} },
  };
  async function api(path, opts = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    const t = token.get();
    if (t) headers["Authorization"] = "Bearer " + t;
    const res = await fetch("/api" + path, Object.assign({}, opts, { headers }));
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error((data && data.error) || ("שגיאה " + res.status));
    return data;
  }

  // ---------- status helpers ----------
  const STATUS = {
    new:       { label: "חדש",       dot: "#64748B" },
    sent:      { label: "נשלח",      dot: "#16A34A" },
    bounced:   { label: "חזר",       dot: "#DC2626" },
    no_reply:  { label: "לא ענו",    dot: "#D97706" },
    replied:   { label: "ענו",       dot: "#1d4ed8" },
    queued:    { label: "בתור שליחה", dot: "#7e22ce" },
    refinding: { label: "מאתר מייל",  dot: "#0369a1" },
    removed:   { label: "הוסר",      dot: "#888" },
  };
  const Badge = ({ s }) => html`<span class=${"badge " + s}>
    <span class="dot" style=${{ background: (STATUS[s] || {}).dot }}></span>${(STATUS[s] || { label: s }).label}</span>`;

  const ACTIONS = {
    login: "התחברה", logout: "התנתקה", refind: "איתור מייל מחדש",
    set_email: "עודכן מייל", queue_resend: "נכנס לתור שליחה",
    followup_draft: "הופק מייל אחרון", create_user: "נוצר משתמש",
  };

  // ---------- Login ----------
  function Login({ onLogin }) {
    const [email, setEmail] = useState("segevmkg@gmail.com");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    async function submit(e) {
      e.preventDefault();
      setErr(""); setBusy(true);
      try {
        const r = await api("/login", { method: "POST", body: JSON.stringify({ email, password }) });
        token.set(r.token);
        onLogin(r.user);
      } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
    }
    return html`
      <div class="login-wrap">
        <form class="login-card" onSubmit=${submit}>
          <div class="brand">
            <div class="logo">S</div>
            <h1>Segev MKG</h1>
            <p>מערכת לידים ושליחה</p>
          </div>
          ${err && html`<div class="err">${err}</div>`}
          <div class="field">
            <label>אימייל</label>
            <input type="email" value=${email} onInput=${(e) => setEmail(e.target.value)} dir="ltr" required />
          </div>
          <div class="field">
            <label>סיסמה</label>
            <input type="password" value=${password} onInput=${(e) => setPassword(e.target.value)} required />
          </div>
          <button class="btn block" disabled=${busy}>${busy ? "מתחברת…" : "כניסה"}</button>
          <div class="hint">גישה מאובטחת · משתמשים נוספים נפתחים בלשונית "משתמשים"</div>
        </form>
      </div>`;
  }

  // ---------- Stat tiles ----------
  function Stats({ stats }) {
    if (!stats) return null;
    const items = [
      { k: "total", l: "סה״כ לידים", dot: "#C9A96E" },
      { k: "sent", l: "נשלחו", dot: STATUS.sent.dot },
      { k: "bounced", l: "חזרו", dot: STATUS.bounced.dot },
      { k: "no_reply", l: "ללא מענה", dot: STATUS.no_reply.dot },
      { k: "replied", l: "ענו", dot: STATUS.replied.dot },
    ];
    return html`<div class="stats">${items.map((i) => html`
      <div class="tile" key=${i.k}>
        <div class="n">${stats[i.k] ?? 0}</div>
        <div class="l"><span class="dot" style=${{ background: i.dot }}></span>${i.l}</div>
      </div>`)}</div>`;
  }

  // ---------- Leads table ----------
  function LeadsTable({ onAction }) {
    const [leads, setLeads] = useState(null);
    const [status, setStatus] = useState("all");
    const [q, setQ] = useState("");
    const load = useCallback(async () => {
      setLeads(null);
      const r = await api("/leads?status=" + encodeURIComponent(status) + "&q=" + encodeURIComponent(q));
      setLeads(r.leads);
    }, [status, q]);
    useEffect(() => { load(); }, [status]);
    const filters = [["all", "הכל"], ["sent", "נשלחו"], ["bounced", "חזרו"], ["no_reply", "ללא מענה"], ["replied", "ענו"], ["new", "חדשים"]];

    async function act(lead, kind) {
      await onAction(lead, kind);
      load();
    }
    return html`
      <div class="card">
        <div class="head"><h2>לידים</h2><span class="muted">${leads ? leads.length + " רשומות" : ""}</span></div>
        <div class="toolbar">
          ${filters.map(([v, l]) => html`<button key=${v} class=${"tab" + (status === v ? " active" : "")} onClick=${() => setStatus(v)}>${l}</button>`)}
          <input class="search" placeholder="חיפוש חברה / מייל / תחום…" value=${q}
            onInput=${(e) => setQ(e.target.value)} onKeyDown=${(e) => e.key === "Enter" && load()} />
          <button class="btn sm ghost" onClick=${load}>חיפוש</button>
        </div>
        <div class="scroll">
          ${!leads ? html`<div class="loading">טוען…</div>` : html`
          <table>
            <thead><tr>
              <th>חברה</th><th>מייל</th><th class="hide-sm">תחום</th><th>סטטוס</th><th>פעולות</th>
            </tr></thead>
            <tbody>
              ${leads.map((l) => html`<tr key=${l.id}>
                <td><div class="company">${l.company}</div>
                  ${l.bounce_reason && html`<div class="reason">${l.bounce_reason}</div>`}</td>
                <td><div class="email">${l.email || "—"}</div></td>
                <td class="hide-sm">${l.sector || "—"}</td>
                <td><${Badge} s=${l.status} /></td>
                <td><div class="row-actions">
                  ${l.status === "bounced"
                    ? html`<button class="btn sm" onClick=${() => act(l, "refind")}>אתר מייל</button>`
                    : html`<button class="btn sm ghost" onClick=${() => act(l, "followup")}>מייל אחרון</button>`}
                  ${l.email && l.status !== "bounced" && html`<button class="btn sm ghost" onClick=${() => act(l, "resend")}>שלח שוב</button>`}
                </div></td>
              </tr>`)}
            </tbody>
          </table>`}
        </div>
      </div>`;
  }

  // ---------- Bounces ----------
  function Bounces({ onAction }) {
    const [rows, setRows] = useState(null);
    const load = useCallback(async () => { setRows(null); const r = await api("/bounces"); setRows(r.bounces); }, []);
    useEffect(() => { load(); }, []);
    async function act(lead, kind) { await onAction(lead, kind); load(); }
    return html`
      <div class="card">
        <div class="head"><h2>מיילים שחזרו</h2><span class="muted">${rows ? rows.length + " כתובות" : ""}</span></div>
        <div class="scroll">
          ${!rows ? html`<div class="loading">טוען…</div>` : rows.length === 0
            ? html`<div class="loading">אין מיילים שחזרו 🎉</div>`
            : html`<table>
            <thead><tr><th>חברה</th><th>מייל שנכשל</th><th>הסיבה</th><th>פעולה</th></tr></thead>
            <tbody>${rows.map((l) => html`<tr key=${l.id}>
              <td><div class="company">${l.company}</div></td>
              <td><div class="email">${l.email}</div></td>
              <td><span class="reason">${l.bounce_reason || "—"}</span></td>
              <td><button class="btn sm" onClick=${() => act(l, "refind")}>אתר מייל חדש</button></td>
            </tr>`)}</tbody></table>`}
        </div>
      </div>`;
  }

  // ---------- Activity ----------
  function Activity() {
    const [rows, setRows] = useState(null);
    useEffect(() => { api("/activity").then((r) => setRows(r.activity)); }, []);
    return html`
      <div class="card">
        <div class="head"><h2>יומן פעילות</h2><span class="muted">כל הפעולות במערכת</span></div>
        ${!rows ? html`<div class="loading">טוען…</div>` : rows.length === 0
          ? html`<div class="loading">עדיין אין פעילות</div>`
          : html`<ul class="feed">${rows.map((a) => html`<li key=${a.id}>
              <span class="act">${ACTIONS[a.action] || a.action}</span>
              <span>${a.company || a.detail || ""}</span>
              <span class="time">${(a.created_at || "").replace("T", " ")}</span>
            </li>`)}</ul>`}
      </div>`;
  }

  // ---------- Users (admin) ----------
  function Users() {
    const [rows, setRows] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", role: "agent" });
    const [made, setMade] = useState(null);
    const [err, setErr] = useState("");
    const load = useCallback(async () => { const r = await api("/users"); setRows(r.users); }, []);
    useEffect(() => { load(); }, []);
    async function create(e) {
      e.preventDefault(); setErr(""); setMade(null);
      try {
        const r = await api("/users", { method: "POST", body: JSON.stringify(form) });
        setMade(r.user); setForm({ name: "", email: "", role: "agent" }); load();
      } catch (ex) { setErr(ex.message); }
    }
    return html`
      <div class="card">
        <div class="head"><h2>משתמשים</h2><span class="muted">חיבור יוזרים עם קוד גישה</span></div>
        <div style=${{ padding: "16px 18px" }}>
          ${err && html`<div class="err">${err}</div>`}
          ${made && html`<div class="notice">נוצר משתמש <b>${made.name}</b> · ${made.email} · קוד גישה: <span class="code">${made.access_code}</span> — זה גם הסיסמה הראשונית.</div>`}
          <form onSubmit=${create} style=${{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div class="field" style=${{ margin: 0, flex: "1 1 160px" }}><label>שם</label>
              <input value=${form.name} onInput=${(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div class="field" style=${{ margin: 0, flex: "1 1 200px" }}><label>אימייל</label>
              <input type="email" dir="ltr" value=${form.email} onInput=${(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <button class="btn">צור קוד גישה</button>
          </form>
        </div>
        <div class="scroll">
          ${!rows ? html`<div class="loading">טוען…</div>` : html`<table>
            <thead><tr><th>שם</th><th>אימייל</th><th>תפקיד</th><th>קוד</th></tr></thead>
            <tbody>${rows.map((u) => html`<tr key=${u.id}>
              <td><div class="company">${u.name}</div></td>
              <td><div class="email">${u.email}</div></td>
              <td>${u.role === "admin" ? "מנהלת" : "סוכן"}</td>
              <td><span class="code">${u.access_code || "—"}</span></td>
            </tr>`)}</tbody></table>`}
        </div>
      </div>`;
  }

  // ---------- Follow-up modal ----------
  function FollowupModal({ draft, onClose }) {
    const [copied, setCopied] = useState(false);
    function copy() {
      try { navigator.clipboard.writeText(draft.subject + "\n\n" + draft.body); setCopied(true); } catch (e) {}
    }
    return html`<div class="modal-bg" onClick=${onClose}>
      <div class="modal" onClick=${(e) => e.stopPropagation()}>
        <div class="m-head"><h3>מייל אחרון — טיוטה</h3><button class="btn sm ghost" onClick=${onClose}>סגירה</button></div>
        <div class="m-body">
          <div class="notice">זו טיוטה בלבד. שום דבר לא נשלח ללא אישורך ומקור שליחה מוגדר.</div>
          <div class="kv">אל: <b dir="ltr">${draft.to || "—"}</b></div>
          <div class="kv">נושא: <b>${draft.subject}</b></div>
          <textarea readonly>${draft.body}</textarea>
        </div>
        <div class="m-foot">
          <button class="btn" onClick=${copy}>${copied ? "הועתק ✓" : "העתק טקסט"}</button>
          <button class="btn ghost" onClick=${onClose}>סגור</button>
        </div>
      </div>
    </div>`;
  }

  // ---------- Shell ----------
  function Shell({ user, onLogout }) {
    const [tab, setTab] = useState("dashboard");
    const [stats, setStats] = useState(null);
    const [draft, setDraft] = useState(null);
    const [toast, setToast] = useState("");
    const loadStats = useCallback(() => api("/stats").then(setStats).catch(() => {}), []);
    useEffect(() => { loadStats(); }, [tab]);

    const onAction = useCallback(async (lead, kind) => {
      if (kind === "followup") {
        const d = await api("/leads/" + lead.id + "/followup", { method: "POST" });
        setDraft(d);
      } else if (kind === "refind") {
        await api("/leads/" + lead.id + "/refind", { method: "POST" });
        setToast("התחלתי לאתר מייל חדש ל" + lead.company);
      } else if (kind === "resend") {
        const r = await api("/leads/" + lead.id + "/resend", { method: "POST" });
        setToast(r.message || "נכנס לתור");
      }
      loadStats();
      setTimeout(() => setToast(""), 3500);
    }, [loadStats]);

    const tabs = [["dashboard", "לוח בקרה"], ["bounces", "חזרו"], ["activity", "יומן פעילות"]];
    if (user.role === "admin") tabs.push(["users", "משתמשים"]);

    return html`
      <div class="app">
        <div class="topbar">
          <div class="left">
            <div class="logo">S</div>
            <div><div class="title">Segev MKG · מערכת לידים</div><div class="sub">שלום, ${user.name}</div></div>
          </div>
          <div class="who"><button class="btn sm ghost" onClick=${onLogout}>יציאה</button></div>
        </div>
        <div class="container">
          <div class="tabs">${tabs.map(([v, l]) => html`<button key=${v} class=${"tab" + (tab === v ? " active" : "")} onClick=${() => setTab(v)}>${l}</button>`)}</div>
          ${toast && html`<div class="notice">${toast}</div>`}
          ${tab === "dashboard" && html`<${React.Fragment}><${Stats} stats=${stats} /><${LeadsTable} onAction=${onAction} /><//>`}
          ${tab === "bounces" && html`<${Bounces} onAction=${onAction} />`}
          ${tab === "activity" && html`<${Activity} />`}
          ${tab === "users" && html`<${Users} />`}
        </div>
        ${draft && html`<${FollowupModal} draft=${draft} onClose=${() => setDraft(null)} />`}
      </div>`;
  }

  // ---------- App root ----------
  function App() {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);
    useEffect(() => {
      if (!token.get()) { setReady(true); return; }
      api("/me").then((r) => setUser(r.user)).catch(() => token.clear()).finally(() => setReady(true));
    }, []);
    function logout() { api("/logout", { method: "POST" }).catch(() => {}); token.clear(); setUser(null); }
    if (!ready) return html`<div class="loading">טוען…</div>`;
    return user ? html`<${Shell} user=${user} onLogout=${logout} />` : html`<${Login} onLogin=${setUser} />`;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
})();
