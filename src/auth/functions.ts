import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { findUserByEmail, verifyPassword } from "./credentials.server";
import { getAuthSession } from "./session.server";
import type { AppUser } from "./types";

export const getSessionUserFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AppUser | null> => {
    const { userId, email, name, role } = (await getAuthSession()).data;
    if (!userId || !email || !name || !role) return null;
    return { id: userId, email, name, role };
  },
);

export const loginFn = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string().email(), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const user = await findUserByEmail(data.email);
    const passwordMatches = await verifyPassword(user?.passwordHash, data.password);
    if (!user || !passwordMatches) throw new Error("Invalid email or password");

    // Rotate the session on privilege change (fresh login).
    const session = await getAuthSession();
    await session.clear();
    await session.update({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { role: user.role };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAuthSession();
  await session.clear();
  return { ok: true };
});
