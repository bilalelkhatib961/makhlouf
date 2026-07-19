import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import { WEEKDAYS } from "@/training/types";
import type { Weekday } from "@/training/types";
import type { DietPlan, DietPlanDay, DietPlanDayInput, DietPlanInput } from "./types";

export interface DietPlanDayDoc {
  day: Weekday;
  label: string;
  mealIds: ObjectId[];
}

export interface DietPlanDoc {
  _id: ObjectId;
  name: string;
  description: string;
  days: DietPlanDayDoc[];
  createdAt: Date;
  updatedAt: Date;
}

async function dietPlansCollection(): Promise<Collection<DietPlanDoc>> {
  const db = await getDb();
  return db.collection<DietPlanDoc>("dietPlans");
}

async function mealNameMap(): Promise<Map<string, string>> {
  const db = await getDb();
  const meals = await db.collection<{ _id: ObjectId; name: string }>("meals").find().toArray();
  return new Map(meals.map((m) => [m._id.toString(), m.name]));
}

function toDietPlanDay(doc: DietPlanDayDoc, mealNames: Map<string, string>): DietPlanDay {
  return {
    day: doc.day,
    label: doc.label,
    meals: doc.mealIds
      .filter((id) => mealNames.has(id.toString()))
      .map((id) => ({ mealId: id.toString(), mealName: mealNames.get(id.toString())! })),
  };
}

function toDietPlan(doc: DietPlanDoc, mealNames: Map<string, string>): DietPlan {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    days: doc.days.map((d) => toDietPlanDay(d, mealNames)),
  };
}

function toDayDoc(input: DietPlanDayInput): DietPlanDayDoc {
  return {
    day: input.day,
    label: input.label.trim(),
    mealIds: input.mealIds.map((id) => new ObjectId(id)),
  };
}

function normalizeDays(input: DietPlanDayInput[]): DietPlanDayDoc[] {
  const byDay = new Map(input.map((d) => [d.day, d]));
  return WEEKDAYS.map((day) => {
    const match = byDay.get(day);
    return match ? toDayDoc(match) : { day, label: "", mealIds: [] };
  });
}

export async function listDietPlans(): Promise<DietPlan[]> {
  const collection = await dietPlansCollection();
  const [docs, mealNames] = await Promise.all([
    collection.find().sort({ name: 1 }).toArray(),
    mealNameMap(),
  ]);
  return docs.map((doc) => toDietPlan(doc, mealNames));
}

export async function createDietPlan(input: DietPlanInput): Promise<DietPlan> {
  const collection = await dietPlansCollection();
  const now = new Date();
  const doc: DietPlanDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    description: input.description.trim(),
    days: normalizeDays(input.days),
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  const mealNames = await mealNameMap();
  return toDietPlan(doc, mealNames);
}

export async function updateDietPlan(id: string, input: DietPlanInput): Promise<void> {
  const collection = await dietPlansCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        description: input.description.trim(),
        days: normalizeDays(input.days),
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Diet plan not found");
}

export async function deleteDietPlan(id: string): Promise<void> {
  const db = await getDb();
  const dietPlanId = new ObjectId(id);

  const assignmentCount = await db.collection("dietPlanAssignments").countDocuments({ dietPlanId });
  if (assignmentCount > 0) {
    throw new Error(
      `Cannot delete this diet plan — ${assignmentCount} client${assignmentCount === 1 ? " has" : "s have"} it assigned.`,
    );
  }

  const collection = await dietPlansCollection();
  const result = await collection.deleteOne({ _id: dietPlanId });
  if (result.deletedCount === 0) throw new Error("Diet plan not found");
}
