import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { Meal, MealFoodItem, MealInput } from "./types";

export interface MealFoodDoc {
  foodId: ObjectId;
  quantityGrams: number;
}

export interface MealDoc {
  _id: ObjectId;
  name: string;
  foods: MealFoodDoc[];
  createdAt: Date;
  updatedAt: Date;
}

interface FoodInfo {
  name: string;
  caloriesPer100g: number;
  carbsPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
}

async function mealsCollection(): Promise<Collection<MealDoc>> {
  const db = await getDb();
  return db.collection<MealDoc>("meals");
}

async function foodInfoMap(): Promise<Map<string, FoodInfo>> {
  const db = await getDb();
  const foods = await db
    .collection<{
      _id: ObjectId;
      name: string;
      caloriesPer100g: number;
      carbsPer100g: number;
      proteinPer100g: number;
      fatPer100g: number;
    }>("foods")
    .find()
    .toArray();
  return new Map(
    foods.map((f) => [
      f._id.toString(),
      {
        name: f.name,
        caloriesPer100g: f.caloriesPer100g,
        carbsPer100g: f.carbsPer100g,
        proteinPer100g: f.proteinPer100g,
        fatPer100g: f.fatPer100g,
      },
    ]),
  );
}

function toMeal(doc: MealDoc, foodInfo: Map<string, FoodInfo>): Meal {
  const foods: MealFoodItem[] = [];
  for (const item of doc.foods) {
    const info = foodInfo.get(item.foodId.toString());
    if (!info) continue; // defensive — foods can't currently be deleted while referenced
    foods.push({
      foodId: item.foodId.toString(),
      foodName: info.name,
      quantityGrams: item.quantityGrams,
      caloriesPer100g: info.caloriesPer100g,
      carbsPer100g: info.carbsPer100g,
      proteinPer100g: info.proteinPer100g,
      fatPer100g: info.fatPer100g,
    });
  }
  return { id: doc._id.toString(), name: doc.name, foods };
}

export async function listMeals(): Promise<Meal[]> {
  const collection = await mealsCollection();
  const [docs, foodInfo] = await Promise.all([
    collection.find().sort({ name: 1 }).toArray(),
    foodInfoMap(),
  ]);
  return docs.map((doc) => toMeal(doc, foodInfo));
}

function toFoodDocs(input: MealInput): MealFoodDoc[] {
  return input.foods.map((f) => ({
    foodId: new ObjectId(f.foodId),
    quantityGrams: f.quantityGrams,
  }));
}

export async function createMeal(input: MealInput): Promise<Meal> {
  const collection = await mealsCollection();
  const now = new Date();
  const doc: MealDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    foods: toFoodDocs(input),
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  const foodInfo = await foodInfoMap();
  return toMeal(doc, foodInfo);
}

export async function updateMeal(id: string, input: MealInput): Promise<void> {
  const collection = await mealsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        foods: toFoodDocs(input),
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Meal not found");
}

export async function deleteMeal(id: string): Promise<void> {
  const db = await getDb();
  const mealId = new ObjectId(id);

  const planCount = await db.collection("dietPlans").countDocuments({ "days.mealIds": mealId });
  if (planCount > 0) {
    throw new Error(
      `Cannot delete this meal — ${planCount} diet plan${planCount === 1 ? "" : "s"} still reference it.`,
    );
  }

  const collection = await mealsCollection();
  const result = await collection.deleteOne({ _id: mealId });
  if (result.deletedCount === 0) throw new Error("Meal not found");
}
