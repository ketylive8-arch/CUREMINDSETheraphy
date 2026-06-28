// CureMindset — Member Area / personal protocol app (Babel-in-browser).
// Wrapped in an IIFE so top-level declarations never collide with app.js's globals;
// communication with app.js happens only through window.* (Icon, Button, CONTACT).
(function () {
  "use strict";

  const { useState, useEffect } = React;
  const Icon = window.Icon;
  const Button = window.Button;
  const ResilienceDashboard = window.ResilienceDashboard;

  /* ---------------------------------------------------------------- */
  /* Persistence                                                       */
  /* ---------------------------------------------------------------- */

  const PROGRESS_KEY = "cm_protocol_progress";
  const SESSIONS_KEY = "cm_grounding_sessions";

  function loadProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      return { unlocked: raw && raw.unlocked ? raw.unlocked : 1, completed: (raw && raw.completed) || [] };
    } catch (e) {
      return { unlocked: 1, completed: [] };
    }
  }

  function saveProgress(progress) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {}
  }

  function loadSessions() {
    try {
      return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveSession(score) {
    try {
      const list = loadSessions();
      list.push({ date: new Date().toISOString(), score });
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(-30)));
      return list;
    } catch (e) {
      return [];
    }
  }

  /* ---------------------------------------------------------------- */
  /* Stage metadata                                                    */
  /* ---------------------------------------------------------------- */

  const STAGES = [
    { id: 1, icon: "anchor", title: "עוגן", subtitle: "יצירת יציבות ראשונית ועוגן רגשי" },
    { id: 2, icon: "compass", title: "גבול ההבחנה", subtitle: "הפרדה בין רגש, מחשבה ומציאות" },
    { id: 3, icon: "footprints", title: "קרקוע", subtitle: "חזרה לגוף ולכאן ועכשיו" },
    { id: 4, icon: "sparkles", title: "מדד חוסן", subtitle: "השיקוף האישי שלך", alwaysUnlocked: true },
  ];

  /* ---------------------------------------------------------------- */
  /* Shared bits                                                       */
  /* ---------------------------------------------------------------- */

  function Field({ icon, label, value, onChange, placeholder, textarea }) {
    const inputClass =
      "w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300";
    return (
      <label className="block">
        <span className="flex items-center gap-2 mb-2 text-[13px] font-heading font-semibold text-ink-700">
          {icon ? <Icon name={icon} size={16} className="text-gold-600 shrink-0" /> : null}
          {label}
        </span>
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={`${inputClass} resize-none`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClass}
          />
        )}
      </label>
    );
  }

  function Chip({ active, onClick, children }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3.5 py-2 rounded-full text-[13px] font-heading font-semibold border transition-colors ${
          active ? "bg-gold-500 text-white border-gold-500" : "bg-white text-ink-600 border-ink-200 hover:border-gold-300"
        }`}
      >
        {children}
      </button>
    );
  }

  function StepDots({ total, current }) {
    return (
      <div className="flex items-center justify-center gap-1.5 mb-5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i + 1 === current ? "w-6 bg-gold-500" : "w-1.5 bg-ink-200"}`}
          />
        ))}
      </div>
    );
  }

  function BreathingOrb({ label }) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="cm-breathe w-24 h-24 rounded-full bg-gradient-to-br from-gold-200 to-gold-400 shadow-soft flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/70" />
        </div>
        {label ? <p className="mt-4 text-[13px] text-ink-500 text-center">{label}</p> : null}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 1 — Anchoring                                                */
  /* ---------------------------------------------------------------- */

  function AnchorStage({ onComplete }) {
    const [anchorWord, setAnchorWord] = useState("");
    const canContinue = anchorWord.trim().length >= 2;
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">בניית עוגן רגשי</h3>
          <p className="text-[14px] text-ink-600 leading-relaxed">
            לפני שמתחילים תהליך, חשוב לבנות עוגן אחד יציב — תחושה, מילה או נשימה שאפשר לחזור אליה בכל רגע שמרגישים גודש.
          </p>
        </div>
        <BreathingOrb label="נשמו לאט: שאיפה ל-4 שניות, נשיפה ל-6 שניות. עקבו אחרי קצב העיגול." />
        <Field
          icon="anchor"
          label="המילה או התחושה שמייצגת עבורך יציבות"
          value={anchorWord}
          onChange={setAnchorWord}
          placeholder="לדוגמה: 'אני יציב/ה', 'שורש', 'בית'"
        />
        <Button
          as="button"
          type="button"
          variant="primary"
          className="w-full"
          icon="arrow-left"
          iconPos="end"
          disabled={!canContinue}
          onClick={() => canContinue && onComplete(anchorWord.trim())}
          style={!canContinue ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
        >
          השלמתי את העוגן · למעבר לשלב הבא
        </Button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 2 — Differentiation Border                                  */
  /* ---------------------------------------------------------------- */

  function BorderStage({ onComplete }) {
    const [emotion, setEmotion] = useState("");
    const [thought, setThought] = useState("");
    const [reality, setReality] = useState("");
    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">גבול ההבחנה</h3>
          <p className="text-[14px] text-ink-600 leading-relaxed">
            כשמרגישים גודש, קל לבלבל בין שלושה דברים שונים. בואו נפריד אותם, אחד אחד.
          </p>
        </div>
        <div className="space-y-4">
          <Field
            icon="heart"
            label="הרגש — מה אני מרגיש/ה עכשיו?"
            value={emotion}
            onChange={setEmotion}
            placeholder="לדוגמה: חרדה, עצב, כעס, לחץ"
            textarea
          />
          <Field
            icon="brain"
            label="המחשבה — מה עולה לי בראש?"
            value={thought}
            onChange={setThought}
            placeholder="לדוגמה: 'אני לא אצליח', 'משהו רע יקרה'"
            textarea
          />
          <Field
            icon="compass"
            label="המציאות — מה קורה בפועל, בלי פרשנות?"
            value={reality}
            onChange={setReality}
            placeholder="לדוגמה: 'אני יושב/ת בבית, בטוח/ה, ולפניי מבחן מחר'"
            textarea
          />
        </div>
        <p className="text-[13px] text-ink-500 bg-gold-50 border border-gold-100 rounded-2xl px-4 py-3 leading-relaxed">
          המחשבה היא לא עובדה, והרגש הוא לא המציאות — שניהם תגובה זמנית שעוברת.
        </p>
        <Button as="button" type="button" variant="primary" className="w-full" icon="arrow-left" iconPos="end" onClick={() => onComplete({ emotion, thought, reality })}>
          סיימתי את ההבחנה · למעבר לקרקוע
        </Button>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Stage 3 — Grounding (3-2-1 protocol)                               */
  /* ---------------------------------------------------------------- */

  const TENSION_AREAS = ["כתפיים", "חזה", "בטן", "צוואר וגרון", "ידיים", "ראש"];

  function GroundStage({ onComplete }) {
    const [step, setStep] = useState(1);
    const [tension, setTension] = useState([]);
    const [seen, setSeen] = useState(["", "", ""]);
    const [heard, setHeard] = useState(["", ""]);
    const [felt, setFelt] = useState("");
    const [score, setScore] = useState(50);
    const [saved, setSaved] = useState(false);
    const [sessionsCount, setSessionsCount] = useState(() => loadSessions().length);

    function toggleTension(area) {
      setTension((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]));
    }

    function updateAt(list, setList, index, value) {
      const next = [...list];
      next[index] = value;
      setList(next);
    }

    function resetForAnotherRound() {
      setStep(1);
      setTension([]);
      setSeen(["", "", ""]);
      setHeard(["", ""]);
      setFelt("");
      setScore(50);
      setSaved(false);
    }

    function handleSave() {
      saveSession(score);
      setSessionsCount((c) => c + 1);
      setSaved(true);
      onComplete();
    }

    return (
      <div className="space-y-5">
        <StepDots total={4} current={step} />

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">שלב 1 · בדיקת גוף</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">
                הניחו את שתי כפות הרגליים על הרצפה. הרגישו את המשקל יורד מטה, ואת המגע של הרגליים עם הקרקע.
              </p>
            </div>
            <div>
              <p className="text-[13px] font-heading font-semibold text-ink-700 mb-2.5">באיזה אזור בגוף מורגש מתח? (אפשר לבחור כמה)</p>
              <div className="flex flex-wrap gap-2">
                {TENSION_AREAS.map((area) => (
                  <Chip key={area} active={tension.includes(area)} onClick={() => toggleTension(area)}>
                    {area}
                  </Chip>
                ))}
              </div>
            </div>
            <Button as="button" type="button" variant="primary" className="w-full" icon="arrow-left" iconPos="end" onClick={() => setStep(2)}>
              המשך לשלב 2
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">שלב 2 · תרגול 3-2-1</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">שימו לב, בלי למהר, לסביבה שלכם דרך החושים.</p>
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700">
                <Icon name="eye" size={16} className="text-gold-600" /> 3 דברים שאתם רואים
              </p>
              {seen.map((v, i) => (
                <input
                  key={i}
                  type="text"
                  value={v}
                  onChange={(e) => updateAt(seen, setSeen, i, e.target.value)}
                  placeholder={`דבר נראה ${i + 1}`}
                  className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
                />
              ))}
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700">
                <Icon name="ear" size={16} className="text-gold-600" /> 2 דברים שאתם שומעים
              </p>
              {heard.map((v, i) => (
                <input
                  key={i}
                  type="text"
                  value={v}
                  onChange={(e) => updateAt(heard, setHeard, i, e.target.value)}
                  placeholder={`קול נשמע ${i + 1}`}
                  className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
                />
              ))}
            </div>
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-[13px] font-heading font-semibold text-ink-700">
                <Icon name="hand" size={16} className="text-gold-600" /> דבר אחד שאתם מרגישים במגע
              </p>
              <input
                type="text"
                value={felt}
                onChange={(e) => setFelt(e.target.value)}
                placeholder="לדוגמה: מרקם הבד, טמפרטורת האוויר"
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-2.5 text-[14px] text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-300"
              />
            </div>
            <div className="flex gap-3">
              <Button as="button" type="button" variant="secondary" className="flex-1" onClick={() => setStep(1)}>
                חזרה
              </Button>
              <Button as="button" type="button" variant="primary" className="flex-1" icon="arrow-left" iconPos="end" onClick={() => setStep(3)}>
                המשך
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">שלב 3 · עוגן הקרקוע</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">חזרו על המשפט לעצמכם, פעמיים, בקול או בשקט.</p>
            </div>
            <BreathingOrb />
            <p className="text-center font-heading font-bold text-xl text-ink-800 leading-snug px-2">
              "אני כאן. עכשיו.
              <br />
              אני בטוח/ה ברגע הזה."
            </p>
            <div className="flex gap-3">
              <Button as="button" type="button" variant="secondary" className="flex-1" onClick={() => setStep(2)}>
                חזרה
              </Button>
              <Button as="button" type="button" variant="primary" className="flex-1" icon="arrow-left" iconPos="end" onClick={() => setStep(4)}>
                סיימתי את התרגול
              </Button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading font-bold text-lg text-ink-800 mb-2">כמה ירד העומס הרגשי?</h3>
              <p className="text-[14px] text-ink-600 leading-relaxed">הזיזו את המחוון להערכה שלכם — אין תשובה נכונה או שגויה.</p>
            </div>
            <div className="bg-white rounded-2xl border border-ink-200 px-5 py-6">
              <p className="text-center font-heading font-bold text-3xl text-gold-600 mb-4">{score}%</p>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-gold-500"
                disabled={saved}
              />
              <div className="flex justify-between text-[11px] text-ink-400 mt-1.5">
                <span>0% · לא ירד</span>
                <span>100% · ירד לחלוטין</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {[0, 25, 50, 75, 100].map((v) => (
                  <Chip key={v} active={score === v} onClick={() => !saved && setScore(v)}>
                    {v}%
                  </Chip>
                ))}
              </div>
            </div>

            {!saved ? (
              <Button as="button" type="button" variant="primary" className="w-full" icon="check-circle-2" onClick={handleSave}>
                שמירת התוצאה
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="flex items-center justify-center gap-2 text-[14px] font-heading font-semibold text-gold-700 bg-gold-50 border border-gold-100 rounded-2xl px-4 py-3">
                  <Icon name="check-circle-2" size={18} /> התוצאה נשמרה. השלמתם {sessionsCount} תרגולי קרקוע עד כה.
                </p>
                <Button as="button" type="button" variant="secondary" className="w-full" icon="rotate-ccw" onClick={resetForAnotherRound}>
                  תרגול קרקוע נוסף
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Phone frame + nav                                                  */
  /* ---------------------------------------------------------------- */

  function PhoneFrame({ children }) {
    return (
      <div className="fixed inset-0 z-50 bg-ink-800 flex items-center justify-center sm:p-8" dir="rtl">
        <div className="relative w-full h-full sm:w-[390px] sm:h-[800px] sm:rounded-[40px] bg-ink-50 overflow-hidden sm:border-[10px] sm:border-ink-700 sm:shadow-2xl flex flex-col">
          <div className="hidden sm:flex absolute top-0 inset-x-0 h-6 items-center justify-center z-20 pointer-events-none">
            <div className="w-28 h-5 bg-ink-700 rounded-b-2xl" />
          </div>
          {children}
        </div>
      </div>
    );
  }

  function Header({ subtitle, onExit }) {
    return (
      <div className="flex items-center justify-between gap-3 px-5 pt-7 sm:pt-5 pb-3 bg-white border-b border-ink-100 shrink-0">
        <div>
          <p className="font-heading font-bold text-[15px] text-ink-800">CureMindset · אזור אישי</p>
          <p className="text-[12px] text-ink-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onExit}
          aria-label="סגירת האזור האישי"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-ink-50 text-ink-600 hover:bg-ink-100 transition-colors shrink-0"
        >
          <Icon name="x" size={18} />
        </button>
      </div>
    );
  }

  function StageNav({ stages, progress, current, onSelect }) {
    return (
      <div className="flex items-center px-4 py-3.5 gap-1 border-b border-ink-100 bg-white shrink-0">
        {stages.map((s, i) => {
          const done = progress.completed.includes(s.id);
          const locked = !s.alwaysUnlocked && s.id > progress.unlocked;
          const isCurrent = s.id === current;
          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                disabled={locked}
                onClick={() => !locked && onSelect(s.id)}
                className={`flex flex-col items-center gap-1.5 flex-1 py-1 rounded-xl transition-colors ${
                  locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gold-50"
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    isCurrent ? "bg-gold-500 text-white" : done ? "bg-gold-100 text-gold-600" : "bg-ink-100 text-ink-400"
                  }`}
                >
                  <Icon name={locked ? "lock" : done && !isCurrent ? "check-circle-2" : s.icon} size={16} />
                </span>
                <span className={`text-[10.5px] font-heading font-semibold ${isCurrent ? "text-ink-800" : "text-ink-400"}`}>{s.title}</span>
              </button>
              {i < stages.length - 1 ? <span className="h-px w-3 bg-ink-100 mt-[-14px]" aria-hidden="true" /> : null}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Root                                                               */
  /* ---------------------------------------------------------------- */

  function MemberArea({ onExit }) {
    const [progress, setProgress] = useState(loadProgress);
    const [current, setCurrent] = useState(() => loadProgress().unlocked);

    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }, []);

    function unlock(stageId, nextUnlocked) {
      setProgress((prev) => {
        const completed = prev.completed.includes(stageId) ? prev.completed : [...prev.completed, stageId];
        const unlocked = Math.max(prev.unlocked, nextUnlocked);
        const next = { completed, unlocked };
        saveProgress(next);
        return next;
      });
    }

    function navigateToStage(stageId) {
      const target = STAGES.find((s) => s.id === stageId);
      setCurrent(target && (target.alwaysUnlocked || stageId <= progress.unlocked) ? stageId : progress.unlocked);
    }

    const stage = STAGES.find((s) => s.id === current);

    return (
      <PhoneFrame>
        <Header subtitle={stage ? stage.subtitle : ""} onExit={onExit} />
        <StageNav stages={STAGES} progress={progress} current={current} onSelect={setCurrent} />
        {current === 4 ? (
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-ink-800">
            <ResilienceDashboard progress={progress} sessions={loadSessions()} onNavigateStage={navigateToStage} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {current === 1 ? (
              <AnchorStage
                onComplete={() => {
                  unlock(1, 2);
                  setCurrent(2);
                }}
              />
            ) : null}
            {current === 2 ? (
              <BorderStage
                onComplete={() => {
                  unlock(2, 3);
                  setCurrent(3);
                }}
              />
            ) : null}
            {current === 3 ? <GroundStage onComplete={() => unlock(3, 3)} /> : null}
          </div>
        )}
      </PhoneFrame>
    );
  }

  window.MemberArea = MemberArea;
})();
