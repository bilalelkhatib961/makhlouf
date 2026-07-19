import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  createMuscleCategoryFn,
  updateMuscleCategoryFn,
  uploadMuscleImageFn,
} from "@/training/functions";
import type { MuscleCategory, MuscleGroup } from "@/training/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FieldErrors {
  name?: string;
}

export function MuscleCategoryFormDialog({
  open,
  onOpenChange,
  muscleGroups,
  muscleCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  muscleGroups: MuscleGroup[];
  muscleCategory: MuscleCategory | null;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [muscleGroupIds, setMuscleGroupIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  previewRef.current = previewUrl;

  useEffect(() => {
    if (!open) return;
    if (muscleCategory) {
      setName(muscleCategory.name);
      setImageUrl(muscleCategory.image);
      setPreviewUrl(muscleCategory.image);
      setMuscleGroupIds(muscleCategory.muscleGroupIds);
    } else {
      setName("");
      setImageUrl(null);
      setPreviewUrl(null);
      setMuscleGroupIds([]);
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, muscleCategory]);

  useEffect(() => {
    if (open) return;
    if (previewRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewRef.current);
  }, [open]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFormError(null);
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadMuscleImageFn({ data });
      setImageUrl(result.url);
    } catch (err) {
      setPreviewUrl(imageUrl);
      setFormError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    setPreviewUrl(null);
  };

  const toggleGroup = (id: string) => {
    setMuscleGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors: FieldErrors = {};
      if (!name.trim()) errors.name = "Name is required";
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the highlighted fields.");
      }

      const input = { name: name.trim(), image: imageUrl, muscleGroupIds };
      if (muscleCategory) {
        return updateMuscleCategoryFn({ data: { id: muscleCategory.id, input } });
      }
      return createMuscleCategoryFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "muscle-categories"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {muscleCategory ? "Edit Muscle Category" : "Add Muscle Category"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="muscle-category-name">Name</Label>
            <Input
              id="muscle-category-name"
              placeholder="e.g. Arms"
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
            <Label>Image</Label>
            <div className="mt-2 flex items-center gap-3">
              {previewUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-border">
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 grid place-items-center bg-background/70">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removeImage}
                    aria-label="Remove image"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-sm border border-dashed border-foreground/30 text-foreground/50 hover:text-foreground"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <div>
            <Label>Muscle Groups</Label>
            <div className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-sm border border-border p-3">
              {muscleGroups.length === 0 && (
                <p className="text-sm text-muted-foreground">No muscle groups yet.</p>
              )}
              {muscleGroups.map((group) => (
                <label key={group.id} className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={muscleGroupIds.includes(group.id)}
                    onCheckedChange={() => toggleGroup(group.id)}
                  />
                  <span className="flex-1">{group.name}</span>
                </label>
              ))}
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={saveMutation.isPending || uploading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {(saveMutation.isPending || uploading) && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Save Muscle Category
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
