import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Asset, AssetType } from "./assets";

export type MimeMap = Record<string, { ext: string; type: AssetType }>;

export async function saveAsset(file: File, folder: string, allowedMimes: MimeMap): Promise<Asset> {
  const meta = allowedMimes[file.type];
  if (!meta) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.${meta.ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/${folder}/${filename}`, type: meta.type, isPrimary: false };
}
