import { NextRequest, NextResponse } from "next/server";
import { computeAttendanceSummary, resolvePeriod } from "@/lib/stats";

function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const { range, label } = resolvePeriod({ month: searchParams.get("month") });
  const summary = await computeAttendanceSummary(range, label);

  const header = ["Player", "Matches Played", "Days Present", "Total Days", "Attendance %"];
  const lines = [
    header.join(","),
    ...summary.rows.map((row) =>
      [row.name, row.matchesPlayed, row.daysPresent, row.totalDays, row.attendancePct]
        .map(csvField)
        .join(",")
    ),
  ];
  const csv = lines.join("\n") + "\n";

  const filename = `shuttlestats-attendance-${label.replace(/\s+/g, "-").toLowerCase()}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
