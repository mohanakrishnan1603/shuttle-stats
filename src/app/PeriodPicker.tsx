"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/Spinner";

type Option = { value: string; label: string };

export default function PeriodPicker({
  months,
  selected,
  basePath,
  view,
}: {
  months: Option[];
  selected: string;
  basePath: string;
  view?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={selected}
        disabled={isPending}
        onChange={(e) => {
          const value = e.target.value;
          startTransition(() => {
            router.push(`${basePath}?month=${value}${view ? `&view=${view}` : ""}`);
          });
        }}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-60"
      >
        <option value="all">All Time</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      {isPending && <Spinner className="h-4 w-4 shrink-0 text-emerald-600" />}
    </div>
  );
}
