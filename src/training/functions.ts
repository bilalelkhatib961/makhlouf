import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coachMiddleware } from "@/auth/middleware.server";
import { createExercise, deleteExercise, listExercises, updateExercise } from "./exercises.server";
import {
  createMuscleCategory,
  deleteMuscleCategory,
  listMuscleCategories,
  updateMuscleCategory,
} from "./muscle-categories.server";
import {
  createMuscleGroup,
  deleteMuscleGroup,
  listMuscleGroups,
  updateMuscleGroup,
} from "./muscle-groups.server";
import { createSplit, deleteSplit, listSplits, updateSplit } from "./splits.server";
import { saveExerciseAsset, saveMuscleImage } from "./upload.server";
import { WEEKDAYS } from "./types";

const muscleGroupInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().nullable(),
});

const muscleCategoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().nullable(),
  muscleGroupIds: z.array(z.string().min(1)),
});

const assetSchema = z.object({
  url: z.string().min(1),
  type: z.enum(["image", "file", "video"]),
  isPrimary: z.boolean(),
});

const exerciseInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  muscleGroupId: z.string().min(1, "Muscle group is required"),
  assets: z.array(assetSchema),
});

const splitExerciseInputSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.array(z.number().int().min(0)),
});

const splitDayInputSchema = z.object({
  day: z.enum(WEEKDAYS),
  label: z.string(),
  exercises: z.array(splitExerciseInputSchema),
});

const splitInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  durationWeeks: z.number().int().min(1),
  days: z.array(splitDayInputSchema),
});

// --- Reads (coach-only) ---

export const getCoachMuscleGroupsFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listMuscleGroups());

export const getCoachMuscleCategoriesFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listMuscleCategories());

export const getCoachExercisesFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listExercises());

export const getCoachSplitsFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listSplits());

// --- Muscle group mutations ---

export const createMuscleGroupFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(muscleGroupInputSchema)
  .handler(async ({ data }) => createMuscleGroup(data));

export const updateMuscleGroupFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: muscleGroupInputSchema }))
  .handler(async ({ data }) => updateMuscleGroup(data.id, data.input));

export const deleteMuscleGroupFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteMuscleGroup(data.id));

// --- Muscle category mutations ---

export const createMuscleCategoryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(muscleCategoryInputSchema)
  .handler(async ({ data }) => createMuscleCategory(data));

export const updateMuscleCategoryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: muscleCategoryInputSchema }))
  .handler(async ({ data }) => updateMuscleCategory(data.id, data.input));

export const deleteMuscleCategoryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteMuscleCategory(data.id));

// --- Exercise mutations ---

export const createExerciseFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(exerciseInputSchema)
  .handler(async ({ data }) => createExercise(data));

export const updateExerciseFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: exerciseInputSchema }))
  .handler(async ({ data }) => updateExercise(data.id, data.input));

export const deleteExerciseFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteExercise(data.id));

// --- Split mutations ---

export const createSplitFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(splitInputSchema)
  .handler(async ({ data }) => createSplit(data));

export const updateSplitFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: splitInputSchema }))
  .handler(async ({ data }) => updateSplit(data.id, data.input));

export const deleteSplitFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteSplit(data.id));

// --- Asset upload (coach-only) ---

export const uploadExerciseAssetFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file field named 'file'");
    return file;
  })
  .handler(async ({ data: file }) => saveExerciseAsset(file));

export const uploadMuscleImageFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file field named 'file'");
    return file;
  })
  .handler(async ({ data: file }) => saveMuscleImage(file));
