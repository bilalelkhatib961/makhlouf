import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteFoodFn } from "@/diet/functions";
import type { Food } from "@/diet/types";
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
import { FoodFormDialog } from "./FoodFormDialog";

export function FoodsTab({ foods, isLoading }: { foods: Food[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const [dialogFood, setDialogFood] = useState<Food | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFoodFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "foods"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogFood("new")}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          <Plus className="h-4 w-4" /> Add Food
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Carbs</TableHead>
              <TableHead>Protein</TableHead>
              <TableHead>Fat</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && foods.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No foods yet.
                </TableCell>
              </TableRow>
            )}
            {foods.map((food) => (
              <TableRow key={food.id}>
                <TableCell>
                  {food.image ? (
                    <img src={food.image} alt="" className="h-12 w-12 rounded-sm object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-sm bg-muted text-muted-foreground">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{food.name}</TableCell>
                <TableCell className="text-muted-foreground">{food.caloriesPer100g} kcal</TableCell>
                <TableCell className="text-muted-foreground">{food.carbsPer100g}g</TableCell>
                <TableCell className="text-muted-foreground">{food.proteinPer100g}g</TableCell>
                <TableCell className="text-muted-foreground">{food.fatPer100g}g</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button
                      aria-label="Edit food"
                      onClick={() => setDialogFood(food)}
                      className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Delete food"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(food);
                      }}
                      className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FoodFormDialog
        open={dialogFood !== null}
        onOpenChange={(open) => !open && setDialogFood(null)}
        food={dialogFood === "new" ? null : dialogFood}
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
