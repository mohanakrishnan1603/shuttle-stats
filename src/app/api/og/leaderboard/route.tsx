import { NextRequest } from "next/server";
import { getReport, resolvePeriod } from "@/lib/stats";
import { buildLeaderboardImageResponse } from "@/lib/leaderboard-image";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const { range, label } = resolvePeriod({
    month: searchParams.get("month"),
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  const report = await getReport(range, label);
  return buildLeaderboardImageResponse(report);
}
