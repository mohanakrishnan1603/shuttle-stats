"use client";

import { useState } from "react";
import { formatDate, toDateInputValue } from "@/lib/format";
import type { PlayerMatchEntry } from "@/lib/stats";

export default function PlayerMatchList({ matches }: { matches: PlayerMatchEntry[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const hasFilter = Boolean(dateFrom || dateTo);

  const filteredMatches = matches.filter((m) => {
    const day = toDateInputValue(m.date);
    if (dateFrom && day < dateFrom) return false;
    if (dateTo && day > dateTo) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Match history</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-500">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              max={dateTo || undefined}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-gray-500">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-700"
            />
          </label>
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
            >
              All
            </button>
          )}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <p className="text-sm text-gray-500">
          {hasFilter ? "No matches recorded in this range." : "No matches recorded yet."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          {filteredMatches.map((match) => (
            <li key={match.matchId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="mb-0.5 text-xs text-gray-400">{formatDate(match.date)}</div>
                <div className="text-gray-700">
                  with{" "}
                  <span className="font-medium text-gray-900">{match.teammate?.name ?? "—"}</span>
                  <span className="mx-2 text-gray-400">vs</span>
                  <span className="font-medium text-gray-900">
                    {match.opponents.map((p) => p.name).join(" & ") || "—"}
                  </span>
                </div>
                {match.teamScore !== undefined && match.opponentScore !== undefined && (
                  <div className="mt-0.5 text-xs text-gray-400">
                    {match.teamScore}–{match.opponentScore}
                  </div>
                )}
              </div>
              <span
                className={
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                  (match.result === "W" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")
                }
              >
                {match.result === "W" ? "Win" : "Loss"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
