import type { Asset } from "@/lib/assets";

export type ExerciseAsset = Asset;

export interface MuscleGroup {
  id: string;
  name: string;
  image: string | null;
}

export interface MuscleGroupInput {
  name: string;
  image: string | null;
}

export interface MuscleCategory {
  id: string;
  name: string;
  image: string | null;
  muscleGroupIds: string[];
}

export interface MuscleCategoryInput {
  name: string;
  image: string | null;
  muscleGroupIds: string[];
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  muscleGroupId: string;
  muscleGroupName: string;
  assets: ExerciseAsset[];
}

export interface ExerciseInput {
  name: string;
  description: string;
  muscleGroupId: string;
  assets: ExerciseAsset[];
}

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export interface SplitExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number[];
}

export interface SplitExerciseInput {
  exerciseId: string;
  sets: number[];
}

export interface SplitDay {
  day: Weekday;
  label: string;
  exercises: SplitExercise[];
}

export interface SplitDayInput {
  day: Weekday;
  label: string;
  exercises: SplitExerciseInput[];
}

export interface Split {
  id: string;
  name: string;
  description: string;
  durationWeeks: number;
  days: SplitDay[];
}

export interface SplitInput {
  name: string;
  description: string;
  durationWeeks: number;
  days: SplitDayInput[];
}
