// Standalone script — run with `npm run db:seed`. Not part of the app bundle.
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

try {
  process.loadEnvFile();
} catch {
  // .env is optional if the vars are already in the environment
}

const SEED_ACCOUNTS = [
  {
    email: "coach@makhlouf.com",
    password: "Coach!2025",
    role: "coach" as const,
    name: "Marcus Vale",
  },
  {
    email: "client@makhlouf.com",
    password: "Client!2025",
    role: "client" as const,
    name: "Jordan Ellis",
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is required");

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(process.env.MONGODB_DB_NAME ?? "makhlouf");
    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });

    for (const account of SEED_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(account.password, 12);
      await users.updateOne(
        { email: account.email },
        {
          $set: { email: account.email, passwordHash, role: account.role, name: account.name },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      );
    }

    console.log("Seeded accounts:");
    for (const account of SEED_ACCOUNTS) {
      console.log(`  ${account.role.padEnd(6)} ${account.email}  /  ${account.password}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
