// Standalone script — run with `npm run db:seed:diet`. Not part of the app bundle.
// Requires `npm run db:seed` (base accounts) and `npm run db:seed:clients`
// (client profiles) to have already run. Seeds ~20 foods, ~8 meals, and 3 diet
// plans, then assigns each profiled client whichever plan's actual average
// daily calories lands closest to their own computed maintenance calories —
// genuinely data-driven from their real seeded weight/height, not a hardcoded
// lookup table. Nutrition values below are standard approximate per-100g
// figures (USDA-ish), not medical-grade data.
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
const FOODS_DIR = path.join(ROOT, "public", "uploads", "foods");
const PLACEHOLDER_PHOTOS = ["product-1.jpg", "product-2.jpg", "product-3.jpg", "product-4.jpg"];

async function placeholderImage(index: number): Promise<string> {
  const source = PLACEHOLDER_PHOTOS[index % PLACEHOLDER_PHOTOS.length];
  const filename = `${randomUUID()}.jpg`;
  await copyFile(path.join(SOURCE_DIR, source), path.join(FOODS_DIR, filename));
  return `/uploads/foods/${filename}`;
}

interface SeedFood {
  name: string;
  caloriesPer100g: number;
  carbsPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
}

// Approximate per-100g macros, standard reference values.
const FOODS: SeedFood[] = [
  {
    name: "White Rice (cooked)",
    caloriesPer100g: 130,
    carbsPer100g: 28,
    proteinPer100g: 2.7,
    fatPer100g: 0.3,
  },
  {
    name: "Chicken Breast",
    caloriesPer100g: 165,
    carbsPer100g: 0,
    proteinPer100g: 31,
    fatPer100g: 3.6,
  },
  {
    name: "Peanut Butter",
    caloriesPer100g: 588,
    carbsPer100g: 20,
    proteinPer100g: 25,
    fatPer100g: 50,
  },
  { name: "Eggs", caloriesPer100g: 155, carbsPer100g: 1.1, proteinPer100g: 13, fatPer100g: 11 },
  {
    name: "Tuna (canned in water)",
    caloriesPer100g: 116,
    carbsPer100g: 0,
    proteinPer100g: 26,
    fatPer100g: 1,
  },
  { name: "Honey", caloriesPer100g: 304, carbsPer100g: 82, proteinPer100g: 0.3, fatPer100g: 0 },
  { name: "Banana", caloriesPer100g: 89, carbsPer100g: 23, proteinPer100g: 1.1, fatPer100g: 0.3 },
  { name: "Oats (dry)", caloriesPer100g: 389, carbsPer100g: 66, proteinPer100g: 17, fatPer100g: 7 },
  { name: "Salmon", caloriesPer100g: 208, carbsPer100g: 0, proteinPer100g: 20, fatPer100g: 13 },
  { name: "Broccoli", caloriesPer100g: 34, carbsPer100g: 7, proteinPer100g: 2.8, fatPer100g: 0.4 },
  {
    name: "Sweet Potato (cooked)",
    caloriesPer100g: 90,
    carbsPer100g: 21,
    proteinPer100g: 2,
    fatPer100g: 0.2,
  },
  { name: "Almonds", caloriesPer100g: 579, carbsPer100g: 22, proteinPer100g: 21, fatPer100g: 50 },
  {
    name: "Greek Yogurt (plain)",
    caloriesPer100g: 59,
    carbsPer100g: 3.6,
    proteinPer100g: 10,
    fatPer100g: 0.4,
  },
  { name: "Olive Oil", caloriesPer100g: 884, carbsPer100g: 0, proteinPer100g: 0, fatPer100g: 100 },
  {
    name: "Whole Wheat Bread",
    caloriesPer100g: 247,
    carbsPer100g: 41,
    proteinPer100g: 13,
    fatPer100g: 3.4,
  },
  {
    name: "Milk (whole)",
    caloriesPer100g: 61,
    carbsPer100g: 4.8,
    proteinPer100g: 3.2,
    fatPer100g: 3.3,
  },
  { name: "Lean Beef", caloriesPer100g: 250, carbsPer100g: 0, proteinPer100g: 26, fatPer100g: 15 },
  { name: "Avocado", caloriesPer100g: 160, carbsPer100g: 9, proteinPer100g: 2, fatPer100g: 15 },
  { name: "Spinach", caloriesPer100g: 23, carbsPer100g: 3.6, proteinPer100g: 2.9, fatPer100g: 0.4 },
  { name: "Apple", caloriesPer100g: 52, carbsPer100g: 14, proteinPer100g: 0.3, fatPer100g: 0.2 },
];

