import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { PromoBanner } from "@/components/sections/PromoBanner";
import { Gallery } from "@/components/sections/Gallery";
import { Products } from "@/components/sections/Products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FORGE/01 — Premium Personal Training & Fitness Gear" },
      { name: "description", content: "Elite coaching, programs, and gear for athletes who treat discipline as a lifestyle." },
      { property: "og:title", content: "FORGE/01 — Premium Personal Training" },
      { property: "og:description", content: "Elite coaching, programs, and gear for athletes who treat discipline as a lifestyle." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <About />
      <PromoBanner />
      <Gallery />
      <Products />
    </>
  );
}
