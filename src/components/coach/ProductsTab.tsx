import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteProductFn } from "@/products/functions";
import type { Category, ProductAdmin } from "@/products/types";
import { Badge } from "@/components/ui/badge";
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
import { ProductFormDialog } from "./ProductFormDialog";

function variantPrice(v: { sellingPrice: number; discount: number }): number {
  return v.sellingPrice - (v.sellingPrice * v.discount) / 100;
}

function priceDisplay(product: ProductAdmin): string {
  const prices = product.variants.map(variantPrice);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} – $${max.toFixed(2)}`;
}

export function ProductsTab({
  products,
  categories,
  isLoading,
}: {
  products: ProductAdmin[];
  categories: Category[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogProduct, setDialogProduct] = useState<ProductAdmin | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductAdmin | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "products"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogProduct("new")}
          disabled={categories.length === 0}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
          title={categories.length === 0 ? "Add a category first" : undefined}
        >
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No products yet.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const firstAssetVariant = product.variants.find((v) => v.assets.length > 0);
              const primary =
                firstAssetVariant?.assets.find((a) => a.isPrimary) ?? firstAssetVariant?.assets[0];
              const totalQuantity = product.variants.reduce((sum, v) => sum + v.quantity, 0);
              const isActive = product.variants.some((v) => v.isActive);
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    {primary ? (
                      <img src={primary.url} alt="" className="h-12 w-12 rounded-sm object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-sm bg-muted text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.title}</TableCell>
                  <TableCell className="text-muted-foreground">{product.categoryName}</TableCell>
                  <TableCell className="text-muted-foreground">{product.variants.length}</TableCell>
                  <TableCell>{priceDisplay(product)}</TableCell>
                  <TableCell className="text-muted-foreground">{totalQuantity}</TableCell>
                  <TableCell>
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        aria-label="Edit product"
                        onClick={() => setDialogProduct(product)}
                        className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Delete product"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(product);
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

      <ProductFormDialog
        open={dialogProduct !== null}
        onOpenChange={(open) => !open && setDialogProduct(null)}
        categories={categories}
        product={dialogProduct === "new" ? null : dialogProduct}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
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
