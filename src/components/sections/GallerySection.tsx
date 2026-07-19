import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Gallery } from "@/galleries/types";

export function GallerySection({ gallery }: { gallery: Gallery }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 500, behavior: "smooth" });
  };

  const showPrev = () => {
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + gallery.images.length) % gallery.images.length,
    );
  };
  const showNext = () => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % gallery.images.length));
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex]);

  if (gallery.images.length === 0) return null;

  return (
    <section className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
              <span className="h-px w-8 bg-foreground/40" /> Gallery
            </div>
            <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl lg:text-7xl">
              {gallery.name}
            </h2>
            {gallery.description && (
              <p className="mt-4 max-w-xl text-foreground/65">{gallery.description}</p>
            )}
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
        className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-6 lg:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {gallery.images.map((img, i) => (
          <motion.button
            key={img.url}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            onClick={() => setLightboxIndex(i)}
            className="group relative h-[28rem] w-[22rem] shrink-0 snap-start overflow-hidden bg-muted text-left sm:h-[34rem] sm:w-[26rem]"
          >
            <img
              src={img.url}
              alt=""
              loading="lazy"
              width={1024}
              height={1024}
              className="h-full w-full object-cover grayscale transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
            />
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && gallery.images[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-[60] grid place-items-center bg-foreground/95 p-6 backdrop-blur"
        >
          <button
            aria-label="Close"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-sm border border-background/30 text-background"
          >
            <X className="h-5 w-5" />
          </button>
          {gallery.images.length > 1 && (
            <>
              <button
                aria-label="Previous image"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                className="absolute left-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-sm border border-background/30 text-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Next image"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                className="absolute right-6 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-sm border border-background/30 text-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <img
            src={gallery.images[lightboxIndex].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full grayscale"
          />
        </div>
      )}
    </section>
  );
}
