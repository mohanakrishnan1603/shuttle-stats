import { NextRequest, NextResponse } from "next/server";
import { computeAttendanceSummary, resolvePeriod } from "@/lib/stats";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const { range, label } = resolvePeriod({ month: searchParams.get("month") });
  const summary = await computeAttendanceSummary(range, label);
  return NextResponse.json(summary);
}
