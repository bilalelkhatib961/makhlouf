import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { createCategoryFn, deleteCategoryFn, updateCategoryFn } from "@/products/functions";
import type { Category, ProductAdmin } from "@/products/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function CategoriesTab({
  categories,
  products,
  isLoading,
}: {
  categories: Category[];
  products: ProductAdmin[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogCategory, setDialogCategory] = useState<Category | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["coach", "categories"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (dialogCategory === "new") {
        return createCategoryFn({ data: { name } });
      }
      if (dialogCategory) {
        return updateCategoryFn({ data: { id: dialogCategory.id, input: { name } } });
      }
    },
    onSuccess: () => {
      invalidate();
      setDialogCategory(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategoryFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const openDialog = (category: Category | "new") => {
    setError(null);
    setName(category === "new" ? "" : category.name);
    setDialogCategory(category);
  };

  const countFor = (categoryId: string) =>
    products.filter((p) => p.categoryId === categoryId).length;

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => openDialog("new")}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Products</TableHead>
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
            {!isLoading && categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">{countFor(category.id)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button
                      aria-label="Edit category"
                      onClick={() => openDialog(category)}
                      className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Delete category"
                      onClick={() => {
                        setError(null);
                        setDeleteTarget(category);
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

      <Dialog
        open={dialogCategory !== null}
        onOpenChange={(open) => !open && setDialogCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogCategory === "new" ? "Add Category" : "Edit Category"}</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <button
              disabled={saveMutation.isPending || !name.trim()}
              onClick={() => saveMutation.mutate()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. {error && <span className="text-destructive">{error}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setError(null)}>Cancel</AlertDialogCancel>
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
