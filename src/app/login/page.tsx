"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }

    router.push(searchParams.get("next") ?? "/admin/matches");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
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
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
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
