import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  Dumbbell,
  Utensils,
  Calendar,
} from "lucide-react";
import { DashboardLayout, type DashboardNavItem } from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS: DashboardNavItem[] = [
  { to: "/coach/clients", label: "Clients", icon: Users },
  { to: "/coach/products", label: "Products", icon: Package },
  { to: "/coach/training", label: "Training", icon: Dumbbell },
  { to: "/coach/diet", label: "Diet", icon: Utensils },
  { to: "/coach", label: "Dashboard", icon: LayoutDashboard, status: "todo" },
  { to: "/coach/subscriptions", label: "Subscriptions", icon: CreditCard, status: "todo" },
  { to: "/coach/schedules", label: "Schedules", icon: Calendar, status: "todo" },
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
