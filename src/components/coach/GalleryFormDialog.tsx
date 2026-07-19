import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createGalleryFn, updateGalleryFn, uploadGalleryImageFn } from "@/galleries/functions";
import type { Gallery } from "@/galleries/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageDraft {
  localId: string;
  previewUrl: string; // blob: URL for new uploads, real server url for existing images
  url: string; // "" while an upload is in flight
  uploading: boolean;
}

interface FieldErrors {
  name?: string;
}

export function GalleryFormDialog({
  open,
  onOpenChange,
  gallery,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery: Gallery | null;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showOnLandingPage, setShowOnLandingPage] = useState(false);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const imagesRef = useRef<ImageDraft[]>(images);
  imagesRef.current = images;

  useEffect(() => {
    if (!open) return;
    if (gallery) {
      setName(gallery.name);
      setDescription(gallery.description);
      setShowOnLandingPage(gallery.showOnLandingPage);
      setImages(
        gallery.images.map((img) => ({
          localId: crypto.randomUUID(),
          previewUrl: img.url,
          url: img.url,
          uploading: false,
        })),
      );
    } else {
      setName("");
      setDescription("");
      setShowOnLandingPage(false);
      setImages([]);
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, gallery]);

  // Revoke blob preview URLs once the dialog closes — reads the latest
  // images via ref so this only runs on the open->closed transition.
  useEffect(() => {
    if (open) return;
    for (const img of imagesRef.current) {
      if (img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
    }
  }, [open]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFormError(null);
    for (const file of Array.from(files)) {
      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setImages((prev) => [...prev, { localId, previewUrl, url: "", uploading: true }]);
      try {
        const data = new FormData();
        data.set("file", file);
        const result = await uploadGalleryImageFn({ data });
        setImages((prev) =>
          prev.map((img) =>
            img.localId === localId ? { ...img, url: result.url, uploading: false } : img,
          ),
        );
      } catch (err) {
        setImages((prev) => prev.filter((img) => img.localId !== localId));
        setFormError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (localId: string) => {
    setImages((prev) => prev.filter((img) => img.localId !== localId));
  };

  const anyUploading = images.some((img) => img.uploading);

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
        description: description.trim(),
        images: images.map((img) => ({ url: img.url })),
        showOnLandingPage,
      };
      if (gallery) {
        return updateGalleryFn({ data: { id: gallery.id, input } });
      }
      return createGalleryFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "galleries"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{gallery ? "Edit Gallery" : "Add Gallery"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="gallery-name">Name</Label>
            <Input
              id="gallery-name"
              placeholder="e.g. Strength Sessions"
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
            <Label htmlFor="gallery-description">Description</Label>
            <Textarea
              id="gallery-description"
              rows={2}
              placeholder="Optional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex items-center justify-between rounded-sm border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Show on landing page</p>
              <p className="text-xs text-muted-foreground">
                Always visible on the full gallery page either way
              </p>
            </div>
            <Switch checked={showOnLandingPage} onCheckedChange={setShowOnLandingPage} />
          </div>

          <div>
            <Label>Images</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((img) => (
                <div
                  key={img.localId}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-border"
                >
                  <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
                  {img.uploading && (
                    <div className="absolute inset-0 grid place-items-center bg-background/70">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.localId)}
                    aria-label="Remove image"
                    className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid h-20 w-20 shrink-0 place-items-center rounded-sm border border-dashed border-foreground/30 text-foreground/50 hover:text-foreground"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
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
              Save Gallery
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
