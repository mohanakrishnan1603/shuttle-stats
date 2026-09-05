"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APP_VERSION } from "@/lib/version";
import { Spinner } from "@/components/Spinner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }

    // Keep the button in its loading state through the redirect — it either
    // unmounts on navigation or the page refreshes, so it never needs to reset.
    router.push(searchParams.get("next") ?? "/admin/matches");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <div className="flex flex-1 items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
        >
          <h1 className="mb-1 text-xl font-semibold text-gray-900">Admin Login</h1>
          <p className="mb-6 text-sm text-gray-500">ShuttleStats admin access</p>

          <label className="mb-1 block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            autoFocus
            autoCapitalize="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading && <Spinner className="h-4 w-4" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
      <footer className="px-4 py-4 text-center text-xs text-gray-400">
        ShuttleStats v{APP_VERSION}
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
