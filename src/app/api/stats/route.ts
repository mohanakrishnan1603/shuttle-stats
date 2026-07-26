import { NextResponse } from "next/server";
import { computeLeaderboard } from "@/lib/stats";

export async function GET() {
  const leaderboard = await computeLeaderboard();
  return NextResponse.json(leaderboard);
}
