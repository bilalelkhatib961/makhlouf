import { queryOptions } from "@tanstack/react-query";
import { getPublicProductsFn } from "./functions";

export const publicProductsQuery = queryOptions({
  queryKey: ["public-products"],
  queryFn: () => getPublicProductsFn(),
});
