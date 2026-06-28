// CureMindset — root bootstrap. Wrapped in an IIFE so it doesn't collide with
// top-level declarations in app.js / memberArea.js, which communicate via window.*.
(function () {
  "use strict";

  const { useState } = React;
  const Home = window.CureMindsetHome;
  const MemberArea = window.MemberArea;

  function App() {
    const [view, setView] = useState("home");
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
