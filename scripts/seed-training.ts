// Standalone script — run with `npm run db:seed:training`. Not part of the app bundle.
// Seeds demo muscle groups, muscle categories, exercises, and a few splits so
// the coach Training page isn't empty on first load, and so seed-clients.ts
// has real splits to assign. Reuses the bundled product photos as placeholder
// exercise/muscle images, same trick seed-catalog.ts used.
import { randomUUID } from "node:crypto";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { MongoClient, ObjectId } from "mongodb";

try {
  process.loadEnvFile();
} catch {
  // .env is optional if the vars are already in the environment
}

const ROOT = path.join(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "src", "assets");
const MUSCLES_DIR = path.join(ROOT, "public", "uploads", "muscles");
const EXERCISES_DIR = path.join(ROOT, "public", "uploads", "exercises");
const PLACEHOLDER_PHOTOS = ["product-1.jpg", "product-2.jpg", "product-3.jpg", "product-4.jpg"];

async function placeholderImage(dir: string, index: number): Promise<string> {
  const source = PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length];
  const filename = `${randomUUID()}.jpg`;
  await copyFile(path.join(SOURCE_DIR, source), path.join(dir, filename));
  const folder = path.basename(dir);
  return `/uploads/${folder}/${filename}`;
}

const MUSCLE_GROUP_NAMES = [
  "Biceps — Long Head",
  "Biceps — Short Head",
  "Triceps — Long Head",
  "Triceps — Short Head",
  "Rear Delt",
  "Front Delt",
  "Side Delt",
  "Chest",
  "Upper Back",
  "Lats",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Abs",
] as const;

const MUSCLE_CATEGORIES: Record<string, (typeof MUSCLE_GROUP_NAMES)[number][]> = {
  Arms: [
    "Biceps — Long Head",
    "Biceps — Short Head",
    "Triceps — Long Head",
    "Triceps — Short Head",
  ],
  Shoulders: ["Rear Delt", "Front Delt", "Side Delt"],
  Chest: ["Chest"],
  Back: ["Upper Back", "Lats"],
  Legs: ["Quads", "Hamstrings", "Glutes", "Calves"],
  Core: ["Abs"],
};

interface SeedExercise {
  name: string;
  description: string;
  muscleGroup: (typeof MUSCLE_GROUP_NAMES)[number];
}

const EXERCISES: SeedExercise[] = [
  {
    name: "Incline Dumbbell Curl",
    description: "Isolates the long head of the biceps.",
    muscleGroup: "Biceps — Long Head",
  },
  {
    name: "Biceps Curl",
    description: "Standard standing curl, targets the short head.",
    muscleGroup: "Biceps — Short Head",
  },
  {
    name: "Skull Crushers",
    description: "Lying triceps extension, long head emphasis.",
    muscleGroup: "Triceps — Long Head",
  },
  {
    name: "Rope Pushdown",
    description: "Cable pushdown, short head emphasis.",
    muscleGroup: "Triceps — Short Head",
  },
  {
    name: "Face Pull",
    description: "Rear delt and upper back isolation.",
    muscleGroup: "Rear Delt",
  },
  {
    name: "Overhead Press",
    description: "Compound press, front delt emphasis.",
    muscleGroup: "Front Delt",
  },
  {
    name: "Lateral Raise",
    description: "Dumbbell raise, side delt isolation.",
    muscleGroup: "Side Delt",
  },
  { name: "Bench Press", description: "Compound horizontal press.", muscleGroup: "Chest" },
  {
    name: "T-Bar Row",
    description: "Compound row, upper back emphasis.",
    muscleGroup: "Upper Back",
  },
  { name: "Lat Pulldown", description: "Vertical pull, lat isolation.", muscleGroup: "Lats" },
  { name: "Leg Extension", description: "Isolated quad extension.", muscleGroup: "Quads" },
  { name: "Leg Curl", description: "Isolated hamstring curl.", muscleGroup: "Hamstrings" },
  {
    name: "Hip Thrust",
    description: "Compound glute-focused hip extension.",
    muscleGroup: "Glutes",
  },
  { name: "Standing Calf Raise", description: "Isolated calf raise.", muscleGroup: "Calves" },
  { name: "Cable Crunch", description: "Weighted abdominal crunch.", muscleGroup: "Abs" },
];

