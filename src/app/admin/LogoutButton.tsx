"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Spinner } from "@/components/Spinner";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 disabled:opacity-60"
    >
      {isPending && <Spinner className="h-3.5 w-3.5" />}
      {isPending ? "Logging out…" : "Log out"}
    </button>
  );
}
