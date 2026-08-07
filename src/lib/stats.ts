import { connectToDatabase } from "@/lib/db";
import { Player } from "@/lib/models/Player";
import { Match, MatchDoc } from "@/lib/models/Match";
import { getPunchline, getDetailedPunchline } from "@/lib/punchlines";

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
  detailedPunchline: string;
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
      detailedPunchline: getDetailedPunchline(p, rank, totalActive),
    };
  });

  return { periodLabel, players };
}

export async function getPlayerReport(playerId: string, range: DateRange, periodLabel: string): Promise<EnrichedPlayerStats | null> {
  const report = await getReport(range, periodLabel);
  return report.players.find((p) => p.playerId === playerId) ?? null;
}

export type DayStatus = { date: string; status: "no-session" | "present" | "absent" };

export type PlayerAttendance = {
  playerId: string;
  name: string;
  presentToday: boolean;
  streak: number;
  sessionsPresent: number;
  totalSessions: number;
  attendancePct: number;
  weekStrip: DayStatus[];
};

export type WeekOverviewDay = {
  date: string;
  isSessionDay: boolean;
  presentCount: number;
  totalPlayers: number;
  isSelected: boolean;
};

export type AttendanceReport = {
  selectedDate: string;
  isSessionDay: boolean;
  totalPlayers: number;
  presentCount: number;
  latestSessionDate: string | null;
  players: PlayerAttendance[];
  weekOverview: WeekOverviewDay[];
};

function toDayKey(date: Date): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function addDaysToKey(dayKey: string, delta: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + delta);
  return toDayKey(d);
}

function buildWeekStrip(
  selectedDate: string,
  presentByDay: Map<string, Set<string>>,
  playerId: string
): DayStatus[] {
  const strip: DayStatus[] = [];
  for (let i = -3; i <= 3; i++) {
    const date = addDaysToKey(selectedDate, i);
    const dayPresent = presentByDay.get(date);
    const status: DayStatus["status"] = !dayPresent ? "no-session" : dayPresent.has(playerId) ? "present" : "absent";
    strip.push({ date, status });
  }
  return strip;
}

function buildWeekOverview(
  selectedDate: string,
  presentByDay: Map<string, Set<string>>,
  totalPlayers: number
): WeekOverviewDay[] {
  const overview: WeekOverviewDay[] = [];
  for (let i = -3; i <= 3; i++) {
    const date = addDaysToKey(selectedDate, i);
    const dayPresent = presentByDay.get(date);
    overview.push({
      date,
      isSessionDay: Boolean(dayPresent),
      presentCount: dayPresent?.size ?? 0,
      totalPlayers,
      isSelected: date === selectedDate,
    });
  }
  return overview;
}

export async function computeAttendance(selectedDate?: string): Promise<AttendanceReport> {
  await connectToDatabase();

  const [players, matches] = await Promise.all([
    Player.find().sort({ name: 1 }).lean(),
    Match.find().lean<MatchDoc[]>(),
  ]);

  const presentByDay = new Map<string, Set<string>>();
  for (const match of matches) {
    const dayKey = toDayKey(match.date);
    const dayPresent = presentByDay.get(dayKey) ?? new Set<string>();
    for (const playerId of [...match.teamA, ...match.teamB]) {
      dayPresent.add(String(playerId));
    }
    presentByDay.set(dayKey, dayPresent);
  }

  const sessionDates = Array.from(presentByDay.keys()).sort();
  const latestSessionDate = sessionDates.at(-1) ?? null;
  const resolvedSelected = selectedDate ?? latestSessionDate ?? toDayKey(new Date());
  const isSessionDay = presentByDay.has(resolvedSelected);
  const presentTodaySet = presentByDay.get(resolvedSelected) ?? new Set<string>();

  const playerAttendance: PlayerAttendance[] = players.map((player) => {
    const playerId = String(player._id);

    let sessionsPresent = 0;
    for (const date of sessionDates) {
      if (presentByDay.get(date)?.has(playerId)) sessionsPresent += 1;
    }

    let streak = 0;
    for (let i = sessionDates.length - 1; i >= 0; i--) {
      if (presentByDay.get(sessionDates[i])?.has(playerId)) {
        streak += 1;
      } else {
        break;
      }
    }

    const totalSessions = sessionDates.length;
    const attendancePct = totalSessions === 0 ? 0 : Math.round((sessionsPresent / totalSessions) * 1000) / 10;

    return {
      playerId,
      name: player.name,
      presentToday: presentTodaySet.has(playerId),
      streak,
      sessionsPresent,
      totalSessions,
      attendancePct,
      weekStrip: buildWeekStrip(resolvedSelected, presentByDay, playerId),
    };
  });

  playerAttendance.sort((a, b) => {
    if (a.presentToday !== b.presentToday) return a.presentToday ? -1 : 1;
    if (a.streak !== b.streak) return b.streak - a.streak;
    return a.name.localeCompare(b.name);
  });

  return {
    selectedDate: resolvedSelected,
    isSessionDay,
    totalPlayers: players.length,
    presentCount: playerAttendance.filter((p) => p.presentToday).length,
    latestSessionDate,
    players: playerAttendance,
    weekOverview: buildWeekOverview(resolvedSelected, presentByDay, players.length),
  };
}
