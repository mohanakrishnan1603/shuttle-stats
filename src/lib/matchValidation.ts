export type MatchInput = {
  teamA: string[];
  teamB: string[];
  winner: "A" | "B";
  date?: Date;
  teamAScore?: number;
  teamBScore?: number;
};

function parseScore(raw: unknown): { value?: number; error?: string } {
  if (raw === undefined || raw === null || raw === "") return {};
  const num = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(num) || num < 0) {
    return { error: "Score must be a non-negative whole number" };
  }
  return { value: num };
}

export function parseMatchInput(body: {
  teamA?: unknown;
  teamB?: unknown;
  winner?: unknown;
  date?: unknown;
  teamAScore?: unknown;
  teamBScore?: unknown;
}): { data: MatchInput } | { error: string } {
  const { teamA, teamB, winner, date, teamAScore, teamBScore } = body;

  if (!Array.isArray(teamA) || teamA.length !== 2 || !Array.isArray(teamB) || teamB.length !== 2) {
    return { error: "Each team needs exactly 2 players" };
  }

  if (winner !== "A" && winner !== "B") {
    return { error: "Winner must be 'A' or 'B'" };
  }

  const allPlayers = [...teamA, ...teamB];
  if (new Set(allPlayers).size !== 4) {
    return { error: "A match needs 4 distinct players" };
  }

  let parsedDate: Date | undefined;
  if (typeof date === "string" && date.trim()) {
    parsedDate = new Date(`${date}T12:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: "Invalid date" };
    }
  }

  const aScore = parseScore(teamAScore);
  if (aScore.error) return { error: aScore.error };
  const bScore = parseScore(teamBScore);
  if (bScore.error) return { error: bScore.error };
  if ((aScore.value !== undefined) !== (bScore.value !== undefined)) {
    return { error: "Enter both team scores or leave both blank" };
  }

  return {
    data: { teamA, teamB, winner, date: parsedDate, teamAScore: aScore.value, teamBScore: bScore.value },
  };
}
