import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Match } from "@/lib/models/Match";

export async function GET() {
  await connectToDatabase();
  const matches = await Match.find()
    .sort({ date: -1 })
    .populate("teamA", "name")
    .populate("teamB", "name")
    .lean();
  return NextResponse.json(matches);
}

export async function POST(request: NextRequest) {
  const { teamA, teamB, winner } = await request.json();

  if (!Array.isArray(teamA) || teamA.length !== 2 || !Array.isArray(teamB) || teamB.length !== 2) {
    return NextResponse.json(
      { error: "Each team needs exactly 2 players" },
      { status: 400 }
    );
  }

  if (winner !== "A" && winner !== "B") {
    return NextResponse.json({ error: "Winner must be 'A' or 'B'" }, { status: 400 });
  }

  const allPlayers = [...teamA, ...teamB];
  const uniquePlayers = new Set(allPlayers);
  if (uniquePlayers.size !== 4) {
    return NextResponse.json(
      { error: "A match needs 4 distinct players" },
      { status: 400 }
    );
  }

  await connectToDatabase();
  const match = await Match.create({ teamA, teamB, winner });

  return NextResponse.json(match, { status: 201 });
}
