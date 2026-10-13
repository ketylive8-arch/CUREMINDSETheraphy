// CureBot — כפתור צף גלובלי, מופיע בכל דף באתר (לא רק בדף הבית).
// נטען כ-<script> רגיל (לא React) כדי לעבוד גם בעמודי ה-HTML הסטטיים.
// פותח שיחה עם העוזרת הדיגיטלית דרך אותו embed שכבר מחובר בדף הבית.
(function () {
  "use strict";
  var EMBED_URL = "https://curebot-agent.onrender.com/embed";

  function build() {
    if (document.getElementById("cmFloatBtn")) return; // לא כופלים אם כבר קיים בדף

    var style = document.createElement("style");
    style.textContent =
      "#cmFloatBtn{position:fixed;bottom:18px;left:18px;z-index:9998;display:flex;align-items:center;gap:10px;" +
      "background:#FFFFFF;color:#2D2A26;border:1px solid #E8E0D5;border-radius:999px;" +
      "padding:9px 18px 9px 9px;font-family:Rubik,Assistant,Arial,sans-serif;font-weight:700;font-size:14.5px;" +
      "cursor:pointer;box-shadow:0 2px 10px rgba(45,42,38,.1);transition:border-color .2s,transform .2s}" +
      "#cmFloatBtn:hover{transform:translateY(-2px);border-color:#C9A96E}" +
      "#cmFloatBtn .cmw-orb{position:relative;flex-shrink:0;width:34px;height:34px;border-radius:50%;background:#C9A96E;display:grid;place-items:center}" +
      "#cmFloatBtn .cmw-orb svg{width:17px;height:17px;color:#fff}" +
      "#cmFloatBtn .cmw-label{display:flex;flex-direction:column;align-items:flex-start;line-height:1.25}" +
      "#cmFloatBtn .cmw-label b{font-size:14px;font-weight:800}" +
      "#cmFloatBtn .cmw-label small{font-size:10.5px;font-weight:500;color:#6B6560}" +
      "#cmFloatOverlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;" +
      "background:rgba(45,42,38,.4);padding:12px}" +
      "#cmFloatOverlay.open{display:flex}" +
      "#cmFloatModal{position:relative;width:min(420px,100%);height:min(640px,88vh);background:#fff;" +
      "border-radius:20px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.2)}" +
      "#cmFloatClose{position:absolute;top:10px;left:10px;z-index:1;width:34px;height:34px;border-radius:50%;" +
      "border:1px solid #E8E0D5;background:#fff;color:#2D2A26;font-size:22px;line-height:1;cursor:pointer}" +
      "#cmFloatModal iframe{width:100%;height:100%;border:0;display:block}" +
      "@media(max-width:480px){#cmFloatBtn .cmw-label small{display:none}}" +
      "@media(prefers-reduced-motion:reduce){#cmFloatBtn{transition:none}}";
    document.head.appendChild(style);

    var btn = document.createElement("button");
    btn.id = "cmFloatBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "קטי AI — מענה רגשי מיידי");
    btn.innerHTML =
      '<span class="cmw-orb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 3a1 1 0 011 1v1.06a7.002 7.002 0 015.94 5.94H20a1 1 0 010 2h-1.06a7.002 7.002 0 01-5.94 5.94V20a1 1 0 01-2 0v-1.06a7.002 7.002 0 01-5.94-5.94H4a1 1 0 010-2h1.06A7.002 7.002 0 0111 5.06V4a1 1 0 011-1z"/>' +
      '<circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/></svg></span>' +
      '<span class="cmw-label"><b>קטי AI</b><small>מענה רגשי מיידי</small></span>';

    var overlay = document.createElement("div");
    overlay.id = "cmFloatOverlay";
    overlay.innerHTML =
      '<div id="cmFloatModal"><button id="cmFloatClose" type="button" aria-label="סגירה">×</button>' +
      '<iframe src="' + EMBED_URL + '?src=' + encodeURIComponent((location.pathname || "/") + (location.search || "")) + '" title="קטי AI — שיחה עם העוזרת הדיגיטלית"></iframe></div>';

    document.body.appendChild(btn);
    document.body.appendChild(overlay);

    function open() {
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }
    btn.addEventListener("click", open);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.getElementById("cmFloatClose").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    // קריאה נוחה מכפתורים אחרים בדף (נאב, כותרות עמודים סטטיים וכו').
    window.cmOpenBot = open;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
