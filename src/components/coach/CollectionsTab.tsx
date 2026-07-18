import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteCollectionFn } from "@/products/functions";
import type { CollectionAdmin, ProductAdmin } from "@/products/types";
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
import { CollectionFormDialog } from "./CollectionFormDialog";

export function CollectionsTab({
  collections,
  products,
  isLoading,
}: {
  collections: CollectionAdmin[];
  products: ProductAdmin[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogCollection, setDialogCollection] = useState<CollectionAdmin | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionAdmin | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCollectionFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "collections"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogCollection("new")}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          <Plus className="h-4 w-4" /> Add Collection
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Landing Page</TableHead>
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
            {!isLoading && collections.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No collections yet.
                </TableCell>
              </TableRow>
            )}
            {collections.map((collection) => (
              <TableRow key={collection.id}>
                <TableCell className="font-medium">{collection.name}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {collection.description}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {collection.productIds.length}
                </TableCell>
                <TableCell>
                  <Badge variant={collection.showOnLandingPage ? "default" : "secondary"}>
                    {collection.showOnLandingPage ? "Yes" : "No"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button
                      aria-label="Edit collection"
                      onClick={() => setDialogCollection(collection)}
                      className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Delete collection"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(collection);
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

      <CollectionFormDialog
        open={dialogCollection !== null}
        onOpenChange={(open) => !open && setDialogCollection(null)}
        products={products}
        collection={dialogCollection === "new" ? null : dialogCollection}
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
