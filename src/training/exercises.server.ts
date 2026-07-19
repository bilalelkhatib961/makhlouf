import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { Exercise, ExerciseAsset, ExerciseInput } from "./types";

export interface ExerciseDoc {
  _id: ObjectId;
  name: string;
  description: string;
  muscleGroupId: ObjectId;
  assets: ExerciseAsset[];
  createdAt: Date;
  updatedAt: Date;
}

async function exercisesCollection(): Promise<Collection<ExerciseDoc>> {
  const db = await getDb();
  return db.collection<ExerciseDoc>("exercises");
}

async function muscleGroupNameMap(): Promise<Map<string, string>> {
  const db = await getDb();
  const groups = await db
    .collection<{ _id: ObjectId; name: string }>("muscleGroups")
    .find()
    .toArray();
  return new Map(groups.map((g) => [g._id.toString(), g.name]));
}

function toExercise(doc: ExerciseDoc, muscleGroupName: string): Exercise {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    muscleGroupId: doc.muscleGroupId.toString(),
    muscleGroupName,
    assets: doc.assets,
  };
}

export async function listExercises(): Promise<Exercise[]> {
  const collection = await exercisesCollection();
  const [docs, groupNames] = await Promise.all([
    collection.find().sort({ name: 1 }).toArray(),
    muscleGroupNameMap(),
  ]);
  return docs.map((doc) =>
    toExercise(doc, groupNames.get(doc.muscleGroupId.toString()) ?? "Unknown"),
  );
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const collection = await exercisesCollection();
  const now = new Date();
  const doc: ExerciseDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    description: input.description.trim(),
    muscleGroupId: new ObjectId(input.muscleGroupId),
    assets: input.assets,
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  const groupNames = await muscleGroupNameMap();
  return toExercise(doc, groupNames.get(input.muscleGroupId) ?? "Unknown");
}

export async function updateExercise(id: string, input: ExerciseInput): Promise<void> {
  const collection = await exercisesCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        description: input.description.trim(),
        muscleGroupId: new ObjectId(input.muscleGroupId),
        assets: input.assets,
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Exercise not found");
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDb();
  const exerciseId = new ObjectId(id);

  const splitCount = await db
    .collection("splits")
    .countDocuments({ "days.exercises.exerciseId": exerciseId });
  if (splitCount > 0) {
    throw new Error(
      `Cannot delete this exercise — ${splitCount} split${splitCount === 1 ? "" : "s"} still reference it.`,
    );
  }

  const collection = await exercisesCollection();
  const result = await collection.deleteOne({ _id: exerciseId });
  if (result.deletedCount === 0) throw new Error("Exercise not found");
}
