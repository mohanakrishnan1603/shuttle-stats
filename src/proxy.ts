import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const PROTECTED_API_PREFIXES = ["/api/players", "/api/matches", "/api/stats", "/api/months", "/api/og", "/api/reports"];
const PLAYERS_OR_MATCHES_API_PREFIXES = ["/api/players", "/api/matches"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const isAdminPage = pathname.startsWith("/admin");
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isAdminPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (isAdminPage) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.role === "admin";
  const isReportRoute = pathname.startsWith("/admin/report") || pathname.startsWith("/api/reports");
  const isPlayersOrMatchesWrite =
    PLAYERS_OR_MATCHES_API_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && method !== "GET";

  const requiresAdmin = isReportRoute || isPlayersOrMatchesWrite;

  if (requiresAdmin && !isAdmin) {
    if (isAdminPage) {
      return NextResponse.redirect(new URL("/admin/leaderboard", request.url));
    }
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/players/:path*",
    "/api/matches/:path*",
    "/api/stats/:path*",
    "/api/months/:path*",
    "/api/og/:path*",
    "/api/reports/:path*",
  ],
};
