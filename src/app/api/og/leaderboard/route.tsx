import { ImageResponse } from "next/og";
import { computeLeaderboard } from "@/lib/stats";

export async function GET() {
  const leaderboard = await computeLeaderboard();
  const width = 800;
  const rowHeight = 64;
  const height = 220 + leaderboard.length * rowHeight;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f9fafb",
          padding: "40px 48px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#111827" }}>ShuttleStats</div>
          <div style={{ fontSize: 22, color: "#6b7280" }}>Badminton Academy — Leaderboard</div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 20,
            fontWeight: 600,
            color: "#6b7280",
            borderBottom: "2px solid #e5e7eb",
            paddingBottom: 12,
          }}
        >
          <div style={{ display: "flex", width: "45%" }}>Player</div>
          <div style={{ display: "flex", width: "15%", justifyContent: "center" }}>P</div>
          <div style={{ display: "flex", width: "15%", justifyContent: "center" }}>W</div>
          <div style={{ display: "flex", width: "15%", justifyContent: "center" }}>L</div>
          <div style={{ display: "flex", width: "20%", justifyContent: "flex-end" }}>Win %</div>
        </div>

        {leaderboard.map((player, i) => (
          <div
            key={player.playerId}
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 24,
              padding: "14px 0",
              borderBottom: i === leaderboard.length - 1 ? "none" : "1px solid #e5e7eb",
              color: "#111827",
            }}
          >
            <div style={{ display: "flex", width: "45%", fontWeight: 600 }}>{player.name}</div>
            <div style={{ display: "flex", width: "15%", justifyContent: "center", color: "#4b5563" }}>
              {player.played}
            </div>
            <div style={{ display: "flex", width: "15%", justifyContent: "center", color: "#4b5563" }}>
              {player.won}
            </div>
            <div style={{ display: "flex", width: "15%", justifyContent: "center", color: "#4b5563" }}>
              {player.lost}
            </div>
            <div
              style={{
                display: "flex",
                width: "20%",
                justifyContent: "flex-end",
                fontWeight: 700,
                color: "#047857",
              }}
            >
              {player.played === 0 ? "—" : `${player.winPct}%`}
            </div>
          </div>
        ))}
      </div>
    ),
    { width, height }
  );
}
