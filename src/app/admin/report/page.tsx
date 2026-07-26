"use client";

import { useEffect, useState } from "react";

type PlayerStats = {
  playerId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  winPct: number;
};

export default function ReportPage() {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);
  const [cacheBust, setCacheBust] = useState(0);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data);
        setLoading(false);
      });
  }, []);

  function handleGenerate() {
    setCacheBust(Date.now());
    setGenerated(true);
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-gray-900">Report</h1>
      <p className="mb-4 text-sm text-gray-500">
        Generate shareable images of the current standings — one overall leaderboard, plus a card
        per player.
      </p>

      <button
        onClick={handleGenerate}
        disabled={leaderboard.length === 0}
        className="mb-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Generate Report
      </button>

      {leaderboard.length === 0 && (
        <p className="text-sm text-gray-500">No players yet — add players and record matches first.</p>
      )}

      {generated && leaderboard.length > 0 && (
        <div className="space-y-8">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Leaderboard image</h2>
              <a
                href={`/api/og/leaderboard?t=${cacheBust}`}
                download="shuttlestats-leaderboard.png"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
              >
                Download
              </a>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- dynamically generated PNG, not a next/image asset */}
            <img
              src={`/api/og/leaderboard?t=${cacheBust}`}
              alt="Leaderboard"
              className="w-full rounded-xl border border-gray-200 shadow-sm"
            />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Individual player cards</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {leaderboard.map((player) => (
                <div key={player.playerId}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{player.name}</span>
                    <a
                      href={`/api/og/player/${player.playerId}?t=${cacheBust}`}
                      download={`shuttlestats-${player.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
                    >
                      Download
                    </a>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element -- dynamically generated PNG, not a next/image asset */}
                  <img
                    src={`/api/og/player/${player.playerId}?t=${cacheBust}`}
                    alt={player.name}
                    className="w-full rounded-xl border border-gray-200 shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
