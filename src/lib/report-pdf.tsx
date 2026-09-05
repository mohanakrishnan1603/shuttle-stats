import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { Report, DateRange } from "@/lib/stats";
import { buildInsights } from "@/lib/insights";
import { avatarColor } from "@/lib/avatar";
import { computeLeaderboardImageSize } from "@/lib/leaderboard-image";

// A4 content box is 523x770pt after the page's 36pt padding; leave headroom for the
// section title above the poster so the (non-wrappable) image always fits a single page,
// however many players it lists. An image taller than the page crashes the whole
// @react-pdf/renderer process instead of raising a catchable error.
const POSTER_MAX_WIDTH = 523;
const POSTER_MAX_HEIGHT = 680;

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  brand: { fontSize: 10, color: "#059669", letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 2 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#111827", marginTop: 18, marginBottom: 8 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  barName: { width: 90, fontSize: 10, fontWeight: 700 },
  barTrack: { flex: 1, height: 14, backgroundColor: "#e5e7eb", borderRadius: 7, marginHorizontal: 8 },
  barPct: { width: 40, fontSize: 10, textAlign: "right", color: "#059669", fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 4, overflow: "hidden" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#c8e6c9" },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  th: { padding: 6, fontSize: 9, fontWeight: 700, color: "#1b4332" },
  td: { padding: 6, fontSize: 9, color: "#1f2937" },
  insightBox: { marginBottom: 10, padding: 10, backgroundColor: "#f0fdf4", borderRadius: 6 },
  insightTitle: { fontSize: 11, fontWeight: 700, color: "#065f46", marginBottom: 3 },
  insightAnomaly: { fontSize: 9.5, color: "#1f2937", marginBottom: 2 },
  insightDetail: { fontSize: 9, color: "#4b5563", fontStyle: "italic" },
  momentumRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  momentumName: { width: 90, fontSize: 10, fontWeight: 700 },
  momentumDelta: { width: 60, fontSize: 10, fontWeight: 700 },
  momentumNote: { flex: 1, fontSize: 9, color: "#4b5563", fontStyle: "italic" },
  poster: { marginTop: 16, width: "100%" },
});

const COLS = {
  rank: { width: 30 },
  name: { flex: 1 },
  played: { width: 55 },
  won: { width: 45 },
  lost: { width: 45 },
  winPct: { width: 55 },
  lossPct: { width: 55 },
};

function PeriodTable({ players, mode }: { players: Report["players"]; mode: "period" | "alltime" }) {
  const rows = mode === "period" ? players : [...players].sort((a, b) => b.played - a.played);

  return (
    <View style={styles.table} wrap={false}>
      <View style={styles.tableHeaderRow} wrap={false}>
        {mode === "period" && <Text style={[styles.th, COLS.rank]}>#</Text>}
        <Text style={[styles.th, COLS.name]}>Player</Text>
        <Text style={[styles.th, COLS.played]}>Played</Text>
        <Text style={[styles.th, COLS.won]}>Won</Text>
        <Text style={[styles.th, COLS.lost]}>Lost</Text>
        <Text style={[styles.th, COLS.winPct]}>Win %</Text>
        <Text style={[styles.th, COLS.lossPct]}>Loss %</Text>
      </View>
      {rows.map((p) => {
        const lossPct = p.played === 0 ? 0 : Math.round((p.lost / p.played) * 1000) / 10;
        return (
          <View style={styles.tableRow} key={p.playerId} wrap={false}>
            {mode === "period" && <Text style={[styles.td, COLS.rank]}>{p.played > 0 ? p.rank : ""}</Text>}
            <Text style={[styles.td, COLS.name]}>{p.name}</Text>
            <Text style={[styles.td, COLS.played]}>{p.played}</Text>
            <Text style={[styles.td, COLS.won]}>{p.won}</Text>
            <Text style={[styles.td, COLS.lost]}>{p.lost}</Text>
            <Text style={[styles.td, COLS.winPct]}>{p.played === 0 ? "—" : `${p.winPct}%`}</Text>
            <Text style={[styles.td, COLS.lossPct]}>{p.played === 0 ? "—" : `${lossPct}%`}</Text>
          </View>
        );
      })}
    </View>
  );
}

export async function renderDetailedReportPdf(
  current: Report,
  allTime: Report,
  range: DateRange,
  monthValue: string | null,
  posterPng: Buffer
): Promise<Buffer> {
  const active = current.players.filter((p) => p.played > 0);
  const insights = await buildInsights(current, range, monthValue);
  const momentum = active.filter((p) => p.winPctDelta !== null);
  const generatedOn = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const posterSize = computeLeaderboardImageSize(current);
  const posterScale = Math.min(POSTER_MAX_WIDTH / posterSize.width, POSTER_MAX_HEIGHT / posterSize.height, 1);
  const posterDisplaySize = { width: posterSize.width * posterScale, height: posterSize.height * posterScale };

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>SHUTTLESTATS</Text>
        <Text style={styles.title}>{current.periodLabel} Performance Report</Text>
        <Text style={styles.subtitle}>Generated on {generatedOn}</Text>

        <Text style={styles.sectionTitle}>Win % Leaderboard</Text>
        {active.length === 0 ? (
          <Text style={styles.insightDetail}>No matches recorded for this period yet.</Text>
        ) : (
          active.map((p) => (
            <View style={styles.barRow} key={p.playerId} wrap={false}>
              <Text style={styles.barName}>{p.name}</Text>
              <View style={styles.barTrack}>
                <View
                  style={{
                    height: 14,
                    borderRadius: 7,
                    width: `${Math.max(p.winPct, 2)}%`,
                    backgroundColor: avatarColor(p.playerId),
                  }}
                />
              </View>
              <Text style={styles.barPct}>{p.winPct}%</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Player Analysis — {current.periodLabel}</Text>
        <PeriodTable players={current.players} mode="period" />

        {insights.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Key Takeaways &amp; Highlights</Text>
            {insights.map((insight) => (
              <View style={styles.insightBox} key={insight.title} wrap={false}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightAnomaly}>{insight.anomaly}</Text>
                <Text style={styles.insightDetail}>{insight.detail}</Text>
              </View>
            ))}
          </>
        )}

        {momentum.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Momentum vs Last Period</Text>
            {momentum.map((p) => (
              <View style={styles.momentumRow} key={p.playerId} wrap={false}>
                <Text style={styles.momentumName}>{p.name}</Text>
                <Text
                  style={[
                    styles.momentumDelta,
                    { color: (p.winPctDelta ?? 0) >= 0 ? "#059669" : "#0369a1" },
                  ]}
                >
                  {(p.winPctDelta ?? 0) >= 0 ? "+" : ""}
                  {p.winPctDelta ?? 0}%
                </Text>
                <Text style={styles.momentumNote}>
                  {(p.winPctDelta ?? 0) >= 0
                    ? "Trending up — great progress!"
                    : "Building back up — next period is a fresh start!"}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>All-Time Cumulative Summary</Text>
        <PeriodTable players={allTime.players} mode="alltime" />

        <Text style={styles.sectionTitle}>Shareable Standings Poster</Text>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- this is @react-pdf/renderer's Image primitive, not an HTML img */}
        <Image src={posterPng} style={[styles.poster, posterDisplaySize]} />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
