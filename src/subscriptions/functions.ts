import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coachMiddleware } from "@/auth/middleware.server";
import { assignPackage } from "./assignments.server";
import { listPackages, updatePackagePrice } from "./packages.server";

const assignPackageInputSchema = z.object({
  clientId: z.string().min(1),
  packageId: z.string().min(1),
  startDate: z.string().min(1),
});

// --- Reads ---

export const getPublicPackagesFn = createServerFn({ method: "GET" }).handler(async () =>
  listPackages(),
);

export const getCoachPackagesFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => listPackages());

// --- Mutations (coach-only) ---

export const updatePackagePriceFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), price: z.number().min(0) }))
  .handler(async ({ data }) => updatePackagePrice(data.id, data.price));

export const assignPackageFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(assignPackageInputSchema)
  .handler(async ({ data }) => assignPackage(data));
