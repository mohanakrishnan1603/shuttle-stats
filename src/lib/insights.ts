import { computeLeaderboard, getAvailableMonths, getReport, monthRange, previousRange, PlayerStats, Report, DateRange } from "@/lib/stats";

export type Insight = {
  title: string;
  anomaly: string;
  detail: string;
};

type HistoricalPeak = {
  everPlayed: boolean;
  maxPlayed: number;
  maxWinPct: number;
};

async function getHistoricalPeaks(excludeMonth: string | null): Promise<Map<string, HistoricalPeak>> {
  const peaks = new Map<string, HistoricalPeak>();
  if (!excludeMonth) return peaks;

  const months = await getAvailableMonths();
  const priorMonths = months.filter((m) => m.value !== excludeMonth);

  const monthlyLeaderboards = await Promise.all(priorMonths.map((m) => computeLeaderboard(monthRange(m.value))));

  for (const leaderboard of monthlyLeaderboards) {
    for (const player of leaderboard) {
      if (player.played === 0) continue;
      const existing = peaks.get(player.playerId) ?? { everPlayed: false, maxPlayed: 0, maxWinPct: 0 };
      peaks.set(player.playerId, {
        everPlayed: true,
        maxPlayed: Math.max(existing.maxPlayed, player.played),
        maxWinPct: Math.max(existing.maxWinPct, player.winPct),
      });
    }
  }

  return peaks;
}

function totalMatches(players: PlayerStats[]): number {
  return players.reduce((sum, p) => sum + p.played, 0) / 4;
}

export async function buildInsights(current: Report, range: DateRange, monthValue: string | null): Promise<Insight[]> {
  const active = current.players.filter((p) => p.played > 0);
  if (active.length === 0) return [];

  const insights: Insight[] = [];
  const peaks = await getHistoricalPeaks(monthValue);

  const mostActive = active.reduce((a, b) => (b.played > a.played ? b : a));
  const activePeak = peaks.get(mostActive.playerId);
  if (activePeak?.everPlayed && mostActive.played > activePeak.maxPlayed) {
    insights.push({
      title: `New Activity Record: ${mostActive.name}`,
      anomaly: `${mostActive.name} played ${mostActive.played} matches this period — a new personal high (previous best was ${activePeak.maxPlayed}).`,
      detail: "Incredible dedication to the court — this kind of energy lifts the whole group!",
    });
  } else if (!activePeak?.everPlayed && monthValue) {
    insights.push({
      title: `Welcome, ${mostActive.name}!`,
      anomaly: `${mostActive.name} made their debut this period with ${mostActive.played} matches and a ${mostActive.winPct}% win rate.`,
      detail: "What an entrance — straight in and already leading the activity charts!",
    });
  } else {
    insights.push({
      title: `The Court Regular: ${mostActive.name}`,
      anomaly: `${mostActive.name} played ${mostActive.played} matches this period, more than anyone else in the group.`,
      detail: "Consistency like this is exactly what builds a strong badminton habit!",
    });
  }

  const top = active[0];
  const topPeak = peaks.get(top.playerId);
  if (topPeak?.everPlayed && top.winPct > topPeak.maxWinPct) {
    insights.push({
      title: `Personal Best: ${top.name}`,
      anomaly: `${top.name} hit a new personal-best win rate of ${top.winPct}% (previous best was ${topPeak.maxWinPct}%).`,
      detail: "Peak form right now — the rest of the group has a great benchmark to chase!",
    });
  } else {
    insights.push({
      title: `Top Form: ${top.name}`,
      anomaly: `${top.name} led the group this period with a ${top.winPct}% win rate across ${top.played} matches.`,
      detail: "Smooth, composed, and hard to beat on court this period!",
    });
  }

  const improved = active.find((p) => p.isMostImproved);
  if (improved && improved.winPctDelta) {
    insights.push({
      title: `Big Climb: ${improved.name}`,
      anomaly: `${improved.name} improved by ${improved.winPctDelta}% compared to last period, now at ${improved.winPct}%.`,
      detail: "That's a serious jump in form — great momentum heading into the next period!",
    });
  }

  if (range.start && range.end) {
    const previousReport = await getReport(previousRange({ start: range.start, end: range.end }), "previous");
    const prevActive = previousReport.players.filter((p) => p.played > 0);
    if (prevActive.length > 0) {
      const currentTotal = totalMatches(current.players);
      const prevTotal = totalMatches(previousReport.players);
      if (prevTotal > 0) {
        const pctChange = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
        insights.push({
          title: "Group Momentum",
          anomaly: `The group played ${currentTotal} matches this period, compared to ${prevTotal} last period.`,
          detail:
            pctChange > 0
              ? `That's ${pctChange}% more court time than last period — the energy is building!`
              : pctChange < 0
                ? "A slightly quieter period, but everyone's fresh and ready for more next time!"
                : "Same great turnout as last period — consistency is a win in itself!",
        });
      }
    }
  }

  if (active.length > 1) {
    const growthPlayer = active[active.length - 1];
    insights.push({
      title: `Rising Opportunity: ${growthPlayer.name}`,
      anomaly: `${growthPlayer.name} played ${growthPlayer.played} matches this period and is building match experience.`,
      detail: "Every match played is a step toward improvement — next period is a fresh chance to climb the rankings!",
    });
  }

  return insights;
}
