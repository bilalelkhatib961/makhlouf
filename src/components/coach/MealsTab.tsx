import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteMealFn } from "@/diet/functions";
import { mealNutrition, roundTotals } from "@/diet/nutrition";
import type { Meal } from "@/diet/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MealFormDialog } from "./MealFormDialog";

export function MealsTab({ meals, isLoading }: { meals: Meal[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const [dialogMeal, setDialogMeal] = useState<Meal | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meal | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMealFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "meals"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogMeal("new")}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          <Plus className="h-4 w-4" /> Add Meal
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Foods</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && meals.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No meals yet.
                </TableCell>
              </TableRow>
            )}
            {meals.map((meal) => {
              const totals = roundTotals(mealNutrition(meal));
              return (
                <TableRow key={meal.id}>
                  <TableCell className="font-medium">{meal.name}</TableCell>
                  <TableCell className="text-muted-foreground">{meal.foods.length}</TableCell>
                  <TableCell className="text-muted-foreground">{totals.calories} kcal</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        aria-label="Edit meal"
                        onClick={() => setDialogMeal(meal)}
                        className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Delete meal"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(meal);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <MealFormDialog
        open={dialogMeal !== null}
        onOpenChange={(open) => !open && setDialogMeal(null)}
        meal={dialogMeal === "new" ? null : dialogMeal}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone.{" "}
              {deleteError && <span className="text-destructive">{deleteError}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteError(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
