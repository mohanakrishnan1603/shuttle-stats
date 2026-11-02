"use client";

import { useEffect, useState } from "react";
import { LoadingBlock } from "@/components/Spinner";
import { generateSchedule, type GeneratedSchedule, type PlayerRef } from "@/lib/schedule";

type Player = { _id: string; name: string };

export default function SchedulePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [courts, setCourts] = useState(1);
  const [matchesPerCourt, setMatchesPerCourt] = useState(4);
  const [schedule, setSchedule] = useState<GeneratedSchedule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/players")
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSchedule(null);
    setError(null);
  }

  const selectedPlayers: PlayerRef[] = players
    .filter((p) => selectedIds.has(p._id))
    .map((p) => ({ playerId: p._id, name: p.name }));

  const activeCount = Math.floor(Math.min(selectedPlayers.length, courts * 4) / 4) * 4;
  const estimatedMatches =
    selectedPlayers.length > 0 && activeCount > 0
      ? ((activeCount * matchesPerCourt) / selectedPlayers.length).toFixed(1)
      : null;

  function runGenerate() {
    const result = generateSchedule(selectedPlayers, courts, matchesPerCourt);
    if ("error" in result) {
      setError(result.error);
      setSchedule(null);
      return;
    }
    setError(null);
    setSchedule(result);
  }

  if (loading) return <LoadingBlock label="Loading schedule…" />;

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Today&apos;s Schedule</h1>

      {players.length < 4 ? (
        <p className="text-sm text-gray-500">Add at least 4 players before generating a schedule.</p>
      ) : (
        <>
          <div className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Who&apos;s playing today?</p>
              <div className="flex gap-3 text-xs font-medium text-emerald-600">
                <button type="button" onClick={() => setSelectedIds(new Set(players.map((p) => p._id)))}>
                  Select all
                </button>
                <button type="button" onClick={() => setSelectedIds(new Set())}>
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => {
                const selected = selectedIds.has(p._id);
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => toggle(p._id)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
                      selected
                        ? "bg-emerald-600 text-white ring-emerald-600"
                        : "bg-white text-gray-700 ring-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Courts</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={courts}
                  onChange={(e) => {
                    setCourts(Math.max(1, Number(e.target.value) || 1));
                    setSchedule(null);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">Matches per court</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={matchesPerCourt}
                  onChange={(e) => {
                    setMatchesPerCourt(Math.max(1, Number(e.target.value) || 1));
                    setSchedule(null);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                />
              </div>
            </div>

            {estimatedMatches && (
              <p className="mt-3 text-xs text-gray-500">
                {selectedPlayers.length} players selected — about {estimatedMatches} matches each.
              </p>
            )}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={runGenerate}
                disabled={selectedPlayers.length < 4}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {schedule ? "Shuffle again" : "Generate schedule"}
              </button>
            </div>
          </div>

          {schedule && (
            <div className="space-y-4">
              {schedule.slots.map((slot) => (
                <div key={slot.slot} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Slot {slot.slot}</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {slot.courts.map((court) => (
                      <li key={court.court}>
                        <span className="font-medium text-gray-500">Court {court.court}:</span>{" "}
                        {court.teamA.map((p) => p.name).join(" & ")}
                        <span className="mx-1 text-gray-400">vs</span>
                        {court.teamB.map((p) => p.name).join(" & ")}
                      </li>
                    ))}
                  </ul>
                  {slot.resting.length > 0 && (
                    <p className="mt-2 text-xs text-gray-400">
                      Resting: {slot.resting.map((p) => p.name).join(", ")}
                    </p>
                  )}
                </div>
              ))}

              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="mb-2 text-sm font-semibold text-gray-700">Matches per player</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-3">
                  {schedule.totals.map((p) => (
                    <li key={p.playerId} className="flex justify-between">
                      <span>{p.name}</span>
                      <span className="font-medium">{p.matches}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
