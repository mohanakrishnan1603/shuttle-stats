"use client";

import { useRouter } from "next/navigation";

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

  return (
    <select
      value={selected}
      onChange={(e) => {
        const value = e.target.value;
        router.push(`${basePath}?month=${month}&view=${value}`);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
    >
      <option value="points">Points Table</option>
      <option value="winrate">Win / Loss %</option>
    </select>
  );
}
