import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { Food, FoodInput } from "./types";

export interface FoodDoc {
  _id: ObjectId;
  name: string;
  image: string | null;
  caloriesPer100g: number;
  carbsPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  createdAt: Date;
  updatedAt: Date;
}

async function foodsCollection(): Promise<Collection<FoodDoc>> {
  const db = await getDb();
  return db.collection<FoodDoc>("foods");
}

function toFood(doc: FoodDoc): Food {
  return {
    id: doc._id.toString(),
    name: doc.name,
    image: doc.image,
    caloriesPer100g: doc.caloriesPer100g,
    carbsPer100g: doc.carbsPer100g,
    proteinPer100g: doc.proteinPer100g,
    fatPer100g: doc.fatPer100g,
  };
}

export async function listFoods(): Promise<Food[]> {
  const collection = await foodsCollection();
  const docs = await collection.find().sort({ name: 1 }).toArray();
  return docs.map(toFood);
}

export async function createFood(input: FoodInput): Promise<Food> {
  const collection = await foodsCollection();
  const now = new Date();
  const doc: FoodDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    image: input.image,
    caloriesPer100g: input.caloriesPer100g,
    carbsPer100g: input.carbsPer100g,
    proteinPer100g: input.proteinPer100g,
    fatPer100g: input.fatPer100g,
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  return toFood(doc);
}

export async function updateFood(id: string, input: FoodInput): Promise<void> {
  const collection = await foodsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        image: input.image,
        caloriesPer100g: input.caloriesPer100g,
        carbsPer100g: input.carbsPer100g,
        proteinPer100g: input.proteinPer100g,
        fatPer100g: input.fatPer100g,
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Food not found");
}

export async function deleteFood(id: string): Promise<void> {
  const db = await getDb();
  const foodId = new ObjectId(id);

  const mealCount = await db.collection("meals").countDocuments({ "foods.foodId": foodId });
  if (mealCount > 0) {
    throw new Error(
      `Cannot delete this food — ${mealCount} meal${mealCount === 1 ? "" : "s"} still reference it.`,
    );
  }

  const collection = await foodsCollection();
  const result = await collection.deleteOne({ _id: foodId });
  if (result.deletedCount === 0) throw new Error("Food not found");
}
