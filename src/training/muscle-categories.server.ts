import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { MuscleCategory, MuscleCategoryInput } from "./types";

export interface MuscleCategoryDoc {
  _id: ObjectId;
  name: string;
  image: string | null;
  muscleGroupIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

async function muscleCategoriesCollection(): Promise<Collection<MuscleCategoryDoc>> {
  const db = await getDb();
  return db.collection<MuscleCategoryDoc>("muscleCategories");
}

function toMuscleCategory(doc: MuscleCategoryDoc): MuscleCategory {
  return {
    id: doc._id.toString(),
    name: doc.name,
    image: doc.image,
    muscleGroupIds: doc.muscleGroupIds.map((id) => id.toString()),
  };
}

export async function listMuscleCategories(): Promise<MuscleCategory[]> {
  const collection = await muscleCategoriesCollection();
  const docs = await collection.find().sort({ name: 1 }).toArray();
  return docs.map(toMuscleCategory);
}

export async function createMuscleCategory(input: MuscleCategoryInput): Promise<MuscleCategory> {
  const collection = await muscleCategoriesCollection();
  const now = new Date();
  const doc: MuscleCategoryDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    image: input.image,
    muscleGroupIds: input.muscleGroupIds.map((id) => new ObjectId(id)),
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  return toMuscleCategory(doc);
}

export async function updateMuscleCategory(id: string, input: MuscleCategoryInput): Promise<void> {
  const collection = await muscleCategoriesCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        image: input.image,
        muscleGroupIds: input.muscleGroupIds.map((id) => new ObjectId(id)),
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Muscle category not found");
}

export async function deleteMuscleCategory(id: string): Promise<void> {
  const collection = await muscleCategoriesCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) throw new Error("Muscle category not found");
}
