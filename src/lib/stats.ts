import { connectToDatabase } from "@/lib/db";
import { Player } from "@/lib/models/Player";
import { Match, MatchDoc } from "@/lib/models/Match";
import { getPunchline } from "@/lib/punchlines";

export type PlayerStats = {
  playerId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  winPct: number;
};

export type EnrichedPlayerStats = PlayerStats & {
  rank: number;
  isMostActive: boolean;
  isMostImproved: boolean;
  winPctDelta: number | null;
  punchline: string;
};

export type DateRange = { start?: Date; end?: Date };

export type Report = {
  periodLabel: string;
  players: EnrichedPlayerStats[];
};

export async function computeLeaderboard(range?: DateRange): Promise<PlayerStats[]> {
  await connectToDatabase();

  const dateFilter: Record<string, Date> = {};
  if (range?.start) dateFilter.$gte = range.start;
  if (range?.end) dateFilter.$lte = range.end;
  const query = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

  const [players, matches] = await Promise.all([
    Player.find().sort({ name: 1 }).lean(),
    Match.find(query).lean<MatchDoc[]>(),
  ]);

  const totals = new Map<string, { played: number; won: number }>();
  for (const player of players) {
    totals.set(String(player._id), { played: 0, won: 0 });
  }

  for (const match of matches) {
    const winningTeam = match.winner === "A" ? match.teamA : match.teamB;
    const losingTeam = match.winner === "A" ? match.teamB : match.teamA;

    for (const playerId of winningTeam) {
      const key = String(playerId);
      const entry = totals.get(key);
      if (entry) {
        entry.played += 1;
        entry.won += 1;
      }
    }
    for (const playerId of losingTeam) {
      const key = String(playerId);
      const entry = totals.get(key);
      if (entry) {
        entry.played += 1;
      }
    }
  }

  const leaderboard: PlayerStats[] = players.map((player) => {
    const key = String(player._id);
    const entry = totals.get(key) ?? { played: 0, won: 0 };
    const lost = entry.played - entry.won;
    const winPct = entry.played === 0 ? 0 : Math.round((entry.won / entry.played) * 1000) / 10;
    return {
      playerId: key,
      name: player.name,
      played: entry.played,
      won: entry.won,
      lost,
      winPct,
    };
  });

  leaderboard.sort((a, b) => b.winPct - a.winPct || b.played - a.played);

  return leaderboard;
}

export function monthRange(value: string): DateRange {
  const [year, month] = value.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export function monthLabel(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function rangeLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function previousRange(range: { start: Date; end: Date }): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  const prevEnd = new Date(range.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: prevStart, end: prevEnd };
}

export async function getAvailableMonths(): Promise<{ value: string; label: string }[]> {
  await connectToDatabase();
  const dates = (await Match.find().distinct("date")) as unknown as Date[];

  const values = new Set<string>();
  for (const date of dates) {
    const d = new Date(date);
    values.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  return Array.from(values)
    .sort()
    .reverse()
    .map((value) => ({ value, label: monthLabel(value) }));
}

export type PeriodParams = {
  month?: string | null;
  start?: string | null;
  end?: string | null;
};

export function resolvePeriod(params: PeriodParams): { range: DateRange; label: string } {
  if (params.start && params.end) {
    const start = new Date(`${params.start}T00:00:00.000Z`);
    const end = new Date(`${params.end}T23:59:59.999Z`);
    return { range: { start, end }, label: rangeLabel(start, end) };
  }
  if (params.month && params.month !== "all") {
    return { range: monthRange(params.month), label: monthLabel(params.month) };
  }
  return { range: {}, label: "All Time" };
}

export async function getReport(range: DateRange, periodLabel: string): Promise<Report> {
  const leaderboard = await computeLeaderboard(range);
  const activePlayers = leaderboard.filter((p) => p.played > 0);
  const totalActive = activePlayers.length;

  let previousByPlayer = new Map<string, PlayerStats>();
  if (range.start && range.end) {
    const previous = await computeLeaderboard(previousRange({ start: range.start, end: range.end }));
    previousByPlayer = new Map(previous.map((p) => [p.playerId, p]));
  }

  let mostActiveId: string | undefined;
  let maxPlayed = 0;
  for (const p of activePlayers) {
    if (p.played > maxPlayed) {
      maxPlayed = p.played;
      mostActiveId = p.playerId;
    }
  }

  let mostImprovedId: string | undefined;
  let bestDelta = 0;
  for (const p of activePlayers) {
    const prev = previousByPlayer.get(p.playerId);
    if (prev && prev.played > 0) {
      const delta = Math.round((p.winPct - prev.winPct) * 10) / 10;
      if (delta > bestDelta) {
        bestDelta = delta;
        mostImprovedId = p.playerId;
      }
    }
  }

  const players: EnrichedPlayerStats[] = leaderboard.map((p) => {
    const rank = p.played > 0 ? activePlayers.findIndex((ap) => ap.playerId === p.playerId) + 1 : totalActive + 1;
    const prev = previousByPlayer.get(p.playerId);
    const winPctDelta = prev && prev.played > 0 ? Math.round((p.winPct - prev.winPct) * 10) / 10 : null;
    return {
      ...p,
      rank,
      isMostActive: p.playerId === mostActiveId,
      isMostImproved: p.playerId === mostImprovedId,
      winPctDelta,
      punchline: getPunchline(p, rank, totalActive),
    };
  });

  return { periodLabel, players };
}

export async function getPlayerReport(playerId: string, range: DateRange, periodLabel: string): Promise<EnrichedPlayerStats | null> {
  const report = await getReport(range, periodLabel);
  return report.players.find((p) => p.playerId === playerId) ?? null;
}
