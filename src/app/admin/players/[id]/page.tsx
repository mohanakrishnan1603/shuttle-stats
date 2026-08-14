import Link from "next/link";
import { getPlayerMatches } from "@/lib/stats";
import PlayerMatchList from "./PlayerMatchList";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getPlayerMatches(id);

  if (!report) {
    return (
      <div>
        <Link href="/admin/players" className="text-sm font-medium text-emerald-600 hover:text-emerald-800">
          ← Back to Players
        </Link>
        <p className="mt-4 text-sm text-gray-500">Player not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/players" className="text-sm font-medium text-emerald-600 hover:text-emerald-800">
        ← Back to Players
      </Link>

      <h1 className="mb-1 mt-3 text-lg font-semibold text-gray-900">{report.name}</h1>
      <p className="mb-4 text-sm text-gray-500">All-time record</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Played" value={report.played} />
        <StatTile label="Won" value={report.won} />
        <StatTile label="Lost" value={report.lost} />
        <StatTile label="Win %" value={report.played === 0 ? "—" : `${report.winPct}%`} highlight />
      </div>

      <PlayerMatchList matches={report.matches} />
    </div>
  );
}

function StatTile({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-200">
      <div className={"text-lg font-semibold " + (highlight ? "text-emerald-700" : "text-gray-900")}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
