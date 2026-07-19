import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteDietPlanFn } from "@/diet/functions";
import type { DietPlan, Meal } from "@/diet/types";
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
import { DietPlanFormDialog } from "./DietPlanFormDialog";

function activeDayCount(plan: DietPlan): number {
  return plan.days.filter((d) => d.meals.length > 0).length;
}

function totalMealCount(plan: DietPlan): number {
  return plan.days.reduce((sum, d) => sum + d.meals.length, 0);
}

export function DietPlansTab({
  dietPlans,
  meals,
  isLoading,
}: {
  dietPlans: DietPlan[];
  meals: Meal[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogPlan, setDialogPlan] = useState<DietPlan | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DietPlan | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDietPlanFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "dietPlans"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogPlan("new")}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          <Plus className="h-4 w-4" /> Add Diet Plan
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Active Days</TableHead>
              <TableHead>Total Meals</TableHead>
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
            {!isLoading && dietPlans.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No diet plans yet.
                </TableCell>
              </TableRow>
            )}
            {dietPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell className="text-muted-foreground">{activeDayCount(plan)} / 7</TableCell>
                <TableCell className="text-muted-foreground">{totalMealCount(plan)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button
                      aria-label="Edit diet plan"
                      onClick={() => setDialogPlan(plan)}
                      className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Delete diet plan"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(plan);
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

      <DietPlanFormDialog
        open={dialogPlan !== null}
        onOpenChange={(open) => !open && setDialogPlan(null)}
        meals={meals}
        dietPlan={dialogPlan === "new" ? null : dialogPlan}
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
