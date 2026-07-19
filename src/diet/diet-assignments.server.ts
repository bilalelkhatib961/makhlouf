import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { AssignDietPlanInput, DietPlanAssignment } from "./types";

export interface DietPlanAssignmentDoc {
  _id: ObjectId;
  clientId: ObjectId;
  dietPlanId: ObjectId;
  startDate: Date;
  createdAt: Date;
}

async function assignmentsCollection(): Promise<Collection<DietPlanAssignmentDoc>> {
  const db = await getDb();
  return db.collection<DietPlanAssignmentDoc>("dietPlanAssignments");
}

async function dietPlanNameMap(): Promise<Map<string, string>> {
  const db = await getDb();
  const plans = await db.collection<{ _id: ObjectId; name: string }>("dietPlans").find().toArray();
  return new Map(plans.map((p) => [p._id.toString(), p.name]));
}

export async function listDietPlanAssignmentsForClient(
  clientId: string,
): Promise<DietPlanAssignment[]> {
  const collection = await assignmentsCollection();
  const [docs, planNames] = await Promise.all([
    collection
      .find({ clientId: new ObjectId(clientId) })
      .sort({ startDate: -1, createdAt: -1 })
      .toArray(),
    dietPlanNameMap(),
  ]);

  const assignments: DietPlanAssignment[] = [];
  for (const doc of docs) {
    const name = planNames.get(doc.dietPlanId.toString());
    if (!name) continue; // defensive — diet plans can't currently be deleted while referenced
    assignments.push({
      id: doc._id.toString(),
      dietPlanId: doc.dietPlanId.toString(),
      dietPlanName: name,
      startDate: doc.startDate.toISOString(),
    });
  }
  return assignments;
}

export async function assignDietPlan(input: AssignDietPlanInput): Promise<void> {
  const db = await getDb();
  const clientUser = await db
    .collection("users")
    .findOne({ _id: new ObjectId(input.clientId), role: "client" });
  if (!clientUser) throw new Error("Client not found");

  const dietPlan = await db
    .collection("dietPlans")
    .findOne({ _id: new ObjectId(input.dietPlanId) });
  if (!dietPlan) throw new Error("Diet plan not found");

  const collection = await assignmentsCollection();
  await collection.insertOne({
    _id: new ObjectId(),
    clientId: new ObjectId(input.clientId),
    dietPlanId: new ObjectId(input.dietPlanId),
    startDate: new Date(input.startDate),
    createdAt: new Date(),
  });
}
