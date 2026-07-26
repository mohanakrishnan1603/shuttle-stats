import { ImageResponse } from "next/og";
import { computePlayerStats } from "@/lib/stats";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stats = await computePlayerStats(id);

  if (!stats) {
    return new Response("Player not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#065f46",
          backgroundImage: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
          padding: "48px",
          fontFamily: "sans-serif",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, opacity: 0.8 }}>ShuttleStats</div>
          <div style={{ display: "flex", fontSize: 48, fontWeight: 700, marginTop: 8 }}>{stats.name}</div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 40 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 20, opacity: 0.75 }}>Played</div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{stats.played}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 20, opacity: 0.75 }}>Won</div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{stats.won}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 20, opacity: 0.75 }}>Lost</div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{stats.lost}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 20, opacity: 0.75 }}>Win Rate</div>
            <div style={{ display: "flex", fontSize: 72, fontWeight: 800 }}>
              {stats.played === 0 ? "—" : `${stats.winPct}%`}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 800, height: 420 }
  );
}
