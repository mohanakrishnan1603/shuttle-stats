"use client";

import { useRouter } from "next/navigation";

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function AttendanceDatePicker({
  selected,
  basePath,
  latestSessionDate,
}: {
  selected: string;
  basePath: string;
  latestSessionDate: string | null;
}) {
  const router = useRouter();
  const today = todayString();

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={selected}
        max={today}
        onChange={(e) => {
          if (e.target.value) router.push(`${basePath}?date=${e.target.value}`);
        }}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
      />
      {selected !== today && (
        <button
          type="button"
          onClick={() => router.push(`${basePath}?date=${today}`)}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
        >
          Today
        </button>
      )}
      {latestSessionDate && selected !== latestSessionDate && latestSessionDate !== today && (
        <button
          type="button"
          onClick={() => router.push(`${basePath}?date=${latestSessionDate}`)}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800"
        >
          Latest session
        </button>
      )}
    </div>
  );
}
