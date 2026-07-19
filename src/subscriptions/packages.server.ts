import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { PackageSlug, SubscriptionPackage } from "./types";

export interface SubscriptionPackageDoc {
  _id: ObjectId;
  slug: PackageSlug;
  name: string;
  price: number;
  durationMonths: number;
  benefits: string[];
  createdAt: Date;
  updatedAt: Date;
}

async function packagesCollection(): Promise<Collection<SubscriptionPackageDoc>> {
  const db = await getDb();
  return db.collection<SubscriptionPackageDoc>("subscriptionPackages");
}

function toPackage(doc: SubscriptionPackageDoc): SubscriptionPackage {
  return {
    id: doc._id.toString(),
    slug: doc.slug,
    name: doc.name,
    price: doc.price,
    durationMonths: doc.durationMonths,
    benefits: doc.benefits,
  };
}

export async function listPackages(): Promise<SubscriptionPackage[]> {
  const collection = await packagesCollection();
  const docs = await collection.find().sort({ price: 1 }).toArray();
  return docs.map(toPackage);
}

// Deliberately narrow — price is the only field the coach can ever edit here.
// Name/duration/benefits are fixed and seeded once; there's no generic
// `updatePackage(id, input)` so that constraint can't accidentally widen.
export async function updatePackagePrice(id: string, price: number): Promise<void> {
  const collection = await packagesCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { price, updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) throw new Error("Package not found");
}
