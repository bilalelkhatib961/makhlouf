import type { Weekday } from "@/training/types";

export interface Food {
  id: string;
  name: string;
  image: string | null;
  caloriesPer100g: number;
  carbsPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
}

export interface FoodInput {
  name: string;
  image: string | null;
  caloriesPer100g: number;
  carbsPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
}

export interface MealFoodItem {
  foodId: string;
  foodName: string;
  quantityGrams: number;
  caloriesPer100g: number;
  carbsPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
}

export interface MealFoodItemInput {
  foodId: string;
  quantityGrams: number;
}

export interface Meal {
  id: string;
  name: string;
  foods: MealFoodItem[];
}

export interface MealInput {
  name: string;
  foods: MealFoodItemInput[];
}

export interface DietPlanMeal {
  mealId: string;
  mealName: string;
}

export interface DietPlanDay {
  day: Weekday;
  label: string;
  meals: DietPlanMeal[];
}

export interface DietPlanDayInput {
  day: Weekday;
  label: string;
  mealIds: string[];
}

export interface DietPlan {
  id: string;
  name: string;
  description: string;
  days: DietPlanDay[];
}

export interface DietPlanInput {
  name: string;
  description: string;
  days: DietPlanDayInput[];
}

export interface DietPlanAssignment {
  id: string;
  dietPlanId: string;
  dietPlanName: string;
  startDate: string; // ISO date string
}

export interface AssignDietPlanInput {
  clientId: string;
  dietPlanId: string;
  startDate: string;
}
