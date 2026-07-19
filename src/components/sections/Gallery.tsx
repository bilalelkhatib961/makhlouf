import { useQuery } from "@tanstack/react-query";
import { galleriesQuery } from "@/galleries/queries";
import { GallerySection } from "./GallerySection";

export function Gallery({ scope }: { scope: "landing" | "gallery" }) {
  const { data: galleries = [], isLoading } = useQuery(galleriesQuery(scope));
  const visibleGalleries = galleries.filter((g) => g.images.length > 0);

  return (
    <>
      {!isLoading && visibleGalleries.length === 0 && (
        <p className="px-6 py-14 text-center text-sm text-foreground/60 lg:px-10">
          No galleries yet — check back soon.
        </p>
      )}

      {visibleGalleries.map((gallery) => (
        <GallerySection key={gallery.id} gallery={gallery} />
      ))}
    </>
  );
}
