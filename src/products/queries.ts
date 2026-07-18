import { queryOptions } from "@tanstack/react-query";
import { getPublicCollectionsFn } from "./functions";

export function collectionsQuery(scope: "landing" | "shop") {
  return queryOptions({
    queryKey: ["public-collections", scope],
    queryFn: () => getPublicCollectionsFn({ data: { onlyLandingPage: scope === "landing" } }),
  });
}
