import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coachMiddleware } from "@/auth/middleware.server";
import { assignSplit } from "./assignments.server";
import { getClientDetail, listClients, upsertClientProfile } from "./clients.server";
import { saveClientProfilePicture } from "./upload.server";

const clientProfileInputSchema = z.object({
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
