import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { ProductPublic } from "@/products/types";
import { useCart } from "@/cart/CartContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

function variantPrice(v: { sellingPrice: number; discount: number }): number {
  return v.sellingPrice - (v.sellingPrice * v.discount) / 100;
}

export function ProductQuickView({
  product,
  open,
  onOpenChange,
}: {
  product: ProductPublic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cart = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Reset only when the dialog opens or a different product is shown —
  // intentionally keyed off product?.id rather than the product object
  // itself, which changes reference on every query refetch.
  useEffect(() => {
    if (open && product) {
      setActiveImage(0);
      setSelectedVariantId(product.variants.length === 1 ? product.variants[0].id : null);
      setQuantity(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  if (!product) return null;

  const hasMultipleVariants = product.variants.length > 1;
  const displayVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const price = variantPrice(displayVariant);
  const images = displayVariant.assets.filter((a) => a.type === "image");
  const needsVariantChoice = hasMultipleVariants && !selectedVariantId;

  const handleAddToCart = () => {
    if (needsVariantChoice) return;
    cart.addItem(
      {
        productId: product.id,
        variantId: displayVariant.id,
        variantName: displayVariant.name || undefined,
        title: product.title,
        image: images[0]?.url,
        unitPrice: price,
      },
      quantity,
    );
    cart.openCart();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl normal-case tracking-tight">
            {product.title}
          </DialogTitle>
          <DialogDescription className="sr-only">{product.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="aspect-square overflow-hidden rounded-sm bg-muted">
              {images[activeImage] && (
                <img
                  src={images[activeImage].url}
                  alt={product.title}
                  className="h-full w-full object-cover grayscale"
                />
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-2 flex gap-2">
                {images.map((image, i) => (
                  <button
                    key={image.url}
                    onClick={() => setActiveImage(i)}
                    className={`h-14 w-14 overflow-hidden rounded-sm border ${
                      i === activeImage ? "border-foreground" : "border-border"
                    }`}
                  >
                    <img src={image.url} alt="" className="h-full w-full object-cover grayscale" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-xs uppercase tracking-[0.25em] text-foreground/60">
              {product.categoryName}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-display text-2xl">${price.toFixed(2)}</span>
              {displayVariant.discount > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  ${displayVariant.sellingPrice.toFixed(2)}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground/70">{product.description}</p>

            {hasMultipleVariants && (
              <div className="mt-4">
                <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                  Variant
                </label>
                <Select
                  value={selectedVariantId ?? ""}
                  onValueChange={(value) => {
                    setSelectedVariantId(value);
                    setActiveImage(0);
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variants.map((v) => (
                      <SelectItem key={v.id} value={v.id} disabled={v.quantity === 0}>
                        {v.name || "Default"} {v.quantity === 0 ? "— Sold Out" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                Qty
              </span>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid h-8 w-8 place-items-center rounded-sm border border-border hover:bg-muted"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="grid h-8 w-8 place-items-center rounded-sm border border-border hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={needsVariantChoice || displayVariant.quantity === 0}
              className="mt-6 h-12 w-full rounded-sm bg-foreground text-sm font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {needsVariantChoice
                ? "Choose a Variant"
                : displayVariant.quantity === 0
                  ? "Out of Stock"
                  : "Add to Cart"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
