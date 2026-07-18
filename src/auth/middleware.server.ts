import { createMiddleware } from "@tanstack/react-start";
import { getAuthSession } from "./session.server";
import type { AppUser } from "./types";

// Attach to any future createServerFn that reads/writes private data, e.g.:
//   createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(...)
// A route's beforeLoad redirect only guards page UX — it does not protect the
// server function itself, since the RPC endpoint is reachable directly.
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { userId, email, name, role } = (await getAuthSession()).data;
  if (!userId || !email || !name || !role) throw new Error("Unauthorized");

  const user: AppUser = { id: userId, email, name, role };

  return next({ context: { user } });
});
