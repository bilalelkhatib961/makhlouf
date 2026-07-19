import type { Meal, MealFoodItem } from "./types";

export interface NutritionTotals {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

const EMPTY_TOTALS: NutritionTotals = { calories: 0, carbs: 0, protein: 0, fat: 0 };

export function foodItemNutrition(item: MealFoodItem): NutritionTotals {
  const factor = item.quantityGrams / 100;
  return {
    calories: item.caloriesPer100g * factor,
    carbs: item.carbsPer100g * factor,
    protein: item.proteinPer100g * factor,
    fat: item.fatPer100g * factor,
  };
}

function addTotals(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  return {
    calories: a.calories + b.calories,
    carbs: a.carbs + b.carbs,
    protein: a.protein + b.protein,
    fat: a.fat + b.fat,
  };
}

export function mealNutrition(meal: Pick<Meal, "foods">): NutritionTotals {
  return meal.foods.reduce(
    (total, item) => addTotals(total, foodItemNutrition(item)),
    EMPTY_TOTALS,
  );
}

// Sums nutrition for a list of meals, looking each one up by id in an
// already-fetched meals list — no extra RPC needed, the coach UI already has
// the full meals array in memory for the meal picker.
export function mealsNutrition(mealIds: string[], mealsById: Map<string, Meal>): NutritionTotals {
  return mealIds.reduce((total, id) => {
    const meal = mealsById.get(id);
    return meal ? addTotals(total, mealNutrition(meal)) : total;
  }, EMPTY_TOTALS);
}

export function roundTotals(totals: NutritionTotals): NutritionTotals {
  return {
    calories: Math.round(totals.calories),
    carbs: Math.round(totals.carbs),
    protein: Math.round(totals.protein),
    fat: Math.round(totals.fat),
  };
}

export type DietGoal = "bulk" | "cut";

export interface MacroTarget {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

const ACTIVITY_MULTIPLIER = 1.55; // "moderately active" — reasonable default for a coached client
const CUT_ADJUSTMENT = 0.8; // 20% deficit
const BULK_ADJUSTMENT = 1.15; // 15% surplus
const PROTEIN_PER_KG = 2.2;
const FAT_CALORIE_SHARE = 0.25;
const DEFAULT_AGE = 30; // used when dob is unknown

function ageFromDob(dob: string | null): number {
  if (!dob) return DEFAULT_AGE;
  const diffMs = Date.now() - new Date(dob).getTime();
  return Math.max(15, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));
}

// Estimate, not a medical/dietitian-grade calculation. This app's client
// profiles don't collect sex, so BMR uses a sex-neutral approximation of
// Mifflin-St Jeor — averaging the male (+5) and female (-161) constants into
// -78 — plus a fixed "moderately active" multiplier since there's no
// activity-level field to ask instead.
export function recommendMacros(
  profile: { weight: number | null; height: number | null; dob: string | null },
  goal: DietGoal,
): MacroTarget | null {
  if (!profile.weight || !profile.height) return null;

  const age = ageFromDob(profile.dob);
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age - 78;
  const maintenance = bmr * ACTIVITY_MULTIPLIER;
  const calories = Math.round(maintenance * (goal === "cut" ? CUT_ADJUSTMENT : BULK_ADJUSTMENT));

  const proteinGrams = Math.round(profile.weight * PROTEIN_PER_KG);
  const fatGrams = Math.round((calories * FAT_CALORIE_SHARE) / 9);
  const remainingCalories = calories - proteinGrams * 4 - fatGrams * 9;
  const carbsGrams = Math.max(0, Math.round(remainingCalories / 4));

  return { calories, proteinGrams, carbsGrams, fatGrams };
}
