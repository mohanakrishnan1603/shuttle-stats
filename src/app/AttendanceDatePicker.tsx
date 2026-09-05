"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/Spinner";

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
  const [isPending, startTransition] = useTransition();
  const today = todayString();

  function go(date: string) {
    startTransition(() => {
      router.push(`${basePath}?date=${date}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={selected}
        max={today}
        disabled={isPending}
        onChange={(e) => {
          if (e.target.value) go(e.target.value);
        }}
        className="rounded-lg border border-gray-300 px-2 py-1 text-sm disabled:opacity-60"
      />
      {selected !== today && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => go(today)}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-60"
        >
          Today
        </button>
      )}
      {latestSessionDate && selected !== latestSessionDate && latestSessionDate !== today && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => go(latestSessionDate)}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800 disabled:opacity-60"
        >
          Latest session
        </button>
      )}
      {isPending && <Spinner className="h-4 w-4 shrink-0 text-emerald-600" />}
    </div>
  );
}
