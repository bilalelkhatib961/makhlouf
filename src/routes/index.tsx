import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { PromoBanner } from "@/components/sections/PromoBanner";
import { Gallery } from "@/components/sections/Gallery";
import { Collections } from "@/components/sections/Collections";
import { collectionsQuery } from "@/products/queries";
import { galleriesQuery } from "@/galleries/queries";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(collectionsQuery("landing")),
      context.queryClient.ensureQueryData(galleriesQuery("landing")),
    ]),
  head: () => ({
    meta: [
      { title: "Makhlouf — Premium Personal Training & Fitness Gear" },
      {
        name: "description",
        content:
          "Elite coaching, programs, and gear for athletes who treat discipline as a lifestyle.",
      },
      { property: "og:title", content: "Makhlouf — Premium Personal Training" },
      {
        property: "og:description",
        content:
          "Elite coaching, programs, and gear for athletes who treat discipline as a lifestyle.",
      },
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
      <Gallery scope="landing" />
      <Collections scope="landing" />
    </>
  );
}
