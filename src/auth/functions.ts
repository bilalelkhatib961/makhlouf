import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { upsertClientProfile } from "@/clients/clients.server";
import { clientProfileInputSchema } from "@/clients/functions";
import { assignPackage } from "@/subscriptions/assignments.server";
import { createClientUser, findUserByEmail, verifyPassword } from "./credentials.server";
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

export const joinFn = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        packageId: z.string().min(1, "Please choose a package"),
        phone: z.string().min(1, "Phone number is required"),
      })
      .merge(clientProfileInputSchema.omit({ phone: true })),
  )
  .handler(async ({ data }) => {
    const user = await createClientUser(data.email, data.name, data.password);
    await upsertClientProfile(user.id, {
      dob: data.dob,
      weight: data.weight,
      height: data.height,
      phone: data.phone,
      nationality: data.nationality,
      profilePicture: data.profilePicture,
    });
    await assignPackage({
      clientId: user.id,
      packageId: data.packageId,
      startDate: new Date().toISOString(),
    });

    const session = await getAuthSession();
    await session.clear();
    await session.update({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return { role: user.role };
  });
