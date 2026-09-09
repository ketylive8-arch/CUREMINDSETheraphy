/* מחולל עמודי SEO סטטיים ל-CureMindset.
 * מריץ: node scripts/gen-seo.js  →  יוצר קבצי .html בשורש הפרויקט.
 * כל עמוד = תוכן מלא ב-HTML (לגוגל), RTL, מובייל, מיתוג זהב-קרם, JSON-LD אמיתי.
 * אין תלות ב-JavaScript להצגת התוכן המרכזי. */

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
  wa: "https://wa.me/972543032349",
  calendly: "https://calendly.com/ketysegev/meet-with-me",
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

function breadcrumbJsonLd(p) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "בית", item: "https://ketysegev.com/" },
      { "@type": "ListItem", position: 2, name: p.h1, item: `https://ketysegev.com/${p.slug}` },
    ],
  });
}

function template(p) {
  const url = `https://ketysegev.com/${p.slug}`;
  const sections = p.sections
    .map((s) => `<section class="blk"><h2>${esc(s.h2)}</h2>${s.body.map((b) => `<p>${b}</p>`).join("")}</section>`)
    .join("\n");
  const signs = p.signs
    ? `<section class="blk"><h2>${esc(p.signsTitle || "מתי העמוד הזה רלוונטי לך")}</h2><ul class="signs">${p.signs.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>`
    : "";
  const tools = p.tools
    ? `<section class="blk"><h2>${esc(p.toolsTitle || "כלים ועקרונות מהשיטה")}</h2><div class="cards">${p.tools
        .map((t) => `<div class="card"><h3>${esc(t.title)}</h3><p>${esc(t.text)}</p></div>`)
        .join("")}</div></section>`
    : "";
  const faq = p.faq
    ? `<section class="blk"><h2>שאלות נפוצות</h2><div class="faq">${p.faq
        .map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
        .join("")}</div></section>`
    : "";
  const related = p.related
    ? `<nav class="related" aria-label="עמודים קשורים"><span>עוד בנושא:</span>${p.related
        .map((r) => `<a href="/${r.slug}">${esc(r.label)}</a>`)
        .join("")}</nav>`
    : "";

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="theme-color" content="${BRAND.gold}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="CURE MINDSET · קטי שגב" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="https://ketysegev.com/images/kety-920.jpg" />
<meta property="og:locale" content="he_IL" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="/images/logo.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;600;700;800&family=Assistant:wght@400;500;600;700&display=swap" rel="stylesheet" />
<script type="application/ld+json">${breadcrumbJsonLd(p)}</script>
<script type="application/ld+json">${faqJsonLd(p.faq || [])}</script>
<style>
  :root{--gold:${BRAND.gold};--gold-deep:${BRAND.goldDeep};--gold-soft:${BRAND.goldSoft};--cream:${BRAND.cream};--ink:${BRAND.ink};--ink-500:${BRAND.ink500}}
  *{box-sizing:border-box}
  body{margin:0;font-family:Assistant,Arial,sans-serif;color:var(--ink);background:var(--cream);line-height:1.8;font-size:17px}
  a{color:var(--gold-deep)}
  .wrap{max-width:820px;margin:0 auto;padding:0 22px}
  header.site{position:sticky;top:0;z-index:20;background:rgba(251,247,239,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--gold-soft)}
  header.site .wrap{display:flex;align-items:center;justify-content:space-between;padding:12px 22px}
  header.site img{height:38px}
  .brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--ink)}
  .brand b{font-family:Rubik,sans-serif;font-weight:800;font-size:17px;color:var(--gold-deep)}
  .cta-top{background:var(--gold);color:#fff;text-decoration:none;font-family:Rubik,sans-serif;font-weight:700;font-size:14px;padding:9px 16px;border-radius:999px;white-space:nowrap}
  h1{font-family:Rubik,sans-serif;font-weight:800;font-size:33px;line-height:1.25;color:var(--ink);margin:8px 0 14px}
  h2{font-family:Rubik,sans-serif;font-weight:700;font-size:24px;color:var(--gold-deep);margin:34px 0 12px}
  h3{font-family:Rubik,sans-serif;font-weight:700;font-size:18px;color:var(--ink);margin:0 0 8px}
  .eyebrow{font-family:Rubik,sans-serif;font-weight:600;font-size:13px;letter-spacing:.12em;color:var(--gold);text-transform:none}
  .hero{padding:44px 0 8px}
  .hero .lead{font-size:20px;font-weight:600;color:var(--ink);margin:0 0 22px}
  .blk{padding:6px 0}
  .signs{list-style:none;padding:0;margin:0;display:grid;gap:10px}
  .signs li{background:#fff;border:1px solid var(--gold-soft);border-radius:12px;padding:12px 16px;position:relative;padding-inline-start:40px}
  .signs li:before{content:"✓";position:absolute;inset-inline-start:14px;top:11px;color:var(--gold);font-weight:800}
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .card{background:#fff;border:1px solid var(--gold-soft);border-radius:14px;padding:18px 20px}
  .faq details{background:#fff;border:1px solid var(--gold-soft);border-radius:12px;padding:0 18px;margin-bottom:10px}
  .faq summary{font-family:Rubik,sans-serif;font-weight:700;cursor:pointer;padding:15px 0;list-style:none}
  .faq summary::-webkit-details-marker{display:none}
  .faq summary:before{content:"+";color:var(--gold);font-weight:800;margin-inline-end:10px}
  .faq details[open] summary:before{content:"–"}
  .faq details p{margin:0 0 16px;color:var(--ink-500)}
  .ctaband{background:linear-gradient(160deg,#fff, var(--gold-soft));border:1px solid var(--gold-soft);border-radius:18px;padding:28px 24px;text-align:center;margin:36px 0}
  .ctaband h2{margin-top:0}
  .btnrow{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:8px}
  .btn{text-decoration:none;font-family:Rubik,sans-serif;font-weight:700;padding:13px 24px;border-radius:999px;font-size:16px}
  .btn.primary{background:var(--gold);color:#fff}
  .btn.ghost{background:#fff;color:var(--gold-deep);border:1px solid var(--gold)}
  .note{font-size:13px;color:var(--ink-500);margin-top:12px}
  .related{display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:22px 0;border-top:1px solid var(--gold-soft);margin-top:30px;font-size:15px}
  .related span{color:var(--ink-500)}
  .disclaimer{background:#f3eee3;border-radius:12px;padding:16px 18px;font-size:13.5px;color:var(--ink-500);margin:24px 0}
  footer.site{border-top:1px solid var(--gold-soft);padding:26px 0;text-align:center;color:var(--ink-500);font-size:14px}
  footer.site a{color:var(--gold-deep);text-decoration:none;margin:0 8px}
  @media(max-width:600px){h1{font-size:27px}.cards{grid-template-columns:1fr}.hero{padding:30px 0 4px}}
  a:focus-visible,summary:focus-visible,.btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;border-radius:6px}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="brand" href="/"><img src="/images/logo.svg" alt="CureMindset — קטי שגב" /><b>CureMindset</b></a>
  <a class="cta-top" href="/#plans">להתחיל ניסיון חינם</a>
</div></header>

<main class="wrap">
  <div class="hero">
    <div class="eyebrow">${esc(p.eyebrow || "CureMindset · קטי שגב")}</div>
    <h1>${esc(p.h1)}</h1>
    <p class="lead">${p.lead}</p>
    <a class="btn primary" href="${BRAND.calendly}" target="_blank" rel="noopener">${esc(p.heroCta || "לשיחת היכרות ללא עלות")}</a>
  </div>

  ${sections}
  ${signs}
  ${tools}

  <section class="blk"><h2>התהליך עם קטי — ומה קורה בשיחת ההיכרות</h2><p>${p.process}</p></section>

  <div class="disclaimer">${esc(p.notFor || "CureMindset הוא כלי לאימון, למידה ותרגול אישי בשיטת NLP. הוא אינו תחליף לאבחון, לטיפול רפואי או נפשי, ואינו מיועד למצבי חירום. במצוקה מיידית פנו לעזרה מקצועית — ער\"ן 1201, מד\"א 101.")}</div>

  ${faq}

  <div class="ctaband">
    <h2>${esc(p.ctaTitle || "השינוי מתחיל בשיחה אחת")}</h2>
    <p>${esc(p.ctaText || "אין צורך להגיע עם תשובות. משאירים פרטים ובודקים יחד אם זה מתאים לך.")}</p>
    <div class="btnrow">
      <a class="btn primary" href="/#plans">להתחיל ניסיון חינם</a>
      <a class="btn ghost" href="${BRAND.calendly}" target="_blank" rel="noopener">קביעת שיחת היכרות</a>
    </div>
    <div class="note">3 ימי התנסות · בלי כרטיס אשראי · ביטול בכל עת</div>
  </div>

  ${related}
</main>

<footer class="site"><div class="wrap">
  <a href="/">דף הבית</a> · <a href="/method">השיטה</a> · <a href="${BRAND.wa}" target="_blank" rel="noopener">וואטסאפ</a> · <a href="${BRAND.calendly}" target="_blank" rel="noopener">קביעת שיחה</a>
  <div style="margin-top:12px">© ${new Date().getFullYear()} CureMindset · קטי שגב</div>
</div></footer>
</body>
</html>`;
}

// ---- התוכן (קופי פרימיום, מקורי) ----
const PAGES = require("./seo-content.js");

let count = 0;
for (const p of PAGES) {
  fs.writeFileSync(path.join(ROOT, `${p.slug}.html`), template(p), "utf8");
  count++;
  console.log("wrote", `${p.slug}.html`);
}
console.log(`\n${count} SEO pages generated.`);
