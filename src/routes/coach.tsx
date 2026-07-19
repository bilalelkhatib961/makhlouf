import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Users, CreditCard, Package, Dumbbell, Calendar } from "lucide-react";
import { DashboardLayout, type DashboardNavItem } from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS: DashboardNavItem[] = [
  { to: "/coach", label: "Dashboard", icon: LayoutDashboard },
  { to: "/coach/clients", label: "Clients", icon: Users },
  { to: "/coach/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/coach/products", label: "Products", icon: Package },
  { to: "/coach/training", label: "Training", icon: Dumbbell },
  { to: "/coach/schedules", label: "Schedules", icon: Calendar },
];

export const Route = createFileRoute("/coach")({
  beforeLoad: ({ context, location }) => {
    const { user } = context;
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (user.role !== "coach") {
      throw redirect({ to: "/portal" });
    }
    return { user };
  },
  component: CoachLayout,
});

function CoachLayout() {
  const { user } = Route.useRouteContext();
  return (
    <DashboardLayout brandLabel="Coach CMS" navItems={NAV_ITEMS} basePath="/coach" user={user}>
      <Outlet />
    </DashboardLayout>
  );
}
