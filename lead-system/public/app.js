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

  // Download the leads as a CSV (Excel opens it). Keeps the token in the header.
  async function exportLeadsCsv() {
    try {
      const t = token.get();
      const res = await fetch("/api/leads/export", { headers: t ? { Authorization: "Bearer " + t } : {} });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "segev-leads-" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }
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
    callback:  { label: "לחזור אליו", dot: "#0f766e" },
  };
  const Badge = ({ s }) => html`<span class=${"badge " + s}>
    <span class="dot" style=${{ background: (STATUS[s] || {}).dot }}></span>${(STATUS[s] || { label: s }).label}</span>`;

  const ACTIONS = {
    login: "התחברה", logout: "התנתקה", refind: "איתור מייל מחדש",
    set_email: "עודכן מייל", queue_resend: "נכנס לתור שליחה",
    followup_draft: "הופק מייל אחרון", create_user: "נוצר משתמש",
    add_lead: "נוסף ליד", onboarding: "השלים אונבורדינג", register: "נרשם",
  };

  // ---------- Login / Register ----------
  function Login({ onLogin }) {
    const [mode, setMode] = useState("login"); // "login" | "register" — open on login; new businesses tap register
    const [name, setName] = useState("");
    const [business, setBusiness] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(true);
    const reg = mode === "register";
    async function submit(e) {
      e.preventDefault();
      setErr(""); setBusy(true);
      try {
        const body = reg
          ? { name, email, password, business_name: business }
          : { email, password };
        const r = await api(reg ? "/register" : "/login", { method: "POST", body: JSON.stringify(body) });
        token.set(r.token);
        onLogin(r.user);
      } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
    }
    return html`
      <div class="entry">
        <div class="entry-hero">
          <div class="logo-lg"><img class="logo-img" src="/logo.svg" alt="Segev" /></div>
          <h1>מערכת הלידים החכמה לעסק שלך</h1>
          <p class="entry-sub">נרשמים, מספרים לנו על העסק — והמערכת מביאה לכם לידים אמיתיים, עם פנייה מוכנה לכל אחד, ומעקב עד סגירה.</p>
          <ul class="entry-benefits">
            <li><span>🎯</span> מאתרים לידים אמיתיים לפי התחום והאזור שלך</li>
            <li><span>✍️</span> פנייה מוכנה בסגנון שלך — אתם מאשרים לפני שליחה</li>
            <li><span>📊</span> מעקב, תזכורות וייצוא לאקסל</li>
          </ul>
          <div class="entry-note">הרשמה חינם · שתי שאלות קצרות על העסק · מתחילים מיד</div>
        </div>

        <form class="login-card" onSubmit=${submit}>
          <div class="brand">
            <div class="logo"><img class="logo-img" src="/logo.svg" alt="Segev" /></div>
            <h1>${reg ? "פתיחת חשבון לעסק" : "כניסה למערכת"}</h1>
            <p>${reg ? "ממלאים פרטים ומתחילים לקבל לידים" : "ברוכים השבים"}</p>
          </div>
          ${err && html`<div class="err">${err}</div>`}
          ${reg && html`<div class="field"><label>שם מלא</label>
            <input value=${name} onInput=${(e) => setName(e.target.value)} required /></div>`}
          ${reg && html`<div class="field"><label>שם העסק</label>
            <input value=${business} onInput=${(e) => setBusiness(e.target.value)} placeholder="לדוגמה: מלון X / חברת Y" /></div>`}
          <div class="field">
            <label>אימייל</label>
            <input type="email" value=${email} onInput=${(e) => setEmail(e.target.value)} dir="ltr" required />
          </div>
          <div class="field">
            <label>סיסמה</label>
            <div class="pw-wrap">
              <input type=${showPw ? "text" : "password"} value=${password} onInput=${(e) => setPassword(e.target.value)} required />
              <button type="button" class="pw-toggle" onClick=${() => setShowPw(!showPw)} title=${showPw ? "הסתר" : "הצג"}>${showPw ? "הסתר" : "הצג"}</button>
            </div>
          </div>
          ${!reg && html`<div class="login-row">
            <label class="switchrow" style=${{ fontSize: "13px" }}>
              <input type="checkbox" checked=${remember} onChange=${(e) => setRemember(e.target.checked)} /> זכור אותי
            </label>
            <a href="#" onClick=${(e) => { e.preventDefault(); setErr("לאיפוס סיסמה פנו למנהל המערכת: ketyse@gmail.com"); }}>שכחתי סיסמה</a>
          </div>`}
          <button class="btn block" disabled=${busy}>${busy ? "רגע…" : (reg ? "הרשמה והתחלה →" : "כניסה")}</button>
          <div class="hint">
            ${reg
              ? html`כבר יש לכם חשבון? <a href="#" onClick=${(e) => { e.preventDefault(); setErr(""); setMode("login"); }}>כניסה</a>`
              : html`עסק חדש? <a href="#" onClick=${(e) => { e.preventDefault(); setErr(""); setMode("register"); }}>פתיחת חשבון וקבלת לידים</a>`}
          </div>
        </form>
      </div>`;
  }

  // ---------- Onboarding wizard ----------
  const BUSINESS_TYPES = ["מלונאות", "קוסמטיקה", "מזון ומשקאות", "אלקטרוניקה", "קליניקה / בריאות", "שיווק ופרסום", "אחר"];
  const SECTOR_OPTS = ["מלונות", "יבואנים / מפיצים", "חברות B2B", "קליניקות", "ציוד רפואי", "מסעדנות", "קוסמטיקה", "הייטק"];
  function Onboarding({ user, onDone }) {
    const [step, setStep] = useState(1);
    const [businessType, setBusinessType] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [sectors, setSectors] = useState([]);
    const [regions, setRegions] = useState("");
    const [goal, setGoal] = useState("");
    const [wantsText, setWantsText] = useState("");
    const [agentInstructions, setAgentInstructions] = useState("");
    const [dailyEnabled, setDailyEnabled] = useState(false);
    const [dailyTime, setDailyTime] = useState("08:00");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");
    function toggleSector(s) {
      setSectors((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
    }
    async function finish() {
      setErr(""); setBusy(true);
      try {
        await api("/profile", { method: "POST", body: JSON.stringify({
          business_name: businessName, business_type: businessType,
          target_sectors: sectors, regions, goal,
          wants_text: wantsText, agent_instructions: agentInstructions,
          daily_enabled: dailyEnabled, daily_time: dailyTime,
        }) });
        onDone();
      } catch (ex) { setErr(ex.message); setBusy(false); }
    }
    return html`
      <div class="login-wrap">
        <div class="login-card" style=${{ maxWidth: "460px" }}>
          <div class="brand"><div class="logo"><img class="logo-img" src="/logo.svg" alt="Segev" /></div>
            <h1>ברוכה הבאה, ${user.name}</h1>
            <p>שתי שאלות קצרות ומתחילים</p></div>
          ${err && html`<div class="err">${err}</div>`}
          ${step === 1 ? html`
            <div class="field"><label>איזה עסק את/ה?</label>
              <div class="chips">${BUSINESS_TYPES.map((t) => html`
                <button type="button" key=${t} class=${"chip" + (businessType === t ? " on" : "")}
                  onClick=${() => setBusinessType(t)}>${t}</button>`)}</div>
            </div>
            <div class="field"><label>שם העסק</label>
              <input value=${businessName} onInput=${(e) => setBusinessName(e.target.value)} placeholder="שם החברה / המותג" /></div>
            <button class="btn block" disabled=${!businessType} onClick=${() => setStep(2)}>המשך →</button>
          ` : html`
            <div class="field"><label>אילו לידים את/ה רוצה? (אפשר כמה)</label>
              <div class="chips">${SECTOR_OPTS.map((s) => html`
                <button type="button" key=${s} class=${"chip" + (sectors.includes(s) ? " on" : "")}
                  onClick=${() => toggleSector(s)}>${s}</button>`)}</div>
            </div>
            <div class="field"><label>אזורים (אופציונלי)</label>
              <input value=${regions} onInput=${(e) => setRegions(e.target.value)} placeholder="לדוגמה: כל הארץ / צפון / מרכז" /></div>
            <div class="field"><label>מה המטרה? (אופציונלי)</label>
              <input value=${goal} onInput=${(e) => setGoal(e.target.value)} placeholder="לדוגמה: לקבוע 5 פגישות בחודש" /></div>
            <div class="field"><label>תאר/י בחופשיות אילו לידים את/ה רוצה</label>
              <textarea class="ta" value=${wantsText} onInput=${(e) => setWantsText(e.target.value)}
                placeholder="לדוגמה: מלונות בוטיק בצפון עם 20-60 חדרים, או יבואני קוסמטיקה שמחפשים מפיצים"></textarea></div>
            <div class="field"><label>הוראות לסוכן (איך לעבוד, מהיכן, מה להימנע)</label>
              <textarea class="ta" value=${agentInstructions} onInput=${(e) => setAgentInstructions(e.target.value)}
                placeholder="לדוגמה: רק עסקים פעילים, לא לפנות למתחרים, להתמקד בלינקדאין ובאתרי החברות"></textarea></div>
            <div class="field"><label>לקבל לידים חדשים כל יום?</label>
              <label class="switchrow">
                <input type="checkbox" checked=${dailyEnabled} onChange=${(e) => setDailyEnabled(e.target.checked)} />
                <span>כן, כל יום בשעה</span>
                <input type="time" class="timein" value=${dailyTime} onInput=${(e) => setDailyTime(e.target.value)} disabled=${!dailyEnabled} />
              </label>
              <div class="hint" style=${{ textAlign: "start", marginTop: "4px" }}>המערכת תאתר לך לידים חדשים ותכין פנייה — ואת מאשרת.</div>
            </div>
            <div class="row-actions" style=${{ gap: "8px" }}>
              <button class="btn ghost" onClick=${() => setStep(1)}>← חזרה</button>
              <button class="btn" style=${{ flex: 1 }} disabled=${busy || sectors.length === 0} onClick=${finish}>
                ${busy ? "מתחילים…" : "סיום — התחל/י לעבוד"}</button>
            </div>
          `}
          <div class="hint">${step}/2</div>
        </div>
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

  // Build a wa.me link from an Israeli phone (0XX… → 972XX…).
  function waLink(phone) {
    const d = String(phone || "").replace(/\D/g, "");
    if (!d) return "";
    const intl = d.startsWith("972") ? d : d.replace(/^0/, "972");
    return "https://wa.me/" + intl;
  }

  // ---------- Add-lead modal ----------
  function AddLeadModal({ onClose, onSaved }) {
    const [f, setF] = useState({ company: "", contact: "", role: "", phone: "", email: "", linkedin: "", sector: "", city: "", notes: "", source_url: "" });
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    async function save() {
      if (!f.company.trim()) { setErr("צריך לפחות שם עסק / ליד"); return; }
      setErr(""); setBusy(true);
      try { await api("/leads", { method: "POST", body: JSON.stringify(f) }); onSaved(); }
      catch (ex) { setErr(ex.message); setBusy(false); }
    }
    return html`<div class="modal-bg" onClick=${onClose}>
      <div class="modal" onClick=${(e) => e.stopPropagation()}>
        <div class="m-head"><h3>הוספת ליד חדש</h3><button class="btn sm ghost" onClick=${onClose}>סגירה</button></div>
        <div class="m-body">
          ${err && html`<div class="err">${err}</div>`}
          <div class="field"><label>שם העסק / הליד *</label><input value=${f.company} onInput=${set("company")} placeholder="לדוגמה: רוני — מחפשת עוזרת בדרך" /></div>
          <div style=${{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div class="field" style=${{ flex: "1 1 180px" }}><label>איש קשר</label><input value=${f.contact} onInput=${set("contact")} /></div>
            <div class="field" style=${{ flex: "1 1 180px" }}><label>תפקיד</label><input value=${f.role} onInput=${set("role")} /></div>
          </div>
          <div style=${{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div class="field" style=${{ flex: "1 1 180px" }}><label>טלפון / וואטסאפ</label><input value=${f.phone} onInput=${set("phone")} dir="ltr" placeholder="052-6116361" /></div>
            <div class="field" style=${{ flex: "1 1 180px" }}><label>מייל</label><input value=${f.email} onInput=${set("email")} dir="ltr" /></div>
          </div>
          <div class="field"><label>לינקדאין</label><input value=${f.linkedin} onInput=${set("linkedin")} dir="ltr" /></div>
          <div style=${{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div class="field" style=${{ flex: "1 1 180px" }}><label>תחום</label><input value=${f.sector} onInput=${set("sector")} /></div>
            <div class="field" style=${{ flex: "1 1 180px" }}><label>עיר</label><input value=${f.city} onInput=${set("city")} /></div>
          </div>
          <div class="field"><label>מקור (קישור)</label><input value=${f.source_url} onInput=${set("source_url")} dir="ltr" placeholder="קישור לפוסט/מודעה" /></div>
          <div class="field"><label>הערות / זווית פנייה</label><textarea class="ta" value=${f.notes} onInput=${set("notes")}></textarea></div>
        </div>
        <div class="m-foot">
          <button class="btn" disabled=${busy} onClick=${save}>${busy ? "שומר…" : "הוסף ליד"}</button>
          <button class="btn ghost" onClick=${onClose}>ביטול</button>
        </div>
      </div>
    </div>`;
  }

  // ---------- Leads table ----------
  function LeadsTable({ onAction }) {
    const [offer, setOffer] = useState(null);
    const [leads, setLeads] = useState(null);
    const [status, setStatus] = useState("all");
    const [q, setQ] = useState("");
    const [adding, setAdding] = useState(false);
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
        <div class="head"><h2>לידים</h2>
          <div style=${{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span class="muted">${leads ? leads.length + " רשומות" : ""}</span>
            <button class="btn sm" onClick=${() => setAdding(true)}>➕ ליד חדש</button>
            <button class="btn sm ghost" onClick=${exportLeadsCsv} title="ייצוא לאקסל">⬇ אקסל</button>
          </div></div>
        <div class="toolbar">
          ${filters.map(([v, l]) => html`<button key=${v} class=${"tab" + (status === v ? " active" : "")} onClick=${() => setStatus(v)}>${l}</button>`)}
          <input class="search" placeholder="חיפוש חברה / מייל / תחום…" value=${q}
            onInput=${(e) => setQ(e.target.value)} onKeyDown=${(e) => e.key === "Enter" && load()} />
          <button class="btn sm ghost" onClick=${load}>חיפוש</button>
        </div>
        <div class="scroll">
          ${!leads ? html`<div class="loading">טוען…</div>` : leads.length === 0
            ? html`<div class="loading">אין עדיין לידים. לחצי "➕ ליד חדש" כדי להוסיף.</div>` : html`
          <table>
            <thead><tr>
              <th>חברה</th><th>איש קשר</th><th>מייל / טלפון</th><th class="hide-sm">תחום</th><th>סטטוס</th><th>פעולות</th>
            </tr></thead>
            <tbody>
              ${leads.map((l) => html`<tr key=${l.id}>
                <td><div class="company">${l.company}</div>
                  ${l.bounce_reason && html`<div class="reason">${l.bounce_reason}</div>`}</td>
                <td>
                  ${l.contact ? html`<div class="company">${l.contact}</div>` : html`<div class="email">—</div>`}
                  ${l.role && html`<div class="email">${l.role}</div>`}
                  ${l.linkedin && /^https?:\/\//i.test(l.linkedin) && html`<a class="lk" href=${l.linkedin} target="_blank" rel="noopener noreferrer">לינקדאין ↗</a>`}
                </td>
                <td>
                  <div class="email">${l.email || ""}</div>
                  ${l.phone && html`<div class="email">📞 ${l.phone} · <a class="lk" href=${waLink(l.phone)} target="_blank" rel="noopener noreferrer">וואטסאפ ↗</a></div>`}
                  ${!l.email && !l.phone && html`<div class="email">—</div>`}
                </td>
                <td class="hide-sm">${l.sector || "—"}</td>
                <td><${Badge} s=${l.status} /></td>
                <td><div class="row-actions">
                  ${l.status === "bounced"
                    ? html`<button class="btn sm" onClick=${() => act(l, "refind")}>אתר מייל</button>`
                    : html`<button class="btn sm ghost" onClick=${() => act(l, "followup")}>מייל אחרון</button>`}
                  ${l.email && l.status !== "bounced" && html`<button class="btn sm ghost" onClick=${() => act(l, "resend")}>שלח שוב</button>`}
                  ${l.draft && html`<button class="btn sm ghost" onClick=${() => setOffer({ to: l.email, subject: l.subject || "", body: l.draft })}>📝 ההצעה</button>`}
                  ${l.source_url && /^https?:\/\//i.test(l.source_url) && html`<a class="lk" href=${l.source_url} target="_blank" rel="noopener noreferrer" title="איפה נמצא המייל">מקור ↗</a>`}
                </div></td>
              </tr>`)}
            </tbody>
          </table>`}
        </div>
        ${adding && html`<${AddLeadModal} onClose=${() => setAdding(false)} onSaved=${() => { setAdding(false); load(); }} />`}
        ${offer && html`<${FollowupModal} draft=${offer} title="ההצעה של הסוכן — טיוטה" onClose=${() => setOffer(null)} />`}
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
  function FollowupModal({ draft, onClose, title }) {
    const [copied, setCopied] = useState(false);
    function copy() {
      try { navigator.clipboard.writeText(draft.subject + "\n\n" + draft.body); setCopied(true); } catch (e) {}
    }
    return html`<div class="modal-bg" onClick=${onClose}>
      <div class="modal" onClick=${(e) => e.stopPropagation()}>
        <div class="m-head"><h3>${title || "מייל אחרון — טיוטה"}</h3><button class="btn sm ghost" onClick=${onClose}>סגירה</button></div>
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

  // ---------- Client welcome / how it works ----------
  function ClientWelcome({ profile }) {
    const sectors = (profile && profile.target_sectors) || [];
    return html`
      <div class="card" style=${{ background: "linear-gradient(180deg,#fff,#faf8f4)" }}>
        <div class="head"><h2>המערכת מתחילה לעבוד עבורך 🚀</h2></div>
        <div style=${{ padding: "16px 18px" }}>
          <div class="kv">העסק שלך: <b>${(profile && profile.business_name) || "—"}</b> · ${(profile && profile.business_type) || ""}</div>
          <div class="kv">לידים שביקשת: <b>${sectors.length ? sectors.join(" · ") : "—"}</b></div>
          ${profile && profile.daily_enabled ? html`<div class="kv">לידים יומיים: <b>כל יום בשעה ${profile.daily_time || "08:00"}</b> ⏰</div>` : ""}
          <div class="steps">
            <div class="stepc"><span class="num">1</span> מאתרים לידים אמיתיים לפי מה שבחרת</div>
            <div class="stepc"><span class="num">2</span> מכינים לכל ליד פנייה מותאמת — את מאשרת</div>
            <div class="stepc"><span class="num">3</span> שולחים, עוקבים, ומסירים מי שלא רלוונטי — אוטומטית</div>
          </div>
          <div class="notice">הלידים הראשונים שלך יופיעו כאן בלוח ברגע שהאיתור מתחיל. בלי להמציא — רק כתובות אמיתיות.</div>
        </div>
      </div>`;
  }

  // ---------- AI Agents Connection & Auth Hub ----------
  const PLATFORMS = ["Make", "n8n", "Dify", "Zapier", "אחר"];
  function AgentsHub() {
    const [agents, setAgents] = useState(null);
    const [keys, setKeys] = useState(null);
    const [addingAgent, setAddingAgent] = useState(false);
    const [genOpen, setGenOpen] = useState(false);
    const [newKey, setNewKey] = useState(null); // shown exactly once
    const [copied, setCopied] = useState("");
    const [msg, setMsg] = useState("");
    const baseUrl = window.location.origin + "/api";
    const [editing, setEditing] = useState(null); // סוכן לידים בעריכה ({} = חדש)
    const [running, setRunning] = useState(0);

    const loadAgents = useCallback(async () => { try { const r = await api("/agents"); setAgents(r.agents); } catch (e) { setAgents([]); } }, []);
    const loadKeys = useCallback(async () => { try { const r = await api("/keys"); setKeys(r.keys); } catch (e) { setKeys([]); } }, []);
    useEffect(() => { loadAgents(); loadKeys(); }, []);

    function copy(text, tag) { try { navigator.clipboard.writeText(text); setCopied(tag); setTimeout(() => setCopied(""), 1600); } catch (e) {} }
    function flash(t) { setMsg(t); setTimeout(() => setMsg(""), 3500); }

    async function testAgent(a) {
      flash("בודק חיבור ל" + a.name + "…");
      try { const r = await api("/agents/" + a.id + "/test", { method: "POST" }); flash((r.ok ? "✅ " : "⚠️ ") + r.detail); loadAgents(); }
      catch (ex) { flash("שגיאה: " + ex.message); }
    }
    const hunters = (agents || []).filter((a) => a.kind === "hunter");
    async function runNow(a) {
      setRunning(a.id); flash("הסוכן " + a.name + " מחפש עכשיו… (עד דקה)");
      try { const r = await api("/agents/" + a.id + "/run", { method: "POST" }); flash("✅ " + r.result); }
      catch (ex) { flash("שגיאה: " + ex.message); }
      setRunning(0); loadAgents();
    }
    async function toggleHunter(a) {
      await api("/agents/" + a.id + "/update", { method: "POST", body: JSON.stringify({ active: !Number(a.active) }) });
      loadAgents();
    }
    async function delAgent(a) { if (!confirm("למחוק את הסוכן " + a.name + "?")) return; await api("/agents/" + a.id + "/delete", { method: "POST" }); loadAgents(); }
    async function revoke(k) { if (!confirm("לבטל את המפתח " + k.name + "? סוכנים שמשתמשים בו יתנתקו.")) return; await api("/keys/" + k.id + "/revoke", { method: "POST" }); loadKeys(); }

    return html`
      <div>
        ${msg && html`<div class="notice">${msg}</div>`}

        <!-- Base URL -->
        <div class="card">
          <div class="head"><h2>כתובת המערכת (Base URL)</h2><span class="muted">זו הכתובת שהסוכנים מתחברים אליה</span></div>
          <div style=${{ padding: "16px 22px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span class="code" style=${{ fontSize: "14px", padding: "9px 12px" }}>${baseUrl}</span>
            <button class="btn sm" onClick=${() => copy(baseUrl, "url")}>${copied === "url" ? "הועתק ✓" : "העתק"}</button>
          </div>
        </div>

        <!-- Lead hunters -->
        <div class="card">
          <div class="head"><h2>סוכני לידים — עובדים לבד כל שעה</h2>
            <button class="btn sm" onClick=${() => setEditing({})}>➕ סוכן לידים חדש</button></div>
          <div style=${{ padding: "12px 22px 4px" }}>
            <div class="notice">כל סוכן מחפש עסקים ברישומים ציבוריים, ולוקח מייל רק מהאתר של העסק או מהרישום שלו, עם קישור למקור. אין מייל מפורסם? הליד נשמר בלי מייל. אף מייל לא מומצא.</div>
          </div>
          <div style=${{ padding: "8px 22px 16px" }}>
            ${!agents ? html`<div class="loading">טוען…</div>` : hunters.length === 0
              ? html`<div class="loading">עוד אין סוכני לידים. לחצי "סוכן לידים חדש", כתבי לו מה לעשות ומה להציע, ובחרי סוגי עסקים.</div>`
              : html`<div class="agent-grid">${hunters.map((a) => html`
                <div class="agent-card" key=${a.id}>
                  <div class="agent-top">
                    <div><div class="agent-name">${a.name}</div><div class="agent-plat">${a.area || "—"}</div></div>
                    <span class="badge ${Number(a.active) ? "sent" : "bounced"}"><span class="dot"></span>${Number(a.active) ? "עובד" : "מושהה"}</span>
                  </div>
                  <div class="agent-meta">
                    <div>סוגי עסקים: <b>${a.targets || "לא נבחרו"}</b></div>
                    <div>לידים שמצא עד היום: <b>${a.found_total || 0}</b></div>
                    <div>ריצה אחרונה: ${a.last_run_at ? a.last_run_at.replace("T", " ") : "עוד לא רץ"}</div>
                    ${a.last_result && html`<div style=${{ color: "var(--ink-2, #666)" }}>${a.last_result}</div>`}
                  </div>
                  <div class="row-actions">
                    <button class="btn sm" onClick=${() => setEditing(a)}>תוכן והגדרות</button>
                    <button class="btn sm ghost" disabled=${running === a.id} onClick=${() => runNow(a)}>${running === a.id ? "מחפש…" : "הרץ עכשיו"}</button>
                    <button class="btn sm ghost" onClick=${() => toggleHunter(a)}>${Number(a.active) ? "השהיה" : "הפעלה"}</button>
                  </div>
                </div>`)}</div>`}
          </div>
        </div>

        <!-- Agents -->
        <div class="card">
          <div class="head"><h2>סוכנים חיצוניים (Make / n8n / Dify)</h2>
            <button class="btn sm" onClick=${() => setAddingAgent(true)}>➕ הוסף חיבור סוכן</button></div>
          <div style=${{ padding: "16px 22px" }}>
            ${!agents ? html`<div class="loading">טוען…</div>` : agents.length === 0
              ? html`<div class="loading">אין עדיין סוכנים. לחצי "הוסף חיבור סוכן" כדי להתחיל.</div>`
              : html`<div class="agent-grid">${agents.filter((a) => a.kind !== "hunter").map((a) => html`
                <div class="agent-card" key=${a.id}>
                  <div class="agent-top">
                    <div>
                      <div class="agent-name">${a.name}</div>
                      <div class="agent-plat">${a.platform || "—"}</div>
                    </div>
                    <span class="badge ${a.status === "connected" ? "sent" : "bounced"}">
                      <span class="dot"></span>${a.status === "connected" ? "מחובר" : "מנותק"}</span>
                  </div>
                  <div class="agent-meta">
                    <div>הרשאה: <b>${a.permissions === "read_write" ? "קריאה וכתיבה" : "קריאה בלבד"}</b></div>
                    <div>פעולה אחרונה: ${a.last_action_at ? a.last_action_at.replace("T", " ") : "—"}</div>
                    ${a.webhook_url && html`<div class="agent-wh">Webhook: <span dir="ltr">${a.webhook_url}</span></div>`}
                  </div>
                  <div class="row-actions">
                    <button class="btn sm ghost" onClick=${() => testAgent(a)}>בדיקת חיבור</button>
                    <button class="btn sm ghost" onClick=${() => delAgent(a)}>מחיקה</button>
                  </div>
                </div>`)}</div>`}
          </div>
        </div>

        <!-- API keys -->
        <div class="card">
          <div class="head"><h2>מפתחות API</h2>
            <button class="btn sm" onClick=${() => setGenOpen(true)}>🔑 צור מפתח חדש</button></div>
          <div style=${{ padding: "12px 22px 4px" }}>
            <div class="notice">מפתח API מחליף את סיסמת המנהל — תני אותו לסוכן במקום הסיסמה. אפשר לבטל מפתח בכל רגע.</div>
          </div>
          <div class="scroll">
            ${!keys ? html`<div class="loading">טוען…</div>` : keys.length === 0
              ? html`<div class="loading">אין מפתחות עדיין.</div>`
              : html`<table>
                <thead><tr><th>שם</th><th>מפתח</th><th>הרשאה</th><th>שימוש אחרון</th><th>פעולה</th></tr></thead>
                <tbody>${keys.map((k) => html`<tr key=${k.id} style=${{ opacity: k.revoked ? .45 : 1 }}>
                  <td><div class="company">${k.name}</div></td>
                  <td><span class="code">${k.prefix}…••••</span></td>
                  <td>${k.permissions === "read_write" ? "קריאה+כתיבה" : "קריאה"}</td>
                  <td>${k.last_used_at ? k.last_used_at.replace("T", " ") : "לא בשימוש"}</td>
                  <td>${k.revoked ? html`<span class="badge removed">בוטל</span>` : html`<button class="btn sm ghost" onClick=${() => revoke(k)}>בטל</button>`}</td>
                </tr>`)}</tbody></table>`}
          </div>
        </div>

        ${editing && html`<${HunterModal} agent=${editing} onClose=${() => setEditing(null)} onSaved=${() => { setEditing(null); loadAgents(); flash("נשמר. הסוכן ימשיך לחפש לבד כל שעה."); }} />`}
        ${addingAgent && html`<${AddAgentModal} onClose=${() => setAddingAgent(false)} onSaved=${() => { setAddingAgent(false); loadAgents(); }} />`}
        ${genOpen && html`<${GenKeyModal} onClose=${() => setGenOpen(false)} onCreated=${(k) => { setGenOpen(false); setNewKey(k); loadKeys(); }} />`}
        ${newKey && html`<${ShowKeyModal} data=${newKey} onClose=${() => setNewKey(null)} />`}
      </div>`;
  }

  // ההצעות שהסוכן בוחר מהן לכל עסק. {הכאב} ו-{הצוות} מתמלאים לבד לפי סוג העסק.
  const DEFAULT_OFFERS = [{"name": "צוות סוכני AI לעסק", "types": [], "subject": "סוכן AI שעושה את העבודה השוטפת של העסק — ומדווח לכם כל בוקר", "text": "שלום {שם העסק},\n\n{מהאתר}\n\nאנחנו Segev MKG, מחלקת השיווק של קטי שגב. כ-15 שנה אנחנו עוסקים בפיתוח עסקי ובשיווק, והיום אנחנו בונים לעסקים צוותי סוכני AI שעושים את העבודה השוטפת — מאתרים לקוחות, עונים לפניות ומנהלים את המשרד — מסביב לשעון. את העסק שלכם אנחנו כבר מכירים: הפנייה הזו הוכנה על ידי הסוכן שלנו, שאיתר אתכם וקרא על העסק, ואנחנו רק עברנו עליה ושלחנו. בדיוק את זה הוא יכול לעשות גם עבורכם.\n\nהסוכן עובד בשלושה מישורים. איתור והרחבת לקוחות — מדי בוקר הוא מאתר לידים רלוונטיים לתחום ולאזור שלכם ממקורות ציבוריים בלבד, מכין לכל אחד פנייה מותאמת בשפה שלו, ומגיש לאישורכם לפני שליחה. מענה ושירות מסביב לשעון — הסוכן עונה לפניות בכל שעה, גם בלילה ובסוף השבוע ובכל שפה, קובע תורים ומבצע מעקב עד סגירה, כך שאף פנייה אינה נופלת בין הכיסאות. ניהול שוטף — תזכורות, מעקבים, עדכון רשומות ודוח בוקר קצר, כדי שתתחילו כל יום עם תמונה מסודרת.\n\nהניהול פשוט: אתם מכוונים את הסוכן בשיחה, אפשר אף בהודעה קולית בוואטסאפ — \"אתר לי לקוחות חדשים באזור\", \"השב למי שפנה וקבע לו פגישה\" — והוא מבצע, תמיד תחת אישורכם. שום דבר אינו יוצא ללא אישורכם.\n\nמבחינת ערך: עובד/ת במשרה עולה כ-8,000 ₪ בחודש בעלויות מעביד. צוות סוכנים מתחיל מ-1,000 ₪ לחודש, בהתאמה לצרכים, בלי ימי מחלה, בלי חופשות ובזמינות מלאה. המטרה אינה להחליף אתכם אלא להחזיר לכם זמן, ולוודא שאף הזדמנות עסקית אינה מתפספסת.\n\nצעד אחד ברור: השיבו למייל, ואכין עבורכם סריקת לקוחות לדוגמה בתחום ובאזור שתבחרו, ללא התחייבות. שיחה של 15 דקות מספיקה כדי לבדוק התאמה.\n\nבברכה,\nKety Segev\n054-3032349\nhttps://bit.ly/m/segevmastermkg\n\nזוהי הצעה חד פעמית. אם אינכם מעוניינים, השיבו \"הסר\" ותוסרו מרשימת התפוצה."}, {"name": "מטפלים וקליניקות", "types": ["פסיכותרפיסטים", "יועצים ומטפלים רגשיים", "מטפלים (קליניקה פרטית)", "רפואה משלימה", "פיזיותרפיסטים", "קלינאי תקשורת", "מרפאים בעיסוק", "קליניקות", "רופאי שיניים"], "subject": "מה הייתם עושים עם עוד שעתיים ביום, בין טיפול לטיפול?", "text": "שלום {שם העסק},\n\n{מהאתר}\n\nנעים מאוד, אני קטי שגב, בעלת SEGEV Master Marketing. כ-15 שנה אני עוסקת בפיתוח עסקי ובשיווק לעסקים, והיום אני מתכננת ובונה צוותים של סוכני AI שעושים את העבודה השוטפת של העסק.\n\nאולי תהיתם איך הגעתי דווקא אליכם, ואיך המייל הזה כל כך אישי. אז הנה סוד קטן: את העבודה עשה הסוכן המופלא שלי. הוא מצא את העסק שלכם, קרא עליו והכין לי את הפנייה, ואני רק עברתי עליה ולחצתי שלח. זה בדיוק מה שאני רוצה שיהיה גם לכם.\n\nאני מכירה את זה מבפנים, כי אני גם מטפלת: {הכאב}. ככה צוות סוכנים יכול לעבוד בקליניקה שלכם:\n{הצוות}\n\nאתם מנהלים את הצוות: שולחים הודעה קולית בוואטסאפ בין לבין, והסוכנים מכינים. שום דבר לא יוצא בלי האישור שלכם.\n\nמה זה חוסך:\n• זמן: נגיד שעה ביום על תורים, תזכורות ומיילים. זה בערך 20 שעות בחודש שחוזרות אליכם.\n• כסף: עובדת עולה כ-8,000 ₪ בחודש בעלויות מעביד. צוות דיגיטלי מתחיל מ-1,000 ₪ לחודש, בהתאמה לצרכים, בלי ימי מחלה ובלי חופשות.\n\nאפשר להתחיל בחודש ניסיון, בלי התחייבות. שיחה של 15 דקות מספיקה כדי לבדוק התאמה. מתי נוח לכם, בוקר או ערב?\n\nקטי שגב | SEGEV Master Marketing · 054-2306016\nלינקדאין: il.linkedin.com/in/ketysegev · וואטסאפ: {וואטסאפ}\n\nזוהי הצעה חד פעמית. אם אינכם מעוניינים, השיבו \"הסר\" ותוסרו מרשימת התפוצה."}, {"name": "צימרים, בתי הארחה ומלונות", "types": ["צימרים", "בתי הארחה", "מלונות"], "subject": "מי עונה לאורחים שכותבים לכם בשתיים בלילה?", "text": "שלום {שם העסק},\n\n{מהאתר}\n\nנעים מאוד, אני קטי שגב, בעלת SEGEV Master Marketing. כ-15 שנה אני עוסקת בפיתוח עסקי ובשיווק לעסקים, והיום אני מתכננת ובונה צוותים של סוכני AI שעושים את העבודה השוטפת של העסק.\n\nאולי תהיתם איך הגעתי דווקא אליכם, ואיך המייל הזה כל כך אישי. אז הנה סוד קטן: את העבודה עשה הסוכן המופלא שלי. הוא מצא את העסק שלכם, קרא עליו והכין לי את הפנייה, ואני רק עברתי עליה ולחצתי שלח. זה בדיוק מה שאני רוצה שיהיה גם לכם.\n\nכל מי שמנהל אירוח מכיר את זה: {הכאב}. ככה צוות סוכנים יכול לעבוד אצלכם, גם כשאתם ישנים:\n{הצוות}\n\nאתם מנהלים את הצוות: שולחים הודעה קולית בוואטסאפ בין לבין, והסוכנים מכינים. שום דבר לא יוצא בלי האישור שלכם.\n\nמה זה חוסך:\n• זמן: נגיד שעה ביום על תורים, תזכורות ומיילים. זה בערך 20 שעות בחודש שחוזרות אליכם.\n• כסף: עובדת עולה כ-8,000 ₪ בחודש בעלויות מעביד. צוות דיגיטלי מתחיל מ-1,000 ₪ לחודש, בהתאמה לצרכים, בלי ימי מחלה ובלי חופשות.\n\nאפשר להתחיל בחודש ניסיון, בלי התחייבות. שיחה של 15 דקות מספיקה כדי לבדוק התאמה. מתי נוח לכם, בוקר או ערב?\n\nקטי שגב | SEGEV Master Marketing · 054-2306016\nלינקדאין: il.linkedin.com/in/ketysegev · וואטסאפ: {וואטסאפ}\n\nזוהי הצעה חד פעמית. אם אינכם מעוניינים, השיבו \"הסר\" ותוסרו מרשימת התפוצה."}];
  function parseOffers(a) {
    try { const j = JSON.parse(a.offer || ""); if (Array.isArray(j) && j.length) return j; } catch (e) {}
    if (a.offer) return [{ name: "הצעה", types: [], subject: a.subject || "", text: a.offer }];
    return DEFAULT_OFFERS;
  }

  // ---------- סוכן לידים: מה לעשות, מה להציע, למי ואיפה ----------
  function HunterModal({ agent, onClose, onSaved }) {
    const isNew = !agent.id;
    const [cats, setCats] = useState([]);
    const [f, setF] = useState({
      name: agent.name || "סוכן עסקים קטנים",
      instructions: agent.instructions || "",
      targets: agent.targets || "",
      area: agent.area || "חיפה, קריית מוצקין, קריית ביאליק, קריית אתא, קריית ים",
      active: agent.id ? !!Number(agent.active) : true,
    });
    const [offers, setOffers] = useState(() => parseOffers(agent));
    const setOffer = (i, k, v) => setOffers(offers.map((o, n) => (n === i ? { ...o, [k]: v } : o)));
    const toggleOfferType = (i, c) => { const t = offers[i].types || []; setOffer(i, "types", t.includes(c) ? t.filter((x) => x !== c) : [...t, c]); };
    const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
    useEffect(() => { api("/hunt/categories").then((r) => setCats(r.categories)).catch(() => {}); }, []);
    const sel = f.targets.split(",").map((x) => x.trim()).filter(Boolean);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    function toggleCat(c) {
      const next = sel.includes(c) ? sel.filter((x) => x !== c) : [...sel, c];
      setF({ ...f, targets: next.join(", ") });
    }
    async function save() {
      if (!f.name.trim()) { setErr("צריך שם לסוכן"); return; }
      if (!sel.length) { setErr("בחרי לפחות סוג עסק אחד"); return; }
      if (!offers.some((o) => (o.text || "").trim())) { setErr("כתבי לפחות הצעה אחת"); return; }
      setErr(""); setBusy(true);
      try {
        const payload = { ...f, offer: JSON.stringify(offers), subject: (offers[0] && offers[0].subject) || "" };
        if (isNew) await api("/agents", { method: "POST", body: JSON.stringify({ ...payload, kind: "hunter" }) });
        else await api("/agents/" + agent.id + "/update", { method: "POST", body: JSON.stringify(payload) });
        onSaved();
      } catch (ex) { setErr(ex.message); setBusy(false); }
    }
    return html`<div class="modal-bg" onClick=${onClose}><div class="modal" onClick=${(e) => e.stopPropagation()}>
      <div class="m-head"><h3>${isNew ? "סוכן לידים חדש" : "תוכן והגדרות · " + agent.name}</h3><button class="btn sm ghost" onClick=${onClose}>סגירה</button></div>
      <div class="m-body">
        ${err && html`<div class="err">${err}</div>`}
        <div class="field"><label>שם הסוכן</label><input id="h-name" value=${f.name} onInput=${set("name")} /></div>
        <div class="field"><label>מה הסוכן עושה (ההוראות שלך)</label>
          <textarea id="h-instr" rows="4" value=${f.instructions} onInput=${set("instructions")} placeholder="למשל: לחפש עסקים קטנים שאין להם מענה מהיר ללקוחות. להתמקד בעסקים עם אתר. לא לפנות לרשתות גדולות."></textarea></div>
        <div class="field"><label>סוגי עסקים לחיפוש</label>
          <div class="chips">${cats.map((c) => html`<button type="button" key=${c} class=${"chip" + (sel.includes(c) ? " on" : "")} onClick=${() => toggleCat(c)}>${c}</button>`)}</div></div>
        <div class="field"><label>ערים / אזורים (מופרדים בפסיק)</label><input id="h-area" value=${f.area} onInput=${set("area")} placeholder="חיפה, קריית מוצקין, או: כל הארץ" /></div>
        <div class="field"><label>סוגי ההצעות שלך</label>
          <div class="muted" style=${{ fontSize: "13px" }}>הסוכן בוחר לכל עסק את ההצעה שסימנת לסוג שלו (או את הכללית), ומתאים אותה. {שם העסק}, {עיר}, {וואטסאפ} מתמלאים לבד. {הכאב} ו-{הצוות} = מה הבעיה של העסק ואיזה צוות סוכנים יעבוד אצלו, לפי התחום. {מהאתר} = משפט מהאתר של העסק (אם יש), אחרת השורה יורדת.</div></div>
        ${offers.map((o, i) => html`<div key=${i} style=${{ border: "1px solid var(--line, #e5e5e5)", borderRadius: "12px", padding: "12px", display: "grid", gap: "8px" }}>
          <div style=${{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input id=${"o-name-" + i} class="ta" value=${o.name || ""} onInput=${(e) => setOffer(i, "name", e.target.value)} placeholder="שם ההצעה" style=${{ flex: 1, fontWeight: 600 }} />
            ${offers.length > 1 && html`<button type="button" class="btn sm ghost" onClick=${() => setOffers(offers.filter((_, n) => n !== i))}>הסרה</button>`}
          </div>
          <div class="muted" style=${{ fontSize: "13px" }}>למי ההצעה (בלי סימון = לכולם):</div>
          <div class="chips">${sel.map((c) => html`<button type="button" key=${c} class=${"chip" + ((o.types || []).includes(c) ? " on" : "")} onClick=${() => toggleOfferType(i, c)}>${c}</button>`)}</div>
          <input id=${"o-subject-" + i} class="ta" value=${o.subject || ""} onInput=${(e) => setOffer(i, "subject", e.target.value)} placeholder="נושא המייל" />
          <textarea id=${"o-text-" + i} class="ta" rows="8" value=${o.text || ""} onInput=${(e) => setOffer(i, "text", e.target.value)}></textarea>
        </div>`)}
        <div><button type="button" class="btn sm ghost" onClick=${() => setOffers([...offers, { name: "הצעה חדשה", types: [], subject: "", text: "" }])}>➕ סוג הצעה נוסף</button></div>
        <label class="check" style=${{ display: "flex", gap: "8px", alignItems: "center" }}><input id="h-active" type="checkbox" checked=${f.active} onChange=${(e) => setF({ ...f, active: e.target.checked })} /> הסוכן עובד (מחפש לבד כל שעה)</label>
      </div>
      <div class="m-foot"><button class="btn" disabled=${busy} onClick=${save}>${busy ? "שומר…" : "שמירה"}</button><button class="btn ghost" onClick=${onClose}>ביטול</button></div>
    </div></div>`;
  }

  function AddAgentModal({ onClose, onSaved }) {
    const [f, setF] = useState({ name: "", platform: "Make", permissions: "read", webhook_url: "" });
    const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    async function save() {
      if (!f.name.trim()) { setErr("צריך שם לסוכן"); return; }
      setErr(""); setBusy(true);
      try { await api("/agents", { method: "POST", body: JSON.stringify(f) }); onSaved(); }
      catch (ex) { setErr(ex.message); setBusy(false); }
    }
    return html`<div class="modal-bg" onClick=${onClose}><div class="modal" onClick=${(e) => e.stopPropagation()}>
      <div class="m-head"><h3>הוספת חיבור סוכן</h3><button class="btn sm ghost" onClick=${onClose}>סגירה</button></div>
      <div class="m-body">
        ${err && html`<div class="err">${err}</div>`}
        <div class="field"><label>שם הסוכן *</label><input value=${f.name} onInput=${set("name")} placeholder="לדוגמה: סוכן שירות לקוחות" /></div>
        <div class="field"><label>פלטפורמה</label>
          <div class="chips">${PLATFORMS.map((p) => html`<button type="button" key=${p} class=${"chip" + (f.platform === p ? " on" : "")} onClick=${() => setF({ ...f, platform: p })}>${p}</button>`)}</div></div>
        <div class="field"><label>רמת הרשאה</label>
          <div class="chips">
            <button type="button" class=${"chip" + (f.permissions === "read" ? " on" : "")} onClick=${() => setF({ ...f, permissions: "read" })}>קריאה בלבד</button>
            <button type="button" class=${"chip" + (f.permissions === "read_write" ? " on" : "")} onClick=${() => setF({ ...f, permissions: "read_write" })}>קריאה וכתיבה</button>
          </div></div>
        <div class="field"><label>כתובת Webhook (אופציונלי)</label><input value=${f.webhook_url} onInput=${set("webhook_url")} dir="ltr" placeholder="https://hook.make.com/..." /></div>
      </div>
      <div class="m-foot"><button class="btn" disabled=${busy} onClick=${save}>${busy ? "שומר…" : "הוסף סוכן"}</button><button class="btn ghost" onClick=${onClose}>ביטול</button></div>
    </div></div>`;
  }

  function GenKeyModal({ onClose, onCreated }) {
    const [name, setName] = useState(""); const [perm, setPerm] = useState("read");
    const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
    async function gen() {
      if (!name.trim()) { setErr("צריך שם למפתח"); return; }
      setErr(""); setBusy(true);
      try { const r = await api("/keys", { method: "POST", body: JSON.stringify({ name, permissions: perm }) }); onCreated(r); }
      catch (ex) { setErr(ex.message); setBusy(false); }
    }
    return html`<div class="modal-bg" onClick=${onClose}><div class="modal" onClick=${(e) => e.stopPropagation()}>
      <div class="m-head"><h3>יצירת מפתח API</h3><button class="btn sm ghost" onClick=${onClose}>סגירה</button></div>
      <div class="m-body">
        ${err && html`<div class="err">${err}</div>`}
        <div class="field"><label>שם המפתח *</label><input value=${name} onInput=${(e) => setName(e.target.value)} placeholder="לדוגמה: מפתח ל-Make" /></div>
        <div class="field"><label>רמת הרשאה</label>
          <div class="chips">
            <button type="button" class=${"chip" + (perm === "read" ? " on" : "")} onClick=${() => setPerm("read")}>קריאה בלבד</button>
            <button type="button" class=${"chip" + (perm === "read_write" ? " on" : "")} onClick=${() => setPerm("read_write")}>קריאה וכתיבה</button>
          </div></div>
      </div>
      <div class="m-foot"><button class="btn" disabled=${busy} onClick=${gen}>${busy ? "יוצר…" : "צור מפתח"}</button><button class="btn ghost" onClick=${onClose}>ביטול</button></div>
    </div></div>`;
  }

  function ShowKeyModal({ data, onClose }) {
    const [copied, setCopied] = useState(false);
    function copy() { try { navigator.clipboard.writeText(data.key); setCopied(true); } catch (e) {} }
    return html`<div class="modal-bg" onClick=${onClose}><div class="modal" onClick=${(e) => e.stopPropagation()}>
      <div class="m-head"><h3>המפתח נוצר — ${data.name}</h3><button class="btn sm ghost" onClick=${onClose}>סגירה</button></div>
      <div class="m-body">
        <div class="err">⚠️ שמרי את המפתח עכשיו במקום מאובטח. לא ניתן יהיה לצפות בו שוב.</div>
        <div class="keybox" dir="ltr">${data.key}</div>
        <button class="btn block" onClick=${copy}>${copied ? "הועתק ✓" : "העתק מפתח"}</button>
      </div>
    </div></div>`;
  }

  // ---------- Shell ----------
  function Shell({ user, profile, onLogout }) {
    const isClient = user.role === "client";
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

    const tabs = isClient
      ? [["dashboard", "לוח בקרה"]]
      : [["dashboard", "לוח בקרה"], ["agents", "חיבורי סוכנים"], ["bounces", "חזרו"], ["activity", "יומן פעילות"], ["users", "משתמשים"]];

    return html`
      <div class="app">
        <div class="topbar">
          <div class="left">
            <div class="logo"><img class="logo-img" src="/logo.svg" alt="Segev" /></div>
            <div><div class="title">Segev MKG · מערכת לידים</div><div class="sub">שלום, ${user.name}</div></div>
          </div>
          <div class="who"><button class="btn sm ghost" onClick=${onLogout}>יציאה</button></div>
        </div>
        <div class="container">
          <div class="tabs">${tabs.map(([v, l]) => html`<button key=${v} class=${"tab" + (tab === v ? " active" : "")} onClick=${() => setTab(v)}>${l}</button>`)}</div>
          ${toast && html`<div class="notice">${toast}</div>`}
          ${tab === "dashboard" && (isClient
            ? html`<${ClientWelcome} profile=${profile} />`
            : html`<${React.Fragment}><${Stats} stats=${stats} /><${LeadsTable} onAction=${onAction} /><//>`)}
          ${tab === "bounces" && html`<${Bounces} onAction=${onAction} />`}
          ${tab === "activity" && html`<${Activity} />`}
          ${tab === "agents" && html`<${AgentsHub} />`}
          ${tab === "users" && html`<${Users} />`}
        </div>
        ${draft && html`<${FollowupModal} draft=${draft} onClose=${() => setDraft(null)} />`}
      </div>`;
  }

  // ---------- App root ----------
  function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(undefined); // undefined=loading, null=none
    const [ready, setReady] = useState(false);

    const loadProfile = useCallback(async () => {
      try { const r = await api("/profile"); setProfile(r.profile); }
      catch (e) { setProfile(null); }
    }, []);

    useEffect(() => {
      if (!token.get()) { setReady(true); return; }
      api("/me").then(async (r) => { setUser(r.user); await loadProfile(); })
        .catch(() => token.clear()).finally(() => setReady(true));
    }, []);

    function onAuth(u) { setUser(u); setReady(false); loadProfile().finally(() => setReady(true)); }
    function logout() { api("/logout", { method: "POST" }).catch(() => {}); token.clear(); setUser(null); setProfile(undefined); }

    if (!ready) return html`<div class="loading">טוען…</div>`;
    if (!user) return html`<${Login} onLogin=${onAuth} />`;
    // A client who hasn't finished onboarding sees the wizard first.
    if (user.role === "client" && (!profile || !profile.business_type)) {
      return html`<${Onboarding} user=${user} onDone=${() => loadProfile()} />`;
    }
    return html`<${Shell} user=${user} profile=${profile} onLogout=${logout} />`;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
})();
