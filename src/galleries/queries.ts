import { queryOptions } from "@tanstack/react-query";
import { getPublicGalleriesFn } from "./functions";

export function galleriesQuery(scope: "landing" | "gallery") {
  return queryOptions({
    queryKey: ["public-galleries", scope],
    queryFn: () => getPublicGalleriesFn({ data: { onlyLandingPage: scope === "landing" } }),
  });
}
