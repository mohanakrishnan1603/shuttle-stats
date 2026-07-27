"use client";

import { createContext, useContext } from "react";
import type { UserRole } from "@/lib/models/User";

type SessionContextValue = {
  username: string;
  role: UserRole;
  isAdmin: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  username,
  role,
  children,
}: {
  username: string;
  role: UserRole;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={{ username, role, isAdmin: role === "admin" }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
