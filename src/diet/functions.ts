import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coachMiddleware } from "@/auth/middleware.server";
import { WEEKDAYS } from "@/training/types";
import { assignDietPlan } from "./diet-assignments.server";
import { createDietPlan, deleteDietPlan, listDietPlans, updateDietPlan } from "./diet-plans.server";
import { createFood, deleteFood, listFoods, updateFood } from "./foods.server";
import { createMeal, deleteMeal, listMeals, updateMeal } from "./meals.server";
import { saveFoodImage } from "./upload.server";

const foodInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  image: z.string().nullable(),
  caloriesPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
});

const mealFoodInputSchema = z.object({
  foodId: z.string().min(1),
  quantityGrams: z.number().min(0),
});

const mealInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  foods: z.array(mealFoodInputSchema),
});

const dietPlanDayInputSchema = z.object({
  day: z.enum(WEEKDAYS),
  label: z.string(),
  mealIds: z.array(z.string().min(1)),
});

const dietPlanInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  days: z.array(dietPlanDayInputSchema),
});

const assignDietPlanInputSchema = z.object({
  clientId: z.string().min(1),
  dietPlanId: z.string().min(1),
  startDate: z.string().min(1),
});

// --- Reads (coach-only) ---

export const getCoachFoodsFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listFoods());

export const getCoachMealsFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listMeals());

export const getCoachDietPlansFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listDietPlans());

// --- Food mutations ---

export const createFoodFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(foodInputSchema)
  .handler(async ({ data }) => createFood(data));

export const updateFoodFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: foodInputSchema }))
  .handler(async ({ data }) => updateFood(data.id, data.input));

export const deleteFoodFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteFood(data.id));

// --- Meal mutations ---

export const createMealFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(mealInputSchema)
  .handler(async ({ data }) => createMeal(data));

export const updateMealFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: mealInputSchema }))
  .handler(async ({ data }) => updateMeal(data.id, data.input));

export const deleteMealFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteMeal(data.id));

// --- Diet plan mutations ---

export const createDietPlanFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(dietPlanInputSchema)
  .handler(async ({ data }) => createDietPlan(data));

export const updateDietPlanFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: dietPlanInputSchema }))
  .handler(async ({ data }) => updateDietPlan(data.id, data.input));

export const deleteDietPlanFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteDietPlan(data.id));

export const assignDietPlanFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(assignDietPlanInputSchema)
  .handler(async ({ data }) => assignDietPlan(data));

// --- Asset upload (coach-only) ---

export const uploadFoodImageFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file field named 'file'");
    return file;
  })
  .handler(async ({ data: file }) => ({ url: await saveFoodImage(file) }));
