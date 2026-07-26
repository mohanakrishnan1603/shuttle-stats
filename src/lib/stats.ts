import { connectToDatabase } from "@/lib/db";
import { Player } from "@/lib/models/Player";
import { Match, MatchDoc } from "@/lib/models/Match";

export type PlayerStats = {
  playerId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  winPct: number;
};

export async function computeLeaderboard(): Promise<PlayerStats[]> {
  await connectToDatabase();

  const [players, matches] = await Promise.all([
    Player.find().sort({ name: 1 }).lean(),
    Match.find().lean<MatchDoc[]>(),
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

export async function computePlayerStats(playerId: string): Promise<PlayerStats | null> {
  const leaderboard = await computeLeaderboard();
  return leaderboard.find((entry) => entry.playerId === playerId) ?? null;
}
