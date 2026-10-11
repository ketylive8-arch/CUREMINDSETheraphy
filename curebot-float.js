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
      "#cmFloatBtn{position:fixed;bottom:18px;left:18px;z-index:9998;display:flex;align-items:center;gap:8px;" +
      "background:linear-gradient(135deg,#c2974a,#a9791f);color:#fff;border:0;border-radius:999px;" +
      "padding:13px 20px 13px 16px;font-family:Rubik,Assistant,Arial,sans-serif;font-weight:700;font-size:14.5px;" +
      "cursor:pointer;box-shadow:0 10px 28px -8px rgba(138,106,47,.55);transition:transform .2s}" +
      "#cmFloatBtn:hover{transform:translateY(-2px)}" +
      "#cmFloatBtn svg{width:19px;height:19px;flex-shrink:0}" +
      "#cmFloatOverlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;" +
      "background:rgba(26,23,20,.45);padding:12px}" +
      "#cmFloatOverlay.open{display:flex}" +
      "#cmFloatModal{position:relative;width:min(420px,100%);height:min(640px,88vh);background:#fff;" +
      "border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.25)}" +
      "#cmFloatClose{position:absolute;top:10px;left:10px;z-index:1;width:34px;height:34px;border-radius:50%;" +
      "border:0;background:rgba(255,255,255,.92);color:#2D2A26;font-size:22px;line-height:1;cursor:pointer;" +
      "box-shadow:0 1px 4px rgba(0,0,0,.2)}" +
      "#cmFloatModal iframe{width:100%;height:100%;border:0;display:block}" +
      "@media(max-width:480px){#cmFloatBtn span{display:none}#cmFloatBtn{padding:14px;border-radius:50%}}";
    document.head.appendChild(style);

    var btn = document.createElement("button");
    btn.id = "cmFloatBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "יש שאלה? דברי עם העוזרת של קטי");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2 2-2.5 3.5"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>' +
      "<span>יש שאלה? דברי איתי</span>";

    var overlay = document.createElement("div");
    overlay.id = "cmFloatOverlay";
    overlay.innerHTML =
      '<div id="cmFloatModal"><button id="cmFloatClose" type="button" aria-label="סגירה">×</button>' +
      '<iframe src="' + EMBED_URL + '" title="שיחה עם העוזרת של קטי שגב"></iframe></div>';

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
