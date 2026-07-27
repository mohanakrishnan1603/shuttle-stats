import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Match } from "@/lib/models/Match";
import { parseMatchInput } from "@/lib/matchValidation";

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
  const body = await request.json();
  const result = parseMatchInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { teamA, teamB, winner, date } = result.data;

  await connectToDatabase();
  const match = await Match.create({ teamA, teamB, winner, ...(date ? { date } : {}) });

  return NextResponse.json(match, { status: 201 });
}
