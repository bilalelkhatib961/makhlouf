import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { AssignSplitInput, SplitAssignment } from "./types";

export interface SplitAssignmentDoc {
  _id: ObjectId;
  clientId: ObjectId;
  splitId: ObjectId;
  startDate: Date;
  createdAt: Date;
}

async function assignmentsCollection(): Promise<Collection<SplitAssignmentDoc>> {
  const db = await getDb();
  return db.collection<SplitAssignmentDoc>("splitAssignments");
}

async function splitInfoMap(): Promise<Map<string, { name: string; durationWeeks: number }>> {
  const db = await getDb();
  const splits = await db
    .collection<{ _id: ObjectId; name: string; durationWeeks: number }>("splits")
    .find()
    .toArray();
  return new Map(
    splits.map((s) => [s._id.toString(), { name: s.name, durationWeeks: s.durationWeeks }]),
  );
}

export async function listAssignmentsForClient(clientId: string): Promise<SplitAssignment[]> {
  const collection = await assignmentsCollection();
  const [docs, splitInfo] = await Promise.all([
    collection
      .find({ clientId: new ObjectId(clientId) })
      .sort({ startDate: -1, createdAt: -1 })
      .toArray(),
    splitInfoMap(),
  ]);

  const assignments: SplitAssignment[] = [];
  for (const doc of docs) {
    const info = splitInfo.get(doc.splitId.toString());
    if (!info) continue; // defensive — splits can't currently be deleted while referenced
    assignments.push({
      id: doc._id.toString(),
      splitId: doc.splitId.toString(),
      splitName: info.name,
      durationWeeks: info.durationWeeks,
      startDate: doc.startDate.toISOString(),
    });
  }
  return assignments;
}

export async function assignSplit(input: AssignSplitInput): Promise<void> {
  const db = await getDb();
  const clientUser = await db
    .collection("users")
    .findOne({ _id: new ObjectId(input.clientId), role: "client" });
  if (!clientUser) throw new Error("Client not found");

  const split = await db.collection("splits").findOne({ _id: new ObjectId(input.splitId) });
  if (!split) throw new Error("Split not found");

  const collection = await assignmentsCollection();
  await collection.insertOne({
    _id: new ObjectId(),
    clientId: new ObjectId(input.clientId),
    splitId: new ObjectId(input.splitId),
    startDate: new Date(input.startDate),
    createdAt: new Date(),
  });
}
