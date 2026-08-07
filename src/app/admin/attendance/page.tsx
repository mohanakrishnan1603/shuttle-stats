import Link from "next/link";
import { computeAttendance, PlayerAttendance } from "@/lib/stats";
import { getAttendancePunchline, streakBadgeLabel } from "@/lib/punchlines";
import AttendanceDatePicker from "@/app/AttendanceDatePicker";

export const dynamic = "force-dynamic";

function formatDateLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00.000Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function weekdayShort(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00.000Z`);
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function dayNumber(dayKey: string): number {
  return Number(dayKey.split("-")[2]);
}

function dotColor(status: "no-session" | "present" | "absent"): string {
  if (status === "present") return "bg-emerald-500";
  if (status === "absent") return "bg-rose-300";
  return "bg-gray-200";
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const report = await computeAttendance(date);

  const longestStreakPlayer = report.players.reduce<PlayerAttendance | null>((best, p) => {
    if (p.streak <= 0) return best;
    if (!best || p.streak > best.streak) return p;
    return best;
  }, null);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-900">Attendance — {formatDateLabel(report.selectedDate)}</h1>
        <AttendanceDatePicker
          selected={report.selectedDate}
          basePath="/admin/attendance"
          latestSessionDate={report.latestSessionDate}
        />
      </div>

      {report.totalPlayers === 0 ? (
        <p className="text-sm text-gray-500">No players yet.</p>
      ) : report.latestSessionDate === null ? (
        <p className="text-sm text-gray-500">No attendance data yet — record a match to get started.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
              {report.isSessionDay ? (
                <>
                  <div className="text-2xl font-bold text-emerald-700">
                    {report.presentCount}/{report.totalPlayers}
                  </div>
                  <div className="text-xs text-gray-500">present that day</div>
                </>
              ) : (
                <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                  No session on this date
                </div>
              )}
            </div>
            {longestStreakPlayer && (
              <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-200">
                <div className="text-sm font-medium text-gray-900">🔥 Longest streak</div>
                <div className="text-xs text-gray-500">
                  {longestStreakPlayer.name} ({longestStreakPlayer.streak})
                </div>
              </div>
            )}
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto">
            {report.weekOverview.map((day) => (
              <Link
                key={day.date}
                href={`/admin/attendance?date=${day.date}`}
                className={`flex min-w-[3.5rem] flex-col items-center rounded-lg px-2 py-2 text-center ${
                  day.isSelected ? "ring-2 ring-emerald-600" : ""
                } ${day.isSessionDay ? "bg-emerald-50" : "bg-gray-100"}`}
              >
                <span className="text-[10px] uppercase text-gray-500">{weekdayShort(day.date)}</span>
                <span className="text-sm font-semibold text-gray-900">{dayNumber(day.date)}</span>
                <span className="text-[10px] text-gray-500">
                  {day.isSessionDay ? `${day.presentCount}/${day.totalPlayers}` : "—"}
                </span>
              </Link>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            {/* Mobile: stacked cards, no horizontal scrolling needed */}
            <ul className="divide-y divide-gray-100 sm:hidden">
              {report.players.map((player) => {
                const badge = streakBadgeLabel(player.streak);
                return (
                  <li key={player.playerId} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-gray-900">{player.name}</div>
                        <div className="truncate text-xs text-gray-400">{getAttendancePunchline(player)}</div>
                      </div>
                      <div className="shrink-0">
                        {report.isSessionDay ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              player.presentToday ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {player.presentToday ? "✅ Present" : "❌ Absent"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      {badge && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">{badge}</span>
                      )}
                      <span>{player.attendancePct}% attendance</span>
                      <span className="flex gap-0.5">
                        {player.weekStrip.map((day) => (
                          <span key={day.date} title={day.date} className={`h-2 w-2 rounded-full ${dotColor(day.status)}`} />
                        ))}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* sm and up: full table */}
            <table className="hidden w-full text-left text-sm sm:table">
              <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2 sm:px-4">Player</th>
                  <th className="px-2 py-2 text-center sm:px-3">Today</th>
                  <th className="px-2 py-2 text-center sm:px-3">Streak</th>
                  <th className="px-2 py-2 text-center sm:px-3">Attendance %</th>
                  <th className="px-3 py-2 text-right sm:px-4">Last 7 days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.players.map((player) => {
                  const badge = streakBadgeLabel(player.streak);
                  return (
                    <tr key={player.playerId}>
                      <td className="px-3 py-3 sm:px-4">
                        <div className="truncate font-medium text-gray-900">{player.name}</div>
                        <div className="truncate text-xs text-gray-400">{getAttendancePunchline(player)}</div>
                      </td>
                      <td className="px-2 py-3 text-center sm:px-3">
                        {report.isSessionDay ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              player.presentToday ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {player.presentToday ? "✅ Present" : "❌ Absent"}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center sm:px-3">
                        {badge ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {badge}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center text-gray-600 sm:px-3">{player.attendancePct}%</td>
                      <td className="px-3 py-3 text-right sm:px-4">
                        <span className="inline-flex gap-0.5">
                          {player.weekStrip.map((day) => (
                            <span
                              key={day.date}
                              title={day.date}
                              className={`h-2 w-2 rounded-full ${dotColor(day.status)}`}
                            />
                          ))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
