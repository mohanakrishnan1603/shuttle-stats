"use client";

import { useLinkStatus } from "next/link";
import { Spinner } from "@/components/Spinner";

export function LinkPendingSpinner({ className = "h-3 w-3" }: { className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Spinner className={className} />;
}
