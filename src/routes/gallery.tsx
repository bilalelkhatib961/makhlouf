import { createFileRoute } from "@tanstack/react-router";
import { Gallery } from "@/components/sections/Gallery";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Makhlouf" },
      {
        name: "description",
        content: "Training sessions, transformations, and inside-the-gym moments.",
      },
      { property: "og:title", content: "Gallery — Makhlouf" },
      {
        property: "og:description",
        content: "Training sessions, transformations, and inside-the-gym moments.",
      },
    ],
  }),
  component: () => (
    <div className="pt-24">
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">— Visual Log</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] sm:text-7xl lg:text-8xl">
          The <span className="italic font-light">work.</span>
        </h1>
      </div>
      <Gallery />
    </div>
  ),
});
