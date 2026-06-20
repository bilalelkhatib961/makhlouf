import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import g1 from "@/assets/gallery-1.jpg";
import g2 from "@/assets/gallery-2.jpg";
import g3 from "@/assets/gallery-3.jpg";
import g4 from "@/assets/gallery-4.jpg";
import g5 from "@/assets/gallery-5.jpg";

const ITEMS = [
  { src: g1, tag: "Strength", title: "Iron Floor" },
  { src: g2, tag: "Conditioning", title: "Ropes & Fire" },
  { src: g3, tag: "Physique", title: "Posterior Chain" },
  { src: g4, tag: "Combat", title: "Gloves Up" },
  { src: g5, tag: "Calisthenics", title: "Bar Work" },
];

export function Gallery() {
  const scroller = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 500, behavior: "smooth" });
  };

  return (
    <section className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
              <span className="h-px w-8 bg-foreground/40" /> Gallery
            </div>
            <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl lg:text-7xl">
              Inside the <span className="italic font-light">work.</span>
            </h2>
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
        {ITEMS.map((it, i) => (
          <motion.button
            key={it.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            onClick={() => setLightbox(it.src)}
            className="group relative h-[28rem] w-[22rem] shrink-0 snap-start overflow-hidden bg-muted text-left sm:h-[34rem] sm:w-[26rem]"
          >
            <img
              src={it.src}
              alt={it.title}
              loading="lazy"
              width={1024}
              height={1024}
              className="h-full w-full object-cover grayscale transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
              <p className="text-[10px] uppercase tracking-[0.3em] text-background/70">{it.tag}</p>
              <p className="mt-2 font-display text-2xl">{it.title}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[60] grid place-items-center bg-foreground/95 p-6 backdrop-blur"
        >
          <button
            aria-label="Close"
            className="absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-sm border border-background/30 text-background"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={lightbox} alt="" className="max-h-[85vh] max-w-full grayscale" />
        </div>
      )}
    </section>
  );
}