interface SeedMealFood {
  foodName: string;
  quantityGrams: number;
}

interface SeedMeal {
  name: string;
  foods: SeedMealFood[];
}

const MEALS: SeedMeal[] = [
  {
    name: "Chicken & Rice Bowl",
    foods: [
      { foodName: "Chicken Breast", quantityGrams: 200 },
      { foodName: "White Rice (cooked)", quantityGrams: 200 },
      { foodName: "Broccoli", quantityGrams: 100 },
    ],
  },
  {
    name: "Protein Oats",
    foods: [
      { foodName: "Oats (dry)", quantityGrams: 80 },
      { foodName: "Milk (whole)", quantityGrams: 250 },
      { foodName: "Honey", quantityGrams: 20 },
      { foodName: "Banana", quantityGrams: 100 },
    ],
  },
  {
    name: "PB Banana Toast",
    foods: [
      { foodName: "Whole Wheat Bread", quantityGrams: 60 },
      { foodName: "Peanut Butter", quantityGrams: 30 },
      { foodName: "Banana", quantityGrams: 100 },
    ],
  },
  {
    name: "Tuna Salad",
    foods: [
      { foodName: "Tuna (canned in water)", quantityGrams: 200 },
      { foodName: "Spinach", quantityGrams: 50 },
      { foodName: "Olive Oil", quantityGrams: 15 },
      { foodName: "Avocado", quantityGrams: 75 },
    ],
  },
  {
    name: "Egg Breakfast",
    foods: [
      { foodName: "Eggs", quantityGrams: 200 },
      { foodName: "Whole Wheat Bread", quantityGrams: 60 },
      { foodName: "Avocado", quantityGrams: 50 },
    ],
  },
  {
    name: "Salmon & Sweet Potato",
    foods: [
      { foodName: "Salmon", quantityGrams: 200 },
      { foodName: "Sweet Potato (cooked)", quantityGrams: 200 },
      { foodName: "Broccoli", quantityGrams: 100 },
    ],
  },
  {
    name: "Greek Yogurt Snack",
    foods: [
      { foodName: "Greek Yogurt (plain)", quantityGrams: 250 },
      { foodName: "Almonds", quantityGrams: 40 },
      { foodName: "Honey", quantityGrams: 20 },
    ],
  },
  {
    name: "Beef & Rice",
    foods: [
      { foodName: "Lean Beef", quantityGrams: 200 },
      { foodName: "White Rice (cooked)", quantityGrams: 200 },
      { foodName: "Spinach", quantityGrams: 50 },
    ],
  },
];

interface SeedDietPlan {
  name: string;
  description: string;
  mealNames: string[]; // same meals assigned to all 7 days
}

const DIET_PLANS: SeedDietPlan[] = [
  {
    name: "Lean Bulk Plan",
    description: "Higher-calorie template for steady lean mass gain.",
    mealNames: [
      "Protein Oats",
      "Chicken & Rice Bowl",
      "PB Banana Toast",
      "Salmon & Sweet Potato",
      "Beef & Rice",
    ],
  },
  {
    name: "Cutting Plan",
    description: "Leaner, higher-protein-density template for a calorie deficit.",
    mealNames: ["Egg Breakfast", "Tuna Salad", "Greek Yogurt Snack"],
  },
  {
    name: "Maintenance Plan",
    description: "Balanced, moderate-calorie template to hold steady.",
    mealNames: ["Protein Oats", "Chicken & Rice Bowl", "Greek Yogurt Snack", "PB Banana Toast"],
  },
];

function mealCalories(meal: SeedMeal, foodsByName: Map<string, SeedFood>): number {
  return meal.foods.reduce((sum, item) => {
    const food = foodsByName.get(item.foodName)!;
    return sum + (food.caloriesPer100g * item.quantityGrams) / 100;
  }, 0);
}

