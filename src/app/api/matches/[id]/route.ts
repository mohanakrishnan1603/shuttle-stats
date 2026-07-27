import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Match } from "@/lib/models/Match";
import { parseMatchInput } from "@/lib/matchValidation";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const result = parseMatchInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { teamA, teamB, winner, date } = result.data;

  await connectToDatabase();
  const match = await Match.findByIdAndUpdate(
    id,
    { teamA, teamB, winner, ...(date ? { date } : {}) },
    { new: true }
  );

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(match);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectToDatabase();
  const match = await Match.findByIdAndDelete(id);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
