/* מדד חוסן והתקדמות אישי · CureMindset
   קומפוננטת React (בלי build). קוראת רק את הנתונים שהכלי "תרגול מודרך" שמר במכשיר (cm_practice_v1):
   מדידות מספריות, תאריכי תרגול וסוגי תרגול. שום תוכן אישי לא נשמר ולא נשלח.
   מה שמוצג מחושב מהנתונים האמיתיים בלבד; אין נתוני דוגמה. */
(function () {
  "use strict";
  var mount = document.getElementById("progress");
  if (!mount || !window.React || !window.ReactDOM) return;
  var h = React.createElement, useState = React.useState;
  var DAY = 86400000;

  function load() {
    var s = { g: "f", checkins: [], log: [], runs: [] };
    try { var r = localStorage.getItem("cm_practice_v1"); if (r) s = Object.assign(s, JSON.parse(r)); } catch (e) {}
    return s;
  }
  function G(s, g) { return s.replace(/\{([^|}]*)\|([^}]*)\}/g, function (m, f, mm) { return g === "m" ? mm : f; }); }
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }
  function r1(n) { return Math.round(n * 10) / 10; }

  var LEVEL = function (v) { return v >= 8 ? "חזקה" : v >= 6 ? "בינונית" : "קלה"; };

  function analyze(s, now) {
    var wk = s.checkins.filter(function (c) { return c.t >= now - 7 * DAY; });
    var allAct = s.log.map(function (x) { return x.t; }).concat(s.checkins.map(function (c) { return c.t; }));
    var last = allAct.length ? Math.max.apply(null, allAct) : null;
    var daysSince = last ? Math.floor((now - last) / DAY) : null;
    var hasData = allAct.length > 0;

    // 1. אתגרים פעילים
    var triggers = [];
    if (wk.length) {
      var dims = [
        ["pain", "כאב", true, "/practice#pain", "להרגעת הכאב"],
        ["fear", "פחד מהכאב", true, "/practice#som", "ל-Somatic Tracking קצר"],
        ["alert", "דריכות", true, "/practice#breath", "לנשימה מודרכת"],
        ["safe", "תחושת ביטחון", false, "/practice#pain", "לבניית עוגן ביטחון"],
        ["ctrl", "תחושת שליטה", false, "/practice#som", "לתרגול עם התחושה"]
      ];
      dims.forEach(function (d) {
        var vals = wk.map(function (c) { return c[d[0]]; }).filter(function (v) { return v != null; });
        var a = avg(vals); if (a == null) return;
        var hard = d[2] ? a >= 6 : a <= 4;
        if (!hard) return;
        var inten = d[2] ? a : 10 - a;
        var prev = null, status = "במעקב";
        if (vals.length >= 2) {
          var diff = vals[vals.length - 1] - vals[0];
          var better = d[2] ? diff < 0 : diff > 0;
          status = diff === 0 ? "יציב" : better ? "בהקלה" : "דורש תשומת לב";
        }
        triggers.push({ name: d[1], avg: r1(a), level: LEVEL(inten), status: status, href: d[3], cta: d[4], hard: d[2] });
      });
      var ev = wk.filter(function (c) { return new Date(c.t).getHours() >= 18; });
      var dayc = wk.filter(function (c) { return new Date(c.t).getHours() < 18; });
      if (ev.length >= 2 && dayc.length >= 1) {
        var ea = avg(ev.map(function (c) { return (c.alert + c.fear) / 2; })), da = avg(dayc.map(function (c) { return (c.alert + c.fear) / 2; }));
        if (ea - da >= 1) triggers.unshift({ name: "עומס מוגבר סביב שעות הערב", avg: r1(ea), level: LEVEL(ea), status: "במעקב", href: "/practice#breath", cta: "לנשימה מודרכת לערב", hard: true });
      }
    }

    // 2. דפוסים
    var patterns = [];
    if (wk.length >= 2) {
      var gap = avg(wk.map(function (c) { return c.fear - c.pain; }));
      if (gap >= 2) patterns.push({ t: "נראה שהפחד מהכאב גדול מהכאב עצמו", p: "כשהפחד גבוה, הגוף נשאר דרוך. אפשר לעבוד ישירות על היחס לתחושה.", href: "/practice#pain", cta: "להפעלת התהליך להרגעת כאב" });
      var ctrl = avg(wk.map(function (c) { return c.ctrl; }));
      if (ctrl <= 4) patterns.push({ t: "קושי להרגיש שליטה כשהעומס עולה", p: "תרגול קצר של התבוננות בתחושה בונה בהדרגה תחושת שליטה.", href: "/practice#som", cta: "ל-Somatic Tracking קצר" });
      var al = avg(wk.map(function (c) { return c.alert; })), sf = avg(wk.map(function (c) { return c.safe; }));
      if (al >= 6 && sf <= 5) patterns.push({ t: "דריכות גבוהה גם ברגעים שאין בהם סכנה", p: "אפשר ללמד את הגוף מחדש מה זה ביטחון.", href: "/practice#pain", cta: "לבניית עוגן ביטחון" });
    }
    var emgWk = s.log.filter(function (x) { return x.m === "emg" && x.t >= now - 7 * DAY; }).length;
    if (emgWk >= 3) patterns.push({ t: "פנית שלוש פעמים או יותר לכפתור החירום השבוע", p: "אפשר לעבוד על מה שחוזר, ולא רק לעבור את הרגע.", href: "/practice#pain", cta: "להפעלת התהליך להרגעת כאב" });

    // 3. איזון
    var balance = [];
    if (hasData && daysSince >= 3) balance.push({ t: "עברו " + daysSince + " ימים מהתרגול האחרון", p: "גם דקה אחת של נשימה מחזירה אותך לקצב.", href: "/practice#breath", cta: "לדקת נשימה" });
    var hasWkCheck = wk.length > 0;
    if (hasData && !hasWkCheck) balance.push({ t: "לא נעשתה בדיקה מהירה בשבוע האחרון", p: "הבדיקה לוקחת פחות מדקה ומאפשרת לראות את השינוי.", href: "/practice#check", cta: "לבדיקה מהירה" });
    var night = s.log.concat(s.checkins.map(function (c) { return { t: c.t }; })).filter(function (x) { var hr = new Date(x.t).getHours(); return x.t >= now - 7 * DAY && (hr >= 23 || hr < 4); }).length;
    if (night >= 1) balance.push({ t: "זוהתה פעילות בשעות הלילה המאוחרות", p: "לפעמים זה סימן לחוסר שקט. נשימה איטית לפני השינה יכולה לעזור.", href: "/practice#breath", cta: "לנשימה מודרכת" });

    // 4. הצלחות
    var wins = [];
    var wkLog = s.log.filter(function (x) { return x.t >= now - 7 * DAY; });
    var count = function (m) { return wkLog.filter(function (x) { return x.m === m; }).length; };
    var total = wkLog.length;
    if (total) wins.push({ big: total, t: total === 1 ? "תרגול אחד הושלם השבוע" : total + " תרגולים הושלמו השבוע" });
    if (count("som")) wins.push({ big: count("som"), t: "פעמים שהתבוננת בתחושה בלי להילחם בה" });
    if (count("breath")) wins.push({ big: count("breath"), t: "סבבי נשימה מודרכת" });
    if (count("pain")) wins.push({ big: count("pain"), t: "תהליכי הרגעת כאב שהסתיימו" });
    if (s.runs.length) {
      var run = s.runs[s.runs.length - 1];
      if (run.p0 > 0 && run.p2 < run.p0) wins.unshift({ big: Math.round((run.p0 - run.p2) / run.p0 * 100) + "%", t: "ירידה בעוצמת הכאב בתהליך האחרון, מ-" + run.p0 + " ל-" + run.p2 });
    }
    var cs = s.checkins.slice(-14);
    if (cs.length >= 2) {
      var f = cs[0], l = cs[cs.length - 1];
      if (l.fear < f.fear) wins.push({ big: f.fear + "→" + l.fear, t: "הפחד מהכאב ירד בין המדידה הראשונה לאחרונה" });
      if (l.safe > f.safe) wins.push({ big: f.safe + "→" + l.safe, t: "תחושת הביטחון עלתה" });
      if (l.ctrl > f.ctrl) wins.push({ big: f.ctrl + "→" + l.ctrl, t: "תחושת השליטה התחזקה" });
    }
    var days = {}; allAct.forEach(function (t) { days[new Date(t).toDateString()] = 1; });
    var streak = 0; for (var i = 0; i < 60; i++) { if (days[new Date(now - i * DAY).toDateString()]) streak++; else if (i > 0) break; else if (i === 0) continue; }
    if (streak >= 2) wins.push({ big: streak, t: "ימים רצופים של תרגול" });

    var balanced = hasData && daysSince !== null && daysSince < 3 && hasWkCheck && !triggers.some(function (x) { return x.hard; }) && night === 0 && wkLog.length >= 1;
    return { hasData: hasData, triggers: triggers, patterns: patterns, balance: balance, wins: wins, balanced: balanced };
  }

  function Star() {
    return h("svg", { className: "pg-star", viewBox: "0 0 64 64", width: 64, height: 64, "aria-hidden": "true" },
      h("defs", null, h("linearGradient", { id: "gld", x1: "0", y1: "0", x2: "1", y2: "1" },
        h("stop", { offset: "0", stopColor: "#E6C679" }), h("stop", { offset: "1", stopColor: "#B8892F" }))),
      h("path", { d: "M32 4l7.6 17.2 18.6 1.8-14 12.6 4 18.4L32 43.8 15.8 54l4-18.4-14-12.6 18.6-1.8z", fill: "url(#gld)" }));
  }

  function Act(p) { return h("a", { className: "btn pg-act", href: p.href }, p.text); }

  function App() {
    var st = useState(load()), s = st[0], setS = st[1];
    var g = s.g, now = Date.now(), A = analyze(s, now), T = function (x) { return G(x, g); };

    if (!A.hasData) return h("div", { className: "pg" },
      h("section", { className: "pg-sec" }, h("h2", null, "המדד שלך מתחיל כאן"),
        h("p", null, T("אחרי הבדיקה המהירה הראשונה והתרגול הראשון, יופיעו כאן ההצלחות והשינויים שלך. הכול מחושב מהמדידות שלך בלבד, ונשאר במכשיר שלך.")),
        h("div", { className: "btns" }, h("a", { className: "btn", href: "/practice#check" }, "לבדיקה מהירה"), h("a", { className: "btn ghost", href: "/practice" }, "לתרגול מודרך"))));

    var wins = h("section", { className: "pg-wins", "aria-labelledby": "w-h" },
      h("div", { className: "wrap" },
        h(Star), h("h2", { id: "w-h" }, "ההצלחות ופריצות הדרך שלי"),
        A.wins.length ? h("ul", { className: "pg-winlist" }, A.wins.map(function (w, i) {
          return h("li", { key: i }, h("b", null, w.big), h("span", null, w.t));
        })) : h("p", null, T("הניצחון הראשון קרוב: תרגול אחד קצר, והוא יופיע כאן.")),
        h("p", { className: "pg-small" }, "אלה מספרים מהמדידות והתרגולים שלך בלבד, ולא אבחון.")));

    var bal = A.balanced ? h("section", { className: "pg-medal" }, h("div", { className: "wrap" }, h(Star),
      h("h2", null, T("המערכת הרגשית שלך באיזון ובוויסות. {את|אתה} במסלול הצמיחה!")),
      h("p", null, "תרגלת, בדקת, והמדדים שלך יציבים. כך ממשיכים."))) : null;

    var tr = h("section", { className: "pg-sec" }, h("h2", null, "אתגרים פעילים בלמידה"),
      A.triggers.length ? A.triggers.map(function (x, i) {
        return h("div", { className: "pg-row", key: i },
          h("div", null, h("h3", null, x.name), h("p", null, "עוצמה " + x.level + " (ממוצע " + x.avg + " מתוך 10 בשבוע האחרון)."),
            h("span", { className: "pg-pill" }, x.status)),
          h(Act, { href: x.href, text: x.cta }));
      }) : h("p", null, "בשבוע האחרון לא זוהה אזור עם עומס גבוה. יפה."));

    var pt = A.patterns.length ? h("section", { className: "pg-sec" }, h("h2", null, "דפוסי חשיבה ששמנו לב אליהם"),
      A.patterns.map(function (x, i) {
        return h("div", { className: "pg-row", key: i }, h("div", null, h("h3", null, x.t), h("p", null, x.p)), h(Act, { href: x.href, text: x.cta }));
      })) : null;

    var bl = A.balance.length ? h("section", { className: "pg-sec" }, h("h2", null, "חריגות מהשגרה"),
      A.balance.map(function (x, i) {
        return h("div", { className: "pg-row", key: i }, h("div", null, h("h3", null, x.t), h("p", null, x.p)), h(Act, { href: x.href, text: x.cta }));
      })) : null;

    var reset = h("section", { className: "pg-sec" },
      h("p", { className: "pg-small" }, "הנתונים נשמרים רק בדפדפן של המכשיר הזה. אם במצוקה חריפה: ער\"ן 1201, מד\"א 101."),
      h("button", { type: "button", className: "btn ghost", onClick: function () {
        if (window.confirm("למחוק את כל נתוני המעקב מהמכשיר הזה?")) { try { localStorage.removeItem("cm_practice_v1"); } catch (e) {} setS(load()); }
      } }, "מחיקת הנתונים מהמכשיר"));

    return h("div", { className: "pg" }, bal, wins, h("div", { className: "wrap" }, tr, pt, bl, reset));
  }

  ReactDOM.createRoot(mount).render(h(App));
})();
