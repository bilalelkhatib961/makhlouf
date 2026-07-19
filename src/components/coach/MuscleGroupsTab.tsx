import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteMuscleGroupFn } from "@/training/functions";
import type { MuscleGroup } from "@/training/types";
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
import { MuscleGroupFormDialog } from "./MuscleGroupFormDialog";

export function MuscleGroupsTab({
  muscleGroups,
  isLoading,
}: {
  muscleGroups: MuscleGroup[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogGroup, setDialogGroup] = useState<MuscleGroup | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MuscleGroup | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMuscleGroupFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "muscle-groups"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogGroup("new")}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          <Plus className="h-4 w-4" /> Add Muscle Group
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && muscleGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No muscle groups yet.
                </TableCell>
              </TableRow>
            )}
            {muscleGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  {group.image ? (
                    <img src={group.image} alt="" className="h-12 w-12 rounded-sm object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-sm bg-muted text-muted-foreground">
                      <ImageOff className="h-4 w-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{group.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button
                      aria-label="Edit muscle group"
                      onClick={() => setDialogGroup(group)}
                      className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Delete muscle group"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(group);
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

      <MuscleGroupFormDialog
        open={dialogGroup !== null}
        onOpenChange={(open) => !open && setDialogGroup(null)}
        muscleGroup={dialogGroup === "new" ? null : dialogGroup}
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
