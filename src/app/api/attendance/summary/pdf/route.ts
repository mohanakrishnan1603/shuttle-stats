import { NextRequest, NextResponse } from "next/server";
import { computeAttendanceSummary, resolvePeriod } from "@/lib/stats";
import { renderAttendanceSummaryPdf } from "@/lib/attendance-pdf";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const { range, label } = resolvePeriod({ month: searchParams.get("month") });
  const summary = await computeAttendanceSummary(range, label);
  const pdfBuffer = await renderAttendanceSummaryPdf(summary);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="shuttlestats-attendance-${label.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
