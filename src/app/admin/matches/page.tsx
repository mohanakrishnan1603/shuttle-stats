"use client";

import { useEffect, useState } from "react";

type Player = {
  _id: string;
  name: string;
};

type Match = {
  _id: string;
  date: string;
  teamA: Player[];
  teamB: Player[];
  winner: "A" | "B";
};

const EMPTY_SELECTION = { a1: "", a2: "", b1: "", b2: "" };

export default function MatchesPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [winner, setWinner] = useState<"A" | "B">("A");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const [playersRes, matchesRes] = await Promise.all([
      fetch("/api/players"),
      fetch("/api/matches"),
    ]);
    setPlayers(await playersRes.json());
    setMatches(await matchesRes.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not derived state
    loadData();
  }, []);

  const selectedIds = Object.values(selection).filter(Boolean);
  const hasDuplicates = new Set(selectedIds).size !== selectedIds.length;
  const allSelected = selection.a1 && selection.a2 && selection.b1 && selection.b2;

  function playerOptions(currentField: keyof typeof selection) {
    return players.filter(
      (p) =>
        p._id === selection[currentField] ||
        !Object.entries(selection).some(([field, id]) => field !== currentField && id === p._id)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allSelected || hasDuplicates) return;

    setSaving(true);
    setError(null);

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamA: [selection.a1, selection.a2],
        teamB: [selection.b1, selection.b2],
        winner,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    setSelection(EMPTY_SELECTION);
    setWinner("A");
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this match result? This will affect the leaderboard.")) return;
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
    loadData();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  if (players.length < 4) {
    return (
      <p className="text-sm text-gray-500">
        Add at least 4 players before recording a doubles match. Go to the Players page first.
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Record a Match</h1>

      <form onSubmit={handleSubmit} className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">Team A</p>
            <select
              value={selection.a1}
              onChange={(e) => setSelection({ ...selection, a1: e.target.value })}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            >
              <option value="">Select player 1</option>
              {playerOptions("a1").map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={selection.a2}
              onChange={(e) => setSelection({ ...selection, a2: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            >
              <option value="">Select player 2</option>
              {playerOptions("a2").map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">Team B</p>
            <select
              value={selection.b1}
              onChange={(e) => setSelection({ ...selection, b1: e.target.value })}
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            >
              <option value="">Select player 1</option>
              {playerOptions("b1").map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={selection.b2}
              onChange={(e) => setSelection({ ...selection, b2: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            >
              <option value="">Select player 2</option>
              {playerOptions("b2").map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Winner</p>
          <div className="flex gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
              <input type="radio" checked={winner === "A"} onChange={() => setWinner("A")} />
              Team A
            </label>
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
              <input type="radio" checked={winner === "B"} onChange={() => setWinner("B")} />
              Team B
            </label>
          </div>
        </div>

        {hasDuplicates && (
          <p className="mb-3 text-sm text-red-600">Each player can only be selected once.</p>
        )}
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!allSelected || hasDuplicates || saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save match"}
        </button>
      </form>

      <h2 className="mb-2 text-sm font-semibold text-gray-700">Recent matches</h2>
      {matches.length === 0 ? (
        <p className="text-sm text-gray-500">No matches recorded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          {matches.map((match) => (
            <li key={match._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <span className={match.winner === "A" ? "font-semibold text-emerald-700" : "text-gray-700"}>
                  {match.teamA.map((p) => p.name).join(" & ")}
                </span>
                <span className="mx-2 text-gray-400">vs</span>
                <span className={match.winner === "B" ? "font-semibold text-emerald-700" : "text-gray-700"}>
                  {match.teamB.map((p) => p.name).join(" & ")}
                </span>
              </div>
              <button onClick={() => handleDelete(match._id)} className="shrink-0 text-red-500 hover:text-red-700">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
