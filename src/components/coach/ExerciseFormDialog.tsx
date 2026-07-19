import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { createExerciseFn, updateExerciseFn } from "@/training/functions";
import type { Exercise, MuscleGroup } from "@/training/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExerciseAssetFields, type ExerciseAssetDraft } from "./ExerciseAssetFields";

interface FieldErrors {
  name?: string;
  muscleGroupId?: string;
}

export function ExerciseFormDialog({
  open,
  onOpenChange,
  muscleGroups,
  exercise,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  muscleGroups: MuscleGroup[];
  exercise: Exercise | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroupId, setMuscleGroupId] = useState("");
  const [assets, setAssets] = useState<ExerciseAssetDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const assetsRef = useRef<ExerciseAssetDraft[]>(assets);
  assetsRef.current = assets;

  useEffect(() => {
    if (!open) return;
    if (exercise) {
      setName(exercise.name);
      setDescription(exercise.description);
      setMuscleGroupId(exercise.muscleGroupId);
      setAssets(
        exercise.assets.map((a) => ({
          localId: crypto.randomUUID(),
          previewUrl: a.url,
          url: a.url,
          type: a.type,
          isPrimary: a.isPrimary,
          uploading: false,
        })),
      );
    } else {
      setName("");
      setDescription("");
      setMuscleGroupId("");
      setAssets([]);
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, exercise]);

  useEffect(() => {
    if (open) return;
    for (const a of assetsRef.current) {
      if (a.previewUrl.startsWith("blob:")) URL.revokeObjectURL(a.previewUrl);
    }
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors: FieldErrors = {};
      if (!name.trim()) errors.name = "Name is required";
      if (!muscleGroupId) errors.muscleGroupId = "Muscle group is required";
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the highlighted fields.");
      }

      const input = {
        name: name.trim(),
        description: description.trim(),
        muscleGroupId,
        assets: assets.map((a) => ({ url: a.url, type: a.type, isPrimary: a.isPrimary })),
      };
      if (exercise) {
        return updateExerciseFn({ data: { id: exercise.id, input } });
      }
      return createExerciseFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "exercises"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const anyUploading = assets.some((a) => a.uploading);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{exercise ? "Edit Exercise" : "Add Exercise"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="exercise-name">Name</Label>
            <Input
              id="exercise-name"
              placeholder="e.g. Biceps Curl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="exercise-description">Description</Label>
            <Textarea
              id="exercise-description"
              rows={3}
              placeholder="How to perform it (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="exercise-muscle-group">Muscle Group</Label>
            <Select value={muscleGroupId} onValueChange={setMuscleGroupId}>
              <SelectTrigger id="exercise-muscle-group" className="mt-2">
                <SelectValue placeholder="Select a muscle group" />
              </SelectTrigger>
              <SelectContent>
                {muscleGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.muscleGroupId && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.muscleGroupId}</p>
            )}
          </div>

          <ExerciseAssetFields assets={assets} onChange={(updater) => setAssets(updater)} />

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={saveMutation.isPending || anyUploading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {(saveMutation.isPending || anyUploading) && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Save Exercise
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
