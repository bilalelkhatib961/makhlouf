import { useSession } from "@tanstack/react-start/server";
import type { UserRole } from "./types";

export interface AuthSessionData {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export function getAuthSession() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET env var is required");

  // Not a React hook — TanStack Start's server-only session helper just uses
  // the "use" prefix by convention (h3/Nuxt-style), callable from any async
  // server function handler.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSession<AuthSessionData>({
    password,
    name: "makhlouf_session",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
