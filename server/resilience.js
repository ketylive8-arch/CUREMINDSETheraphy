// Server-side mirror of the heuristic in resilienceDashboard.js (wins/balanceAlerts from
// progress+sessions), merged with AI-extracted data from checkins (triggers/patterns/wins/alerts).

function average(list) {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
}

function heuristicData(progress, sessions) {
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

  return { isFullyBalanced, wins, balanceAlerts };
}

function dedupeById(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = item.id || JSON.stringify(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// Merge AI-extracted arrays from the most recent checkins (newest first), capped per section.
function mergeCheckinExtractions(checkinRows, field, cap) {
  const merged = [];
  for (const row of checkinRows) {
    let items;
    try {
      items = JSON.parse(row[field] || "[]");
    } catch {
      items = [];
    }
    merged.push(...items);
    if (merged.length >= cap) break;
  }
  return dedupeById(merged).slice(0, cap);
}

function buildDashboardData(progress, sessions, checkinRows) {
  const base = heuristicData(progress, sessions);
  const aiTriggers = mergeCheckinExtractions(checkinRows, "triggers", 6);
  const aiPatterns = mergeCheckinExtractions(checkinRows, "patterns", 6);
  const aiAlerts = mergeCheckinExtractions(checkinRows, "balance_alerts", 4);
  const aiWins = mergeCheckinExtractions(checkinRows, "wins", 6);

  return {
    isFullyBalanced: base.isFullyBalanced,
    wins: dedupeById([...aiWins, ...base.wins]),
    triggers: aiTriggers,
    patterns: aiPatterns,
    balanceAlerts: dedupeById([...aiAlerts, ...base.balanceAlerts]),
  };
}

module.exports = { buildDashboardData };
