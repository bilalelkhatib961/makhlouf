import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteSplitFn } from "@/training/functions";
import type { Exercise, Split } from "@/training/types";
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
import { SplitFormDialog } from "./SplitFormDialog";

function activeDayCount(split: Split): number {
  return split.days.filter((d) => d.exercises.length > 0).length;
}

function totalExerciseCount(split: Split): number {
  return split.days.reduce((sum, d) => sum + d.exercises.length, 0);
}

export function SplitsTab({
  splits,
  exercises,
  isLoading,
}: {
  splits: Split[];
  exercises: Exercise[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogSplit, setDialogSplit] = useState<Split | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Split | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSplitFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "splits"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogSplit("new")}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          <Plus className="h-4 w-4" /> Add Split
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Active Days</TableHead>
              <TableHead>Total Exercises</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && splits.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No splits yet.
                </TableCell>
              </TableRow>
            )}
            {splits.map((split) => (
              <TableRow key={split.id}>
                <TableCell className="font-medium">{split.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {split.durationWeeks} week{split.durationWeeks === 1 ? "" : "s"}
                </TableCell>
                <TableCell className="text-muted-foreground">{activeDayCount(split)} / 7</TableCell>
                <TableCell className="text-muted-foreground">{totalExerciseCount(split)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button
                      aria-label="Edit split"
                      onClick={() => setDialogSplit(split)}
                      className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Delete split"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(split);
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

      <SplitFormDialog
        open={dialogSplit !== null}
        onOpenChange={(open) => !open && setDialogSplit(null)}
        exercises={exercises}
        split={dialogSplit === "new" ? null : dialogSplit}
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
