import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getCoachGalleriesFn } from "@/galleries/functions";
import { GalleriesTab } from "@/components/coach/GalleriesTab";

export const Route = createFileRoute("/coach/galleries")({
  component: GalleriesPage,
});

function GalleriesPage() {
  const galleriesQuery = useQuery({
    queryKey: ["coach", "galleries"],
    queryFn: () => getCoachGalleriesFn(),
  });
  const galleries = galleriesQuery.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Visual Log"
        title="Galleries."
        description="Photo galleries shown on the public site — pick which ones appear on the landing page."
      />
      <GalleriesTab galleries={galleries} isLoading={galleriesQuery.isLoading} />
    </div>
  );
}
