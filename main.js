// CureMindset — root bootstrap. Wrapped in an IIFE so it doesn't collide with
// top-level declarations in app.js / memberArea.js, which communicate via window.*.
(function () {
  "use strict";

  const { useState, useEffect } = React;
  const Home = window.CureMindsetHome;
  const MemberArea = window.MemberArea;

  // מסיר את מסך הטעינה הממותג ברגע ש-React עלה (התוכן האמיתי מוכן).
  function hideSplash() {
    const s = document.getElementById("cm-splash");
    if (!s) return;
    s.classList.add("cm-hide");
    setTimeout(function () { if (s && s.parentNode) s.parentNode.removeChild(s); }, 650);
  }

  // כתובות שמטרתן היחידה היא לפתוח את האזור האישי ישר — כל כפתור "להתחיל ניסיון חינם"
  // בדפים הסטטיים (programs.html, faq.html, contact.html, workshop-*.html וכו') מצביע
  // ל-/program, שדרכו הם היחידה "להיכנס" לאפליקציה מחוץ לדף הבית עצמו.
  const APP_ENTRY_PATHS = ["/program", "/dashboard"];

  function App() {
    // אם המשתמש חזר זה עתה מהתחברות חברתית (Google/Facebook), או נחת ישירות על כתובת
    // כניסה לאפליקציה — נפתח ישר לאזור האישי.
    const [view, setView] = useState(
      window.__cmOpenApp || APP_ENTRY_PATHS.includes(location.pathname) ? "app" : "home"
    );
    useEffect(hideSplash, []);
    return (
      <React.Fragment>
        <Home onEnterApp={() => setView("app")} />
        {view === "app" ? <MemberArea onExit={() => setView("home")} /> : null}
      </React.Fragment>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(<App />);
})();
