import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware, coachMiddleware } from "@/auth/middleware.server";
import { updateUserName } from "@/auth/credentials.server";
import { getAuthSession } from "@/auth/session.server";
import { assignSplit } from "./assignments.server";
import { getClientDetail, getOwnProfile, listClients, upsertClientProfile } from "./clients.server";
import { saveClientProfilePicture } from "./upload.server";

export const clientProfileInputSchema = z.object({
  dob: z.string().nullable(),
  weight: z.number().min(0).nullable(),
  height: z.number().min(0).nullable(),
  phone: z.string().nullable(),
  nationality: z.string().nullable(),
  profilePicture: z.string().nullable(),
});

const assignSplitInputSchema = z.object({
  clientId: z.string().min(1),
  splitId: z.string().min(1),
  startDate: z.string().min(1),
});

// --- Reads (coach-only) ---

export const getCoachClientsFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listClients());

export const getCoachClientDetailFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .validator(z.object({ clientId: z.string().min(1) }))
  .handler(async ({ data }) => getClientDetail(data.clientId));

// --- Mutations (coach-only) ---

export const updateClientProfileFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ clientId: z.string().min(1), input: clientProfileInputSchema }))
  .handler(async ({ data }) => upsertClientProfile(data.clientId, data.input));

export const assignSplitFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(assignSplitInputSchema)
  .handler(async ({ data }) => assignSplit(data));

// --- Asset upload (coach-only) ---

export const uploadClientProfilePictureFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file field named 'file'");
    return file;
  })
  .handler(async ({ data: file }) => ({ url: await saveClientProfilePicture(file) }));

// Public — a join-flow visitor has no session yet, so this can't sit behind
// authMiddleware. Only writes a file to disk and returns its URL, no DB
// write, same low-risk shape as every other upload endpoint in this app.
export const uploadJoinProfilePictureFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file field named 'file'");
    return file;
  })
  .handler(async ({ data: file }) => ({ url: await saveClientProfilePicture(file) }));

// --- Self-service (client-only, own account) ---

export const getOwnClientProfileFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getOwnProfile(context.user.id));

const updateOwnProfileInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  profile: clientProfileInputSchema,
});

export const updateOwnClientProfileFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateOwnProfileInputSchema)
  .handler(async ({ data, context }) => {
    await upsertClientProfile(context.user.id, data.profile);
    await updateUserName(context.user.id, data.name);

    const session = await getAuthSession();
    await session.update({
      userId: context.user.id,
      email: context.user.email,
      name: data.name,
      role: context.user.role,
    });
  });

export const uploadOwnProfilePictureFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file field named 'file'");
    return file;
  })
  .handler(async ({ data: file }) => ({ url: await saveClientProfilePicture(file) }));
