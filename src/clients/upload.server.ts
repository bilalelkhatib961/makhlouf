import { saveAsset, type MimeMap } from "@/lib/upload.server";

const IMAGE_MIMES: MimeMap = {
  "image/jpeg": { ext: "jpg", type: "image" },
  "image/png": { ext: "png", type: "image" },
  "image/webp": { ext: "webp", type: "image" },
  "image/gif": { ext: "gif", type: "image" },
  "image/svg+xml": { ext: "svg", type: "image" },
};

export async function saveClientProfilePicture(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported for profile pictures.");
  }
  const asset = await saveAsset(file, "clients", IMAGE_MIMES);
  return asset.url;
}
