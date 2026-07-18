import { createFileRoute } from "@tanstack/react-router";
import { About } from "@/components/sections/About";
import { PromoBanner } from "@/components/sections/PromoBanner";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Makhlouf" },
      {
        name: "description",
        content: "Twelve years of coaching, programming, and obsession with the craft of training.",
      },
      { property: "og:title", content: "About — Makhlouf" },
      {
        property: "og:description",
        content: "Twelve years of coaching, programming, and obsession with the craft of training.",
      },
    ],
  }),
  component: () => (
    <div className="pt-24">
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">— The Story</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] sm:text-7xl lg:text-8xl">
          Built on <span className="italic font-light">iron.</span>
        </h1>
      </div>
      <About />
      <PromoBanner />
    </div>
  ),
});
