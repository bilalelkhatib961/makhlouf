import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import { WEEKDAYS } from "./types";
import type { Split, SplitDay, SplitDayInput, SplitInput, Weekday } from "./types";

export interface SplitExerciseDoc {
  exerciseId: ObjectId;
  sets: number[];
}

export interface SplitDayDoc {
  day: Weekday;
  label: string;
  exercises: SplitExerciseDoc[];
}

export interface SplitDoc {
  _id: ObjectId;
  name: string;
  description: string;
  durationWeeks: number;
  days: SplitDayDoc[];
  createdAt: Date;
  updatedAt: Date;
}

async function splitsCollection(): Promise<Collection<SplitDoc>> {
  const db = await getDb();
  return db.collection<SplitDoc>("splits");
}

async function exerciseNameMap(): Promise<Map<string, string>> {
  const db = await getDb();
  const exercises = await db
    .collection<{ _id: ObjectId; name: string }>("exercises")
    .find()
    .toArray();
  return new Map(exercises.map((e) => [e._id.toString(), e.name]));
}

function toSplitDay(doc: SplitDayDoc, exerciseNames: Map<string, string>): SplitDay {
  return {
    day: doc.day,
    label: doc.label,
    exercises: doc.exercises.map((e) => ({
      exerciseId: e.exerciseId.toString(),
      exerciseName: exerciseNames.get(e.exerciseId.toString()) ?? "Unknown",
      sets: e.sets,
    })),
  };
}

function toSplit(doc: SplitDoc, exerciseNames: Map<string, string>): Split {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    durationWeeks: doc.durationWeeks,
    days: doc.days.map((d) => toSplitDay(d, exerciseNames)),
  };
}

function toDayDoc(input: SplitDayInput): SplitDayDoc {
  return {
    day: input.day,
    label: input.label.trim(),
    exercises: input.exercises.map((e) => ({
      exerciseId: new ObjectId(e.exerciseId),
      sets: e.sets,
    })),
  };
}

function normalizeDays(input: SplitInput["days"]): SplitDayDoc[] {
  const byDay = new Map(input.map((d) => [d.day, d]));
  return WEEKDAYS.map((day) => {
    const match = byDay.get(day);
    return match ? toDayDoc(match) : { day, label: "", exercises: [] };
  });
}

export async function listSplits(): Promise<Split[]> {
  const collection = await splitsCollection();
  const [docs, exerciseNames] = await Promise.all([
    collection.find().sort({ name: 1 }).toArray(),
    exerciseNameMap(),
  ]);
  return docs.map((doc) => toSplit(doc, exerciseNames));
}

export async function createSplit(input: SplitInput): Promise<Split> {
  const collection = await splitsCollection();
  const now = new Date();
  const doc: SplitDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    description: input.description.trim(),
    durationWeeks: input.durationWeeks,
    days: normalizeDays(input.days),
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  const exerciseNames = await exerciseNameMap();
  return toSplit(doc, exerciseNames);
}

export async function updateSplit(id: string, input: SplitInput): Promise<void> {
  const collection = await splitsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        description: input.description.trim(),
        durationWeeks: input.durationWeeks,
        days: normalizeDays(input.days),
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Split not found");
}

export async function deleteSplit(id: string): Promise<void> {
  const db = await getDb();
  const splitId = new ObjectId(id);

  const assignmentCount = await db.collection("splitAssignments").countDocuments({ splitId });
  if (assignmentCount > 0) {
    throw new Error(
      `Cannot delete this split — ${assignmentCount} client${assignmentCount === 1 ? " has" : "s have"} it assigned.`,
    );
  }

  const collection = await splitsCollection();
  const result = await collection.deleteOne({ _id: splitId });
  if (result.deletedCount === 0) throw new Error("Split not found");
}
