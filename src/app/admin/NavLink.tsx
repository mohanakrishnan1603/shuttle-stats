"use client";

import Link from "next/link";
import { LinkPendingSpinner } from "@/components/LinkPendingSpinner";

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-1.5 hover:text-emerald-600">
      <span>{children}</span>
      <LinkPendingSpinner className="h-3 w-3 text-emerald-600" />
    </Link>
  );
}
