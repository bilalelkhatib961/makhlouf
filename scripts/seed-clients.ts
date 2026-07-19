// Standalone script — run with `npm run db:seed:clients`. Not part of the app bundle.
// Requires `npm run db:seed` (base accounts) and `npm run db:seed:training`
// (splits) to have already been run. Seeds four additional client accounts
// plus profile data for all clients (including the original seeded Jordan
// Ellis), each with a different combination of profile completeness and
// split-assignment history so the coach UI has real variety to inspect.
import { randomUUID } from "node:crypto";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile();
} catch {
  // .env is optional if the vars are already in the environment
}

const ROOT = path.join(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "src", "assets");
const CLIENTS_DIR = path.join(ROOT, "public", "uploads", "clients");

async function placeholderPicture(sourceFile: string): Promise<string> {
  const filename = `${randomUUID()}.jpg`;
  await copyFile(path.join(SOURCE_DIR, sourceFile), path.join(CLIENTS_DIR, filename));
  return `/uploads/clients/${filename}`;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

interface SeedProfile {
  dob: string;
  weight: number;
  height: number;
  phone: string;
  nationality: string;
  photo: string;
}

interface SeedAssignment {
  splitName: string;
  startedDaysAgo: number;
}

interface SeedClient {
  email: string;
  name: string;
  createIfMissing: boolean; // false for the already-seeded Jordan Ellis
  profile: SeedProfile | null;
  history: SeedAssignment[];
}

const CLIENTS: SeedClient[] = [
  {
    email: "client@makhlouf.com",
    name: "Jordan Ellis",
    createIfMissing: false,
    profile: {
      dob: "1996-04-12",
      weight: 78,
      height: 178,
      phone: "+1 416 555 0142",
      nationality: "Canadian",
      photo: "portrait.jpg",
    },
    history: [
      { splitName: "Push Pull Legs Arms", startedDaysAgo: 70 },
      { splitName: "Upper Lower Split", startedDaysAgo: 14 },
    ],
  },
  {
    email: "casey@makhlouf.com",
    name: "Casey Brooks",
    createIfMissing: true,
    profile: {
      dob: "1990-11-02",
      weight: 65,
      height: 165,
      phone: "+44 20 7946 0958",
      nationality: "British",
      photo: "gallery-1.jpg",
    },
    history: [{ splitName: "Full Body Strength", startedDaysAgo: 5 }],
  },
  {
    email: "riley@makhlouf.com",
    name: "Riley Chen",
    createIfMissing: true,
    profile: {
      dob: "2000-06-20",
      weight: 82,
      height: 182,
      phone: "+65 8123 4567",
      nationality: "Singaporean",
      photo: "gallery-2.jpg",
    },
    history: [
      { splitName: "Push Pull Legs Arms", startedDaysAgo: 140 },
      { splitName: "Full Body Strength", startedDaysAgo: 84 },
      { splitName: "Upper Lower Split", startedDaysAgo: 3 },
    ],
  },
  {
    email: "sam@makhlouf.com",
    name: "Sam Whitfield",
    createIfMissing: true,
    profile: {
      dob: "1985-02-15",
      weight: 90,
      height: 188,
      phone: "+1 212 555 0199",
      nationality: "American",
      photo: "gallery-3.jpg",
    },
    // Both fully elapsed — the most recent one still becomes "current" (by
    // startDate), but renders as Completed, demonstrating that state.
    history: [
      { splitName: "Push Pull Legs Arms", startedDaysAgo: 210 },
      { splitName: "Full Body Strength", startedDaysAgo: 98 },
    ],
  },
  {
    email: "morgan@makhlouf.com",
    name: "Morgan Blake",
    createIfMissing: true,
    profile: null, // no profile row, no assignments — fully-empty state
    history: [],
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is required");

  await mkdir(CLIENTS_DIR, { recursive: true });

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(process.env.MONGODB_DB_NAME ?? "makhlouf");
    const users = db.collection("users");
    const profiles = db.collection("clientProfiles");
    const assignments = db.collection("splitAssignments");
    const splits = db.collection("splits");

    const splitIds = new Map<string, ObjectId>();
    const allSplits = await splits.find().toArray();
    if (allSplits.length === 0) {
      throw new Error(
        "No splits found — run `npm run db:seed:training` before `npm run db:seed:clients`.",
      );
    }
    for (const split of allSplits) splitIds.set(split.name, split._id);

    let createdAccounts = 0;
    let seededProfiles = 0;
    let seededAssignments = 0;

    for (const seedClient of CLIENTS) {
      let userId: ObjectId;
      const existing = await users.findOne({ email: seedClient.email });
      if (existing) {
        userId = existing._id;
      } else {
        if (!seedClient.createIfMissing) {
          throw new Error(
            `Expected ${seedClient.email} to already exist — run \`npm run db:seed\` first.`,
          );
        }
        const passwordHash = await bcrypt.hash("Client!2025", 12);
        const result = await users.insertOne({
          email: seedClient.email,
          passwordHash,
          role: "client",
          name: seedClient.name,
          createdAt: new Date(),
        });
        userId = result.insertedId;
        createdAccounts++;
      }

      // Assignment history is demo data — clear and reinsert fresh every run.
      await assignments.deleteMany({ clientId: userId });

      if (seedClient.profile) {
        const photoUrl = await placeholderPicture(seedClient.profile.photo);
        const now = new Date();
        await profiles.updateOne(
          { userId },
          {
            $set: {
              dob: new Date(seedClient.profile.dob),
              weight: seedClient.profile.weight,
              height: seedClient.profile.height,
              phone: seedClient.profile.phone,
              nationality: seedClient.profile.nationality,
              profilePicture: photoUrl,
              updatedAt: now,
            },
            $setOnInsert: { _id: new ObjectId(), userId, createdAt: now },
          },
          { upsert: true },
        );
        seededProfiles++;
      }

      for (const entry of seedClient.history) {
        const splitId = splitIds.get(entry.splitName);
        if (!splitId) throw new Error(`Unknown split name in seed data: ${entry.splitName}`);
        await assignments.insertOne({
          _id: new ObjectId(),
          clientId: userId,
          splitId,
          startDate: daysAgo(entry.startedDaysAgo),
          createdAt: new Date(),
        });
        seededAssignments++;
      }
    }

    console.log(
      `Seeded ${createdAccounts} new client accounts, ${seededProfiles} profiles, and ${seededAssignments} split assignments across ${CLIENTS.length} clients.`,
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
