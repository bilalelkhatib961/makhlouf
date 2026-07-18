import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { collectionsQuery } from "@/products/queries";
import type { ProductPublic } from "@/products/types";
import { ProductQuickView } from "@/components/ProductQuickView";
import { CollectionSection } from "./CollectionSection";

export function Collections({ scope }: { scope: "landing" | "shop" }) {
  const { data: collections = [], isLoading } = useQuery(collectionsQuery(scope));
  const [quickViewProduct, setQuickViewProduct] = useState<ProductPublic | null>(null);

  const visibleCollections = collections.filter((c) => c.products.length > 0);

  return (
    <>
      {!isLoading && visibleCollections.length === 0 && (
        <p className="px-6 py-14 text-center text-sm text-foreground/60 lg:px-10">
          No products available yet — check back soon.
        </p>
      )}

      {visibleCollections.map((collection) => (
        <CollectionSection
          key={collection.id}
          collection={collection}
          onQuickView={setQuickViewProduct}
        />
      ))}

      <ProductQuickView
        product={quickViewProduct}
        open={quickViewProduct !== null}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
      />
    </>
  );
}
