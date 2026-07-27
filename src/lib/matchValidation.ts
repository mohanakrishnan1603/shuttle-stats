export type MatchInput = {
  teamA: string[];
  teamB: string[];
  winner: "A" | "B";
  date?: Date;
};

export function parseMatchInput(body: {
  teamA?: unknown;
  teamB?: unknown;
  winner?: unknown;
  date?: unknown;
}): { data: MatchInput } | { error: string } {
  const { teamA, teamB, winner, date } = body;

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

  return { data: { teamA, teamB, winner, date: parsedDate } };
}
