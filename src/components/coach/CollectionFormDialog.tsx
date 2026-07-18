import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { createCollectionFn, updateCollectionFn } from "@/products/functions";
import type { CollectionAdmin, ProductAdmin } from "@/products/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  description?: string;
}

export function CollectionFormDialog({
  open,
  onOpenChange,
  products,
  collection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductAdmin[];
  collection: CollectionAdmin | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showOnLandingPage, setShowOnLandingPage] = useState(false);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (collection) {
      setName(collection.name);
      setDescription(collection.description);
      setShowOnLandingPage(collection.showOnLandingPage);
      setProductIds(collection.productIds);
    } else {
      setName("");
      setDescription("");
      setShowOnLandingPage(false);
      setProductIds([]);
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, collection]);

  const toggleProduct = (id: string) => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors: FieldErrors = {};
      if (!name.trim()) errors.name = "Name is required";
      if (!description.trim()) errors.description = "Description is required";
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the highlighted fields.");
      }

      const input = {
        name: name.trim(),
        description: description.trim(),
        productIds,
        showOnLandingPage,
      };
      if (collection) {
        return updateCollectionFn({ data: { id: collection.id, input } });
      }
      return createCollectionFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "collections"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "Add Collection"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="collection-description">Description</Label>
            <Textarea
              id="collection-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-sm border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Show on landing page</p>
              <p className="text-xs text-muted-foreground">
                Always visible on the full shop page either way
              </p>
            </div>
            <Switch checked={showOnLandingPage} onCheckedChange={setShowOnLandingPage} />
          </div>

          <div>
            <Label>Products</Label>
            <div className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-sm border border-border p-3">
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground">No products yet.</p>
              )}
              {products.map((product) => (
                <label key={product.id} className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={productIds.includes(product.id)}
                    onCheckedChange={() => toggleProduct(product.id)}
                  />
                  <span className="flex-1">{product.title}</span>
                  <span className="text-xs text-muted-foreground">{product.categoryName}</span>
                </label>
              ))}
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
              Save Collection
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
