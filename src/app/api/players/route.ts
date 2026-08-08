import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Player } from "@/lib/models/Player";

export async function GET() {
  await connectToDatabase();
  const players = await Player.find().sort({ name: 1 }).lean();
  return NextResponse.json(players);
}

export async function POST(request: NextRequest) {
  const { name, email, mobile, includeInReports } = await request.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await connectToDatabase();
  const player = await Player.create({
    name: name.trim(),
    email: email?.trim() || undefined,
    mobile: mobile?.trim() || undefined,
    includeInReports: includeInReports ?? true,
  });

  return NextResponse.json(player, { status: 201 });
}
