import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { uploadProductAssetFn } from "@/products/functions";
import type { AssetType } from "@/products/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface AssetDraft {
  localId: string;
  previewUrl: string; // always what <img src> renders — a blob: URL for new uploads, the real server url for existing assets
  url: string; // "" while an upload is in flight
  type: AssetType;
  isPrimary: boolean;
  uploading: boolean;
}

export interface VariantDraft {
  id: string;
  name: string;
  basePrice: number;
  sellingPrice: number;
  discount: number;
  quantity: number;
  isActive: boolean;
  assets: AssetDraft[];
}

// Co-exported with ProductVariantFields by design — a small factory the
// parent dialog needs for "Add Variant" / initializing a new product.
// eslint-disable-next-line react-refresh/only-export-components
export function emptyVariantDraft(): VariantDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    basePrice: 0,
    sellingPrice: 0,
    discount: 0,
    quantity: 0,
    isActive: true,
    assets: [],
  };
}

export function ProductVariantFields({
  variant,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  variant: VariantDraft;
  index: number;
  canRemove: boolean;
  onChange: (updater: (v: VariantDraft) => VariantDraft) => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    for (const file of Array.from(files)) {
      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      onChange((v) => ({
        ...v,
        assets: [
          ...v.assets,
          {
            localId,
            previewUrl,
            url: "",
            type: "image",
            isPrimary: v.assets.length === 0,
            uploading: true,
          },
        ],
      }));
      try {
        const data = new FormData();
        data.set("file", file);
        const result = await uploadProductAssetFn({ data });
        onChange((v) => ({
          ...v,
          assets: v.assets.map((a) =>
            a.localId === localId ? { ...a, url: result.url, uploading: false } : a,
          ),
        }));
      } catch (err) {
        onChange((v) => ({ ...v, assets: v.assets.filter((a) => a.localId !== localId) }));
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setPrimary = (localId: string) => {
    onChange((v) => ({
      ...v,
      assets: v.assets.map((a) => ({ ...a, isPrimary: a.localId === localId })),
    }));
  };

  const removeAsset = (localId: string) => {
    onChange((v) => {
      const next = v.assets.filter((a) => a.localId !== localId);
      if (next.length > 0 && !next.some((a) => a.isPrimary)) next[0].isPrimary = true;
      return { ...v, assets: next };
    });
  };

  return (
    <div className="space-y-4 rounded-sm border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/50">
          Variant {index + 1}
        </p>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove variant"
            className="grid h-7 w-7 place-items-center rounded-sm hover:bg-muted"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div>
        <Label htmlFor={`variant-name-${variant.id}`}>Variant name</Label>
        <Input
          id={`variant-name-${variant.id}`}
          placeholder="e.g. Black / M — leave blank if this is the only variant"
          value={variant.name}
          onChange={(e) => onChange((v) => ({ ...v, name: e.target.value }))}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <Label htmlFor={`base-price-${variant.id}`}>Base price</Label>
          <Input
            id={`base-price-${variant.id}`}
            type="number"
            step="0.01"
            value={variant.basePrice}
            onChange={(e) => onChange((v) => ({ ...v, basePrice: Number(e.target.value) }))}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor={`selling-price-${variant.id}`}>Selling price</Label>
          <Input
            id={`selling-price-${variant.id}`}
            type="number"
            step="0.01"
            value={variant.sellingPrice}
            onChange={(e) => onChange((v) => ({ ...v, sellingPrice: Number(e.target.value) }))}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor={`discount-${variant.id}`}>Discount %</Label>
          <Input
            id={`discount-${variant.id}`}
            type="number"
            value={variant.discount}
            onChange={(e) => onChange((v) => ({ ...v, discount: Number(e.target.value) }))}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor={`quantity-${variant.id}`}>Quantity</Label>
          <Input
            id={`quantity-${variant.id}`}
            type="number"
            value={variant.quantity}
            onChange={(e) => onChange((v) => ({ ...v, quantity: Number(e.target.value) }))}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-sm border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">Visible in the public shop</p>
        </div>
        <Switch
          checked={variant.isActive}
          onCheckedChange={(checked) => onChange((v) => ({ ...v, isActive: checked }))}
        />
      </div>

      <div>
        <Label>Images</Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {variant.assets.map((asset) => (
            <div
              key={asset.localId}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-border"
            >
              <img src={asset.previewUrl} alt="" className="h-full w-full object-cover" />
              {asset.uploading && (
                <div className="absolute inset-0 grid place-items-center bg-background/70">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setPrimary(asset.localId)}
                aria-label="Set as primary image"
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
        {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}
      </div>
    </div>
  );
}
