import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coachMiddleware } from "@/auth/middleware.server";
import {
  createGallery,
  deleteGallery,
  listGalleriesAdmin,
  listGalleriesPublic,
  updateGallery,
} from "./galleries.server";
import { saveGalleryImage } from "./upload.server";

const galleryImageSchema = z.object({ url: z.string().min(1) });

const galleryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  images: z.array(galleryImageSchema),
  showOnLandingPage: z.boolean(),
});

// --- Reads ---

export const getPublicGalleriesFn = createServerFn({ method: "GET" })
  .validator(z.object({ onlyLandingPage: z.boolean() }))
  .handler(async ({ data }) => listGalleriesPublic(data.onlyLandingPage));

export const getCoachGalleriesFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listGalleriesAdmin());

// --- Mutations (coach-only) ---

export const createGalleryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(galleryInputSchema)
  .handler(async ({ data }) => createGallery(data));

export const updateGalleryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: galleryInputSchema }))
  .handler(async ({ data }) => updateGallery(data.id, data.input));

export const deleteGalleryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteGallery(data.id));

// --- Asset upload (coach-only) ---

export const uploadGalleryImageFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file field named 'file'");
    return file;
  })
  .handler(async ({ data: file }) => ({ url: await saveGalleryImage(file) }));
