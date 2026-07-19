import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { AssignPackageInput, SubscriptionAssignment } from "./types";

export interface SubscriptionAssignmentDoc {
  _id: ObjectId;
  clientId: ObjectId;
  packageId: ObjectId;
  startDate: Date;
  createdAt: Date;
}

async function assignmentsCollection(): Promise<Collection<SubscriptionAssignmentDoc>> {
  const db = await getDb();
  return db.collection<SubscriptionAssignmentDoc>("subscriptionAssignments");
}

async function packageInfoMap(): Promise<
  Map<string, { name: string; price: number; durationMonths: number }>
> {
  const db = await getDb();
  const packages = await db
    .collection<{
      _id: ObjectId;
      name: string;
      price: number;
      durationMonths: number;
    }>("subscriptionPackages")
    .find()
    .toArray();
  return new Map(
    packages.map((p) => [
      p._id.toString(),
      { name: p.name, price: p.price, durationMonths: p.durationMonths },
    ]),
  );
}

export async function listSubscriptionAssignmentsForClient(
  clientId: string,
): Promise<SubscriptionAssignment[]> {
  const collection = await assignmentsCollection();
  const [docs, packageInfo] = await Promise.all([
    collection
      .find({ clientId: new ObjectId(clientId) })
      .sort({ startDate: -1, createdAt: -1 })
      .toArray(),
    packageInfoMap(),
  ]);

  const assignments: SubscriptionAssignment[] = [];
  for (const doc of docs) {
    const info = packageInfo.get(doc.packageId.toString());
    if (!info) continue; // defensive — packages are never deleted, but stay consistent with other domains
    assignments.push({
      id: doc._id.toString(),
      packageId: doc.packageId.toString(),
      packageName: info.name,
      price: info.price,
      durationMonths: info.durationMonths,
      startDate: doc.startDate.toISOString(),
    });
  }
  return assignments;
}

export async function assignPackage(input: AssignPackageInput): Promise<void> {
  const db = await getDb();
  const clientUser = await db
    .collection("users")
    .findOne({ _id: new ObjectId(input.clientId), role: "client" });
  if (!clientUser) throw new Error("Client not found");

  const pkg = await db
    .collection("subscriptionPackages")
    .findOne({ _id: new ObjectId(input.packageId) });
  if (!pkg) throw new Error("Package not found");

  const collection = await assignmentsCollection();
  await collection.insertOne({
    _id: new ObjectId(),
    clientId: new ObjectId(input.clientId),
    packageId: new ObjectId(input.packageId),
    startDate: new Date(input.startDate),
    createdAt: new Date(),
  });
}
