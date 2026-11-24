// ============================================================
//  Segev MKG · WhatsApp control
//  Link the account with a QR (WhatsApp Web), then operate the lead system
//  by text or voice note. Auth state lives on a persistent disk so the link
//  survives restarts. Voice is transcribed with OpenAI Whisper.
// ============================================================
import express from "express";
import baileys, { DisconnectReason, useMultiFileAuthState, downloadMediaMessage } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import fs from "fs";

const makeWASocket = baileys.default || baileys;
const log = pino({ level: "warn" });

const PORT = process.env.PORT || 10000;
const AUTH_DIR = process.env.AUTH_DIR || "/data/auth";                 // persistent disk
const API = (process.env.LEADS_API || "https://segev-mkg-leads.onrender.com").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "segevmkg@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""; // set as an env var on the service; never hardcoded
const OWNER = String(process.env.OWNER_NUMBER || "").replace(/\D/g, ""); // who may give commands
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";

fs.mkdirSync(AUTH_DIR, { recursive: true });

const view = { status: "starting", qr: null, me: null, lastEvent: "מתחיל…", handled: 0 };

/* ---------------- lead-system API (admin session, cached) ---------------- */
let token = null;
async function api(path, opts = {}) {
  if (!token) {
    const r = await fetch(API + "/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const j = await r.json().catch(() => ({}));
    token = j.token || null;
    if (!token) throw new Error("לא הצלחתי להתחבר למערכת הלידים");
  }
  const r = await fetch(API + path, { ...opts, headers: { ...(opts.headers || {}), Authorization: "Bearer " + token } });
  if (r.status === 401) { token = null; return api(path, opts); }
  return r.json().catch(() => ({}));
}

/* ---------------- voice → text (Whisper) ---------------- */
async function transcribe(msg) {
  if (!OPENAI_KEY) return null;
  try {
    const buffer = await downloadMediaMessage(msg, "buffer", {}, { logger: log });
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: "audio/ogg" }), "voice.ogg");
    form.append("model", process.env.STT_MODEL || "whisper-1");
    form.append("language", "he");
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST", headers: { Authorization: "Bearer " + OPENAI_KEY }, body: form,
    });
    if (!r.ok) return null;
    const j = await r.json();
    return (j.text || "").trim() || null;
  } catch { return null; }
}

/* ---------------- commands ---------------- */
const HELP =
  "אפשר לכתוב או להקליט הודעה קולית:\n" +
  "• “סטטוס” — כמה לידים ומה מצבם\n" +
  "• “אתר לידים” — הפעלת חיפוש עכשיו\n" +
  "• “עזרה” — התפריט הזה\n\n" +
  "בקרוב: שליחה ושינוי הצעות בפקודה.";

async function handleCommand(text) {
  const t = (text || "").trim();
  if (!t) return "לא הבנתי. כתבי “עזרה” לרשימת הפקודות.";
  if (/^(עזרה|פקודות|מה אפשר|help)/i.test(t)) return HELP;
  if (/(סטטוס|כמה לידים|מצב|דו״ח|דוח)/.test(t)) {
    const s = await api("/api/stats");
    return `דוח מצב לידים:\n` +
      `• סה״כ: ${s.total ?? "-"}\n` +
      `• חדשים: ${s.new ?? "-"}\n` +
      `• נשלחו: ${s.sent ?? "-"}\n` +
      `• ללא מענה: ${s.no_reply ?? "-"}`;
  }
  if (/(אתר|חפש|חיפוש|תמצא|מצא).*ליד|ליד.*(אתר|חפש|תמצא)|הפעל.*חיפוש/.test(t)) {
    try {
      const secret = process.env.HUNT_SECRET || "";
      const r = await fetch(API + "/api/hunt/run", { method: "POST", headers: { "X-Hunt-Secret": secret } });
      const j = await r.json().catch(() => ({}));
      return j && j.ok ? "התחלתי חיפוש לידים. אעדכן אותך בדוח הבא." : "ניסיתי להפעיל חיפוש — צריך להגדיר הרשאת הפעלה. אטפל בזה.";
    } catch { return "לא הצלחתי להפעיל חיפוש כרגע."; }
  }
  // free-form — acknowledge; richer intent handling comes next
  return "קיבלתי: “" + t + "”.\nבגרסה הזו אני יודע: סטטוס · אתר לידים · עזרה. בקרוב אבצע גם פקודות חופשיות.";
}

