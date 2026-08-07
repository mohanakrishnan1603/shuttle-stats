import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPlayerReport, resolvePeriod } from "@/lib/stats";
import { avatarColor, initials } from "@/lib/avatar";
import { mostActiveBadge, mostImprovedBadge } from "@/lib/punchlines";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const { range, label } = resolvePeriod({
    month: searchParams.get("month"),
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  const stats = await getPlayerReport(id, range, label);

  if (!stats) {
    return new Response("Player not found", { status: 404 });
  }

  const badges = [
    stats.isMostActive ? mostActiveBadge(stats.played) : null,
    stats.isMostImproved ? mostImprovedBadge(stats.winPctDelta ?? 0) : null,
  ].filter((b): b is string => b !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f172a",
          backgroundImage: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          padding: "48px",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: avatarColor(stats.playerId),
              fontSize: 34,
              fontWeight: 700,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 24,
            }}
          >
            {initials(stats.name)}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 18, color: "#86efac", letterSpacing: 2 }}>
              SHUTTLESTATS · {label.toUpperCase()}
            </div>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700, marginTop: 4 }}>{stats.name}</div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#e2e8f0", maxWidth: 620 }}>
          {stats.detailedPunchline}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, opacity: 0.75 }}>Played</div>
              <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{stats.played}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, opacity: 0.75 }}>Won</div>
              <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{stats.won}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, opacity: 0.75 }}>Lost</div>
              <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{stats.lost}</div>
            </div>
            {badges.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                {badges.map((b) => (
                  <div key={b} style={{ display: "flex", fontSize: 16, color: "#facc15", fontWeight: 700 }}>
                    {b}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 18, opacity: 0.75 }}>Win Rate</div>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: "#4ade80" }}>
              {stats.played === 0 ? "—" : `${stats.winPct}%`}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 800, height: 520 }
  );
}
