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
    low: {
      label: "עומס קל",
      width: "30%"
    },
    medium: {
      label: "עומס מתון",
      width: "60%"
    },
    high: {
      label: "עומס גבוה",
      width: "90%"
    }
  };
  function SectionHeader({
    icon,
    title,
    subtitle
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3 mb-4 px-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 shadow-soft shrink-0"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 18,
      className: "text-ink-800",
      strokeWidth: 2.25
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
      className: "font-heading text-[15px] font-bold text-ink-800 tracking-tight"
    }, title), subtitle ? /*#__PURE__*/React.createElement("p", {
      className: "text-[11.5px] text-ink-400"
    }, subtitle) : null));
  }
  function EmptyState({
    text,
    actionLabel,
    onAction
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "rounded-2xl border border-white/10 bg-white/[0.04] p-4"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] leading-relaxed text-ink-500"
    }, text), actionLabel ? /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      size: "md",
      className: "w-full mt-3 !py-2.5 !text-[13px]",
      icon: "arrow-left",
      iconPos: "end",
      onClick: onAction
    }, actionLabel) : null);
  }

  /* ---------------------------------------------------------------- */
  /* 1. Full balance celebration screen                                 */
  /* ---------------------------------------------------------------- */

  function FullBalanceCelebration() {
    return /*#__PURE__*/React.createElement("div", {
      className: "relative overflow-hidden rounded-3xl border border-gold-200 bg-white px-6 py-9 text-center shadow-soft"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold-400/20 blur-3xl"
    }), /*#__PURE__*/React.createElement("div", {
      className: "relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 shadow-soft"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "star",
      size: 34,
      className: "text-ink-800",
      strokeWidth: 1.5
    })), /*#__PURE__*/React.createElement("div", {
      className: "relative mb-3 flex items-center justify-center gap-1"
    }, Array.from({
      length: 5
    }).map((_, i) => /*#__PURE__*/React.createElement(Icon, {
      key: i,
      name: "star",
      size: 15,
      className: "text-gold-400"
    }))), /*#__PURE__*/React.createElement("h3", {
      className: "relative font-heading text-xl font-extrabold text-ink-800"
    }, "\u05D4\u05DE\u05E2\u05E8\u05DB\u05EA \u05D4\u05E8\u05D2\u05E9\u05D9\u05EA \u05E9\u05DC\u05DA \u05D1\u05D0\u05D9\u05D6\u05D5\u05DF \u05D5\u05D1\u05D5\u05D5\u05D9\u05E1\u05D5\u05EA"), /*#__PURE__*/React.createElement("p", {
      className: "relative mt-2 text-[14px] font-heading font-semibold text-gold-300"
    }, "\u05D0\u05EA/\u05D4 \u05D1\u05DE\u05E1\u05DC\u05D5\u05DC \u05D4\u05E6\u05DE\u05D9\u05D7\u05D4!"), /*#__PURE__*/React.createElement("p", {
      className: "relative mt-3 text-[12.5px] leading-relaxed text-ink-500"
    }, "\u05D4\u05DE\u05E9\u05D9\u05DB\u05D5 \u05DC\u05E9\u05DE\u05D5\u05E8 \u05E2\u05DC \u05D4\u05E7\u05E6\u05D1 \u05D4\u05D6\u05D4 \u2014 \u05DB\u05DC \u05EA\u05E8\u05D2\u05D5\u05DC, \u05DB\u05DC \u05E8\u05D2\u05E2 \u05E9\u05DC \u05DE\u05D5\u05D3\u05E2\u05D5\u05EA, \u05D4\u05D5\u05D0 \u05E2\u05D5\u05D3 \u05D0\u05D1\u05DF \u05D3\u05E8\u05DA \u05D1\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05DC\u05DB\u05DD."));
  }

  /* ---------------------------------------------------------------- */
  /* 2. Breakthroughs & wins — most prominent, celebratory               */
  /* ---------------------------------------------------------------- */

  function WinsSection({
    wins,
    onNavigateStage
  }) {
    return /*#__PURE__*/React.createElement("section", {
      className: "mb-6"
    }, /*#__PURE__*/React.createElement(SectionHeader, {
      icon: "award",
      title: "\u05D4\u05D4\u05E6\u05DC\u05D7\u05D5\u05EA \u05D5\u05E4\u05E8\u05D9\u05E6\u05D5\u05EA \u05D4\u05D3\u05E8\u05DA \u05E9\u05DC\u05D9",
      subtitle: "\u05DB\u05DC \u05E0\u05D9\u05E6\u05D7\u05D5\u05DF \u05DB\u05D0\u05DF \u05D4\u05D5\u05D0 \u05E9\u05DC\u05DA \u2014 \u05EA\u05E0\u05D9 \u05DC\u05D5 \u05DE\u05E7\u05D5\u05DD"
    }), wins.length ? /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col gap-3"
    }, wins.map(win => /*#__PURE__*/React.createElement("div", {
      key: win.id,
      className: "relative overflow-hidden rounded-2xl border border-gold-200 bg-white p-4 shadow-soft"
    }, /*#__PURE__*/React.createElement("div", {
      className: "absolute -left-6 -top-6 h-24 w-24 rounded-full bg-gold-400/15 blur-2xl"
    }), /*#__PURE__*/React.createElement("div", {
      className: "cm-shimmer-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
    }), /*#__PURE__*/React.createElement("div", {
      className: "relative flex items-start gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "cm-star-pop mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-400 shadow-soft"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "star",
      size: 16,
      className: "text-ink-800"
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[14px] font-bold text-ink-800 leading-snug"
    }, win.title), win.description ? /*#__PURE__*/React.createElement("p", {
      className: "mt-1 text-[12.5px] text-ink-500 leading-relaxed"
    }, win.description) : null, win.metric ? /*#__PURE__*/React.createElement("div", {
      className: "mt-2 inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-2.5 py-1 text-[11px] font-semibold text-gold-300"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trending-down",
      size: 12
    }), win.metric) : null))))) : /*#__PURE__*/React.createElement(EmptyState, {
      text: "\u05D0\u05D9\u05DF \u05E2\u05D3\u05D9\u05D9\u05DF \u05D4\u05E6\u05DC\u05D7\u05D5\u05EA \u05DE\u05EA\u05D5\u05E2\u05D3\u05D5\u05EA \u2014 \u05DB\u05DC \u05E9\u05D9\u05D7\u05D4 \u05D5\u05EA\u05E8\u05D2\u05D5\u05DC \u05E9\u05EA\u05E2\u05E9\u05D9 \u05D9\u05D5\u05E4\u05D9\u05E2\u05D5 \u05DB\u05D0\u05DF \u05DB\u05E0\u05D9\u05E6\u05D7\u05D5\u05DF \u05E9\u05DC\u05DA.",
      actionLabel: "\u05DC\u05D4\u05EA\u05D7\u05DC\u05EA \u05E9\u05D9\u05D7\u05D4 \u05E2\u05DD \u05D4\u05DE\u05DC\u05D5\u05D5\u05D4",
      onAction: () => onNavigateStage(5)
    }));
  }

  /* ---------------------------------------------------------------- */
  /* 3. Active triggers                                                  */
  /* ---------------------------------------------------------------- */

  function TriggersSection({
    triggers,
    onNavigateStage
  }) {
    return /*#__PURE__*/React.createElement("section", {
      className: "mb-6"
    }, /*#__PURE__*/React.createElement(SectionHeader, {
      icon: "flame",
      title: "\u05D0\u05EA\u05D2\u05E8\u05D9\u05DD \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD \u05D1\u05DC\u05DE\u05D9\u05D3\u05D4",
      subtitle: "\u05D0\u05D6\u05D5\u05E8\u05D9\u05DD \u05E9\u05D1\u05D4\u05DD \u05E4\u05D2\u05E9\u05EA \u05E7\u05D5\u05E9\u05D9 \u05D0\u05D5 \u05E2\u05D5\u05DE\u05E1 \u05D1\u05D9\u05DE\u05D9\u05DD \u05D4\u05D0\u05D7\u05E8\u05D5\u05E0\u05D9\u05DD"
    }), triggers.length ? /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col gap-3"
    }, triggers.map(trigger => {
      const intensity = INTENSITY_MAP[trigger.intensity] || INTENSITY_MAP.medium;
      return /*#__PURE__*/React.createElement("div", {
        key: trigger.id,
        className: "rounded-2xl border border-white/10 bg-white/[0.04] p-4"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center justify-between"
      }, /*#__PURE__*/React.createElement("p", {
        className: "text-[13.5px] font-semibold text-ink-800"
      }, trigger.area), /*#__PURE__*/React.createElement("span", {
        className: "rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-600"
      }, trigger.status)), trigger.note ? /*#__PURE__*/React.createElement("p", {
        className: "mt-1.5 text-[12px] leading-relaxed text-ink-500"
      }, trigger.note) : null, /*#__PURE__*/React.createElement("div", {
        className: "mt-3"
      }, /*#__PURE__*/React.createElement("p", {
        className: "text-[10px] text-ink-400 mb-1"
      }, intensity.label), /*#__PURE__*/React.createElement("div", {
        className: "h-1.5 w-full overflow-hidden rounded-full bg-white/10"
      }, /*#__PURE__*/React.createElement("div", {
        className: "h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500",
        style: {
          width: intensity.width
        }
      }))), trigger.actionLabel ? /*#__PURE__*/React.createElement(Button, {
        as: "button",
        type: "button",
        variant: "primary",
        size: "md",
        className: "w-full mt-3 !py-2.5 !text-[13px]",
        icon: "arrow-left",
        iconPos: "end",
        onClick: () => onNavigateStage(trigger.stageId)
      }, trigger.actionLabel) : null);
    })) : /*#__PURE__*/React.createElement(EmptyState, {
      text: "\u05E2\u05D5\u05D3 \u05D0\u05D9\u05DF \u05DE\u05E1\u05E4\u05D9\u05E7 \u05EA\u05E8\u05D2\u05D5\u05DC\u05D9\u05DD \u05DB\u05D3\u05D9 \u05DC\u05E9\u05E7\u05E3 \u05DB\u05D0\u05DF \u05D0\u05D6\u05D5\u05E8\u05D9 \u05E2\u05D5\u05DE\u05E1 \u2014 \u05DB\u05DB\u05DC \u05E9\u05EA\u05EA\u05E8\u05D2\u05DC\u05D5 \u05D9\u05D5\u05EA\u05E8, \u05E0\u05D5\u05DB\u05DC \u05DC\u05D6\u05D4\u05D5\u05EA \u05D3\u05E4\u05D5\u05E1\u05D9\u05DD \u05D1\u05E2\u05D3\u05D9\u05E0\u05D5\u05EA."
    }));
  }

  /* ---------------------------------------------------------------- */
  /* 4. Mindset patterns                                                 */
  /* ---------------------------------------------------------------- */

  function PatternsSection({
    patterns,
    onNavigateStage
  }) {
    return /*#__PURE__*/React.createElement("section", {
      className: "mb-6"
    }, /*#__PURE__*/React.createElement(SectionHeader, {
      icon: "brain",
      title: "\u05D3\u05E4\u05D5\u05E1\u05D9 \u05D7\u05E9\u05D9\u05D1\u05D4 \u05E9\u05E9\u05DE\u05E0\u05D5 \u05DC\u05D1 \u05D0\u05DC\u05D9\u05D4\u05DD",
      subtitle: "\u05E9\u05D9\u05E7\u05D5\u05E3 \u05E2\u05D3\u05D9\u05DF \u05DE\u05EA\u05D5\u05DA \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05DC\u05DA"
    }), patterns.length ? /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col gap-3"
    }, patterns.map(pattern => /*#__PURE__*/React.createElement("div", {
      key: pattern.id,
      className: "rounded-2xl border border-white/10 bg-white/[0.04] p-4"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[13.5px] font-semibold text-ink-800"
    }, pattern.title), pattern.description ? /*#__PURE__*/React.createElement("p", {
      className: "mt-1.5 text-[12px] leading-relaxed text-ink-500"
    }, pattern.description) : null, pattern.actionLabel ? /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      size: "md",
      className: "w-full mt-3 !py-2.5 !text-[13px]",
      icon: "arrow-left",
      iconPos: "end",
      onClick: () => onNavigateStage(pattern.stageId)
    }, pattern.actionLabel) : null))) : /*#__PURE__*/React.createElement(EmptyState, {
      text: "\u05D1\u05E7\u05E8\u05D5\u05D1 \u05E0\u05E9\u05E7\u05E3 \u05DB\u05D0\u05DF \u05D3\u05E4\u05D5\u05E1\u05D9 \u05D7\u05E9\u05D9\u05D1\u05D4 \u05E9\u05E2\u05D5\u05DC\u05D9\u05DD \u05DE\u05D4\u05E9\u05D9\u05D7\u05D5\u05EA \u05E9\u05DC\u05DA \u2014 \u05DB\u05DB\u05DC \u05E9\u05EA\u05E9\u05EA\u05E4\u05D9 \u05D9\u05D5\u05EA\u05E8, \u05D4\u05E9\u05D9\u05E7\u05D5\u05E3 \u05D9\u05EA\u05E2\u05D3\u05DB\u05DF.",
      actionLabel: "\u05DC\u05D4\u05DE\u05E9\u05DA \u05E9\u05D9\u05D7\u05D4 \u05E2\u05DD \u05D4\u05DE\u05DC\u05D5\u05D5\u05D4",
      onAction: () => onNavigateStage(5)
    }));
  }

  /* ---------------------------------------------------------------- */
  /* 5. Balance check — gentle alerts (hidden entirely when nothing to flag) */
  /* ---------------------------------------------------------------- */

  function BalanceCheckSection({
    alerts,
    onNavigateStage
  }) {
    if (!alerts?.length) return null;
    return /*#__PURE__*/React.createElement("section", {
      className: "mb-6"
    }, /*#__PURE__*/React.createElement(SectionHeader, {
      icon: "moon",
      title: "\u05D7\u05E8\u05D9\u05D2\u05D5\u05EA \u05DE\u05D4\u05E9\u05D2\u05E8\u05D4",
      subtitle: "\u05E7\u05E6\u05EA \u05EA\u05E9\u05D5\u05DE\u05EA \u05DC\u05D1 \u05DC\u05D0\u05D9\u05D6\u05D5\u05DF \u05E9\u05DC\u05DA"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col gap-3"
    }, alerts.map(alert => /*#__PURE__*/React.createElement("div", {
      key: alert.id,
      className: "flex items-start gap-3 rounded-2xl border border-gold-400/25 bg-gold-400/[0.06] p-4"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "alert-circle",
      size: 17,
      className: "mt-0.5 flex-shrink-0 text-gold-400"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-[12.5px] leading-relaxed text-ink-600"
    }, alert.message), alert.actionLabel ? /*#__PURE__*/React.createElement(Button, {
      as: "button",
      type: "button",
      variant: "primary",
      size: "md",
      className: "w-full mt-3 !py-2.5 !text-[13px]",
      icon: "arrow-left",
      iconPos: "end",
      onClick: () => onNavigateStage(alert.stageId)
    }, alert.actionLabel) : null)))));
  }

  /* ---------------------------------------------------------------- */
  /* Real-data builder                                                   */
  /* ---------------------------------------------------------------- */

  function average(list) {
    return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
  }
  function buildResilienceData(progress, sessions) {
    const completed = progress.completed || [];
    const scores = sessions.map(s => s.score);
    const recentScores = scores.slice(-5);
    const avgRecentScore = average(recentScores);
    let trendPercent = null;
    if (scores.length >= 4) {
      const mid = Math.floor(scores.length / 2);
      const firstAvg = average(scores.slice(0, mid));
      const secondAvg = average(scores.slice(mid));
      if (firstAvg > 0) trendPercent = Math.round((secondAvg - firstAvg) / firstAvg * 100);
    }
    const lastSession = sessions[sessions.length - 1];
    const daysSinceLastSession = lastSession ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000) : null;
    const lateNightCount = sessions.filter(s => {
      const h = new Date(s.date).getHours();
      return h >= 23 || h < 5;
    }).length;
    const wins = [];
    if (completed.includes(1)) {
      wins.push({
        id: "win-anchor",
        title: "השלמת בהצלחה את שלב העוגן הרגשי",
        description: "בנית נקודת יציבות שאפשר לחזור אליה בכל רגע שמרגישים גודש."
      });
    }
    if (completed.includes(2)) {
      wins.push({
        id: "win-border",
        title: "הצלחת להפריד בין רגש, מחשבה ומציאות בגבול ההבחנה",
        description: "מיומנות מרכזית להפחתת עומס רגשי ולבהירות פנימית."
      });
    }
    if (sessions.length > 0) {
      wins.push({
        id: "win-ground",
        title: `השלמת בהצלחה ${sessions.length} ${sessions.length === 1 ? "תרגיל קרקוע" : "תרגילי קרקוע"}`,
        metric: trendPercent !== null && trendPercent > 0 ? `ירידה של ${trendPercent}% בעומס המחשבתי לאורך התרגולים` : undefined
      });
    }
    if (sessions.length >= 2 && avgRecentScore >= 70) {
      wins.push({
        id: "win-score",
        title: "מדד הירידה בעומס הרגשי שלך גבוה ויציב",
        description: `בתרגולים האחרונים העומס ירד בממוצע ${Math.round(avgRecentScore)}%.`
      });
    }
    const balanceAlerts = [];
    if (sessions.length > 0 && daysSinceLastSession !== null && daysSinceLastSession >= 3) {
      balanceAlerts.push({
        id: "alert-inactive",
        message: `לא נכנסת לתרגל כבר ${daysSinceLastSession} ימים — זה בסדר, אפשר לחזור בעדינות.`,
        actionLabel: "לחצי כאן לחזרה מהירה לתרגול",
        stageId: 3
      });
    }
    if (lateNightCount > 0) {
      balanceAlerts.push({
        id: "alert-latenight",
        message: "זיהינו תרגול בשעות לילה מאוחרות — סימן אפשרי לחוסר שקט. שימו לב לעצמכם."
      });
    }
    const isFullyBalanced = completed.includes(1) && completed.includes(2) && sessions.length >= 3 && avgRecentScore >= 70 && (daysSinceLastSession === null || daysSinceLastSession <= 2);
    return {
      isFullyBalanced,
      wins,
      triggers: [],
      patterns: [],
      balanceAlerts
    };
  }

  /* ---------------------------------------------------------------- */
  /* Root component                                                      */
  /* ---------------------------------------------------------------- */

  function ResilienceDashboard({
    progress = {
      unlocked: 1,
      completed: []
    },
    sessions = [],
    onNavigateStage,
    data: serverData
  }) {
    const data = serverData || buildResilienceData(progress, sessions);
    return /*#__PURE__*/React.createElement("div", {
      className: "px-1 pb-2"
    }, /*#__PURE__*/React.createElement("header", {
      className: "mb-6 px-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkles",
      size: 16,
      className: "text-gold-400"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] font-heading font-semibold uppercase tracking-wider text-gold-400"
    }, "CureMindset")), /*#__PURE__*/React.createElement("h1", {
      className: "mt-1 font-heading text-xl font-extrabold text-ink-800"
    }, "\u05DE\u05D3\u05D3 \u05D7\u05D5\u05E1\u05DF \u05D5\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA \u05D0\u05D9\u05E9\u05D9"), /*#__PURE__*/React.createElement("p", {
      className: "mt-1 text-[13px] text-ink-400"
    }, "\u05E9\u05D9\u05E7\u05D5\u05E3 \u05D0\u05D9\u05E9\u05D9 \u05D5\u05DE\u05E2\u05D5\u05D3\u05D3 \u05E9\u05DC \u05D4\u05EA\u05D4\u05DC\u05D9\u05DA \u05E9\u05DC\u05DA \u2014 \u05D1\u05E7\u05E6\u05D1 \u05E9\u05DC\u05DA")), data.isFullyBalanced ? /*#__PURE__*/React.createElement("div", {
      className: "mb-6"
    }, /*#__PURE__*/React.createElement(FullBalanceCelebration, null)) : null, /*#__PURE__*/React.createElement(WinsSection, {
      wins: data.wins,
      onNavigateStage: onNavigateStage
    }), /*#__PURE__*/React.createElement(TriggersSection, {
      triggers: data.triggers,
      onNavigateStage: onNavigateStage
    }), /*#__PURE__*/React.createElement(PatternsSection, {
      patterns: data.patterns,
      onNavigateStage: onNavigateStage
    }), /*#__PURE__*/React.createElement(BalanceCheckSection, {
      alerts: data.balanceAlerts,
      onNavigateStage: onNavigateStage
    }), /*#__PURE__*/React.createElement("p", {
      className: "mt-2 px-1 text-center text-[11px] leading-relaxed text-ink-400"
    }, "\u05D4\u05D3\u05D5\"\u05D7 \u05D4\u05D6\u05D4 \u05E0\u05D1\u05E0\u05D4 \u05DB\u05D3\u05D9 \u05DC\u05EA\u05DE\u05D5\u05DA \u05D1\u05DA, \u05DC\u05D0 \u05DC\u05E9\u05E4\u05D5\u05D8 \u05D0\u05D5\u05EA\u05DA. \u05DB\u05DC \u05E6\u05E2\u05D3 \u2014 \u05E7\u05D8\u05DF \u05DB\u05D2\u05D3\u05D5\u05DC \u2014 \u05E0\u05E1\u05E4\u05E8."));
  }
  window.ResilienceDashboard = ResilienceDashboard;
})();
