import { NextRequest, NextResponse } from "next/server";
import { getReport, resolvePeriod } from "@/lib/stats";
import { buildLeaderboardImageResponse } from "@/lib/leaderboard-image";
import { renderDetailedReportPdf } from "@/lib/report-pdf";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month");
  const { range, label } = resolvePeriod({
    month,
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  const [current, allTime] = await Promise.all([getReport(range, label), getReport({}, "All Time")]);

  const posterResponse = buildLeaderboardImageResponse(current);
  const posterBuffer = Buffer.from(await posterResponse.arrayBuffer());

  const isRealMonth = month && month !== "all" ? month : null;
  const pdfBuffer = await renderDetailedReportPdf(current, allTime, range, isRealMonth, posterBuffer);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="shuttlestats-${label.replace(/\s+/g, "-").toLowerCase()}-report.pdf"`,
    },
  });
}
