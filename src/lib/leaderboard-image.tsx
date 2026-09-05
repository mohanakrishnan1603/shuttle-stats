import { ImageResponse } from "next/og";
import { Report } from "@/lib/stats";
import { avatarColor, initials } from "@/lib/avatar";
import { mostActiveBadge, mostImprovedBadge } from "@/lib/punchlines";

function rankColor(rank: number): string {
  if (rank === 1) return "#facc15";
  if (rank === 2) return "#cbd5e1";
  if (rank === 3) return "#d97706";
  return "#475569";
}

export function computeLeaderboardImageSize(report: Report): { width: number; height: number } {
  const activeCount = report.players.filter((p) => p.played > 0).length;
  const width = 900;
  const rowHeight = 132;
  const height = 190 + Math.max(activeCount, 1) * rowHeight + 60;
  return { width, height };
}

export function buildLeaderboardImageResponse(report: Report): ImageResponse {
  const players = report.players.filter((p) => p.played > 0);
  const { width, height } = computeLeaderboardImageSize(report);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f172a",
          backgroundImage: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
          padding: "40px 48px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
          <div style={{ display: "flex", fontSize: 20, color: "#86efac", letterSpacing: 2 }}>
            SHUTTLESTATS
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#ffffff", marginTop: 6 }}>
            {report.periodLabel.toUpperCase()} STANDINGS
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#4ade80", marginTop: 2 }}>
            & Highlights
          </div>
        </div>

        {players.length === 0 ? (
          <div style={{ display: "flex", fontSize: 26, color: "#cbd5e1" }}>
            No matches recorded for this period yet.
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.playerId}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "16px 20px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: rankColor(player.rank),
                  color: "#0f172a",
                  fontSize: 22,
                  fontWeight: 800,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 18,
                }}
              >
                {player.rank}
              </div>

              <div
                style={{
                  display: "flex",
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: avatarColor(player.playerId),
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: 700,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 20,
                }}
              >
                {initials(player.name)}
              </div>

              <div style={{ display: "flex", flexDirection: "column", width: 190 }}>
                <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#ffffff" }}>
                  {player.name}
                </div>
                <div style={{ display: "flex", fontSize: 17, color: "#4ade80", fontWeight: 600, marginTop: 4 }}>
                  {player.played}P · {player.won}W · {player.winPct}%
                </div>
                {player.isMostActive ? (
                  <div style={{ display: "flex", fontSize: 14, color: "#facc15", marginTop: 6 }}>
                    {mostActiveBadge(player.played)}
                  </div>
                ) : null}
                {player.isMostImproved ? (
                  <div style={{ display: "flex", fontSize: 14, color: "#facc15", marginTop: 6 }}>
                    {mostImprovedBadge(player.winPctDelta ?? 0)}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  flex: 1,
                  fontSize: 19,
                  color: "#e2e8f0",
                  paddingLeft: 20,
                  borderLeft: "2px solid rgba(255,255,255,0.15)",
                }}
              >
                {player.detailedPunchline}
              </div>
            </div>
          ))
        )}
      </div>
    ),
    { width, height }
  );
}
