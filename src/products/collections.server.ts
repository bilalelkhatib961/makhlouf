import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import { listProductsPublic } from "./products.server";
import type { CollectionAdmin, CollectionInput, CollectionPublic } from "./types";

export interface CollectionDoc {
  _id: ObjectId;
  name: string;
  description: string;
  productIds: ObjectId[];
  showOnLandingPage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

async function collectionsCollection(): Promise<Collection<CollectionDoc>> {
  const db = await getDb();
  return db.collection<CollectionDoc>("collections");
}

function toAdmin(doc: CollectionDoc): CollectionAdmin {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    productIds: doc.productIds.map((id) => id.toString()),
    showOnLandingPage: doc.showOnLandingPage,
  };
}

export async function listCollectionsAdmin(): Promise<CollectionAdmin[]> {
  const collection = await collectionsCollection();
  const docs = await collection.find().sort({ createdAt: 1 }).toArray();
  return docs.map(toAdmin);
}

export async function listCollectionsPublic(onlyLandingPage: boolean): Promise<CollectionPublic[]> {
  const collection = await collectionsCollection();
  const query = onlyLandingPage ? { showOnLandingPage: true } : {};
  const docs = await collection.find(query).sort({ createdAt: 1 }).toArray();
  if (docs.length === 0) return [];

  const products = await listProductsPublic();
  const productsById = new Map(products.map((p) => [p.id, p]));

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    products: doc.productIds
      .map((id) => productsById.get(id.toString()))
      .filter((p) => p !== undefined),
  }));
}

export async function createCollection(input: CollectionInput): Promise<CollectionAdmin> {
  const collection = await collectionsCollection();
  const now = new Date();
  const doc: CollectionDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    description: input.description.trim(),
    productIds: input.productIds.map((id) => new ObjectId(id)),
    showOnLandingPage: input.showOnLandingPage,
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  return toAdmin(doc);
}

export async function updateCollection(id: string, input: CollectionInput): Promise<void> {
  const collection = await collectionsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        description: input.description.trim(),
        productIds: input.productIds.map((pid) => new ObjectId(pid)),
        showOnLandingPage: input.showOnLandingPage,
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Collection not found");
}

export async function deleteCollection(id: string): Promise<void> {
  const collection = await collectionsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) throw new Error("Collection not found");
}
