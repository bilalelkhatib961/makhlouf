import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteGalleryFn } from "@/galleries/functions";
import type { Gallery } from "@/galleries/types";
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
import { GalleryFormDialog } from "./GalleryFormDialog";

export function GalleriesTab({
  galleries,
  isLoading,
}: {
  galleries: Gallery[];
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [dialogGallery, setDialogGallery] = useState<Gallery | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gallery | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGalleryFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "galleries"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setDialogGallery("new")}
          className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background"
        >
          <Plus className="h-4 w-4" /> Add Gallery
        </button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Landing Page</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && galleries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No galleries yet.
                </TableCell>
              </TableRow>
            )}
            {galleries.map((gallery) => {
              const cover = gallery.images[0];
              return (
                <TableRow key={gallery.id}>
                  <TableCell>
                    {cover ? (
                      <img src={cover.url} alt="" className="h-12 w-12 rounded-sm object-cover" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-sm bg-muted text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{gallery.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {gallery.description}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{gallery.images.length}</TableCell>
                  <TableCell>
                    <Badge variant={gallery.showOnLandingPage ? "default" : "secondary"}>
                      {gallery.showOnLandingPage ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        aria-label="Edit gallery"
                        onClick={() => setDialogGallery(gallery)}
                        className="grid h-8 w-8 place-items-center rounded-sm hover:bg-muted"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Delete gallery"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(gallery);
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

      <GalleryFormDialog
        open={dialogGallery !== null}
        onOpenChange={(open) => !open && setDialogGallery(null)}
        gallery={dialogGallery === "new" ? null : dialogGallery}
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
