import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { Category, CategoryInput } from "./types";

export interface CategoryDoc {
  _id: ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

async function categoriesCollection(): Promise<Collection<CategoryDoc>> {
  const db = await getDb();
  return db.collection<CategoryDoc>("categories");
}

function toCategory(doc: CategoryDoc): Category {
  return { id: doc._id.toString(), name: doc.name };
}

export async function listCategories(): Promise<Category[]> {
  const collection = await categoriesCollection();
  const docs = await collection.find().sort({ name: 1 }).toArray();
  return docs.map(toCategory);
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const collection = await categoriesCollection();
  const now = new Date();
  const result = await collection.insertOne({
    _id: new ObjectId(),
    name: input.name.trim(),
    createdAt: now,
    updatedAt: now,
  });
  return { id: result.insertedId.toString(), name: input.name.trim() };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const collection = await categoriesCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { name: input.name.trim(), updatedAt: new Date() } },
  );
  if (result.matchedCount === 0) throw new Error("Category not found");
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  const categoryId = new ObjectId(id);
  const productCount = await db.collection("products").countDocuments({ categoryId });
  if (productCount > 0) {
    throw new Error(
      `Cannot delete this category — ${productCount} product${productCount === 1 ? "" : "s"} still assigned to it.`,
    );
  }
  const collection = await categoriesCollection();
  const result = await collection.deleteOne({ _id: categoryId });
  if (result.deletedCount === 0) throw new Error("Category not found");
}