/* ---------------- WhatsApp connection ---------------- */
let sock = null;
async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  sock = makeWASocket({ auth: state, logger: log, printQRInTerminal: false, syncFullHistory: false });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect, qr } = u;
    if (qr) {
      view.qr = await QRCode.toDataURL(qr).catch(() => null);
      view.status = "ממתין לסריקת QR";
      view.lastEvent = "קוד QR חדש — סרקי מהטלפון";
    }
    if (connection === "open") {
      view.qr = null;
      view.status = "מחובר";
      view.me = sock.user?.id?.split(":")[0] || null;
      view.lastEvent = "התחברות הצליחה";
    }
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      view.status = "מנותק";
      view.lastEvent = "נותק (" + (code || "?") + ")";
      if (code !== DisconnectReason.loggedOut) setTimeout(connect, 3000); // reconnect unless logged out
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const m of messages) {
      try {
        if (m.key.fromMe) continue;
        const from = (m.key.remoteJid || "").replace(/@.*/, "").replace(/\D/g, "");
        // only the owner may operate the system
        if (OWNER && from !== OWNER) continue;
        const inner = m.message || {};
        let text = inner.conversation || inner.extendedTextMessage?.text || "";
        const audio = inner.audioMessage;
        if (!text && audio) {
          const spoken = await transcribe(m);
          if (!spoken) { await reply(m.key.remoteJid, "לא הצלחתי לתמלל את ההקלטה. ודאי שמחובר מפתח OpenAI, או כתבי בטקסט."); continue; }
          text = spoken;
        }
        if (!text) continue;
        const answer = await handleCommand(text);
        await reply(m.key.remoteJid, answer);
        view.handled++;
        view.lastEvent = "טיפלתי בפקודה: " + text.slice(0, 40);
      } catch (e) {
        view.lastEvent = "שגיאה בטיפול בהודעה: " + e.message;
      }
    }
  });
}

async function reply(jid, text) {
  try { await sock.sendMessage(jid, { text }); } catch { /* ignore */ }
}

/* ---------------- web page: QR + status ---------------- */
const app = express();
app.get("/", (_req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Segev · חיבור וואטסאפ</title>
<style>body{font-family:-apple-system,Segoe UI,Heebo,Arial,sans-serif;background:#ECE7DF;color:#201D18;margin:0;
display:flex;min-height:100vh;align-items:center;justify-content:center}
.card{background:#fff;border:1px solid #E3DCD0;border-radius:18px;box-shadow:0 10px 28px rgba(0,0,0,.06);
padding:28px;max-width:420px;width:92%;text-align:center}
.logo{width:48px;height:48px;border-radius:14px;background:linear-gradient(150deg,#2B3C62,#15203A);color:#D4A94E;
display:grid;place-items:center;font-weight:800;margin:0 auto 14px}
h1{font-size:19px;margin:0 0 4px}.sub{color:#6A635A;font-size:13px;margin-bottom:18px}
img{width:240px;height:240px;border:1px solid #eee;border-radius:12px}
.st{font-weight:700;margin-top:14px}.ev{color:#6A635A;font-size:12px;margin-top:4px}
.ok{color:#0E9F6E}.wait{color:#B4690E}</style></head>
<body><div class="card"><div class="logo">SM</div>
<h1>חיבור וואטסאפ · Segev MKG</h1>
<div class="sub">סרקי את הקוד מהטלפון: וואטסאפ → מכשירים מקושרים → קישור מכשיר</div>
<div id="box">טוען…</div>
<div class="st" id="st"></div><div class="ev" id="ev"></div></div>
<script>
async function tick(){
 try{const r=await fetch('/status');const j=await r.json();
  const box=document.getElementById('box');
  if(j.status==='מחובר'){box.innerHTML='<div style="font-size:60px">✅</div>';}
  else if(j.qr){box.innerHTML='<img src="'+j.qr+'">';}
  else{box.textContent='מתחבר…';}
  const st=document.getElementById('st');st.textContent=j.status;st.className='st '+(j.status==='מחובר'?'ok':'wait');
  document.getElementById('ev').textContent=j.lastEvent+(j.me?(' · '+j.me):'');
 }catch(e){}
}
tick();setInterval(tick,2500);
</script></body></html>`);
});
app.get("/status", (_req, res) => res.json(view));
app.get("/healthz", (_req, res) => res.json({ ok: true, status: view.status }));
app.listen(PORT, () => log.info("web on " + PORT));

connect().catch((e) => { view.lastEvent = "שגיאת חיבור: " + e.message; });