interface SeedDay {
  day: string;
  label: string;
  exercises: Array<{ exerciseName: string; sets: number[] }>;
}

interface SeedSplit {
  name: string;
  description: string;
  durationWeeks: number;
  days: SeedDay[];
}

const REST: SeedDay = { day: "", label: "Rest", exercises: [] };
function rest(day: string): SeedDay {
  return { ...REST, day };
}

const SPLITS: SeedSplit[] = [
  {
    name: "Push Pull Legs Arms",
    description: "A 4-day push/pull/legs/arms split with two rest days.",
    durationWeeks: 6,
    days: [
      {
        day: "monday",
        label: "Push Day",
        exercises: [
          { exerciseName: "Bench Press", sets: [12, 10, 8] },
          { exerciseName: "Overhead Press", sets: [12, 10, 8] },
          { exerciseName: "Lateral Raise", sets: [15, 15, 15] },
        ],
      },
      {
        day: "tuesday",
        label: "Pull Day",
        exercises: [
          { exerciseName: "Lat Pulldown", sets: [12, 10, 8] },
          { exerciseName: "T-Bar Row", sets: [12, 10, 8] },
          { exerciseName: "Face Pull", sets: [15, 15, 15] },
        ],
      },
      rest("wednesday"),
      {
        day: "thursday",
        label: "Legs Day",
        exercises: [
          { exerciseName: "Leg Extension", sets: [15, 12, 10] },
          { exerciseName: "Leg Curl", sets: [15, 12, 10] },
          { exerciseName: "Hip Thrust", sets: [12, 10, 8] },
          { exerciseName: "Standing Calf Raise", sets: [15, 15, 15] },
        ],
      },
      {
        day: "friday",
        label: "Arms Day",
        exercises: [
          { exerciseName: "Biceps Curl", sets: [12, 10, 8] },
          { exerciseName: "Incline Dumbbell Curl", sets: [12, 10, 8] },
          { exerciseName: "Skull Crushers", sets: [12, 10, 8] },
          { exerciseName: "Rope Pushdown", sets: [15, 12, 10] },
        ],
      },
      rest("saturday"),
      rest("sunday"),
    ],
  },
  {
    name: "Upper Lower Split",
    description: "A 4-day upper/lower split, twice through each per week.",
    durationWeeks: 8,
    days: [
      {
        day: "monday",
        label: "Upper Body",
        exercises: [
          { exerciseName: "Bench Press", sets: [10, 8, 8] },
          { exerciseName: "Lat Pulldown", sets: [10, 8, 8] },
          { exerciseName: "Overhead Press", sets: [10, 10, 8] },
          { exerciseName: "Biceps Curl", sets: [12, 10, 10] },
        ],
      },
      {
        day: "tuesday",
        label: "Lower Body",
        exercises: [
          { exerciseName: "Leg Extension", sets: [12, 10, 10] },
          { exerciseName: "Leg Curl", sets: [12, 10, 10] },
          { exerciseName: "Hip Thrust", sets: [10, 8, 8] },
          { exerciseName: "Standing Calf Raise", sets: [15, 15, 15] },
        ],
      },
      rest("wednesday"),
      {
        day: "thursday",
        label: "Upper Body",
        exercises: [
          { exerciseName: "T-Bar Row", sets: [10, 8, 8] },
          { exerciseName: "Face Pull", sets: [15, 15, 15] },
          { exerciseName: "Skull Crushers", sets: [12, 10, 10] },
          { exerciseName: "Rope Pushdown", sets: [12, 10, 10] },
        ],
      },
      {
        day: "friday",
        label: "Lower Body",
        exercises: [
          { exerciseName: "Leg Extension", sets: [12, 10, 10] },
          { exerciseName: "Leg Curl", sets: [12, 10, 10] },
          { exerciseName: "Hip Thrust", sets: [10, 8, 8] },
        ],
      },
      rest("saturday"),
      rest("sunday"),
    ],
  },
  {
    name: "Full Body Strength",
    description: "A 3-day full-body strength program for steady progression.",
    durationWeeks: 10,
    days: [
      {
        day: "monday",
        label: "Full Body A",
        exercises: [
          { exerciseName: "Bench Press", sets: [8, 6, 6] },
          { exerciseName: "T-Bar Row", sets: [8, 8, 6] },
          { exerciseName: "Leg Extension", sets: [12, 10, 10] },
        ],
      },
      rest("tuesday"),
      {
        day: "wednesday",
        label: "Full Body B",
        exercises: [
          { exerciseName: "Overhead Press", sets: [8, 6, 6] },
          { exerciseName: "Lat Pulldown", sets: [10, 8, 8] },
          { exerciseName: "Leg Curl", sets: [12, 10, 10] },
        ],
      },
      rest("thursday"),
      {
        day: "friday",
        label: "Full Body C",
        exercises: [
          { exerciseName: "Bench Press", sets: [6, 6, 6] },
          { exerciseName: "T-Bar Row", sets: [8, 8, 8] },
          { exerciseName: "Hip Thrust", sets: [10, 8, 8] },
        ],
      },
      rest("saturday"),
      rest("sunday"),
    ],
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is required");

  await mkdir(MUSCLES_DIR, { recursive: true });
  await mkdir(EXERCISES_DIR, { recursive: true });

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(process.env.MONGODB_DB_NAME ?? "makhlouf");
    const muscleGroups = db.collection("muscleGroups");
    const muscleCategories = db.collection("muscleCategories");
    const exercises = db.collection("exercises");
    const splits = db.collection("splits");

    // Muscle groups — idempotent, matched by name.
    const muscleGroupIds = new Map<string, ObjectId>();
    let imgIndex = 0;
    for (const name of MUSCLE_GROUP_NAMES) {
      const existing = await muscleGroups.findOne({ name });
      if (existing) {
        muscleGroupIds.set(name, existing._id);
        continue;
      }
      const now = new Date();
      const image = await placeholderImage(MUSCLES_DIR, imgIndex++);
      const result = await muscleGroups.insertOne({ name, image, createdAt: now, updatedAt: now });
      muscleGroupIds.set(name, result.insertedId);
    }

    // Muscle categories — idempotent, matched by name.
    for (const [name, groupNames] of Object.entries(MUSCLE_CATEGORIES)) {
      const groupIds = groupNames.map((g) => muscleGroupIds.get(g)!);
      const existing = await muscleCategories.findOne({ name });
      if (existing) {
        await muscleCategories.updateOne(
          { _id: existing._id },
          { $set: { muscleGroupIds: groupIds, updatedAt: new Date() } },
        );
        continue;
      }
      const now = new Date();
      const image = await placeholderImage(MUSCLES_DIR, imgIndex++);
      await muscleCategories.insertOne({
        name,
        image,
        muscleGroupIds: groupIds,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Exercises — demo data, safe to fully replace rather than migrate on schema changes.
    await exercises.deleteMany({});
    await splits.deleteMany({});

    const exerciseIds = new Map<string, ObjectId>();
    let exImgIndex = 0;
    for (const exercise of EXERCISES) {
      const now = new Date();
      const image = await placeholderImage(EXERCISES_DIR, exImgIndex++);
      const result = await exercises.insertOne({
        name: exercise.name,
        description: exercise.description,
        muscleGroupId: muscleGroupIds.get(exercise.muscleGroup)!,
        assets: [{ url: image, type: "image", isPrimary: true }],
        createdAt: now,
        updatedAt: now,
      });
      exerciseIds.set(exercise.name, result.insertedId);
    }

    for (const split of SPLITS) {
      const now = new Date();
      await splits.insertOne({
        name: split.name,
        description: split.description,
        durationWeeks: split.durationWeeks,
        days: split.days.map((day) => ({
          day: day.day,
          label: day.label,
          exercises: day.exercises.map((e) => ({
            exerciseId: exerciseIds.get(e.exerciseName)!,
            sets: e.sets,
          })),
        })),
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(
      `Seeded ${MUSCLE_GROUP_NAMES.length} muscle groups, ${Object.keys(MUSCLE_CATEGORIES).length} muscle categories, ${EXERCISES.length} exercises, and ${SPLITS.length} splits.`,
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
