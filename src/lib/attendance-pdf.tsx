import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { AttendanceSummaryReport } from "@/lib/stats";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  brand: { fontSize: 10, color: "#059669", letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 18 },
  table: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 4, overflow: "hidden" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#c8e6c9" },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  th: { padding: 6, fontSize: 9, fontWeight: 700, color: "#1b4332" },
  td: { padding: 6, fontSize: 9, color: "#1f2937" },
});

const COLS = {
  name: { flex: 1 },
  matchesPlayed: { width: 90 },
  daysPresent: { width: 110 },
  attendancePct: { width: 90 },
};

export async function renderAttendanceSummaryPdf(summary: AttendanceSummaryReport): Promise<Buffer> {
  const generatedOn = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>SHUTTLESTATS</Text>
        <Text style={styles.title}>Attendance Summary — {summary.periodLabel}</Text>
        <Text style={styles.subtitle}>
          Generated on {generatedOn} · {summary.totalDays} session day{summary.totalDays === 1 ? "" : "s"} in this
          period
        </Text>

        <View style={styles.table} wrap={false}>
          <View style={styles.tableHeaderRow} wrap={false}>
            <Text style={[styles.th, COLS.name]}>Player</Text>
            <Text style={[styles.th, COLS.matchesPlayed]}>Matches Played</Text>
            <Text style={[styles.th, COLS.daysPresent]}>Days Present</Text>
            <Text style={[styles.th, COLS.attendancePct]}>Attendance %</Text>
          </View>
          {summary.rows.map((row) => (
            <View style={styles.tableRow} key={row.playerId} wrap={false}>
              <Text style={[styles.td, COLS.name]}>{row.name}</Text>
              <Text style={[styles.td, COLS.matchesPlayed]}>{row.matchesPlayed}</Text>
              <Text style={[styles.td, COLS.daysPresent]}>
                {row.daysPresent} / {row.totalDays}
              </Text>
              <Text style={[styles.td, COLS.attendancePct]}>{row.attendancePct}%</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
