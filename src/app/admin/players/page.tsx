"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Spinner, LoadingBlock } from "@/components/Spinner";
import { useSession } from "@/lib/session-context";

type Player = {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  includeInReports?: boolean;
};

export default function PlayersPage() {
  const { isAdmin } = useSession();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", email: "", mobile: "", includeInReports: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const rosterPlayers = players.filter((p) => p.includeInReports !== false);
  const guestPlayers = players.filter((p) => p.includeInReports === false);

  async function loadPlayers() {
    const res = await fetch("/api/players");
    const data = await res.json();
    setPlayers(data);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, not derived state
    loadPlayers();
  }, []);

  function startEdit(player: Player) {
    setEditingId(player._id);
    setForm({
      name: player.name,
      email: player.email ?? "",
      mobile: player.mobile ?? "",
      includeInReports: player.includeInReports ?? true,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", email: "", mobile: "", includeInReports: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const url = editingId ? `/api/players/${editingId}` : "/api/players";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    resetForm();
    loadPlayers();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this player? Their past match history stays, but they won't be selectable in new matches.")) {
      return;
    }
    setDeletingId(id);
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (editingId === id) resetForm();
    loadPlayers();
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-gray-900">Players</h1>

      {isAdmin && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
        >
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Player name"
            />
          </div>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="optional"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mobile</label>
              <input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="optional"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.includeInReports}
                onChange={(e) => setForm({ ...form, includeInReports: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                <span className="font-medium">Include in reports</span>
                <span className="block text-xs text-gray-500">
                  Turn off for one-off guest players — they&apos;ll be left out of the leaderboard and
                  reports, but their matches still count for their teammates.
                </span>
              </span>
            </label>
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving && <Spinner className="h-4 w-4" />}
              {editingId ? "Save changes" : "Add player"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? (
        <LoadingBlock label="Loading players…" />
      ) : players.length === 0 ? (
        <p className="text-sm text-gray-500">No players yet — add the first one above.</p>
      ) : (
        <>
          {rosterPlayers.length > 0 && (
            <ul className="divide-y divide-gray-200 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              {rosterPlayers.map((player) => (
                <PlayerRow
                  key={player._id}
                  player={player}
                  isAdmin={isAdmin}
                  isDeleting={deletingId === player._id}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}

          {guestPlayers.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Guest players</h2>
              <p className="mb-2 text-xs text-gray-500">Excluded from the leaderboard and reports.</p>
              <ul className="divide-y divide-gray-200 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                {guestPlayers.map((player) => (
                  <PlayerRow
                    key={player._id}
                    player={player}
                    isAdmin={isAdmin}
                    isDeleting={deletingId === player._id}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PlayerRow({
  player,
  isAdmin,
  isDeleting,
  onEdit,
  onDelete,
}: {
  player: Player;
  isAdmin: boolean;
  isDeleting: boolean;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">
          <Link href={`/admin/players/${player._id}`} className="hover:underline">
            {player.name}
          </Link>
        </p>
        <p className="truncate text-sm text-gray-500">
          {[player.email, player.mobile].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
      {isAdmin && (
        <div className="flex shrink-0 items-center gap-3 text-sm font-medium">
          <button
            onClick={() => onEdit(player)}
            disabled={isDeleting}
            className="text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(player._id)}
            disabled={isDeleting}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {isDeleting && <Spinner className="h-3.5 w-3.5" />}
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