// Sex-neutral Mifflin-St Jeor approximation — same formula as
// src/diet/nutrition.ts's recommendMacros, duplicated here since this
// standalone script doesn't import from src/ (same reasoning seed-clients.ts
// already duplicates its own account-creation logic).
function maintenanceCalories(weight: number, height: number, dob: Date): number {
  const ageMs = Date.now() - dob.getTime();
  const age = Math.max(15, Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000)));
  const bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  return bmr * 1.55;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI env var is required");

  await mkdir(FOODS_DIR, { recursive: true });

  const client = await new MongoClient(uri).connect();
  try {
    const db = client.db(process.env.MONGODB_DB_NAME ?? "makhlouf");
    const foods = db.collection("foods");
    const meals = db.collection("meals");
    const dietPlans = db.collection("dietPlans");
    const dietPlanAssignments = db.collection("dietPlanAssignments");
    const users = db.collection("users");
    const clientProfiles = db.collection("clientProfiles");

    // Demo data — safe to fully replace rather than migrate on schema changes.
    await foods.deleteMany({});
    await meals.deleteMany({});
    await dietPlans.deleteMany({});

    const foodsByName = new Map(FOODS.map((f) => [f.name, f]));
    const foodIds = new Map<string, ObjectId>();
    let imgIndex = 0;
    for (const food of FOODS) {
      const now = new Date();
      const image = await placeholderImage(imgIndex++);
      const result = await foods.insertOne({
        name: food.name,
        image,
        caloriesPer100g: food.caloriesPer100g,
        carbsPer100g: food.carbsPer100g,
        proteinPer100g: food.proteinPer100g,
        fatPer100g: food.fatPer100g,
        createdAt: now,
        updatedAt: now,
      });
      foodIds.set(food.name, result.insertedId);
    }

    const mealIds = new Map<string, ObjectId>();
    for (const meal of MEALS) {
      const now = new Date();
      const result = await meals.insertOne({
        name: meal.name,
        foods: meal.foods.map((f) => ({
          foodId: foodIds.get(f.foodName)!,
          quantityGrams: f.quantityGrams,
        })),
        createdAt: now,
        updatedAt: now,
      });
      mealIds.set(meal.name, result.insertedId);
    }

    const WEEKDAYS = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ] as const;

    const dietPlanIds = new Map<string, ObjectId>();
    const dietPlanCalories = new Map<string, number>();
    for (const plan of DIET_PLANS) {
      const now = new Date();
      const planMealIds = plan.mealNames.map((name) => mealIds.get(name)!);
      const result = await dietPlans.insertOne({
        name: plan.name,
        description: plan.description,
        days: WEEKDAYS.map((day) => ({ day, label: "", mealIds: planMealIds })),
        createdAt: now,
        updatedAt: now,
      });
      dietPlanIds.set(plan.name, result.insertedId);
      const dailyCalories = plan.mealNames.reduce(
        (sum, name) => sum + mealCalories(MEALS.find((m) => m.name === name)!, foodsByName),
        0,
      );
      dietPlanCalories.set(plan.name, dailyCalories);
    }

    // Assignments — cleared and reinserted fresh, same reasoning as splitAssignments.
    const CLIENT_EMAILS = [
      "client@makhlouf.com",
      "casey@makhlouf.com",
      "riley@makhlouf.com",
      "sam@makhlouf.com",
      "morgan@makhlouf.com",
    ];

    let assigned = 0;
    for (const email of CLIENT_EMAILS) {
      const user = await users.findOne({ email });
      if (!user)
        throw new Error(`Expected ${email} to exist — run \`npm run db:seed:clients\` first.`);

      await dietPlanAssignments.deleteMany({ clientId: user._id });

      const profile = await clientProfiles.findOne({ userId: user._id });
      if (!profile?.weight || !profile?.height) continue; // Morgan Blake — no profile, stays unassigned

      const target = maintenanceCalories(profile.weight, profile.height, profile.dob ?? new Date());
      let bestPlan = DIET_PLANS[0].name;
      let bestDiff = Infinity;
      for (const [planName, calories] of dietPlanCalories) {
        const diff = Math.abs(calories - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestPlan = planName;
        }
      }

      // Jordan Ellis gets an earlier, different plan first so Diet Plan
      // History has something to show, mirroring their split history.
      if (email === "client@makhlouf.com") {
        const earlierPlan = DIET_PLANS.map((p) => p.name).find((n) => n !== bestPlan)!;
        await dietPlanAssignments.insertOne({
          _id: new ObjectId(),
          clientId: user._id,
          dietPlanId: dietPlanIds.get(earlierPlan)!,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        });
        assigned++;
      }

      await dietPlanAssignments.insertOne({
        _id: new ObjectId(),
        clientId: user._id,
        dietPlanId: dietPlanIds.get(bestPlan)!,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });
      assigned++;
    }

    console.log(
      `Seeded ${FOODS.length} foods, ${MEALS.length} meals, ${DIET_PLANS.length} diet plans, and ${assigned} diet plan assignments.`,
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
