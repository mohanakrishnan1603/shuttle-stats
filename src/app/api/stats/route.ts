import { NextRequest, NextResponse } from "next/server";
import { getReport, resolvePeriod } from "@/lib/stats";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const { range, label } = resolvePeriod({
    month: searchParams.get("month"),
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  const report = await getReport(range, label);
  return NextResponse.json(report);
}
