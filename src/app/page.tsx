import Link from "next/link";
import { computeLeaderboard } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leaderboard = await computeLeaderboard();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">ShuttleStats</h1>
            <p className="text-sm text-gray-500">Badminton Academy Leaderboard</p>
          </div>
          <Link href="/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-800">
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {leaderboard.length === 0 ? (
          <p className="text-sm text-gray-500">No players yet.</p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 sm:px-4">Player</th>
                  <th className="px-2 py-2 text-center sm:px-3">P</th>
                  <th className="px-2 py-2 text-center sm:px-3">W</th>
                  <th className="px-2 py-2 text-center sm:px-3">L</th>
                  <th className="px-3 py-2 text-right sm:px-4">Win %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((player) => (
                  <tr key={player.playerId}>
                    <td className="truncate px-3 py-3 font-medium text-gray-900 sm:px-4">
                      {player.name}
                    </td>
                    <td className="px-2 py-3 text-center text-gray-600 sm:px-3">{player.played}</td>
                    <td className="px-2 py-3 text-center text-gray-600 sm:px-3">{player.won}</td>
                    <td className="px-2 py-3 text-center text-gray-600 sm:px-3">{player.lost}</td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-700 sm:px-4">
                      {player.played === 0 ? "—" : `${player.winPct}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
