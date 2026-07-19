// Standalone script — run with `npm run db:seed:galleries`. Not part of the app bundle.
// Seeds demo galleries so the public Gallery section/page isn't empty, copying
// the existing bundled gallery/hero/portrait photos into public/uploads/galleries
// as real served files, same trick seed-catalog.ts used for products.
import { randomUUID } from "node:crypto";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";

try {
  process.loadEnvFile();
} catch {
  // .env is optional if the vars are already in the environment
}

const ROOT = path.join(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "src", "assets");
const UPLOAD_DIR = path.join(ROOT, "public", "uploads", "galleries");

async function copyImage(sourceFile: string): Promise<string> {
  const filename = `${randomUUID()}.jpg`;
  await copyFile(path.join(SOURCE_DIR, sourceFile), path.join(UPLOAD_DIR, filename));
  return `/uploads/galleries/${filename}`;
}

interface SeedGallery {
  name: string;
  description: string;
  sourceFiles: string[];
  showOnLandingPage: boolean;
}

const GALLERIES: SeedGallery[] = [
  {
    name: "Strength Sessions",
    description: "Heavy days on the platform — squat, pull, press.",
    sourceFiles: ["gallery-1.jpg", "gallery-3.jpg", "hero-athlete.jpg"],
    showOnLandingPage: true,
  },
  {
    name: "Conditioning & Cardio",
    description: "Ropes, sleds, and everything that leaves you gasping.",
    sourceFiles: ["gallery-2.jpg", "gallery-4.jpg"],
    showOnLandingPage: false,
  },
  {
    name: "Physique Progress",
    description: "Transformation check-ins from clients across the program.",
    sourceFiles: ["gallery-3.jpg", "portrait.jpg", "gallery-5.jpg"],
    showOnLandingPage: true,
  },
  {
    name: "Combat Training",
    description: "Bag work, pad rounds, and footwork drills.",
    sourceFiles: ["gallery-4.jpg", "gallery-1.jpg", "gallery-2.jpg"],
    showOnLandingPage: false,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is required");

  await mkdir(UPLOAD_DIR, { recursive: true });

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(process.env.MONGODB_DB_NAME ?? "makhlouf");
    const galleries = db.collection("galleries");

    // Demo data — safe to fully replace rather than migrate on schema changes.
    await galleries.deleteMany({});

    for (const gallery of GALLERIES) {
      const images = [];
      for (const sourceFile of gallery.sourceFiles) {
        images.push({ url: await copyImage(sourceFile) });
      }
      const now = new Date();
      await galleries.insertOne({
        name: gallery.name,
        description: gallery.description,
        images,
        showOnLandingPage: gallery.showOnLandingPage,
        createdAt: now,
        updatedAt: now,
      });
    }

    const landingCount = GALLERIES.filter((g) => g.showOnLandingPage).length;
    console.log(`Seeded ${GALLERIES.length} galleries (${landingCount} shown on landing page).`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
