import { saveAsset, type MimeMap } from "@/lib/upload.server";
import type { ProductAsset } from "./types";

const IMAGE_MIMES: MimeMap = {
  "image/jpeg": { ext: "jpg", type: "image" },
  "image/png": { ext: "png", type: "image" },
  "image/webp": { ext: "webp", type: "image" },
  "image/gif": { ext: "gif", type: "image" },
  "image/svg+xml": { ext: "svg", type: "image" },
};

export async function saveProductImage(file: File): Promise<ProductAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported right now.");
  }
  return saveAsset(file, "products", IMAGE_MIMES);
}
