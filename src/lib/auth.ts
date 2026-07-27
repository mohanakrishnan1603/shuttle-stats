import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/models/User";

export const SESSION_COOKIE_NAME = "shuttlestats_session";
const SESSION_DURATION = "7d";

export type Session = {
  username: string;
  role: UserRole;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(username: string, role: UserRole) {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin" && payload.role !== "viewer") return null;
    return { username: String(payload.username ?? ""), role: payload.role };
  } catch {
    return null;
  }
}
