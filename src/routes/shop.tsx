import { createFileRoute } from "@tanstack/react-router";
import { Products } from "@/components/sections/Products";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — FORGE/01" },
      {
        name: "description",
        content: "Curated supplements, apparel, accessories, and training programs.",
      },
      { property: "og:title", content: "Shop — FORGE/01" },
      {
        property: "og:description",
        content: "Curated supplements, apparel, accessories, and training programs.",
      },
    ],
  }),
  component: () => (
    <div className="pt-24">
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">— Storefront</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] sm:text-7xl lg:text-8xl">
          Forged <span className="italic font-light">essentials.</span>
        </h1>
      </div>
      <Products />
    </div>
  ),
});
