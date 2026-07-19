import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createMealFn, getCoachFoodsFn, updateMealFn } from "@/diet/functions";
import { foodItemNutrition, roundTotals } from "@/diet/nutrition";
import type { Food, Meal } from "@/diet/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FoodRowDraft {
  localId: string;
  foodId: string;
  quantityGrams: string;
}

interface FieldErrors {
  name?: string;
}

export function MealFormDialog({
  open,
  onOpenChange,
  meal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: Meal | null;
}) {
  const queryClient = useQueryClient();
  const foodsQuery = useQuery({
    queryKey: ["coach", "foods"],
    queryFn: () => getCoachFoodsFn(),
  });
  const foods = foodsQuery.data ?? [];
  const foodsById = new Map<string, Food>(foods.map((f) => [f.id, f]));

  const [name, setName] = useState("");
  const [rows, setRows] = useState<FoodRowDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (meal) {
      setName(meal.name);
      setRows(
        meal.foods.map((f) => ({
          localId: crypto.randomUUID(),
          foodId: f.foodId,
          quantityGrams: String(f.quantityGrams),
        })),
      );
    } else {
      setName("");
      setRows([]);
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, meal]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { localId: crypto.randomUUID(), foodId: "", quantityGrams: "100" },
    ]);
  };

  const removeRow = (localId: string) => {
    setRows((prev) => prev.filter((r) => r.localId !== localId));
  };

  const updateRow = (localId: string, updater: (row: FoodRowDraft) => FoodRowDraft) => {
    setRows((prev) => prev.map((r) => (r.localId === localId ? updater(r) : r)));
  };

  const totals = roundTotals(
    rows.reduce(
      (sum, row) => {
        const food = foodsById.get(row.foodId);
        if (!food) return sum;
        const item = foodItemNutrition({
          foodId: food.id,
          foodName: food.name,
          quantityGrams: Number(row.quantityGrams) || 0,
          caloriesPer100g: food.caloriesPer100g,
          carbsPer100g: food.carbsPer100g,
          proteinPer100g: food.proteinPer100g,
          fatPer100g: food.fatPer100g,
        });
        return {
          calories: sum.calories + item.calories,
          carbs: sum.carbs + item.carbs,
          protein: sum.protein + item.protein,
          fat: sum.fat + item.fat,
        };
      },
      { calories: 0, carbs: 0, protein: 0, fat: 0 },
    ),
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors: FieldErrors = {};
      if (!name.trim()) errors.name = "Name is required";
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the highlighted fields.");
      }

      const input = {
        name: name.trim(),
        foods: rows
          .filter((r) => r.foodId)
          .map((r) => ({ foodId: r.foodId, quantityGrams: Number(r.quantityGrams) || 0 })),
      };
      if (meal) {
        return updateMealFn({ data: { id: meal.id, input } });
      }
      return createMealFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "meals"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{meal ? "Edit Meal" : "Add Meal"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="meal-name">Name</Label>
            <Input
              id="meal-name"
              placeholder="e.g. Chicken & Rice Bowl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Foods</Label>
            <button
              type="button"
              onClick={addRow}
              disabled={foods.length === 0}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-foreground/70 hover:text-foreground disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add Food
            </button>
          </div>

          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.localId} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Food</Label>
                  <Select
                    value={row.foodId}
                    onValueChange={(value) =>
                      updateRow(row.localId, (r) => ({ ...r, foodId: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a food" />
                    </SelectTrigger>
                    <SelectContent>
                      {foods.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <Label>Grams</Label>
                  <Input
                    type="number"
                    min={0}
                    value={row.quantityGrams}
                    onChange={(e) =>
                      updateRow(row.localId, (r) => ({ ...r, quantityGrams: e.target.value }))
                    }
                    className="mt-2"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.localId)}
                  aria-label="Remove food"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-sm hover:bg-muted"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground">No foods added yet.</p>
            )}
          </div>

          <div className="rounded-sm border border-border p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/50">
              Total nutrition
            </p>
            <div className="mt-2 grid grid-cols-4 gap-3 text-sm">
              <div>
                <p className="font-display text-lg">{totals.calories}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div>
                <p className="font-display text-lg">{totals.carbs}g</p>
                <p className="text-xs text-muted-foreground">carbs</p>
              </div>
              <div>
                <p className="font-display text-lg">{totals.protein}g</p>
                <p className="text-xs text-muted-foreground">protein</p>
              </div>
              <div>
                <p className="font-display text-lg">{totals.fat}g</p>
                <p className="text-xs text-muted-foreground">fat</p>
              </div>
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Meal
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
