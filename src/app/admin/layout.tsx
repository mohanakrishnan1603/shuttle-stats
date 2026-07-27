import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { APP_VERSION } from "@/lib/version";
import { SessionProvider } from "@/lib/session-context";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.role === "admin";

  return (
    <SessionProvider username={session.username} role={session.role}>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <nav className="flex gap-4 text-sm font-medium text-gray-600">
              <Link href="/admin/leaderboard" className="hover:text-emerald-600">
                Leaderboard
              </Link>
              <Link href="/admin/matches" className="hover:text-emerald-600">
                Matches
              </Link>
              <Link href="/admin/players" className="hover:text-emerald-600">
                Players
              </Link>
              {isAdmin && (
                <Link href="/admin/report" className="hover:text-emerald-600">
                  Report
                </Link>
              )}
            </nav>
            <LogoutButton />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-3xl px-4 py-4 text-center text-xs text-gray-400">
          ShuttleStats v{APP_VERSION}
        </footer>
      </div>
    </SessionProvider>
  );
}
