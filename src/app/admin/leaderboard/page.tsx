import { getAvailableMonths, getReport, resolvePeriod } from "@/lib/stats";
import PeriodPicker from "@/app/PeriodPicker";

export const dynamic = "force-dynamic";

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const months = await getAvailableMonths();

  const thisMonth = currentMonthValue();
  const hasCurrentMonthData = months.some((m) => m.value === thisMonth);
  const selectedMonth = month ?? (hasCurrentMonthData ? thisMonth : "all");

  const { range, label } = resolvePeriod({ month: selectedMonth });
  const report = await getReport(range, label);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{report.periodLabel}</h1>
        <PeriodPicker months={months} selected={selectedMonth} basePath="/admin/leaderboard" />
      </div>

      {report.players.length === 0 ? (
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
              {report.players.map((player) => (
                <tr key={player.playerId}>
                  <td className="px-3 py-3 sm:px-4">
                    <div className="truncate font-medium text-gray-900">
                      {player.played > 0 ? `${player.rank}. ` : ""}
                      {player.name}
                      {player.isMostActive && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          🔥 Active
                        </span>
                      )}
                      {player.isMostImproved && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          📈 Improved
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-gray-400">{player.punchline}</div>
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
    </div>
  );
}
