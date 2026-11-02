export type PlayerRef = { playerId: string; name: string };

export type ScheduleCourt = {
  court: number;
  teamA: [PlayerRef, PlayerRef];
  teamB: [PlayerRef, PlayerRef];
};

export type ScheduleSlot = {
  slot: number;
  courts: ScheduleCourt[];
  resting: PlayerRef[];
};

export type GeneratedSchedule = {
  slots: ScheduleSlot[];
  totals: (PlayerRef & { matches: number })[];
};

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateSchedule(
  players: PlayerRef[],
  courts: number,
  matchesPerCourt: number
): GeneratedSchedule | { error: string } {
  if (players.length < 4) return { error: "Select at least 4 players." };
  if (courts < 1) return { error: "Need at least 1 court." };
  if (matchesPerCourt < 1) return { error: "Need at least 1 match per court." };

  const activeCount = Math.floor(Math.min(players.length, courts * 4) / 4) * 4;
  if (activeCount === 0) return { error: "Not enough players for a full court." };

  const restCount = players.length - activeCount;
  const playCount = new Map<string, number>(players.map((p) => [p.playerId, 0]));
  const scheduleSlots: ScheduleSlot[] = [];

  for (let slot = 1; slot <= matchesPerCourt; slot++) {
    // Shuffle first so ties in playCount break randomly, then rest whoever has
    // played the most so far — this keeps everyone's total matches within 1 of each other.
    const ordered = shuffle(players).sort(
      (a, b) => (playCount.get(b.playerId) ?? 0) - (playCount.get(a.playerId) ?? 0)
    );
    const resting = ordered.slice(0, restCount);
    const active = shuffle(ordered.slice(restCount));

    const courtsThisSlot: ScheduleCourt[] = [];
    for (let i = 0; i < active.length; i += 4) {
      const group = active.slice(i, i + 4);
      courtsThisSlot.push({
        court: courtsThisSlot.length + 1,
        teamA: [group[0], group[1]],
        teamB: [group[2], group[3]],
      });
    }

    for (const p of active) {
      playCount.set(p.playerId, (playCount.get(p.playerId) ?? 0) + 1);
    }

    scheduleSlots.push({ slot, courts: courtsThisSlot, resting });
  }

  const totals = players.map((p) => ({ ...p, matches: playCount.get(p.playerId) ?? 0 }));

  return { slots: scheduleSlots, totals };
}
