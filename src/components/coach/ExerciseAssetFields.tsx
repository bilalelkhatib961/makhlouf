import { useRef, useState } from "react";
import { FilePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { uploadExerciseAssetFn } from "@/training/functions";
import type { AssetType } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface ExerciseAssetDraft {
  localId: string;
  previewUrl: string; // blob: URL for new uploads, real server url for existing assets
  url: string; // "" while an upload is in flight
  type: AssetType;
  isPrimary: boolean;
  uploading: boolean;
}

export function ExerciseAssetFields({
  assets,
  onChange,
}: {
  assets: ExerciseAssetDraft[];
  onChange: (updater: (assets: ExerciseAssetDraft[]) => ExerciseAssetDraft[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    for (const file of Array.from(files)) {
      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      const type: AssetType = file.type.startsWith("video/") ? "video" : "image";
      onChange((prev) => [
        ...prev,
        { localId, previewUrl, url: "", type, isPrimary: prev.length === 0, uploading: true },
      ]);
      try {
        const data = new FormData();
        data.set("file", file);
        const result = await uploadExerciseAssetFn({ data });
        onChange((prev) =>
          prev.map((a) =>
            a.localId === localId ? { ...a, url: result.url, uploading: false } : a,
          ),
        );
      } catch (err) {
        onChange((prev) => prev.filter((a) => a.localId !== localId));
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setPrimary = (localId: string) => {
    onChange((prev) => prev.map((a) => ({ ...a, isPrimary: a.localId === localId })));
  };

  const removeAsset = (localId: string) => {
    onChange((prev) => {
      const next = prev.filter((a) => a.localId !== localId);
      if (next.length > 0 && !next.some((a) => a.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  };

  return (
    <div>
      <Label>Images &amp; Video</Label>
      <div className="mt-2 flex flex-wrap gap-3">
        {assets.map((asset) => (
          <div
            key={asset.localId}
            className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-border"
          >
            {asset.type === "video" ? (
              <video
                src={asset.previewUrl}
                muted
                preload="metadata"
                className="h-full w-full object-cover"
              />
            ) : (
              <img src={asset.previewUrl} alt="" className="h-full w-full object-cover" />
            )}
            {asset.uploading && (
              <div className="absolute inset-0 grid place-items-center bg-background/70">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setPrimary(asset.localId)}
              aria-label="Set as primary asset"
              className={cn(
                "absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90",
                asset.isPrimary && "bg-foreground text-background",
              )}
            >
              <Star className="h-3 w-3" fill={asset.isPrimary ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => removeAsset(asset.localId)}
              aria-label="Remove asset"
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
          <FilePlus className="h-5 w-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}
    </div>
  );
}
