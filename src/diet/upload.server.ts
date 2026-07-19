import { saveAsset, type MimeMap } from "@/lib/upload.server";

const IMAGE_MIMES: MimeMap = {
  "image/jpeg": { ext: "jpg", type: "image" },
  "image/png": { ext: "png", type: "image" },
  "image/webp": { ext: "webp", type: "image" },
  "image/gif": { ext: "gif", type: "image" },
  "image/svg+xml": { ext: "svg", type: "image" },
};

export async function saveFoodImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported for food images.");
  }
  const asset = await saveAsset(file, "foods", IMAGE_MIMES);
  return asset.url;
}
