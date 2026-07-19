import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  ListChecks,
  TrendingUp,
  Settings,
} from "lucide-react";
import { DashboardLayout, type DashboardNavItem } from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS: DashboardNavItem[] = [
  { to: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/diet", label: "Diet", icon: Utensils },
  { to: "/portal/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/portal/exercises", label: "Exercises", icon: ListChecks },
  { to: "/portal/weight", label: "Weight", icon: TrendingUp },
  { to: "/portal/settings", label: "Settings", icon: Settings },
];

export const Route = createFileRoute("/portal")({
  beforeLoad: ({ context, location }) => {
    const { user } = context;
    if (!user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
    if (user.role !== "client") {
      throw redirect({ to: "/coach" });
    }
    return { user };
  },
  component: PortalLayout,
});

function PortalLayout() {
  const { user } = Route.useRouteContext();
  return (
    <DashboardLayout brandLabel="Client Portal" navItems={NAV_ITEMS} basePath="/portal" user={user}>
      <Outlet />
    </DashboardLayout>
  );
}
