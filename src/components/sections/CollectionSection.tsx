import { useRef } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";
import type { CollectionPublic, ProductPublic } from "@/products/types";
import { lineKey, useCart } from "@/cart/CartContext";

function variantPrice(v: { sellingPrice: number; discount: number }): number {
  return v.sellingPrice - (v.sellingPrice * v.discount) / 100;
}

function cheapestVariant(product: ProductPublic) {
  return product.variants.reduce((min, v) => (variantPrice(v) < variantPrice(min) ? v : min));
}

export function CollectionSection({
  collection,
  onQuickView,
}: {
  collection: CollectionPublic;
  onQuickView: (product: ProductPublic) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (d: 1 | -1) => scroller.current?.scrollBy({ left: d * 420, behavior: "smooth" });
  const cart = useCart();

  if (collection.products.length === 0) return null;

  const handleAdd = (event: React.MouseEvent, product: ProductPublic) => {
    event.stopPropagation();
    if (product.variants.length > 1) {
      onQuickView(product);
      return;
    }
    const variant = product.variants[0];
    const alreadyInCart =
      cart.items.find((i) => i.key === lineKey(product.id, variant.id))?.quantity ?? 0;
    if (alreadyInCart >= variant.quantity) return;
    const primary = variant.assets.find((a) => a.isPrimary) ?? variant.assets[0];
    cart.addItem({
      productId: product.id,
      variantId: variant.id,
      variantName: variant.name || undefined,
      title: product.title,
      image: primary?.url,
      unitPrice: variantPrice(variant),
      maxQuantity: variant.quantity,
    });
    cart.openCart();
  };

  return (
    <section className="relative bg-muted/40 py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
              <span className="h-px w-8 bg-foreground/40" /> Shop
            </div>
            <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl lg:text-7xl">
              {collection.name}
            </h2>
            <p className="mt-4 max-w-xl text-foreground/65">{collection.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous"
              className="grid h-12 w-12 place-items-center rounded-sm border border-foreground/30 transition hover:bg-foreground hover:text-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next"
              className="grid h-12 w-12 place-items-center rounded-sm border border-foreground/30 transition hover:bg-foreground hover:text-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {collection.products.map((product, i) => {
          const cheapest = cheapestVariant(product);
          const primary = cheapest.assets.find((a) => a.isPrimary) ?? cheapest.assets[0];
          const price = variantPrice(cheapest);
          const soldOut = product.variants.every((v) => v.quantity === 0);
          const multiVariant = product.variants.length > 1;
          const alreadyInCart = !multiVariant
            ? (cart.items.find((it) => it.key === lineKey(product.id, product.variants[0].id))
                ?.quantity ?? 0)
            : 0;
          const maxedInCart =
            !multiVariant && !soldOut && alreadyInCart >= product.variants[0].quantity;
          return (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              onClick={() => onQuickView(product)}
              className="group w-[20rem] shrink-0 cursor-pointer snap-start bg-background"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                {primary && (
                  <img
                    src={primary.url}
                    alt={product.title}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <button
                  aria-label="Quick view"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickView(product);
                  }}
                  className="absolute right-3 top-3 grid h-10 w-10 translate-y-2 place-items-center rounded-sm bg-background/90 opacity-0 backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <span className="absolute left-3 top-3 bg-foreground px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-background">
                  {product.categoryName}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg leading-tight normal-case tracking-tight">
                  {product.title}
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl">
                      {multiVariant && "From "}${price.toFixed(2)}
                    </span>
                    {cheapest.discount > 0 && (
                      <span className="text-xs text-muted-foreground line-through">
                        ${cheapest.sellingPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleAdd(e, product)}
                    disabled={soldOut || maxedInCart}
                    className="group/btn inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-4 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5 transition-transform group-hover/btn:rotate-90" />
                    {soldOut ? "Sold Out" : maxedInCart ? "Max in Cart" : "Add"}
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
