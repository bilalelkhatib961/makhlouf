import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Pencil } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import { getCoachPackagesFn } from "@/subscriptions/functions";
import type { SubscriptionPackage } from "@/subscriptions/types";
import { EditPackagePriceDialog } from "@/components/coach/EditPackagePriceDialog";

export const Route = createFileRoute("/coach/subscriptions")({
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const packagesQuery = useQuery({
    queryKey: ["coach", "packages"],
    queryFn: () => getCoachPackagesFn(),
  });
  const packages = packagesQuery.data ?? [];
  const [editPackage, setEditPackage] = useState<SubscriptionPackage | null>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Subscriptions."
        description="The two packages clients can subscribe to. Only the price is editable — benefits and duration are fixed."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {packagesQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {packages.map((pkg) => (
          <div key={pkg.id} className="border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-xl">{pkg.name}</h3>
              <Badge variant="outline">{pkg.durationMonths} month</Badge>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-display text-3xl">${pkg.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">/ month</p>
            </div>
            <ul className="mt-4 space-y-2">
              {pkg.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-foreground/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  {benefit}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setEditPackage(pkg)}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-sm border border-foreground/30 px-4 text-xs font-medium uppercase tracking-[0.18em] hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Price
            </button>
          </div>
        ))}
      </div>

      <EditPackagePriceDialog
        open={editPackage !== null}
        onOpenChange={(open) => !open && setEditPackage(null)}
        pkg={editPackage}
      />
    </div>
  );
}
