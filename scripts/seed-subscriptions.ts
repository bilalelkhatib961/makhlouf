// Standalone script — run with `npm run db:seed:subscriptions`. Not part of
// the app bundle. Requires `npm run db:seed:clients` to have already run.
// Upserts the two fixed packages (Basic/Premium) by slug — only `price` is
// ever set via $setOnInsert, so re-running this script never clobbers a
// coach's already-edited price; the fixed fields (name/duration/benefits)
// are always $set so copy edits here do propagate on re-run. Then assigns
// packages to the seeded clients for variety — this part is demo data,
// cleared and reinserted fresh per client every run, same reasoning as
// seed-diet.ts's diet assignments.
import { ObjectId, MongoClient } from "mongodb";

try {
  process.loadEnvFile();
} catch {
  // .env is optional if the vars are already in the environment
}

interface SeedPackage {
  slug: "basic" | "premium";
  name: string;
  defaultPrice: number;
  durationMonths: number;
  benefits: string[];
}

const PACKAGES: SeedPackage[] = [
  {
    slug: "basic",
    name: "Basic",
    defaultPrice: 49.99,
    durationMonths: 1,
    benefits: ["Personalized diet plan", "Personalized workout plan"],
  },
  {
    slug: "premium",
    name: "Premium",
    defaultPrice: 149.99,
    durationMonths: 1,
    benefits: [
      "Personalized diet plan",
      "Personalized workout plan",
      "Weights, sets & reps tracking",
      "Diet tracking",
      "1-on-1 private coaching session (in person)",
      "Book your own session time on the coach's calendar",
    ],
  },
];

// email -> package slug, or null for "no subscription" (demonstrates the
// empty state, consistent with Morgan Blake elsewhere in the seed data).
const CLIENT_PACKAGES: Record<string, "basic" | "premium" | null> = {
  "client@makhlouf.com": "premium", // Jordan Ellis
  "casey@makhlouf.com": "basic",
  "riley@makhlouf.com": "premium",
  "sam@makhlouf.com": "basic",
  "morgan@makhlouf.com": null,
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is required");

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(process.env.MONGODB_DB_NAME ?? "makhlouf");
    const packages = db.collection("subscriptionPackages");
    const assignments = db.collection("subscriptionAssignments");
    const users = db.collection("users");

    const packageIds = new Map<string, ObjectId>();
    for (const pkg of PACKAGES) {
      const now = new Date();
      const result = await packages.findOneAndUpdate(
        { slug: pkg.slug },
        {
          $set: {
            name: pkg.name,
            durationMonths: pkg.durationMonths,
            benefits: pkg.benefits,
            updatedAt: now,
          },
          $setOnInsert: {
            _id: new ObjectId(),
            slug: pkg.slug,
            price: pkg.defaultPrice,
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      packageIds.set(pkg.slug, result!._id);
    }

    let assigned = 0;
    for (const [email, slug] of Object.entries(CLIENT_PACKAGES)) {
      const user = await users.findOne({ email });
      if (!user)
        throw new Error(`Expected ${email} to exist — run \`npm run db:seed:clients\` first.`);

      await assignments.deleteMany({ clientId: user._id });
      if (!slug) continue;

      await assignments.insertOne({
        _id: new ObjectId(),
        clientId: user._id,
        packageId: packageIds.get(slug)!,
        startDate: new Date(),
        createdAt: new Date(),
      });
      assigned++;
    }

    console.log(`Seeded ${PACKAGES.length} packages and ${assigned} subscription assignments.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
