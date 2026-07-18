import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type {
  ProductAdmin,
  ProductAsset,
  ProductInput,
  ProductPublic,
  ProductVariantAdmin,
  ProductVariantInput,
  ProductVariantPublic,
} from "./types";

export interface VariantDoc {
  id: string;
  name: string;
  basePrice: number;
  sellingPrice: number;
  discount: number;
  quantity: number;
  isActive: boolean;
  assets: ProductAsset[];
}

export interface ProductDoc {
  _id: ObjectId;
  categoryId: ObjectId;
  title: string;
  description: string;
  variants: VariantDoc[];
  createdAt: Date;
  updatedAt: Date;
}

async function productsCollection(): Promise<Collection<ProductDoc>> {
  const db = await getDb();
  return db.collection<ProductDoc>("products");
}

async function categoryNameMap(): Promise<Map<string, string>> {
  const db = await getDb();
  const categories = await db
    .collection<{ _id: ObjectId; name: string }>("categories")
    .find()
    .toArray();
  return new Map(categories.map((c) => [c._id.toString(), c.name]));
}

function toVariantPublic(v: VariantDoc): ProductVariantPublic {
  return {
    id: v.id,
    name: v.name,
    sellingPrice: v.sellingPrice,
    discount: v.discount,
    quantity: v.quantity,
    assets: v.assets,
  };
}

function toVariantAdmin(v: VariantDoc): ProductVariantAdmin {
  return { ...toVariantPublic(v), basePrice: v.basePrice, isActive: v.isActive };
}

function toAdmin(doc: ProductDoc, categoryName: string): ProductAdmin {
  return {
    id: doc._id.toString(),
    categoryId: doc.categoryId.toString(),
    categoryName,
    title: doc.title,
    description: doc.description,
    variants: doc.variants.map(toVariantAdmin),
  };
}

export async function listProductsPublic(): Promise<ProductPublic[]> {
  const collection = await productsCollection();
  const [docs, categoryNames] = await Promise.all([
    collection.find({ "variants.isActive": true }).sort({ createdAt: -1 }).toArray(),
    categoryNameMap(),
  ]);
  const products: ProductPublic[] = [];
  for (const doc of docs) {
    const activeVariants = doc.variants.filter((v) => v.isActive).map(toVariantPublic);
    if (activeVariants.length === 0) continue;
    products.push({
      id: doc._id.toString(),
      categoryId: doc.categoryId.toString(),
      categoryName: categoryNames.get(doc.categoryId.toString()) ?? "Uncategorized",
      title: doc.title,
      description: doc.description,
      variants: activeVariants,
    });
  }
  return products;
}

export async function listProductsAdmin(): Promise<ProductAdmin[]> {
  const collection = await productsCollection();
  const [docs, categoryNames] = await Promise.all([
    collection.find().sort({ createdAt: -1 }).toArray(),
    categoryNameMap(),
  ]);
  return docs.map((doc) =>
    toAdmin(doc, categoryNames.get(doc.categoryId.toString()) ?? "Uncategorized"),
  );
}

function toVariantDoc(v: ProductVariantInput): VariantDoc {
  return {
    id: v.id,
    name: v.name.trim(),
    basePrice: v.basePrice,
    sellingPrice: v.sellingPrice,
    discount: v.discount,
    quantity: v.quantity,
    isActive: v.isActive,
    assets: v.assets,
  };
}

export async function createProduct(input: ProductInput): Promise<ProductAdmin> {
  const collection = await productsCollection();
  const now = new Date();
  const doc: ProductDoc = {
    _id: new ObjectId(),
    categoryId: new ObjectId(input.categoryId),
    title: input.title.trim(),
    description: input.description.trim(),
    variants: input.variants.map(toVariantDoc),
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  const categoryNames = await categoryNameMap();
  return toAdmin(doc, categoryNames.get(input.categoryId) ?? "Uncategorized");
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const collection = await productsCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        categoryId: new ObjectId(input.categoryId),
        title: input.title.trim(),
        description: input.description.trim(),
        variants: input.variants.map(toVariantDoc),
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Product not found");
}

export async function deleteProduct(id: string): Promise<void> {
  const collection = await productsCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) throw new Error("Product not found");
}
