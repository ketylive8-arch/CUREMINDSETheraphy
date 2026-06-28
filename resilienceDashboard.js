// CureMindset — "מדד חוסן והתקדמות אישי" (My Resilience Dashboard).
// IIFE-wrapped like memberArea.js; reads window.Icon (icons.js) and window.Button (app.js).
// Wins + balance alerts are computed for real from the visitor's own localStorage
// progress/session data (see buildResilienceData below). Triggers & mindset patterns
// would need a journal/mood-log feature the app doesn't have yet, so until that exists
// they render an honest "still collecting" placeholder instead of invented insights —
// the moment real input exists, feed it into those two arrays and the UI is ready.
(function () {
  "use strict";

  const Icon = window.Icon;
  const Button = window.Button;

  const INTENSITY_MAP = {
    low: { label: "עומס קל", width: "30%" },
    medium: { label: "עומס מתון", width: "60%" },
    high: { label: "עומס גבוה", width: "90%" },
  };

  function SectionHeader({ icon, title, subtitle }) {
    return (
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 shadow-soft shrink-0">
          <Icon name={icon} size={18} className="text-ink-800" strokeWidth={2.25} />
        </div>
        <div>
          <h2 className="font-heading text-[15px] font-bold text-white tracking-tight">{title}</h2>
          {subtitle ? <p className="text-[11.5px] text-white/50">{subtitle}</p> : null}
        </div>
      </div>
    );
  }

  function EmptyState({ text, actionLabel, onAction }) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[12.5px] leading-relaxed text-white/55">{text}</p>
        {actionLabel ? (
          <Button as="button" type="button" variant="primary" size="md" className="w-full mt-3 !py-2.5 !text-[13px]" icon="arrow-left" iconPos="end" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* 1. Full balance celebration screen                                 */
  /* ---------------------------------------------------------------- */

  function FullBalanceCelebration() {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-gold-400/40 bg-gradient-to-b from-ink-700 via-ink-800 to-ink-800 px-6 py-9 text-center shadow-soft">
        <div className="absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 shadow-soft">
          <Icon name="star" size={34} className="text-ink-800" strokeWidth={1.5} />
        </div>
        <div className="relative mb-3 flex items-center justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Icon key={i} name="star" size={15} className="text-gold-400" />
          ))}
        </div>
        <h3 className="relative font-heading text-xl font-extrabold text-white">המערכת הרגשית שלך באיזון ובוויסות</h3>
        <p className="relative mt-2 text-[14px] font-heading font-semibold text-gold-300">את/ה במסלול הצמיחה! 🌟</p>
        <p className="relative mt-3 text-[12.5px] leading-relaxed text-white/60">
          המשיכו לשמור על הקצב הזה — כל תרגול, כל רגע של מודעות, הוא עוד אבן דרך בתהליך שלכם.
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* 2. Breakthroughs & wins — most prominent, celebratory               */
  /* ---------------------------------------------------------------- */

  function WinsSection({ wins, onNavigateStage }) {
    return (
      <section className="mb-6">
        <SectionHeader icon="award" title="ההצלחות ופריצות הדרך שלי" subtitle="כל ניצחון כאן הוא שלך — תני לו מקום" />
        {wins.length ? (
          <div className="flex flex-col gap-3">
            {wins.map((win) => (
              <div key={win.id} className="relative overflow-hidden rounded-2xl border border-gold-400/40 bg-gradient-to-br from-ink-700 via-ink-800 to-ink-800 p-4 shadow-soft">
                <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-gold-400/15 blur-2xl" />
                <div className="relative flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-400 shadow-soft">
                    <Icon name="star" size={16} className="text-ink-800" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-white leading-snug">{win.title}</p>
                    {win.description ? <p className="mt-1 text-[12.5px] text-white/60 leading-relaxed">{win.description}</p> : null}
                    {win.metric ? (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-2.5 py-1 text-[11px] font-semibold text-gold-300">
                        <Icon name="trending-down" size={12} />
                        {win.metric}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            text="אין עדיין הצלחות מתועדות — כל תרגול שתשלימו יופיע כאן כניצחון שלכם."
            actionLabel="לחצי כאן להתחלת התרגול הראשון"
            onAction={() => onNavigateStage(1)}
          />
        )}
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /* 3. Active triggers                                                  */
  /* ---------------------------------------------------------------- */

  function TriggersSection({ triggers, onNavigateStage }) {
    return (
      <section className="mb-6">
        <SectionHeader icon="flame" title="אתגרים פעילים בלמידה" subtitle="אזורים שבהם פגשת קושי או עומס בימים האחרונים" />
        {triggers.length ? (
          <div className="flex flex-col gap-3">
            {triggers.map((trigger) => {
              const intensity = INTENSITY_MAP[trigger.intensity] || INTENSITY_MAP.medium;
              return (
                <div key={trigger.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[13.5px] font-semibold text-white">{trigger.area}</p>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/70">{trigger.status}</span>
                  </div>
                  {trigger.note ? <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">{trigger.note}</p> : null}
                  <div className="mt-3">
                    <p className="text-[10px] text-white/40 mb-1">{intensity.label}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500" style={{ width: intensity.width }} />
                    </div>
                  </div>
                  {trigger.actionLabel ? (
                    <Button as="button" type="button" variant="primary" size="md" className="w-full mt-3 !py-2.5 !text-[13px]" icon="arrow-left" iconPos="end" onClick={() => onNavigateStage(trigger.stageId)}>
                      {trigger.actionLabel}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="עוד אין מספיק תרגולים כדי לשקף כאן אזורי עומס — ככל שתתרגלו יותר, נוכל לזהות דפוסים בעדינות." />
        )}
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /* 4. Mindset patterns                                                 */
  /* ---------------------------------------------------------------- */

  function PatternsSection({ patterns, onNavigateStage }) {
    return (
      <section className="mb-6">
        <SectionHeader icon="brain" title="דפוסי חשיבה ששמנו לב אליהם" subtitle="שיקוף עדין מתוך התהליך שלך" />
        {patterns.length ? (
          <div className="flex flex-col gap-3">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[13.5px] font-semibold text-white">{pattern.title}</p>
                {pattern.description ? <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">{pattern.description}</p> : null}
                {pattern.actionLabel ? (
                  <Button as="button" type="button" variant="primary" size="md" className="w-full mt-3 !py-2.5 !text-[13px]" icon="arrow-left" iconPos="end" onClick={() => onNavigateStage(pattern.stageId)}>
                    {pattern.actionLabel}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            text="בקרוב נוכל לשקף כאן דפוסי חשיבה שעולים בתרגול גבול ההבחנה — ככל שתתרגלו יותר, השיקוף יתעדכן."
            actionLabel="לחצי כאן לתרגול גבול ההבחנה"
            onAction={() => onNavigateStage(2)}
          />
        )}
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /* 5. Balance check — gentle alerts (hidden entirely when nothing to flag) */
  /* ---------------------------------------------------------------- */

  function BalanceCheckSection({ alerts, onNavigateStage }) {
    if (!alerts?.length) return null;
    return (
      <section className="mb-6">
        <SectionHeader icon="moon" title="חריגות מהשגרה" subtitle="קצת תשומת לב לאיזון שלך" />
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 rounded-2xl border border-gold-400/25 bg-gold-400/[0.06] p-4">
              <Icon name="alert-circle" size={17} className="mt-0.5 flex-shrink-0 text-gold-400" />
              <div className="flex-1">
                <p className="text-[12.5px] leading-relaxed text-white/75">{alert.message}</p>
                {alert.actionLabel ? (
                  <Button as="button" type="button" variant="primary" size="md" className="w-full mt-3 !py-2.5 !text-[13px]" icon="arrow-left" iconPos="end" onClick={() => onNavigateStage(alert.stageId)}>
                    {alert.actionLabel}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Real-data builder                                                   */
  /* ---------------------------------------------------------------- */

  function average(list) {
    return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
  }

  function buildResilienceData(progress, sessions) {
    const completed = progress.completed || [];
    const scores = sessions.map((s) => s.score);
    const recentScores = scores.slice(-5);
    const avgRecentScore = average(recentScores);

    let trendPercent = null;
    if (scores.length >= 4) {
      const mid = Math.floor(scores.length / 2);
      const firstAvg = average(scores.slice(0, mid));
      const secondAvg = average(scores.slice(mid));
      if (firstAvg > 0) trendPercent = Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
    }

    const lastSession = sessions[sessions.length - 1];
    const daysSinceLastSession = lastSession ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000) : null;
    const lateNightCount = sessions.filter((s) => {
      const h = new Date(s.date).getHours();
      return h >= 23 || h < 5;
    }).length;

    const wins = [];
    if (completed.includes(1)) {
      wins.push({ id: "win-anchor", title: "השלמת בהצלחה את שלב העוגן הרגשי", description: "בנית נקודת יציבות שאפשר לחזור אליה בכל רגע שמרגישים גודש." });
    }
    if (completed.includes(2)) {
      wins.push({ id: "win-border", title: "הצלחת להפריד בין רגש, מחשבה ומציאות בגבול ההבחנה", description: "מיומנות מרכזית להפחתת עומס רגשי ולבהירות פנימית." });
    }
    if (sessions.length > 0) {
      wins.push({
        id: "win-ground",
        title: `השלמת בהצלחה ${sessions.length} ${sessions.length === 1 ? "תרגיל קרקוע" : "תרגילי קרקוע"}`,
        metric: trendPercent !== null && trendPercent > 0 ? `ירידה של ${trendPercent}% בעומס המחשבתי לאורך התרגולים` : undefined,
      });
    }
    if (sessions.length >= 2 && avgRecentScore >= 70) {
      wins.push({ id: "win-score", title: "מדד הירידה בעומס הרגשי שלך גבוה ויציב", description: `בתרגולים האחרונים העומס ירד בממוצע ${Math.round(avgRecentScore)}%.` });
    }

    const balanceAlerts = [];
    if (sessions.length > 0 && daysSinceLastSession !== null && daysSinceLastSession >= 3) {
      balanceAlerts.push({
        id: "alert-inactive",
        message: `לא נכנסת לתרגל כבר ${daysSinceLastSession} ימים — זה בסדר, אפשר לחזור בעדינות.`,
        actionLabel: "לחצי כאן לחזרה מהירה לתרגול",
        stageId: 3,
      });
    }
    if (lateNightCount > 0) {
      balanceAlerts.push({ id: "alert-latenight", message: "זיהינו תרגול בשעות לילה מאוחרות — סימן אפשרי לחוסר שקט. שימו לב לעצמכם." });
    }

    const isFullyBalanced =
      completed.includes(1) &&
      completed.includes(2) &&
      sessions.length >= 3 &&
      avgRecentScore >= 70 &&
      (daysSinceLastSession === null || daysSinceLastSession <= 2);

    return {
      isFullyBalanced,
      wins,
      triggers: [],
      patterns: [],
      balanceAlerts,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Root component                                                      */
  /* ---------------------------------------------------------------- */

  function ResilienceDashboard({ progress, sessions, onNavigateStage }) {
    const data = buildResilienceData(progress, sessions);

    return (
      <div className="px-1 pb-2">
        <header className="mb-6 px-1">
          <div className="flex items-center gap-2">
            <Icon name="sparkles" size={16} className="text-gold-400" />
            <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-400">CureMindset</span>
          </div>
          <h1 className="mt-1 font-heading text-xl font-extrabold text-white">מדד חוסן והתקדמות אישי</h1>
          <p className="mt-1 text-[13px] text-white/50">שיקוף אישי ומעודד של התהליך שלך — בקצב שלך</p>
        </header>

        {data.isFullyBalanced ? (
          <div className="mb-6">
            <FullBalanceCelebration />
          </div>
        ) : null}

        <WinsSection wins={data.wins} onNavigateStage={onNavigateStage} />
        <TriggersSection triggers={data.triggers} onNavigateStage={onNavigateStage} />
        <PatternsSection patterns={data.patterns} onNavigateStage={onNavigateStage} />
        <BalanceCheckSection alerts={data.balanceAlerts} onNavigateStage={onNavigateStage} />

        <p className="mt-2 px-1 text-center text-[11px] leading-relaxed text-white/30">
          הדו"ח הזה נבנה כדי לתמוך בך, לא לשפוט אותך. כל צעד — קטן כגדול — נספר.
        </p>
      </div>
    );
  }

  window.ResilienceDashboard = ResilienceDashboard;
})();
