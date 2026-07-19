import { saveAsset, type MimeMap } from "@/lib/upload.server";
import type { ExerciseAsset } from "./types";

const IMAGE_MIMES: MimeMap = {
  "image/jpeg": { ext: "jpg", type: "image" },
  "image/png": { ext: "png", type: "image" },
  "image/webp": { ext: "webp", type: "image" },
  "image/gif": { ext: "gif", type: "image" },
  "image/svg+xml": { ext: "svg", type: "image" },
};

const EXERCISE_MIMES: MimeMap = {
  ...IMAGE_MIMES,
  "video/mp4": { ext: "mp4", type: "video" },
  "video/webm": { ext: "webm", type: "video" },
  "video/quicktime": { ext: "mov", type: "video" },
};

export async function saveExerciseAsset(file: File): Promise<ExerciseAsset> {
  return saveAsset(file, "exercises", EXERCISE_MIMES);
}

export async function saveMuscleImage(file: File): Promise<ExerciseAsset> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported for muscle groups/categories.");
  }
  return saveAsset(file, "muscles", IMAGE_MIMES);
}
