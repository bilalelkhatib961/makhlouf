import { saveAsset, type MimeMap } from "@/lib/upload.server";

const IMAGE_MIMES: MimeMap = {
  "image/jpeg": { ext: "jpg", type: "image" },
  "image/png": { ext: "png", type: "image" },
  "image/webp": { ext: "webp", type: "image" },
  "image/gif": { ext: "gif", type: "image" },
  "image/svg+xml": { ext: "svg", type: "image" },
};

export async function saveGalleryImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported for gallery images.");
  }
  const asset = await saveAsset(file, "galleries", IMAGE_MIMES);
  return asset.url;
}
