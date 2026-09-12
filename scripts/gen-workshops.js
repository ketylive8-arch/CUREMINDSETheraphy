/* מחולל עמודי נחיתה לסדנאות — כל סדנה בנפרד, עמוד מכירה מלא.
 * מריץ: node scripts/gen-workshops.js  →  יוצר <slug>.html בשורש הפרויקט.
 * עיצוב פרימיום, מיתוג זהב-קרם, RTL, מובייל-first, טופס לידים + וואטסאפ.
 * התוכן: scripts/workshops-content.js */

const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.join(__dirname, "..");

const BRAND = {
  gold: "#c2974a",
  goldDeep: "#8a6a2f",
  goldSoft: "#efe3cc",
  cream: "#FBF7EF",
  ink: "#2D2A26",
  ink500: "#6B6560",
  green: "#16A34A",
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function faqJsonLd(faq) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "he",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });
}

function courseJsonLd(p, url) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Course",
    name: p.program_name,
    description: p.one_line_promise,
    inLanguage: "he",
    url,
    provider: {
      "@type": "Organization",
      name: "CureMindset · קטי שגב",
      url: p.brand_domain,
    },
    ...(p.price && /₪/.test(p.price)
      ? {
          offers: {
            "@type": "Offer",
            price: p.price.replace(/[^\d]/g, ""),
            priceCurrency: "ILS",
            category: "Workshop",
          },
        }
      : {}),
  });
}

function breadcrumbJsonLd(p, url) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "בית", item: "https://ketysegev.com/" },
      { "@type": "ListItem", position: 2, name: "סדנאות", item: "https://ketysegev.com/workshops" },
      { "@type": "ListItem", position: 3, name: p.program_name, item: url },
    ],
  });
}

function template(p) {
  const url = `https://ketysegev.com/${p.slug}`;
  const waBase = `https://wa.me/${p.whatsapp_number}`;
  const waMsg = encodeURIComponent(`היי קטי, אשמח לפרטים על "${p.program_name}"`);

  const factRows = [
    ["פורמט", p.format],
    ["מפגשים", p.sessions_count],
    ["אורך מפגש", p.session_length],
    ["מועדים", p.dates],
    ["מיקום", p.location],
    ["גודל קבוצה", p.group_size],
    ["מחיר", `${p.price}${p.price_note ? ` — ${p.price_note}` : ""}`],
    ["אפשרויות תשלום", p.payment_options.join(" · ")],
  ]
    .map(
      ([k, v]) =>
        `<div class="fact"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`
    )
    .join("");

  const chips = [
    ["📅", p.sessions_count],
    ["⏱️", p.session_length],
    ["📍", p.location],
    ["👥", p.group_size],
  ]
    .map(([i, t]) => `<span class="chip">${i} ${esc(t)}</span>`)
    .join("");

  const pains = p.pains
    .map((t) => `<li>${esc(t)}</li>`)
    .join("");
  const outcomes = p.outcomes
    .map((t) => `<li>${esc(t)}</li>`)
    .join("");
  const agenda = p.agenda
    .map(
      (a, i) =>
        `<div class="step"><div class="step-n">${i + 1}</div><div><h3>${esc(
          a.t
        )}</h3><p>${esc(a.d)}</p></div></div>`
    )
    .join("");
  const includes = p.includes
    .map((t) => `<li>${esc(t)}</li>`)
    .join("");
  const forwhom = p.forwhom
    .map((t) => `<li>${esc(t)}</li>`)
    .join("");
  const proof = p.proof_assets
    .map((t) => `<div class="proof-item"><span>✦</span>${esc(t)}</div>`)
    .join("");
  const faq = p.faq
    ? `<section class="blk"><h2>שאלות נפוצות</h2><div class="faq">${p.faq
        .map(
          (f) =>
            `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`
        )
        .join("")}</div></section>`
    : "";

  const webhookJs = p.crm_webhook_url
    ? `
    const WEBHOOK=${JSON.stringify(p.crm_webhook_url)};
    form.addEventListener('submit',async function(e){
      e.preventDefault();
      const data=Object.fromEntries(new FormData(form).entries());
      data.program=${JSON.stringify(p.program_name)};
      data.source=location.href;
      btn.disabled=true;btn.textContent='שולח…';
      try{
        await fetch(WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        form.hidden=true;ok.hidden=false;
      }catch(err){
        // נפילה לוואטסאפ אם ה-webhook נכשל
        const msg=encodeURIComponent('היי קטי, אשמח לפרטים על "'+data.program+'". שם: '+(data.name||'')+', טלפון: '+(data.phone||''));
        location.href=${JSON.stringify(waBase)}+'?text='+msg;
      }
    });`
    : `
    form.addEventListener('submit',function(e){
      e.preventDefault();
      const data=Object.fromEntries(new FormData(form).entries());
      const msg=encodeURIComponent('היי קטי, אשמח לפרטים על "'+${JSON.stringify(
        p.program_name
      )}+'". שם: '+(data.name||'')+', טלפון: '+(data.phone||'')+(data.note?', '+data.note:''));
      window.open(${JSON.stringify(waBase)}+'?text='+msg,'_blank');
      form.hidden=true;ok.hidden=false;
    });`;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(p.program_name)} | קטי שגב · CureMindset</title>
