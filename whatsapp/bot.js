// ==========================================================================
// CureMindset — חיבור וואטסאפ (WhatsApp Web / QR), בנוי אצלנו.
// הרעיון נלקח מהמעקף של Base44: מתחברים לוואטסאפ ע"י סריקת QR פעם אחת,
// ואז הבוט עונה אוטומטית לכל מי שכותב — באמצעות אותו "מוח" של האתר
// (שיטת קטי + NLP), דרך הנתיב /api/wa/reply בשרת שלנו.
//
// הרצה:   WA_BOT_SECRET=... BRAIN_URL=https://curemindsetheraphy.onrender.com npm start
// בפעם הראשונה יודפס QR בטרמינל — סורקים אותו מהוואטסאפ:
//   וואטסאפ בטלפון → הגדרות → מכשירים מקושרים → קישור מכשיר → סריקה.
// אחרי סריקה אחת, החיבור נשמר בתיקיית auth/ וממשיך לבד (לא צריך לסרוק שוב).
//
// ⚠️ זו שיטה לא-רשמית של וואטסאפ. מומלץ מספר ייעודי לבוט (לא המספר הראשי),
//    כי במקרים מסוימים וואטסאפ עלול להגביל/לחסום מספר שפועל אוטומטית.
// ==========================================================================

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import pino from "pino";

const BRAIN_URL = (process.env.BRAIN_URL || "https://curemindsetheraphy.onrender.com").replace(/\/+$/, "");
const WA_SECRET = process.env.WA_BOT_SECRET || "";
const AUTH_DIR = process.env.AUTH_DIR || "./auth";
const logger = pino({ level: "silent" });

// פנייה ל"מוח" של CureMindset (אותו מנוע של הצ'אט באתר) וקבלת תשובת NLP.
async function askBrain(text, from) {
  const res = await fetch(`${BRAIN_URL}/api/wa/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(WA_SECRET ? { "x-wa-secret": WA_SECRET } : {}),
    },
    body: JSON.stringify({ text, from }),
  });
  if (!res.ok) throw new Error("brain responded " + res.status);
  const data = await res.json();
  return (data && data.reply) || "";
}

function extractText(msg) {
  const m = msg.message || {};
  return (
    m.conversation ||
    (m.extendedTextMessage && m.extendedTextMessage.text) ||
    (m.imageMessage && m.imageMessage.caption) ||
    (m.videoMessage && m.videoMessage.caption) ||
    ""
  );
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({ version, auth: state, logger, printQRInTerminal: false });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("\n📲  סרקי את ה-QR הזה מהוואטסאפ (הגדרות → מכשירים מקושרים → קישור מכשיר):\n");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log("\n✅  וואטסאפ מחובר! הבוט עונה עכשיו אוטומטית.\n");
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      console.log(loggedOut
        ? "⚠️  התנתקת מהוואטסאפ — צריך לסרוק QR מחדש (מחקי את תיקיית auth/ והריצי שוב)."
        : "↻  החיבור נסגר — מתחבר מחדש…");
      if (!loggedOut) start();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const jid = msg.key.remoteJid || "";
      if (jid.endsWith("@g.us") || jid.endsWith("@broadcast")) continue; // לא עונים בקבוצות/סטטוס
      const text = extractText(msg).trim();
      if (!text) continue;

      try {
        await sock.sendPresenceUpdate("composing", jid); // "קטי מקלידה…"
        const reply = await askBrain(text, jid);
        await sock.sendMessage(jid, { text: reply || "אני כאן איתך 🌿" });
      } catch (err) {
        console.error("reply failed:", err.message);
        try {
          await sock.sendMessage(jid, { text: "אני כאן איתך 🌿 קרתה תקלה רגעית — נסי שוב בעוד רגע." });
        } catch (_) { /* מתעלמים */ }
      }
    }
  });
}

start().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
