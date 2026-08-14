"use client";

import { useEffect, useState } from "react";
import { Spinner, LoadingBlock } from "@/components/Spinner";
import { EditIcon, DeleteIcon } from "@/components/icons";
import { useSession } from "@/lib/session-context";
import { formatDate, toDateInputValue } from "@/lib/format";

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
  teamAScore?: number;
  teamBScore?: number;
};

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const EMPTY_SELECTION = { a1: "", a2: "", b1: "", b2: "" };

export default function MatchesPage() {
  const { isAdmin } = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [winner, setWinner] = useState<"A" | "B">("A");
  const [teamAScore, setTeamAScore] = useState("");
  const [teamBScore, setTeamBScore] = useState("");
  const [date, setDate] = useState(todayString());
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

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

    const url = editingMatchId ? `/api/matches/${editingMatchId}` : "/api/matches";
    const method = editingMatchId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamA: [selection.a1, selection.a2],
        teamB: [selection.b1, selection.b2],
        winner,
        date,
        teamAScore,
        teamBScore,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    handleReset();
    loadData();
  }

  function handleReset() {
    setSelection(EMPTY_SELECTION);
    setWinner("A");
    setTeamAScore("");
    setTeamBScore("");
    setDate(todayString());
    setEditingMatchId(null);
    setError(null);
  }

  function startEdit(match: Match) {
    setEditingMatchId(match._id);
    setSelection({
      a1: match.teamA[0]?._id ?? "",
      a2: match.teamA[1]?._id ?? "",
      b1: match.teamB[0]?._id ?? "",
      b2: match.teamB[1]?._id ?? "",
    });
    setWinner(match.winner);
    setTeamAScore(match.teamAScore !== undefined && match.teamAScore !== null ? String(match.teamAScore) : "");
    setTeamBScore(match.teamBScore !== undefined && match.teamBScore !== null ? String(match.teamBScore) : "");
    setDate(toDateInputValue(match.date));
    setError(null);
  }

  function handleScoreChange(field: "A" | "B", value: string) {
    const nextA = field === "A" ? value : teamAScore;
    const nextB = field === "B" ? value : teamBScore;
    if (field === "A") setTeamAScore(value);
    else setTeamBScore(value);

    if (nextA !== "" && nextB !== "") {
      const a = Number(nextA);
      const b = Number(nextB);
      if (Number.isFinite(a) && Number.isFinite(b) && a !== b) {
        setWinner(a > b ? "A" : "B");
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this match result? This will affect the leaderboard.")) return;
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
    if (editingMatchId === id) handleReset();
    loadData();
  }

  const filteredMatches = dateFilter
    ? matches.filter((m) => toDateInputValue(m.date) === dateFilter)
    : matches;

  if (loading) return <LoadingBlock label="Loading matches…" />;

  return (
    <div>
      {isAdmin && (
        <>
          <h1 className="mb-4 text-lg font-semibold text-gray-900">
            {editingMatchId ? "Edit Match" : "Record a Match"}
          </h1>

          {players.length < 4 ? (
            <p className="mb-6 text-sm text-gray-500">
              Add at least 4 players before recording a doubles match. Go to the Players page first.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
            >
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

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">Date</p>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={todayString()}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  />
                </div>

                <div>
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
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Team A score <span className="font-normal text-gray-400">(optional)</span>
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={teamAScore}
                    onChange={(e) => handleScoreChange("A", e.target.value)}
                    placeholder="e.g. 21"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Team B score <span className="font-normal text-gray-400">(optional)</span>
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={teamBScore}
                    onChange={(e) => handleScoreChange("B", e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  />
                </div>
              </div>

              {hasDuplicates && (
                <p className="mb-3 text-sm text-red-600">Each player can only be selected once.</p>
              )}
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                {allSelected && (
                  <button
                    type="submit"
                    disabled={hasDuplicates || saving}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving && <Spinner className="h-4 w-4" />}
                    {saving ? "Saving…" : editingMatchId ? "Update match" : "Save match"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
                >
                  {editingMatchId ? "Cancel edit" : "Reset"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-700">Recent matches</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter("")}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
            >
              All
            </button>
          )}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <p className="text-sm text-gray-500">
          {dateFilter ? "No matches recorded on this date." : "No matches recorded yet."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          {filteredMatches.map((match) => (
            <li key={match._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="mb-0.5 text-xs text-gray-400">{formatDate(match.date)}</div>
                <div>
                  <span className={match.winner === "A" ? "font-semibold text-emerald-700" : "text-gray-700"}>
                    {match.teamA.map((p) => p.name).join(" & ")}
                  </span>
                  <span className="mx-2 text-gray-400">vs</span>
                  <span className={match.winner === "B" ? "font-semibold text-emerald-700" : "text-gray-700"}>
                    {match.teamB.map((p) => p.name).join(" & ")}
                  </span>
                </div>
                {match.teamAScore !== undefined && match.teamBScore !== undefined && (
                  <div className="mt-0.5 text-xs text-gray-400">
                    {match.teamAScore}–{match.teamBScore}
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="flex shrink-0 gap-3">
                  <button
                    onClick={() => startEdit(match)}
                    aria-label="Edit match"
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => handleDelete(match._id)}
                    aria-label="Delete match"
                    className="text-red-500 hover:text-red-700"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
