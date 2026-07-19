import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createFoodFn, updateFoodFn, uploadFoodImageFn } from "@/diet/functions";
import type { Food } from "@/diet/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function FoodFormDialog({
  open,
  onOpenChange,
  food,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food: Food | null;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [calories, setCalories] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [protein, setProtein] = useState("0");
  const [fat, setFat] = useState("0");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  previewRef.current = previewUrl;

  useEffect(() => {
    if (!open) return;
    if (food) {
      setName(food.name);
      setImageUrl(food.image);
      setPreviewUrl(food.image);
      setCalories(String(food.caloriesPer100g));
      setCarbs(String(food.carbsPer100g));
      setProtein(String(food.proteinPer100g));
      setFat(String(food.fatPer100g));
    } else {
      setName("");
      setImageUrl(null);
      setPreviewUrl(null);
      setCalories("0");
      setCarbs("0");
      setProtein("0");
      setFat("0");
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, food]);

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
      const result = await uploadFoodImageFn({ data });
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
        image: imageUrl,
        caloriesPer100g: Number(calories) || 0,
        carbsPer100g: Number(carbs) || 0,
        proteinPer100g: Number(protein) || 0,
        fatPer100g: Number(fat) || 0,
      };
      if (food) {
        return updateFoodFn({ data: { id: food.id, input } });
      }
      return createFoodFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "foods"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{food ? "Edit Food" : "Add Food"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="food-name">Name</Label>
            <Input
              id="food-name"
              placeholder="e.g. Chicken Breast"
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
            <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/50">
              Nutrition facts — per 100g
            </p>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="food-calories">Calories</Label>
                <Input
                  id="food-calories"
                  type="number"
                  step="1"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="food-carbs">Carbs (g)</Label>
                <Input
                  id="food-carbs"
                  type="number"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="food-protein">Protein (g)</Label>
                <Input
                  id="food-protein"
                  type="number"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="food-fat">Fat (g)</Label>
                <Input
                  id="food-fat"
                  type="number"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="mt-2"
                />
              </div>
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
              Save Food
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
