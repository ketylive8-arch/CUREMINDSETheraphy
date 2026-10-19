(function () {
  "use strict";
  if (window.__cmA11yInit) return;
  window.__cmA11yInit = true;

  var STORAGE_KEY = "cmA11yPrefs";
  var defaults = { fontStep: 0, contrast: false, underline: false, readable: false, noMotion: false, grayscale: false };

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, defaults);
      var parsed = JSON.parse(raw);
      return Object.assign({}, defaults, parsed);
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  function savePrefs(prefs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  var prefs = loadPrefs();

  var css =
    "#cmA11yBtn{position:fixed;bottom:18px;right:18px;z-index:9997;width:48px;height:48px;border-radius:50%;" +
    "background:#2D2A26;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;" +
    "box-shadow:0 6px 18px rgba(0,0,0,.25);font-size:22px;}" +
    "#cmA11yBtn:hover{background:#44403a}" +
    "#cmA11yPanel{position:fixed;bottom:76px;right:18px;z-index:9997;width:280px;max-width:calc(100vw - 36px);" +
    "background:#fff;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.25);padding:16px;display:none;" +
    "font-family:Assistant,Arial,sans-serif;color:#2D2A26;direction:rtl;max-height:70vh;overflow:auto}" +
    "#cmA11yPanel.open{display:block}" +
    "#cmA11yPanel h2{font-size:16px;margin:0 0 10px;font-family:Rubik,Assistant,sans-serif;font-weight:700}" +
    "#cmA11yPanel button.cm-a11y-opt{display:flex;align-items:center;gap:8px;width:100%;text-align:right;" +
    "background:#F7F3EC;border:1px solid #E8E0D5;border-radius:10px;padding:10px 12px;margin:0 0 8px;cursor:pointer;" +
    "font-size:14px;color:#2D2A26;font-family:Assistant,Arial,sans-serif}" +
    "#cmA11yPanel button.cm-a11y-opt[aria-pressed='true']{background:#C9A96E;color:#fff;border-color:#C9A96E}" +
    "#cmA11yPanel button.cm-a11y-opt:focus-visible,#cmA11yBtn:focus-visible{outline:3px solid #C9A96E;outline-offset:2px}" +
    "#cmA11yReset{width:100%;text-align:center;background:none;border:none;color:#8a6a2f;text-decoration:underline;" +
    "cursor:pointer;font-size:13px;padding:6px 0 0}" +
    "html.cm-a11y-contrast{filter:invert(1) hue-rotate(180deg)}" +
    "html.cm-a11y-contrast img,html.cm-a11y-contrast video,html.cm-a11y-contrast svg,html.cm-a11y-contrast iframe," +
    "html.cm-a11y-contrast picture{filter:invert(1) hue-rotate(180deg)}" +
    "html.cm-a11y-underline a{text-decoration:underline !important}" +
    "html.cm-a11y-readable, html.cm-a11y-readable *{font-family:Arial,Helvetica,sans-serif !important;letter-spacing:.02em}" +
    "html.cm-a11y-grayscale{filter:grayscale(1)}" +
    "html.cm-a11y-nomotion *{animation:none !important;transition:none !important;scroll-behavior:auto !important}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement("button");
  btn.id = "cmA11yBtn";
  btn.type = "button";
  btn.setAttribute("aria-label", "אפשרויות נגישות");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = "&#9855;";

  var panel = document.createElement("div");
  panel.id = "cmA11yPanel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "אפשרויות נגישות");
  panel.innerHTML =
    "<h2>נגישות</h2>" +
    "<button type=\"button\" class=\"cm-a11y-opt\" data-action=\"fontUp\">הגדלת טקסט (A+)</button>" +
    "<button type=\"button\" class=\"cm-a11y-opt\" data-action=\"fontDown\">הקטנת טקסט (A-)</button>" +
    "<button type=\"button\" class=\"cm-a11y-opt\" data-action=\"contrast\">ניגודיות גבוהה</button>" +
    "<button type=\"button\" class=\"cm-a11y-opt\" data-action=\"underline\">הדגשת קישורים</button>" +
    "<button type=\"button\" class=\"cm-a11y-opt\" data-action=\"readable\">פונט קריא</button>" +
    "<button type=\"button\" class=\"cm-a11y-opt\" data-action=\"grayscale\">גווני אפור</button>" +
    "<button type=\"button\" class=\"cm-a11y-opt\" data-action=\"noMotion\">עצירת אנימציות</button>" +
    "<button type=\"button\" id=\"cmA11yReset\">איפוס הגדרות</button>" +
    "<p style=\"font-size:11.5px;color:#6B6560;margin:10px 0 0\">נתקלתם בבעיית נגישות? <a href=\"/accessibility\" style=\"color:#8a6a2f\">הצהרת הנגישות שלנו</a></p>";

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var FONT_STEP_PX = 1;
  var MAX_STEP = 4;
  var MIN_STEP = -2;

  function applyFontStep(step) {
    var zoom = (1 + step * 0.1).toFixed(2);
    document.body.style.zoom = step === 0 ? "" : zoom;
  }

  function render() {
    applyFontStep(prefs.fontStep);
    document.documentElement.classList.toggle("cm-a11y-contrast", !!prefs.contrast);
    document.documentElement.classList.toggle("cm-a11y-underline", !!prefs.underline);
    document.documentElement.classList.toggle("cm-a11y-readable", !!prefs.readable);
    document.documentElement.classList.toggle("cm-a11y-grayscale", !!prefs.grayscale);
    document.documentElement.classList.toggle("cm-a11y-nomotion", !!prefs.noMotion);

    var map = {
      contrast: "contrast", underline: "underline", readable: "readable",
      grayscale: "grayscale", noMotion: "noMotion"
    };
    Array.prototype.forEach.call(panel.querySelectorAll(".cm-a11y-opt"), function (b) {
      var action = b.getAttribute("data-action");
      if (map[action]) {
        b.setAttribute("aria-pressed", prefs[map[action]] ? "true" : "false");
      }
    });
  }

  panel.addEventListener("click", function (e) {
    var b = e.target.closest(".cm-a11y-opt");
    if (!b) return;
    var action = b.getAttribute("data-action");
    if (action === "fontUp") prefs.fontStep = Math.min(MAX_STEP, prefs.fontStep + 1);
    else if (action === "fontDown") prefs.fontStep = Math.max(MIN_STEP, prefs.fontStep - 1);
    else if (action === "contrast") prefs.contrast = !prefs.contrast;
    else if (action === "underline") prefs.underline = !prefs.underline;
    else if (action === "readable") prefs.readable = !prefs.readable;
    else if (action === "grayscale") prefs.grayscale = !prefs.grayscale;
    else if (action === "noMotion") prefs.noMotion = !prefs.noMotion;
    savePrefs(prefs);
    render();
  });

  document.getElementById("cmA11yReset").addEventListener("click", function () {
    prefs = Object.assign({}, defaults);
    savePrefs(prefs);
    render();
  });

  btn.addEventListener("click", function () {
    var open = panel.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", function (e) {
    if (!panel.contains(e.target) && e.target !== btn && panel.classList.contains("open")) {
      panel.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      panel.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }
  });

  render();
})();
