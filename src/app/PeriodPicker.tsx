"use client";

import { useRouter } from "next/navigation";

type Option = { value: string; label: string };

export default function PeriodPicker({
  months,
  selected,
  basePath,
}: {
  months: Option[];
  selected: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => {
        const value = e.target.value;
        router.push(value === "all" ? basePath : `${basePath}?month=${value}`);
      }}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700"
    >
      <option value="all">All Time</option>
      {months.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
