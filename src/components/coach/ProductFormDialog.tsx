import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { createProductFn, updateProductFn } from "@/products/functions";
import type { Category, ProductAdmin, ProductVariantInput } from "@/products/types";
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
import { emptyVariantDraft, ProductVariantFields, type VariantDraft } from "./ProductVariantFields";

interface FieldErrors {
  title?: string;
  description?: string;
  categoryId?: string;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  categories,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  product: ProductAdmin | null;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const variantsRef = useRef<VariantDraft[]>(variants);
  variantsRef.current = variants;

  useEffect(() => {
    if (!open) return;
    if (product) {
      setTitle(product.title);
      setDescription(product.description);
      setCategoryId(product.categoryId);
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          basePrice: v.basePrice,
          sellingPrice: v.sellingPrice,
          discount: v.discount,
          quantity: v.quantity,
          isActive: v.isActive,
          assets: v.assets.map((a) => ({
            localId: crypto.randomUUID(),
            previewUrl: a.url,
            url: a.url,
            type: a.type,
            isPrimary: a.isPrimary,
            uploading: false,
          })),
        })),
      );
    } else {
      setTitle("");
      setDescription("");
      setCategoryId("");
      setVariants([emptyVariantDraft()]);
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, product]);

  // Revoke blob preview URLs once the dialog closes — reads the latest
  // variants via ref so this only runs on the open->closed transition, not
  // on every keystroke/upload while the dialog is still in use.
  useEffect(() => {
    if (open) return;
    for (const v of variantsRef.current) {
      for (const a of v.assets) {
        if (a.previewUrl.startsWith("blob:")) URL.revokeObjectURL(a.previewUrl);
      }
    }
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors: FieldErrors = {};
      if (!title.trim()) errors.title = "Title is required";
      if (!description.trim()) errors.description = "Description is required";
      if (!categoryId) errors.categoryId = "Category is required";
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the highlighted fields.");
      }

      const payloadVariants: ProductVariantInput[] = variants.map((v) => ({
        id: v.id,
        name: v.name.trim(),
        basePrice: v.basePrice,
        sellingPrice: v.sellingPrice,
        discount: v.discount,
        quantity: v.quantity,
        isActive: v.isActive,
        assets: v.assets.map((a) => ({ url: a.url, type: a.type, isPrimary: a.isPrimary })),
      }));

      const input = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        variants: payloadVariants,
      };
      if (product) {
        return updateProductFn({ data: { id: product.id, input } });
      }
      return createProductFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "products"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const anyUploading = variants.some((v) => v.assets.some((a) => a.uploading));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          <div>
            <Label htmlFor="categoryId">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="categoryId" className="mt-2">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.categoryId && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.categoryId}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Variants</Label>
            <button
              type="button"
              onClick={() => setVariants((prev) => [...prev, emptyVariantDraft()])}
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-foreground/70 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add Variant
            </button>
          </div>
          <div className="space-y-4">
            {variants.map((variant, i) => (
              <ProductVariantFields
                key={variant.id}
                variant={variant}
                index={i}
                canRemove={variants.length > 1}
                onChange={(updater) =>
                  setVariants((prev) => prev.map((v, vi) => (vi === i ? updater(v) : v)))
                }
                onRemove={() => setVariants((prev) => prev.filter((_, vi) => vi !== i))}
              />
            ))}
          </div>

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
              Save Product
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
