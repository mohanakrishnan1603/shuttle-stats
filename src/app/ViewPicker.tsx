"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/Spinner";

export default function ViewPicker({
  selected,
  basePath,
  month,
}: {
  selected: string;
  basePath: string;
  month: string;
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
            router.push(`${basePath}?month=${month}&view=${value}`);
          });
        }}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-60"
      >
        <option value="points">Points Table</option>
        <option value="winrate">Win / Loss %</option>
      </select>
      {isPending && <Spinner className="h-4 w-4 shrink-0 text-emerald-600" />}
    </div>
  );
}
