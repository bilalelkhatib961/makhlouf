import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { MuscleGroup, MuscleGroupInput } from "./types";

export interface MuscleGroupDoc {
  _id: ObjectId;
  name: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

async function muscleGroupsCollection(): Promise<Collection<MuscleGroupDoc>> {
  const db = await getDb();
  return db.collection<MuscleGroupDoc>("muscleGroups");
}

function toMuscleGroup(doc: MuscleGroupDoc): MuscleGroup {
  return { id: doc._id.toString(), name: doc.name, image: doc.image };
}

export async function listMuscleGroups(): Promise<MuscleGroup[]> {
  const collection = await muscleGroupsCollection();
  const docs = await collection.find().sort({ name: 1 }).toArray();
  return docs.map(toMuscleGroup);
}

export async function createMuscleGroup(input: MuscleGroupInput): Promise<MuscleGroup> {
  const collection = await muscleGroupsCollection();
  const now = new Date();
  const doc: MuscleGroupDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    image: input.image,
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  return toMuscleGroup(doc);
}

export async function updateMuscleGroup(id: string, input: MuscleGroupInput): Promise<void> {
  const collection = await muscleGroupsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name: input.name.trim(), image: input.image, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) throw new Error("Muscle group not found");
}

export async function deleteMuscleGroup(id: string): Promise<void> {
  const db = await getDb();
  const groupId = new ObjectId(id);

  const exerciseCount = await db.collection("exercises").countDocuments({ muscleGroupId: groupId });
  if (exerciseCount > 0) {
    throw new Error(
      `Cannot delete this muscle group — ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"} still assigned to it.`,
    );
  }

  const categoryCount = await db
    .collection("muscleCategories")
    .countDocuments({ muscleGroupIds: groupId });
  if (categoryCount > 0) {
    throw new Error(
      `Cannot delete this muscle group — ${categoryCount} muscle categor${categoryCount === 1 ? "y" : "ies"} still reference it.`,
    );
  }

  const collection = await muscleGroupsCollection();
  const result = await collection.deleteOne({ _id: groupId });
  if (result.deletedCount === 0) throw new Error("Muscle group not found");
}
