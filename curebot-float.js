// CureBot — כפתור צף גלובלי, מופיע בכל דף באתר (לא רק בדף הבית).
// נטען כ-<script> רגיל (לא React) כדי לעבוד גם בעמודי ה-HTML הסטטיים.
// פותח שיחה עם קיורטי דרך אותו embed שכבר מחובר בדף הבית.
(function () {
  "use strict";
  var EMBED_URL = "https://curebot-agent.onrender.com/embed";

  function build() {
    if (document.getElementById("cmFloatBtn")) return; // לא כופלים אם כבר קיים בדף

    var style = document.createElement("style");
    style.textContent =
      "#cmFloatBtn{position:fixed;bottom:20px;left:20px;z-index:9998;display:flex;align-items:center;gap:12px;" +
      "background:#C2974A;color:#26231F;border:0;border-radius:6px;" +
      "padding:10px 18px 10px 12px;font-family:Heebo,Arial,sans-serif;font-weight:600;font-size:15px;" +
      "cursor:pointer;box-shadow:0 10px 30px -10px rgba(31,28,24,.55);transition:transform .25s cubic-bezier(.16,1,.3,1),background .2s}" +
      "#cmFloatBtn:hover{transform:translateY(-2px);background:#D3A95A}" +
      "#cmFloatBtn:active{transform:scale(.98)}" +
      "#cmFloatBtn .cmw-orb{position:relative;flex-shrink:0;width:32px;height:32px;border-radius:50%;background:#FAF8F4;display:grid;place-items:center}" +
      "#cmFloatBtn .cmw-orb svg{width:16px;height:16px;color:#1F1C18}" +
      "#cmFloatBtn .cmw-label{display:flex;flex-direction:column;align-items:flex-start;line-height:1.2}" +
      "#cmFloatBtn .cmw-label b{font-size:15px;font-weight:600}" +
      "#cmFloatBtn .cmw-label small{font-size:12px;font-weight:400;color:#4A4234}" +
      "#cmFloatOverlay{position:fixed;inset:0;z-index:9999;display:none;align-items:flex-end;justify-content:flex-start;" +
      "background:rgba(234,221,195,.7);padding:20px}" +
      "#cmFloatOverlay.open{display:flex}" +
      "#cmFloatModal{position:relative;width:min(420px,100%);height:min(680px,88vh);background:#FAF8F4;" +
      "border-radius:8px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.45)}" +
      "#cmFloatClose{position:absolute;top:12px;left:12px;z-index:1;width:40px;height:40px;border-radius:6px;" +
      "border:1px solid #E2D9C9;background:#FAF8F4;color:#26231F;font-size:22px;line-height:1;cursor:pointer}" +
      "#cmFloatModal iframe{width:100%;height:100%;border:0;display:block}" +
      "#cmFloatHint{position:fixed;bottom:80px;left:20px;z-index:9998;max-width:250px;background:#FAF8F4;color:#26231F;" +
      "border:1px solid #E2D9C9;border-radius:6px;padding:12px 34px 12px 16px;font-family:Heebo,Arial,sans-serif;" +
      "font-size:15px;line-height:1.5;box-shadow:0 14px 34px -14px rgba(31,28,24,.35);cursor:pointer;display:none}" +
      "#cmFloatHint.show{display:block;animation:cmHintIn .4s cubic-bezier(.16,1,.3,1)}" +
      "#cmFloatHint button{position:absolute;top:2px;right:4px;width:32px;height:32px;border:0;background:none;color:#6B6560;font-size:18px;cursor:pointer;line-height:1}" +
      "@keyframes cmHintIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}" +
      "@media(max-width:560px){#cmFloatOverlay{padding:0}#cmFloatModal{width:100%;height:100%;border-radius:0}#cmFloatBtn{bottom:14px;left:14px;padding:8px}#cmFloatBtn .cmw-label{display:none}#cmFloatHint{left:14px;bottom:74px}}" +
      "@media(prefers-reduced-motion:reduce){#cmFloatBtn{transition:none}#cmFloatHint.show{animation:none}}";
    document.head.appendChild(style);

    var btn = document.createElement("button");
    btn.id = "cmFloatBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "קיורטי — יש שאלה? כתבו לי כאן");
    btn.innerHTML =
      '<span class="cmw-orb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3a1 1 0 011 1v1.06a7.002 7.002 0 015.94 5.94H20a1 1 0 010 2h-1.06a7.002 7.002 0 01-5.94 5.94V20a1 1 0 01-2 0v-1.06a7.002 7.002 0 01-5.94-5.94H4a1 1 0 010-2h1.06A7.002 7.002 0 0111 5.06V4a1 1 0 011-1z"/>' +
      '<circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/></svg></span>' +
      '<span class="cmw-label"><b>קיורטי</b><small>יש שאלה? כתבו לי כאן</small></span>';

    var overlay = document.createElement("div");
    overlay.id = "cmFloatOverlay";
    overlay.innerHTML =
      '<div id="cmFloatModal"><button id="cmFloatClose" type="button" aria-label="סגירה">×</button>' +
      '<iframe src="' + EMBED_URL + '?src=' + encodeURIComponent((location.pathname || "/") + (location.search || "")) + '" title="שיחה עם קיורטי"></iframe></div>';

    // בועת הסבר קטנה ליד הכפתור — פעם אחת בביקור, כדי שיבינו מה זה
    var hint = document.createElement("div");
    hint.id = "cmFloatHint";
    hint.innerHTML = '<button type="button" aria-label="סגירה">×</button>' +
      "היי, אני קיורטי. אפשר לשאול אותי על הליווי, או פשוט לספר מה קורה.";

    document.body.appendChild(btn);
    document.body.appendChild(hint);
    document.body.appendChild(overlay);

    var seen = false;
    try { seen = sessionStorage.getItem("cmHintSeen") === "1"; } catch (e) {}
    function hideHint() {
      hint.classList.remove("show");
      try { sessionStorage.setItem("cmHintSeen", "1"); } catch (e) {}
    }
    if (!seen) setTimeout(function () { if (!overlay.classList.contains("open")) hint.classList.add("show"); }, 5000);
    hint.querySelector("button").addEventListener("click", function (e) { e.stopPropagation(); hideHint(); });

    function open() {
      hideHint();
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }
    btn.addEventListener("click", open);
    hint.addEventListener("click", open);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.getElementById("cmFloatClose").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    // קריאה נוחה מכפתורים אחרים בדף (נאב, כותרות עמודים סטטיים וכו').
    window.cmOpenBot = open;

    // עוזרת אחת באתר: קישורים שעוד מפנים לעוזרת הישנה (/talk) פותחים את קיורטי.
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href^="/talk"]') : null;
      if (!a) return;
      e.preventDefault();
      open();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
