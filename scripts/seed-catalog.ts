// Standalone script — run with `npm run db:seed:catalog`. Not part of the app bundle.
// Seeds demo categories + products so the shop isn't empty, copying the
// existing bundled product photos into public/uploads/products as real
// served files (rather than Vite-bundled imports).
import { randomUUID } from "node:crypto";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { MongoClient, ObjectId } from "mongodb";

try {
  process.loadEnvFile();
} catch {
  // .env is optional if the vars are already in the environment
}

const ROOT = path.join(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "src", "assets");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads", "products");

const CATEGORY_NAMES = ["Supplement", "Apparel", "Accessory", "Program"] as const;

interface SeedVariant {
  name: string;
  basePrice: number;
  sellingPrice: number;
  discount: number;
  quantity: number;
  isActive: boolean;
}

interface SeedProduct {
  sourceFile: string;
  category: (typeof CATEGORY_NAMES)[number];
  title: string;
  description: string;
  variants: SeedVariant[];
}

function singleVariant(opts: Omit<SeedVariant, "name" | "isActive">): SeedVariant[] {
  return [{ name: "", isActive: true, ...opts }];
}

function sizeVariants(
  opts: Omit<SeedVariant, "name" | "isActive" | "quantity">,
  totalQuantity: number,
): SeedVariant[] {
  const sizes = ["S", "M", "L", "XL"];
  const base = Math.floor(totalQuantity / sizes.length);
  const remainder = totalQuantity - base * sizes.length;
  return sizes.map((name, i) => ({
    name,
    isActive: true,
    quantity: base + (i < remainder ? 1 : 0),
    ...opts,
  }));
}

const PRODUCTS: SeedProduct[] = [
  {
    sourceFile: "product-1.jpg",
    category: "Supplement",
    title: "Makhlouf Protein · Isolate",
    description: "Clean whey isolate — 27g protein per scoop, minimal additives.",
    variants: singleVariant({ basePrice: 28, sellingPrice: 64, discount: 0, quantity: 142 }),
  },
  {
    sourceFile: "product-2.jpg",
    category: "Apparel",
    title: "Iron Heavyweight Hoodie",
    description: "14oz heavyweight cotton fleece, built to outlast every wash.",
    variants: sizeVariants({ basePrice: 52, sellingPrice: 128, discount: 10 }, 58),
  },
  {
    sourceFile: "product-3.jpg",
    category: "Accessory",
    title: "Pro Lifting Straps",
    description: "Cotton lifting straps with reinforced stitching for heavy pulls.",
    variants: singleVariant({ basePrice: 11, sellingPrice: 32, discount: 0, quantity: 210 }),
  },
  {
    sourceFile: "product-4.jpg",
    category: "Accessory",
    title: "Matte Steel Shaker",
    description: "28oz double-wall shaker, leak-proof, matte steel finish.",
    variants: singleVariant({ basePrice: 9, sellingPrice: 28, discount: 0, quantity: 12 }),
  },
  {
    sourceFile: "product-1.jpg",
    category: "Program",
    title: "12-Week Hypertrophy Block",
    description: "A structured 12-week hypertrophy program with weekly progression.",
    variants: singleVariant({ basePrice: 40, sellingPrice: 149, discount: 0, quantity: 999 }),
  },
  {
    sourceFile: "product-2.jpg",
    category: "Apparel",
    title: "Performance Training Tee",
    description: "Lightweight, breathable training tee with a relaxed fit.",
    variants: sizeVariants({ basePrice: 22, sellingPrice: 58, discount: 0 }, 0),
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is required");

  await mkdir(UPLOAD_DIR, { recursive: true });

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(process.env.MONGODB_DB_NAME ?? "makhlouf");
    const categories = db.collection("categories");
    const products = db.collection("products");

    const categoryIds = new Map<string, ObjectId>();
    for (const name of CATEGORY_NAMES) {
      const existing = await categories.findOne({ name });
      if (existing) {
        categoryIds.set(name, existing._id);
        continue;
      }
      const now = new Date();
      const result = await categories.insertOne({ name, createdAt: now, updatedAt: now });
      categoryIds.set(name, result.insertedId);
    }

    // Demo data — safe to fully replace rather than migrate on schema changes.
    await products.deleteMany({});

    for (const product of PRODUCTS) {
      const filename = `${randomUUID()}.jpg`;
      await copyFile(path.join(SOURCE_DIR, product.sourceFile), path.join(UPLOAD_DIR, filename));
      const asset = { url: `/uploads/products/${filename}`, type: "image", isPrimary: true };

      const now = new Date();
      await products.insertOne({
        categoryId: categoryIds.get(product.category),
        title: product.title,
        description: product.description,
        variants: product.variants.map((v) => ({
          id: randomUUID(),
          name: v.name,
          basePrice: v.basePrice,
          sellingPrice: v.sellingPrice,
          discount: v.discount,
          quantity: v.quantity,
          isActive: v.isActive,
          assets: [asset],
        })),
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(`Seeded ${CATEGORY_NAMES.length} categories and ${PRODUCTS.length} products.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
