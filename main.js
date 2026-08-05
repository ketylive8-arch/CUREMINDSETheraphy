// CureMindset — root bootstrap. Wrapped in an IIFE so it doesn't collide with
// top-level declarations in app.js / memberArea.js, which communicate via window.*.
(function () {
  "use strict";

  const { useState } = React;
  const Home = window.CureMindsetHome;
  const MemberArea = window.MemberArea;

  function App() {
    // אם המשתמש חזר זה עתה מהתחברות חברתית (Google/Facebook) — נפתח מחובר לאזור האישי.
    const [view, setView] = useState(window.__cmOpenApp ? "app" : "home");
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
