import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/coach/subscriptions")({
  component: SubscriptionsPage,
});

const PLANS = [
  {
    name: "Elite Coaching",
    price: "$399/mo",
    billing: "Monthly",
    clients: 9,
    description: "1:1 programming, weekly check-ins, and priority messaging.",
  },
  {
    name: "Hybrid",
    price: "$249/mo",
    billing: "Monthly",
    clients: 3,
    description: "Custom programming plus biweekly coaching calls.",
  },
  {
    name: "Programming Only",
    price: "$129/mo",
    billing: "Monthly",
    clients: 6,
    description: "Custom program, self-guided execution, no calls.",
  },
  {
    name: "12-Week Intensive",
    price: "$899",
    billing: "One-time",
    clients: 2,
    description: "Fixed-length transformation block with daily check-ins.",
  },
];

function SubscriptionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Subscriptions."
        description="The plans clients can be enrolled in. Placeholder data — plan management isn't wired up yet."
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div key={plan.name} className="border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-xl">{plan.name}</h3>
              <Badge variant="outline">{plan.billing}</Badge>
            </div>
            <p className="mt-2 font-display text-2xl">{plan.price}</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/70">{plan.description}</p>
            <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {plan.clients} active clients
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
