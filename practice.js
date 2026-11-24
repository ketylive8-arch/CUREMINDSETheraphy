/* תרגול מודרך · CureMindset
   תסריטים מבוססי "Pure Mindset – סקריפטים מדויקים לבוט, חלק 1" (פתיחה יומית, כפתור חירום,
   Somatic Tracking, תהליך להרגעת כאב ב-15 שלבים, מעקב).
   פועל בלי שרת: התשובות החופשיות נשארות בזיכרון הדף בלבד. נשמרים במכשיר רק ערכי המעקב (מספרים) והמגדר. */
(function () {
  "use strict";
  var root = document.getElementById("practice");
  if (!root) return;

  var KEY = "cm_practice_v1";
  var store = { g: "f", checkins: [], log: [], runs: [] };
  try { var raw = localStorage.getItem(KEY); if (raw) store = Object.assign(store, JSON.parse(raw)); } catch (e) {}
  function logDone(m) { store.log.push({ t: Date.now(), m: m }); store.log = store.log.slice(-200); save(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }

  var state = { mod: null, i: 0, ans: {}, trail: [] };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // {נקבה|זכר}
  function G(s) {
    return s.replace(/\{([^|}]*)\|([^}]*)\}/g, function (m, f, mm) { return store.g === "m" ? mm : f; });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var SAFE_NOTE = 'אם הכאב חדש, חריף או לא מוסבר, יש לפנות לרופא. התרגול אינו תחליף לטיפול רפואי או נפשי. במצוקה חריפה: ער"ן 1201, מד"א 101.';

  /* ---------- תסריטים ---------- */
  var MODS = {};

  MODS.open = [
    { id: "o2", t: "ask", k: "other", p: ["ספר{י|} לי במשפט או שניים מה קורה. אפשר גם לדלג."] },
    { id: "o3", t: "choice", p: ["תודה ששיתפת.", "מה מתאים לך עכשיו?"],
      o: [["כפתור חירום", "emg:e1"], ["Somatic Tracking קצר", "som:s1"], ["תהליך להרגעת כאב", "pain:p0"], ["בדיקה מהירה", "check:c1"]] }
  ];

  MODS.intro = [
    { id: "i1", t: "say", p: ["ברוכים הבאים. זה מקום לתרגל בקצב שלך.", "כלי קצר שמלווה את הליווי האישי של קטי שגב, ואינו מחליף אותו."] },
    { id: "i2", t: "say", p: ["למי זה מתאים? לכל מי שמרגיש מתח, עומס או כאב שחוזר, ורוצה כלי מעשי לרגע שבו זה קורה."] },
    { id: "i3", t: "say", p: ["מי אני? קטי שגב, מטפלת רגשית ומאמנת מנטלית. את השיטה, CureMindset, בניתי מניסיון אישי."] },
    { id: "i4", t: "say", p: ["מאיפה מתחילים? בלחיצה אחת על \"כפתור חירום\" כשצריך, או בבדיקה מהירה כדי לראות איפה אתה נמצא היום."] },
    { id: "i5", t: "say", p: ["ומי זו קיריטי? העוזרת הדיגיטלית של CureMindset. היא זמינה בכל שעה, בכפתור בפינת המסך.", "{מוכנה|מוכן} להתחיל?"], last: true }
  ];

  MODS.emg = [
    { id: "e1", t: "say", p: ["אני כאן. בוא{י|} ניקח רגע אחד ביחד.", "קח{י|} נשימה אחת עמוקה פנימה... ושחרר{י|} לאט החוצה.", "עוד אחת."] },
    { id: "e2", t: "say", p: ["עכשיו רק שים{י|} לב: איפה התחושה הכי חזקה בגוף כרגע?", "אין צורך לשנות אותה. רק לראות אותה."] },
    { id: "e3", t: "wait", secs: 25, p: ["תן{י|} לעצמך עוד רגע של הסתכלות שקטה."] },
    { id: "e4", t: "choice", p: ["מה קורה לתחושה כש{את|אתה} רק {צופה|צופה} בה?"],
      o: [["היא זזה או נעשית רכה יותר", "emg:e5"], ["היא נשארת אותו דבר", "emg:e5"], ["היא חזקה יותר", "emg:e5"]] },
    { id: "e5", t: "choice", p: ["אין תשובה נכונה. רק מה שקורה.", "רוצה שאמשיך איתך לנשימות, או שנעבור לתרגיל קצר יותר ממוקד?"],
      o: [["עוד נשימות מודרכות", "breath:b1"], ["Somatic Tracking קצר", "som:s1"], ["משפט עוצמה", "emg:e6"],
          ["מיפוי מהיר של הכאב", "pain:p2"], ["רק לשבת בשקט כמה רגעים", "sit:q1"], ["סיימתי לעכשיו", "menu"]] },
    { id: "e6", t: "ask", k: "power", p: ["משפט עוצמה הוא משפט קצר שמתאר איך {את רוצה|אתה רוצה} להיות. מה המשפט שלך?", "למשל: \"אני כאן, ואני בטוח{ה|} עכשיו\". כתוב{י|} במילים שלך."] , after: "emg:e7" },
    { id: "e7", t: "say", dyn: "power", p: ["תן{י|} לעצמך לקרוא אותו לאט, ולשים לב מה קורה בגוף כש{את אומרת|אתה אומר} אותו."], after: "emg:e5" }
  ];

  MODS.breath = [
    { id: "b1", t: "breath", p: ["נשימה מודרכת: שאיפה איטית דרך האף, נשיפה ארוכה יותר דרך הפה. בלי להכריח. אם יש סחרחורת, חוזרים לנשימה טבעית."] },
    { id: "b2", t: "choice", p: ["איך זה עכשיו?"], o: [["עוד נשימות", "breath:b1"], ["Somatic Tracking קצר", "som:s1"], ["מספיק לעכשיו", "menu"]] }
  ];

  MODS.sit = [
    { id: "q1", t: "wait", secs: 120, long: true, p: ["אני כאן. אין צורך לעשות כלום.", "אפשר פשוט לשבת, לנשום, ולתת לגוף לנוח."] },
    { id: "q2", t: "end", p: ["תודה שנשארת כאן.", "אפשר לחזור בכל רגע."] }
  ];

  MODS.som = [
    { id: "s1", t: "say", p: ["במקום לנסות להעלים את התחושה, בוא{י|} רק נשים עליה תשומת לב רכה.", "אין צורך לשנות אותה. אין צורך לעשות משהו \"נכון\". רק לראות אותה."] },
    { id: "s2", t: "ask", k: "som_where", p: ["איפה היא בגוף עכשיו?", "מה הצורה שלה? היא חדה? מטושטשת? כבדה? פועמת?"] },
    { id: "s3", t: "wait", secs: 35, p: ["רק תן{י|} לה להיות שם, ו{את צופה|אתה צופה}."] },
    { id: "s4", t: "choice", p: ["מה קורה לה כש{את רק מסתכלת|אתה רק מסתכל}?", "היא זזה? נעשית רכה יותר? נשארת אותו דבר? משתנה?"],
      o: [["זזה או נעשית רכה", "som:s5"], ["נשארת אותו דבר", "som:s5"], ["משתנה", "som:s5"]] },
    { id: "s5", t: "end", p: ["אין תשובה נכונה. רק מה שקורה.", "אפשר לחזור לתרגיל הזה בכל פעם שהתחושה חוזרת."] }
  ];

  MODS.pain = [
    { id: "p0", t: "say", p: ["לפני שמתחילים, חשוב לי שתדע{י|} משהו.", SAFE_NOTE] },
    { id: "p1", t: "choice", p: ["אנחנו לא הולכים להילחם בכאב. אנחנו הולכים להקשיב למה שהמערכת שלך מנסה לעשות עבורך.", "בכל רגע אפשר לעצור, לפתוח עיניים, או לבחור \"עצירה וחזרה לתפריט\".", "{מוכנה|מוכן} להתחיל?"],
      o: [["כן, מתחילים", "pain:p2"], ["לא עכשיו", "menu"]] },
    // 2 מיפוי
    { id: "p2", t: "ask", k: "where", step: 2, p: ["בוא{י|} נמפה את הכאב ביחד.", "איפה הכאב נמצא בדיוק?"] },
    { id: "p2b", t: "ask", k: "size", step: 2, p: ["מה הגודל שלו כרגע? יש לו צורה? יש לו צבע?"] },
    { id: "p2c", t: "choice", step: 2, p: ["הוא חד או מטושטש?"], o: [["חד", "pain:p2d"], ["מטושטש", "pain:p2d"], ["משהו אחר", "pain:p2d"]], k: "sharp" },
    { id: "p2d", t: "choice", step: 2, p: ["הוא זז או קבוע במקום?"], o: [["זז", "pain:p2e"], ["קבוע", "pain:p2e"]], k: "moves" },
    { id: "p2e", t: "ask", k: "feel", step: 2, p: ["יש לו טמפרטורה? כובד? דופק? כיווץ?"] },
    { id: "p2f", t: "ask", k: "name", step: 2, p: ["אם {היית נותנת|היית נותן} לו שם, איזה שם היית נותן לו?"] },
    { id: "p2g", t: "scale", k: "pain0", step: 2, p: ["מה עוצמת הכאב עכשיו, מ-0 עד 10?"] },
    { id: "p2h", t: "reflect", step: 2, keys: [["where", "מיקום"], ["size", "גודל, צורה וצבע"], ["sharp", "חד או מטושטש"], ["moves", "תנועה"], ["feel", "תחושה"], ["name", "שם"]], p: ["זה מה ששמעתי ממך:"] },
    // 3 תת-מודליות
    { id: "p3", t: "ask", k: "change", step: 3, p: ["אם {היית יכולה|היית יכול} לשנות דבר אחד באופן שבו הכאב הזה מופיע עכשיו, מה היית רוצה לשנות?"] },
    { id: "p3b", t: "wait", secs: 20, step: 3, p: ["בוא{י|} נבדוק. מה קורה אם הוא מתרחק ממך קצת? או נעשה קטן יותר? או שהצבע משתנה?", "תן{י|} לזה כמה רגעים."] },
    { id: "p3c", t: "scale", k: "pain1", step: 3, p: ["מה קרה לעוצמה עכשיו, מ-0 עד 10?"] },
    // 4 הגנה
    { id: "p4", t: "ask", k: "protect", step: 4, p: ["עכשיו אני רוצה שננית לרגע את הרצון להיפטר מהכאב.", "נניח שהמערכת שלך לא עושה משהו נגדך. נניח שהיא מנסה לעשות משהו עבורך.", "מה לדעתך הכאב מנסה לעשות עבורך?"], note: "אפשר להשאיר ריק ולהמשיך." },
    // 5 כניסה פנימה
    { id: "p5", t: "wait", secs: 30, step: 5, p: ["בוא{י|} ניקח כמה נשימות רכות. תן{י|} לגוף להירגע בקצב שלו.", "אין צורך לחפש תשובה. רק לאפשר למערכת הפנימית להראות משהו שחשוב לדעת עכשיו."] },
    { id: "p5b", t: "choice", step: 5, p: ["אם יש משהו שהמערכת שלך רוצה להראות לך לגבי הצורך הזה בהגנה, מה עולה?"],
      o: [["דמות", "pain:p6a"], ["זיכרון או תמונה", "pain:p6b"], ["תחושה", "pain:p6b"], ["לא עלה כלום", "pain:p7"]] },
    // 6
    { id: "p6a", t: "ask", k: "person", step: 6, p: ["מי מופיע? מה {את יודעת|אתה יודע} על האדם הזה?", "מה הוא מייצג עבורך? מה {את מרגישה|אתה מרגיש} כשרואים אותו? מה התפקיד שלו עבורך?"], after: "pain:p7" },
    { id: "p6b", t: "ask", k: "arise", step: 6, p: ["מה עולה? איך זה מרגיש או נראה?", "מה זה מנסה להגיד או לעשות?"], after: "pain:p7" },
    // 7
    { id: "p7", t: "ask", k: "need", step: 7, p: ["מה הופיע? מה זה מייצג? מה האדם או החלק הזה היה צריך?", "למשל: הגנה, ובמקומה ביטחון."] },
    { id: "p7b", t: "ask", k: "know", step: 7, p: ["אם הדבר הזה הוא ביטחון, מה הגוף שלך היה צריך לדעת אז?", "ומה {את יודעת|אתה יודע} היום שלא ידעת אז?"] },
    // 8
    { id: "p8", t: "ask", k: "safe", step: 8, p: ["איך מרגישה תחושת ביטחון עבורך? איפה בגוף אפשר להרגיש אותה?", "אם {היית יכולה|היית יכול} לתת לעצמך עכשיו את הביטחון ש{היית צריכה|היית צריך} אז, איך זה היה נראה? מרגיש?"] },
    // 9
    { id: "p9", t: "ask", k: "child", step: 9, p: ["{תראי|תראה} את {הילדה|הילד} שהיית. מה {היא הייתה צריכה|הוא היה צריך} באותו רגע? מה {היא לא ידעה|הוא לא ידע} אז?",
        "ומה {את|אתה}, כפי ש{את|אתה} היום, {יכולה להגיד לה|יכול להגיד לו}?"] },
    { id: "p9b", t: "say", step: 9, p: ["{את|אתה} כבר לא שם. {את|אתה} כבר לא {אותה ילדה|אותו ילד}.", "היום יש לך יכולות ומשאבים שלא היו לך אז."] },
    // 10
    { id: "p10", t: "ask", k: "newrel", step: 10, p: ["אם הכאב כבר לא צריך להגן עליך באותה הדרך, מה קורה לו עכשיו?"] },
    { id: "p10b", t: "scale", k: "pain2", step: 10, p: ["בוא{י|} נבדוק שוב: מה עוצמת הכאב עכשיו, מ-0 עד 10?"] },
    // 11
    { id: "p11", t: "ask", k: "loop", step: 11, p: ["מה קורה כש{את חושבת|אתה חושב} על הפעם הבאה שבה בדרך כלל מופיע הכאב?",
        "מה הגוף עושה עכשיו? מה השתנה? מה היית רוצה שהגוף ילמד במקום הפחד?"] },
    // 12
    { id: "p12", t: "choice", step: 12, p: ["{דמייני|דמיין} שהמצב שבו בדרך כלל הכאב מופיע קורה עכשיו. שים{י|} לב למה שקורה בגוף.", "האם {את מחכה|אתה מחכה} לכאב, או ש{את יכולה|אתה יכול} פשוט להיות?"],
      o: [["מחכה לכאב", "pain:p12b"], ["אפשר פשוט להיות", "pain:p12b"], ["משהו באמצע", "pain:p12b"]] },
    { id: "p12b", t: "ask", k: "meet", step: 12, p: ["איך {את רוצה|אתה רוצה} לפגוש את הגוף שלך בפעם הבאה?"] },
    // 13
    { id: "p13", t: "ask", k: "sentence", step: 13, p: ["אחרי כל מה שקרה כאן, מה {את יודעת|אתה יודע} היום שלא ידעת קודם?", "כתוב{י|} משפט חדש במילים שלך. אין צורך שיהיה מושלם."] },
    // 14
    { id: "p14", t: "choice", step: 14, p: ["תן{י|} לעצמך להרגיש את התחושה הזאת עכשיו. איפה היא בגוף? מה קורה לנשימה?", "רוצה ליצור עוגן קטן שאפשר לחזור אליו?"],
      o: [["מגע", "pain:p14b"], ["מחווה", "pain:p14b"], ["מילה", "pain:p14b"], ["רק התחושה עצמה", "pain:p14b"], ["לא עכשיו", "pain:p15"]] },
    { id: "p14b", t: "say", step: 14, p: ["בחר{י|} את העוגן, וחבר{י|} אותו לתחושה הזאת: {הרגישי|הרגש} אותה, ו{עשי|עשה} את המגע, המחווה או המילה.",
        "אפשר לחזור אליו בכל רגע שצריך."] },
    // 15
    { id: "p15", t: "ask", k: "take", step: 15, p: ["מה {את לוקחת|אתה לוקח} מהתהליך הזה?", "מה השתנה ביחס שלך לגוף? ומה ביחס לכאב?"] },
    { id: "p15b", t: "ask", k: "next", step: 15, p: ["מה {תעשי|תעשה} אחרת בפעם הבאה ש{את מרגישה|אתה מרגיש} סימן של פחד?"] },
    { id: "p15c", t: "summary", step: 15, p: ["סיימנו את התהליך."] }
  ];

  MODS.check = [
    { id: "c1", t: "scale", k: "c_pain", p: ["עוצמת כאב עכשיו, מ-0 עד 10?"] },
    { id: "c2", t: "scale", k: "c_fear", p: ["פחד מהכאב?"] },
    { id: "c3", t: "scale", k: "c_safe", p: ["תחושת ביטחון?"] },
    { id: "c4", t: "scale", k: "c_alert", p: ["דריכות?"] },
    { id: "c5", t: "scale", k: "c_ctrl", p: ["תחושת שליטה?"] },
    { id: "c6", t: "checkdone", p: ["תודה. המדידה נשמרה במכשיר שלך."] }
  ];

  var PROG = { pain: 15 };

  /* ---------- מנוע ---------- */
  var live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.className = "pr-live";
  root.appendChild(live);

  var timer = null;
  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function find(mod, id) {
    var arr = MODS[mod];
    for (var k = 0; k < arr.length; k++) if (arr[k].id === id) return k;
    return 0;
  }
  function go(target) {
    clearTimer();
    if (target === "menu") return menu();
    var p = target.split(":");
    state.mod = p[0];
    state.i = find(p[0], p[1]);
    render();
  }
  function advance(step) {
    if (step.after) return go(step.after);
    var arr = MODS[state.mod];
    if (state.i + 1 < arr.length) { state.i++; render(); }
    else menu();
  }

  function frame(inner, step, extra) {
    var prog = "";
    if (step && step.step && state.mod === "pain") {
      prog = '<p class="pr-prog">שלב ' + step.step + ' מתוך ' + PROG.pain + '</p>';
    }
    return '<div class="pr-bar"><button type="button" class="btn ghost pr-emg" data-go="emg:e1">כפתור חירום</button>' +
      '<button type="button" class="btn ghost pr-stop" data-go="menu">עצירה וחזרה לתפריט</button></div>' +
      prog + inner + (extra || "");
  }

  function paras(arr) { return arr.map(function (t) { return "<p>" + esc(G(t)) + "</p>"; }).join(""); }

  function setView(html, focusSel) {
    live.innerHTML = html;
    var h = live.querySelector("[data-focus]");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: false }); }
  }

  function menu() {
    clearTimer();
    var last = store.checkins[store.checkins.length - 1];
    var hist = "";
    if (store.checkins.length) {
      var rows = store.checkins.slice(-5).reverse().map(function (c) {
        var d = new Date(c.t);
        return "<li>" + d.toLocaleDateString("he-IL") + ": כאב " + c.pain + ", פחד " + c.fear + ", ביטחון " + c.safe + ", דריכות " + c.alert + ", שליטה " + c.ctrl + "</li>";
      }).join("");
      hist = '<h2>המדידות האחרונות</h2><ul class="list">' + rows + "</ul>";
    }
    var gsel = '<fieldset class="pr-g"><legend>איך לפנות אליך?</legend>' +
      '<label><input type="radio" name="g" value="f"' + (store.g === "f" ? " checked" : "") + '> בלשון נקבה</label>' +
      '<label><input type="radio" name="g" value="m"' + (store.g === "m" ? " checked" : "") + '> בלשון זכר</label></fieldset>';
    setView(
      '<div class="pr-bar"><button type="button" class="btn ghost pr-emg" data-go="emg:e1">כפתור חירום</button></div>' +
      '<h2 data-focus>' + esc(G("היי, אני כאן איתך.")) + '</h2><p>' + esc(G("מה הכי בוער היום?")) + '</p>' +
      '<div class="pr-choices">' +
      '<button type="button" class="btn" data-go="pain:p0">כאב או פחד מהכאב</button>' +
      '<button type="button" class="btn" data-go="emg:e1">חרדה או רגש חזק</button>' +
      '<button type="button" class="btn ghost" data-go="som:s1">Somatic Tracking קצר</button>' +
      '<button type="button" class="btn ghost" data-go="check:c1">בדיקה מהירה (מעקב)</button>' +
      '<button type="button" class="btn ghost" data-go="open:o2">משהו אחר</button></div>' +
      gsel + hist + '<p><a href="/progress">למדד החוסן וההתקדמות שלי</a></p>' +
      '<p class="note" style="border:0;padding-top:12px">' + esc(SAFE_NOTE) + ' התשובות החופשיות שלך נשארות בדף בלבד ואינן נשמרות או נשלחות. נשמרים רק מספרי המדידה, במכשיר שלך.</p>');
  }

  function render() {
    var step = MODS[state.mod][state.i];
    var html = "";
    var key = step.k;
    var q = (step.p || []).slice();
    if (step.dyn === "power" && state.ans.power) q.unshift('"' + state.ans.power + '"');
    if (step.id === "e5") logDone("emg");
    if (step.id === "b2") logDone("breath");
    if (step.id === "s5") logDone("som");
    if (step.id === "q2") logDone("sit");
    if (step.last) { store.seen = 1; save(); }
    if (step.t === "say") {
      html = frame('<div data-focus>' + paras(q) + '</div><div class="btns"><button class="btn" data-next>המשך</button></div>', step);
    } else if (step.t === "ask") {
      html = frame('<div data-focus>' + paras(q) + (step.note ? '<p class="note" style="border:0;padding:0">' + esc(step.note) + "</p>" : "") + '</div>' +
        '<label class="pr-lbl" for="pr-in">התשובה שלך (לא חובה, ונשארת בדף בלבד)</label><textarea id="pr-in" rows="3">' + esc(state.ans[key] || "") + '</textarea>' +
        '<div class="btns"><button class="btn" data-next>המשך</button></div>', step);
    } else if (step.t === "choice") {
      var opts = step.o.map(function (o) { return '<button type="button" class="btn ghost" data-pick="' + esc(o[1]) + '" data-label="' + esc(o[0]) + '">' + esc(G(o[0])) + "</button>"; }).join("");
      html = frame('<div data-focus>' + paras(q) + '</div><div class="pr-choices">' + opts + "</div>", step);
    } else if (step.t === "scale") {
      var v = state.ans[key] != null ? state.ans[key] : 5;
      html = frame('<div data-focus>' + paras(q) + '</div><label class="pr-lbl" for="pr-rng">מ-0 (כלום) עד 10 (הכי חזק): <b id="pr-val">' + v + '</b></label>' +
        '<input id="pr-rng" type="range" min="0" max="10" step="1" value="' + v + '"><div class="btns"><button class="btn" data-next>המשך</button></div>', step);
    } else if (step.t === "wait" || step.t === "breath") {
      html = frame('<div data-focus>' + paras(q) + '</div>' +
        (step.t === "breath" ? '<div class="pr-breath" aria-hidden="true"><span id="pr-bl">שאיפה</span></div><p class="pr-cnt">שאיפה ארבע שניות, נשיפה שש שניות.</p>' :
          '<p class="pr-cnt">אפשר להמשיך מתי שנוח: <span id="pr-t">' + step.secs + '</span> שניות</p>') +
        '<div class="btns"><button class="btn" data-next>' + esc(G("{אני מוכנה|אני מוכן} להמשיך")) + "</button></div>", step);
    } else if (step.t === "reflect") {
      var li = step.keys.filter(function (kk) { return state.ans[kk[0]]; }).map(function (kk) { return "<li><b>" + kk[1] + ":</b> " + esc(state.ans[kk[0]]) + "</li>"; }).join("");
      html = frame('<div data-focus>' + paras(q) + (li ? '<ul class="list">' + li + "</ul>" : "<p>לא נכתבו תשובות, וזה בסדר.</p>") + '</div><div class="btns"><button class="btn" data-next>המשך</button></div>', step);
    } else if (step.t === "summary") {
      var a = state.ans, line = "";
      logDone("pain");
      if (a.pain0 != null && a.pain2 != null) { store.runs.push({ t: Date.now(), p0: a.pain0, p2: a.pain2 }); store.runs = store.runs.slice(-50); save(); }
      if (a.pain0 != null && a.pain2 != null) line = "<p>עוצמת הכאב בתחילה: <b>" + a.pain0 + "</b>. עכשיו: <b>" + a.pain2 + "</b>.</p>";
      if (a.sentence) line += '<p>המשפט שלך: <b>"' + esc(a.sentence) + '"</b></p>';
      html = frame('<div data-focus>' + paras(q) + line + "</div>" +
        '<p>מומלץ לסיים בבדיקה מהירה, כדי לראות איך זה משתנה לאורך זמן.</p><div class="btns"><button class="btn" data-go="check:c1">לבדיקה מהירה</button><button class="btn ghost" data-go="menu">לתפריט</button></div>', step);
    } else if (step.t === "checkdone") {
      var c = state.ans;
      store.checkins.push({ t: Date.now(), pain: c.c_pain, fear: c.c_fear, safe: c.c_safe, alert: c.c_alert, ctrl: c.c_ctrl });
      store.checkins = store.checkins.slice(-30); logDone("check");
      html = frame('<div data-focus>' + paras(q) + '</div><div class="btns"><button class="btn" data-go="menu">לתפריט</button></div>', step);
    } else if (step.t === "end") {
      html = frame('<div data-focus>' + paras(q) + '</div><div class="btns"><button class="btn" data-go="menu">לתפריט</button></div>', step);
    }
    setView(html);
    bind(step);
  }

  function bind(step) {
    var nextBtn = live.querySelector("[data-next]");
    if (nextBtn) nextBtn.addEventListener("click", function () {
      var inp = live.querySelector("#pr-in"), rng = live.querySelector("#pr-rng");
      if (inp && step.k) state.ans[step.k] = inp.value.trim();
      if (rng && step.k) state.ans[step.k] = +rng.value;
      advance(step);
    });
    var rng = live.querySelector("#pr-rng");
    if (rng) rng.addEventListener("input", function () { live.querySelector("#pr-val").textContent = rng.value; });
    Array.prototype.forEach.call(live.querySelectorAll("[data-pick]"), function (b) {
      b.addEventListener("click", function () {
        if (step.k) state.ans[step.k] = b.getAttribute("data-label");
        go(b.getAttribute("data-pick"));
      });
    });
    if (step.t === "wait") {
      var s = step.secs, el = live.querySelector("#pr-t");
      timer = setInterval(function () { s--; if (el) el.textContent = Math.max(s, 0); if (s <= 0) clearTimer(); }, 1000);
    }
    if (step.t === "breath") {
      var el2 = live.querySelector("#pr-bl"), circle = live.querySelector(".pr-breath"), ph = 0;
      function tick() {
        var inh = ph % 10 < 4;
        if (el2) el2.textContent = inh ? "שאיפה" : "נשיפה";
        if (circle) circle.className = "pr-breath " + (reduce ? "" : (inh ? "in" : "out"));
        ph = (ph + 1) % 10;
      }
      tick(); timer = setInterval(tick, 1000);
    }
  }

  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-go]");
    if (b) { go(b.getAttribute("data-go")); return; }
  });
  root.addEventListener("change", function (e) {
    if (e.target.name === "g") { store.g = e.target.value; save(); menu(); var r = root.querySelector('input[name=g]:checked'); if (r) r.focus(); }
  });

  var DEEP = { pain: "pain:p0", emergency: "emg:e1", som: "som:s1", check: "check:c1", breath: "breath:b1" };
  var hsh = (location.hash || "").replace("#", "");
  if (DEEP[hsh]) go(DEEP[hsh]); else if (!store.seen) go("intro:i1"); else menu();
  window.addEventListener("hashchange", function () { var k = (location.hash || "").replace("#", ""); if (DEEP[k]) go(DEEP[k]); });
})();
