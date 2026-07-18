import { useRef } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Star, Eye, Plus } from "lucide-react";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

const PRODUCTS = [
  { img: p1, cat: "Supplement", name: "Forge Protein · Isolate", price: 64, rating: 4.9 },
  { img: p2, cat: "Apparel", name: "Iron Heavyweight Hoodie", price: 128, rating: 4.8 },
  { img: p3, cat: "Accessory", name: "Pro Lifting Straps", price: 32, rating: 4.9 },
  { img: p4, cat: "Accessory", name: "Matte Steel Shaker", price: 28, rating: 4.7 },
  { img: p1, cat: "Program", name: "12-Week Hypertrophy Block", price: 149, rating: 5.0 },
  { img: p2, cat: "Apparel", name: "Performance Training Tee", price: 58, rating: 4.8 },
];

export function Products() {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (d: 1 | -1) => scroller.current?.scrollBy({ left: d * 420, behavior: "smooth" });

  return (
    <section className="relative bg-muted/40 py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
              <span className="h-px w-8 bg-foreground/40" /> Shop
            </div>
            <h2 className="mt-4 font-display text-5xl leading-none sm:text-6xl lg:text-7xl">
              Built for the <span className="italic font-light">grind.</span>
            </h2>
            <p className="mt-4 max-w-xl text-foreground/65">
              Gear, fuel, and programs we actually use. Curated. Tested. Minimal.
            </p>
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
        {PRODUCTS.map((p, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="group w-[20rem] shrink-0 snap-start bg-background"
          >
            <div className="relative aspect-square overflow-hidden bg-muted">
              <img
                src={p.img}
                alt={p.name}
                loading="lazy"
                width={800}
                height={800}
                className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-105"
              />
              <button
                aria-label="Quick view"
                className="absolute right-3 top-3 grid h-10 w-10 translate-y-2 place-items-center rounded-sm bg-background/90 opacity-0 backdrop-blur transition-all group-hover:translate-y-0 group-hover:opacity-100"
              >
                <Eye className="h-4 w-4" />
              </button>
              <span className="absolute left-3 top-3 bg-foreground px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-background">
                {p.cat}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-1 text-xs text-foreground/70">
                <Star className="h-3 w-3 fill-foreground text-foreground" /> {p.rating}
              </div>
              <h3 className="mt-2 font-display text-lg leading-tight normal-case tracking-tight">
                {p.name}
              </h3>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-display text-xl">${p.price}</span>
                <button className="group/btn inline-flex h-10 items-center gap-2 rounded-sm bg-foreground px-4 text-xs font-medium uppercase tracking-[0.18em] text-background">
                  <Plus className="h-3.5 w-3.5 transition-transform group-hover/btn:rotate-90" />
                  Add
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
