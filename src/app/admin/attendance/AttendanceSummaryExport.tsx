"use client";

import { useEffect, useState } from "react";
import { Spinner, LoadingBlock } from "@/components/Spinner";
import { downloadBlob } from "@/lib/download-blob";

type MonthOption = { value: string; label: string };

type AttendanceSummaryRow = {
  playerId: string;
  name: string;
  matchesPlayed: number;
  daysPresent: number;
  totalDays: number;
  attendancePct: number;
};

type AttendanceSummaryReport = {
  periodLabel: string;
  totalDays: number;
  rows: AttendanceSummaryRow[];
};

const ALL = "all";

export default function AttendanceSummaryExport() {
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [loadingMonths, setLoadingMonths] = useState(true);
  const [period, setPeriod] = useState<string>(ALL);

  const [summary, setSummary] = useState<AttendanceSummaryReport | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState<string | null>(null);
  const loadingSummary = summaryPeriod !== period;

  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/months")
      .then((res) => res.json())
      .then((data) => {
        setMonths(data);
        setLoadingMonths(false);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const qs = period === ALL ? "" : `?month=${period}`;
    fetch(`/api/attendance/summary${qs}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setSummary(data);
        setSummaryPeriod(period);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  function query(): string {
    return period === ALL ? "" : `?month=${period}`;
  }

  async function handleDownloadCsv() {
    if (!summary) return;
    setDownloadingCsv(true);
    setDownloadError(null);
    try {
      await downloadBlob(
        `/api/attendance/summary/csv${query()}`,
        `shuttlestats-attendance-${summary.periodLabel.replace(/\s+/g, "-").toLowerCase()}.csv`
      );
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingCsv(false);
    }
  }

  async function handleDownloadPdf() {
    if (!summary) return;
    setDownloadingPdf(true);
    setDownloadError(null);
    try {
      await downloadBlob(
        `/api/attendance/summary/pdf${query()}`,
        `shuttlestats-attendance-${summary.periodLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`
      );
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">Monthly Summary &amp; Export</h2>
        {loadingMonths ? (
          <Spinner className="h-4 w-4 text-emerald-600" />
        ) : (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={ALL}>All Time</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {downloadError && <p className="mb-3 text-sm text-red-600">{downloadError}</p>}

      {loadingSummary || !summary ? (
        <LoadingBlock label="Loading summary…" />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {summary.totalDays} session day{summary.totalDays === 1 ? "" : "s"} in {summary.periodLabel}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadCsv}
                disabled={downloadingCsv || summary.rows.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-gray-200 hover:bg-emerald-50 disabled:opacity-50"
              >
                {downloadingCsv && <Spinner className="h-3.5 w-3.5" />}
                {downloadingCsv ? "Preparing…" : "Download CSV"}
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf || summary.rows.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {downloadingPdf && <Spinner className="h-3.5 w-3.5" />}
                {downloadingPdf ? "Preparing…" : "Download PDF"}
              </button>
            </div>
          </div>

          {summary.rows.length === 0 ? (
            <p className="text-sm text-gray-500">No attendance data for this period.</p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              {/* Mobile: stacked cards */}
              <ul className="divide-y divide-gray-100 sm:hidden">
                {summary.rows.map((row) => (
                  <li key={row.playerId} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-gray-900">{row.name}</span>
                      <span className="shrink-0 text-sm text-gray-600">{row.attendancePct}%</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {row.matchesPlayed} match{row.matchesPlayed === 1 ? "" : "es"} played · {row.daysPresent}/
                      {row.totalDays} days present
                    </div>
                  </li>
                ))}
              </ul>

              {/* sm and up: full table */}
              <table className="hidden w-full text-left text-sm sm:table">
                <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 sm:px-4">Player</th>
                    <th className="px-2 py-2 text-center sm:px-3">Matches Played</th>
                    <th className="px-2 py-2 text-center sm:px-3">Days Present</th>
                    <th className="px-3 py-2 text-right sm:px-4">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.rows.map((row) => (
                    <tr key={row.playerId}>
                      <td className="px-3 py-3 font-medium text-gray-900 sm:px-4">{row.name}</td>
                      <td className="px-2 py-3 text-center text-gray-600 sm:px-3">{row.matchesPlayed}</td>
                      <td className="px-2 py-3 text-center text-gray-600 sm:px-3">
                        {row.daysPresent} / {row.totalDays}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-600 sm:px-4">{row.attendancePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
