import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteExerciseFn } from "@/training/functions";
import type { Exercise, MuscleGroup } from "@/training/types";
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
import { ExerciseFormDialog } from "./ExerciseFormDialog";

export function ExercisesTab({
  exercises,
  muscleGroups,
  isLoading,
}: {
  exercises: Exercise[];
  muscleGroups: MuscleGroup[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogExercise, setDialogExercise] = useState<Exercise | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExerciseFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "exercises"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogExercise("new")}
          disabled={muscleGroups.length === 0}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
          title={muscleGroups.length === 0 ? "Add a muscle group first" : undefined}
        >
          <Plus className="h-4 w-4" /> Add Exercise
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Muscle Group</TableHead>
              <TableHead>Media</TableHead>
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
            {!isLoading && exercises.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No exercises yet.
                </TableCell>
              </TableRow>
            )}
            {exercises.map((exercise) => {
              const primary = exercise.assets.find((a) => a.isPrimary) ?? exercise.assets[0];
              return (
                <TableRow key={exercise.id}>
                  <TableCell>
                    {primary ? (
                      primary.type === "video" ? (
                        <video
                          src={primary.url}
                          muted
                          preload="metadata"
                          className="h-12 w-12 rounded-sm object-cover"
                        />
                      ) : (
                        <img
                          src={primary.url}
                          alt=""
                          className="h-12 w-12 rounded-sm object-cover"
                        />
                      )
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-sm bg-muted text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{exercise.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {exercise.muscleGroupName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{exercise.assets.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        aria-label="Edit exercise"
                        onClick={() => setDialogExercise(exercise)}
                        className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Delete exercise"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(exercise);
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

      <ExerciseFormDialog
        open={dialogExercise !== null}
        onOpenChange={(open) => !open && setDialogExercise(null)}
        muscleGroups={muscleGroups}
        exercise={dialogExercise === "new" ? null : dialogExercise}
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