<meta name="description" content="${esc(p.one_line_promise)}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="theme-color" content="${BRAND.gold}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="CureMindset · קטי שגב" />
<meta property="og:title" content="${esc(p.program_name)}" />
<meta property="og:description" content="${esc(p.one_line_promise)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="https://ketysegev.com/images/kety-920.jpg" />
<meta property="og:locale" content="he_IL" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/logo.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700;800&family=Assistant:wght@400;500;600;700&display=swap" rel="stylesheet" />
<script type="application/ld+json">${breadcrumbJsonLd(p, url)}</script>
<script type="application/ld+json">${courseJsonLd(p, url)}</script>
${p.faq && p.faq.length ? `<script type="application/ld+json">${faqJsonLd(p.faq)}</script>` : ""}
<style>
  :root{--gold:${BRAND.gold};--gold-deep:${BRAND.goldDeep};--gold-soft:${BRAND.goldSoft};--cream:${BRAND.cream};--ink:${BRAND.ink};--ink-500:${BRAND.ink500};--green:${BRAND.green}}
  *{box-sizing:border-box}
  body{margin:0;font-family:Assistant,Arial,sans-serif;color:var(--ink);background:var(--cream);line-height:1.75;font-size:17px}
  a{color:var(--gold-deep)}
  .wrap{max-width:900px;margin:0 auto;padding:0 20px}
  header.site{position:sticky;top:0;z-index:30;background:rgba(251,247,239,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--gold-soft)}
  header.site .wrap{display:flex;align-items:center;justify-content:space-between;padding:12px 20px}
  .brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--ink)}
  .brand img{height:36px}
  .brand b{font-family:Rubik,sans-serif;font-weight:800;font-size:17px;color:var(--gold-deep)}
  .cta-top{background:var(--gold);color:#fff;text-decoration:none;font-family:Rubik,sans-serif;font-weight:700;font-size:14px;padding:9px 16px;border-radius:999px;white-space:nowrap}
  h1{font-family:Rubik,sans-serif;font-weight:800;font-size:36px;line-height:1.22;margin:10px 0 14px}
  h2{font-family:Rubik,sans-serif;font-weight:700;font-size:25px;color:var(--gold-deep);margin:38px 0 14px}
  h3{font-family:Rubik,sans-serif;font-weight:700;font-size:18px;margin:0 0 6px}
  .eyebrow{font-family:Rubik,sans-serif;font-weight:600;font-size:13px;letter-spacing:.1em;color:var(--gold)}
  .hero{background:linear-gradient(165deg,#fff 0%,var(--gold-soft) 100%);border-bottom:1px solid var(--gold-soft);padding:14px 0 40px}
  .hero .lead{font-size:20px;font-weight:600;margin:0 0 18px;max-width:40ch}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px}
  .chip{background:#fff;border:1px solid var(--gold-soft);border-radius:999px;padding:7px 14px;font-size:14px;font-weight:600;color:var(--ink)}
  .btnrow{display:flex;flex-wrap:wrap;gap:12px}
  .btn{text-decoration:none;font-family:Rubik,sans-serif;font-weight:700;padding:14px 26px;border-radius:999px;font-size:16px;border:0;cursor:pointer;display:inline-block;text-align:center}
  .btn.primary{background:var(--gold);color:#fff;box-shadow:0 8px 20px rgba(194,151,74,.3)}
  .btn.ghost{background:#fff;color:var(--gold-deep);border:1px solid var(--gold)}
  .price-badge{display:inline-flex;align-items:baseline;gap:8px;background:#fff;border:1px solid var(--gold-soft);border-radius:14px;padding:12px 18px;margin:0 0 20px}
  .price-badge b{font-family:Rubik,sans-serif;font-weight:800;font-size:26px;color:var(--gold-deep)}
  .price-badge span{font-size:13px;color:var(--ink-500)}
  section.blk{padding:4px 0}
  ul.ticks{list-style:none;padding:0;margin:0;display:grid;gap:11px}
  ul.ticks li{background:#fff;border:1px solid var(--gold-soft);border-radius:12px;padding:13px 16px 13px 46px;position:relative}
  ul.ticks li:before{content:"✓";position:absolute;inset-inline-start:16px;top:12px;color:var(--green);font-weight:800}
  ul.pains{list-style:none;padding:0;margin:0;display:grid;gap:10px}
  ul.pains li{padding:4px 22px 4px 0;position:relative;color:var(--ink-500)}
  ul.pains li:before{content:"—";position:absolute;inset-inline-start:0;color:var(--gold)}
  .steps{display:grid;gap:14px;margin-top:6px}
  .step{display:flex;gap:14px;background:#fff;border:1px solid var(--gold-soft);border-radius:14px;padding:18px 20px}
  .step-n{flex:none;width:34px;height:34px;border-radius:50%;background:var(--gold);color:#fff;font-family:Rubik,sans-serif;font-weight:800;display:flex;align-items:center;justify-content:center}
  .facts{display:grid;grid-template-columns:1fr 1fr;gap:0;background:#fff;border:1px solid var(--gold-soft);border-radius:16px;overflow:hidden;margin:6px 0}
  .fact{padding:15px 18px;border-top:1px solid var(--gold-soft)}
  .fact:nth-child(1),.fact:nth-child(2){border-top:0}
  .fact dt{font-family:Rubik,sans-serif;font-weight:700;font-size:13px;color:var(--gold-deep);margin:0 0 3px}
  .fact dd{margin:0;font-size:15px}
  .guarantee{background:#f1f7f1;border:1px solid #cfe6cf;border-radius:14px;padding:16px 20px;margin:18px 0;display:flex;gap:12px;align-items:flex-start}
  .guarantee b{color:var(--green)}
  .proof{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:10px 0}
  .proof-item{background:#fff;border:1px solid var(--gold-soft);border-radius:14px;padding:16px;text-align:center;font-weight:600;font-size:15px}
  .proof-item span{display:block;color:var(--gold);font-size:20px;margin-bottom:6px}
  .faq details{background:#fff;border:1px solid var(--gold-soft);border-radius:12px;padding:0 18px;margin-bottom:10px}
  .faq summary{font-family:Rubik,sans-serif;font-weight:700;cursor:pointer;padding:15px 0;list-style:none}
  .faq summary::-webkit-details-marker{display:none}
  .faq summary:before{content:"+";color:var(--gold);font-weight:800;margin-inline-end:10px}
  .faq details[open] summary:before{content:"–"}
  .faq details p{margin:0 0 16px;color:var(--ink-500)}
  .leadbox{background:linear-gradient(160deg,#fff,var(--gold-soft));border:1px solid var(--gold-soft);border-radius:20px;padding:30px 26px;margin:40px 0 10px;text-align:center}
  .leadbox h2{margin-top:0}
  form.lead{display:grid;gap:12px;max-width:420px;margin:18px auto 0;text-align:start}
  form.lead input,form.lead textarea{font-family:Assistant,sans-serif;font-size:16px;padding:13px 15px;border:1px solid var(--gold-soft);border-radius:12px;background:#fff;width:100%}
  form.lead textarea{min-height:70px;resize:vertical}
  .ok{display:none;background:#f1f7f1;border:1px solid #cfe6cf;border-radius:14px;padding:18px;color:var(--green);font-weight:700}
  .note{font-size:13px;color:var(--ink-500);margin-top:12px}
  .disclaimer{background:#f3eee3;border-radius:12px;padding:16px 18px;font-size:13.5px;color:var(--ink-500);margin:26px 0}
  .stickybar{position:fixed;inset-inline:0;bottom:0;z-index:40;display:none;gap:8px;padding:10px 14px;background:rgba(251,247,239,.97);border-top:1px solid var(--gold-soft);backdrop-filter:blur(8px)}
  .stickybar a{flex:1;text-align:center}
  footer.site{border-top:1px solid var(--gold-soft);padding:26px 0 90px;text-align:center;color:var(--ink-500);font-size:14px}
  footer.site a{color:var(--gold-deep);text-decoration:none;margin:0 7px}
  a:focus-visible,summary:focus-visible,.btn:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid var(--gold);outline-offset:2px;border-radius:6px}
  @media(max-width:640px){
    h1{font-size:28px}h2{font-size:22px}
    .facts{grid-template-columns:1fr}
    .fact{border-top:1px solid var(--gold-soft)}
    .fact:nth-child(2){border-top:1px solid var(--gold-soft)}
    .proof{grid-template-columns:1fr}
    .stickybar{display:flex}
    footer.site{padding-bottom:90px}
  }
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="brand" href="/"><img src="/images/logo.svg" alt="CureMindset — קטי שגב" /><b>CureMindset</b></a>
  <a class="cta-top" href="#lead">${esc(p.cta_primary)}</a>
</div></header>

<section class="hero"><div class="wrap">
  <div class="eyebrow">סדנה עם קטי שגב · ${esc(p.audience_primary)}</div>
  <h1>${esc(p.program_name)}</h1>
  <p class="lead">${esc(p.one_line_promise)}</p>
  <div class="chips">${chips}</div>
  <div class="price-badge"><b>${esc(p.price)}</b><span>${esc(p.price_note || "")}</span></div>
  <div class="btnrow">
    <a class="btn primary" href="#lead">${esc(p.cta_primary)} →</a>
    <a class="btn ghost" href="${waBase}?text=${waMsg}" target="_blank" rel="noopener">${esc(p.cta_secondary)}</a>
  </div>
</div></section>

<main class="wrap">
  <p style="font-size:19px;margin:30px 0 0">${esc(p.hero_sub)}</p>

  <section class="blk"><h2>אם זה מרגיש מוכר —</h2>
    <ul class="pains">${pains}</ul>
  </section>

  <section class="blk"><h2>מה תיקח/י מהסדנה</h2>
    <ul class="ticks">${outcomes}</ul>
  </section>

  <section class="blk"><h2>איך הסדנה בנויה</h2>
    <div class="steps">${agenda}</div>
  </section>

  <section class="blk"><h2>מה כלול</h2>
    <ul class="ticks">${includes}</ul>
  </section>

  <section class="blk"><h2>למי זה מתאים</h2>
    <ul class="pains">${forwhom}</ul>
  </section>

  <section class="blk"><h2>כל הפרטים במקום אחד</h2>
    <dl class="facts">${factRows}</dl>
    <div class="guarantee"><span style="font-size:20px">🛡️</span><div><b>ההבטחה שלי: </b>${esc(p.guarantee)}</div></div>
  </section>

  <section class="blk"><h2>למה לסמוך על זה</h2>
    <div class="proof">${proof}</div>
  </section>

  ${faq}

  <div class="disclaimer">CureMindset והסדנאות הם מרחב לאימון, למידה ותרגול אישי בשיטת NLP. הם אינם תחליף לאבחון, טיפול רפואי או נפשי, ואינם מיועדים למצבי חירום. במצוקה מיידית פנו לעזרה מקצועית — ער"ן 1201, מד"א 101.</div>

  <div class="leadbox" id="lead">
    <h2>${esc(p.cta_primary)}</h2>
    <p>משאירים פרטים וקטי חוזרת אליכם אישית — בלי התחייבות.</p>
    <form class="lead" id="leadForm" novalidate>
      <input name="name" type="text" placeholder="שם מלא" autocomplete="name" required />
      <input name="phone" type="tel" placeholder="טלפון" autocomplete="tel" required />
      <textarea name="note" placeholder="משהו שחשוב שנדע? (לא חובה)"></textarea>
      <button class="btn primary" type="submit" id="leadBtn">שליחה ←</button>
    </form>
    <div class="ok" id="leadOk">קיבלנו! קטי תחזור אליך בהקדם 🤍</div>
    <div class="note">או בוואטסאפ ישיר: <a href="${waBase}?text=${waMsg}" target="_blank" rel="noopener">054-303-2349</a></div>
  </div>
</main>

<div class="stickybar">
  <a class="btn primary" href="#lead">${esc(p.cta_primary)}</a>
  <a class="btn ghost" href="${waBase}?text=${waMsg}" target="_blank" rel="noopener">וואטסאפ</a>
</div>

<footer class="site"><div class="wrap">
  <a href="/">דף הבית</a> · <a href="/#workshops">כל הסדנאות</a> · <a href="/method">השיטה</a> · <a href="/faq">שאלות נפוצות</a> · <a href="/contact">יצירת קשר</a>
  <div style="margin-top:8px"><a href="/privacy">פרטיות</a> · <a href="/terms">תנאי שימוש</a> · <a href="/accessibility">נגישות</a> · <a href="/responsibility">הבהרת אחריות</a></div>
  <div style="margin-top:12px">© ${new Date().getFullYear()} CureMindset · קטי שגב</div>
</div></footer>

<script>
  (function(){
    var form=document.getElementById('leadForm');
    var btn=document.getElementById('leadBtn');
    var ok=document.getElementById('leadOk');
    if(!form)return;${webhookJs}
  })();
</script>
</body>
</html>`;
}

const PAGES = require("./workshops-content.js");
let count = 0;
for (const p of PAGES) {
  fs.writeFileSync(path.join(ROOT, `${p.slug}.html`), template(p), "utf8");
  count++;
  console.log("wrote", `${p.slug}.html`);
}
console.log(`\n${count} workshop pages generated.`);
