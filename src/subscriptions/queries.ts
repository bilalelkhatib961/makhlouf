import { queryOptions } from "@tanstack/react-query";
import { getPublicPackagesFn } from "./functions";

export function packagesQuery() {
  return queryOptions({
    queryKey: ["public-packages"],
    queryFn: () => getPublicPackagesFn(),
  });
}
