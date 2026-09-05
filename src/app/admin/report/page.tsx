"use client";

import { useEffect, useState } from "react";
import { Spinner, LoadingBlock } from "@/components/Spinner";

type PlayerStats = {
  playerId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  winPct: number;
  rank: number;
  punchline: string;
};

type Report = {
  periodLabel: string;
  players: PlayerStats[];
};

type MonthOption = { value: string; label: string };

const CUSTOM = "custom";
const ALL = "all";

async function downloadBlob(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export default function ReportPage() {
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [period, setPeriod] = useState<string>(ALL);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [report, setReport] = useState<Report | null>(null);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingLeaderboard, setDownloadingLeaderboard] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/months")
      .then((res) => res.json())
      .then((data) => {
        setMonths(data);
        setLoadingMonths(false);
      });
  }, []);

  function buildQuery(): string {
    if (period === CUSTOM && customStart && customEnd) {
      return `start=${customStart}&end=${customEnd}`;
    }
    if (period !== ALL && period !== CUSTOM) {
      return `month=${period}`;
    }
    return "";
  }

  async function handleGenerate() {
    setGenerating(true);
    const qs = buildQuery();
    const res = await fetch(`/api/stats${qs ? `?${qs}` : ""}`);
    const data: Report = await res.json();
    setReport(data);
    setQuery(qs);
    setCacheBust(Date.now());
    setGenerating(false);
  }

  const isCustomIncomplete = period === CUSTOM && (!customStart || !customEnd);
  const activePlayers = report?.players.filter((p) => p.played > 0) ?? [];

  const imgQuery = (extra: string) => {
    const parts = [query, extra].filter(Boolean);
    return parts.length ? `?${parts.join("&")}` : "";
  };

  async function handleDownloadPdf() {
    if (!report) return;
    setDownloadingPdf(true);
    setDownloadError(null);
    try {
      await downloadBlob(
        `/api/reports/detailed${imgQuery("")}`,
        `shuttlestats-${report.periodLabel.replace(/\s+/g, "-").toLowerCase()}-report.pdf`
      );
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDownloadLeaderboard() {
    setDownloadingLeaderboard(true);
    setDownloadError(null);
    try {
      await downloadBlob(`/api/og/leaderboard${imgQuery(`t=${cacheBust}`)}`, "shuttlestats-leaderboard.png");
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingLeaderboard(false);
    }
  }

  if (loadingMonths) return <LoadingBlock label="Loading…" />;

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-gray-900">Report</h1>
      <p className="mb-4 text-sm text-gray-500">
        Generate shareable images of the standings for any period — one overall leaderboard, plus a
        card per player.
      </p>

      <div className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <label className="mb-1 block text-sm font-medium text-gray-700">Period</label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
        >
          <option value={ALL}>All Time</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
          <option value={CUSTOM}>Custom Range…</option>
        </select>

        {period === CUSTOM && (
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || isCustomIncomplete}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {generating && <Spinner className="h-4 w-4" />}
          {generating ? "Generating…" : "Generate Report"}
        </button>
      </div>

      {report && activePlayers.length === 0 && (
        <p className="text-sm text-gray-500">No matches recorded for this period.</p>
      )}

      {downloadError && <p className="mb-4 text-sm text-red-600">{downloadError}</p>}

      {report && activePlayers.length > 0 && (
        <div className="space-y-8">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700">
                  Detailed Report — {report.periodLabel}
                </h2>
                <p className="text-xs text-gray-500">
                  Full PDF: win % chart, player analysis, momentum vs last period, all-time summary,
                  and highlights.
                </p>
              </div>
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {downloadingPdf && <Spinner className="h-4 w-4" />}
                {downloadingPdf ? "Preparing…" : "Download PDF"}
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Leaderboard image — {report.periodLabel}
              </h2>
              <button
                onClick={handleDownloadLeaderboard}
                disabled={downloadingLeaderboard}
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
              >
                {downloadingLeaderboard && <Spinner className="h-3.5 w-3.5" />}
                {downloadingLeaderboard ? "Preparing…" : "Download"}
              </button>
            </div>
            <GeneratedImage src={`/api/og/leaderboard${imgQuery(`t=${cacheBust}`)}`} alt="Leaderboard" />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">Individual player cards</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activePlayers.map((player) => (
                <PlayerCard
                  key={player.playerId}
                  name={player.name}
                  src={`/api/og/player/${player.playerId}${imgQuery(`t=${cacheBust}`)}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GeneratedImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <div className="relative min-h-[220px]">
      {status !== "loaded" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
          {status === "loading" ? (
            <Spinner className="h-5 w-5 text-emerald-600" />
          ) : (
            <span className="text-sm text-red-600">Failed to load image</span>
          )}
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamically generated PNG, not a next/image asset */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`w-full rounded-xl border border-gray-200 shadow-sm transition-opacity duration-200 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function PlayerCard({ name, src }: { name: string; src: string }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      await downloadBlob(src, `shuttlestats-${name.toLowerCase().replace(/\s+/g, "-")}.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
        >
          {downloading && <Spinner className="h-3.5 w-3.5" />}
          {downloading ? "Preparing…" : "Download"}
        </button>
      </div>
      {error && <p className="mb-1 text-xs text-red-600">{error}</p>}
      <GeneratedImage src={src} alt={name} />
    </div>
  );
}
