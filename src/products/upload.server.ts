import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProductAsset } from "./types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function saveProductImage(file: File): Promise<ProductAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported right now.");
  }
  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    throw new Error(`Unsupported image type: ${file.type}`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return { url: `/uploads/products/${filename}`, type: "image", isPrimary: false };
}
