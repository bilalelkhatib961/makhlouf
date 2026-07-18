import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { Menu, X, LogOut, ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutFn } from "@/auth/functions";
import type { AppUser } from "@/auth/types";

export interface DashboardNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

function SidebarNav({
  navItems,
  basePath,
  onNavigate,
}: {
  navItems: DashboardNavItem[];
  basePath: string;
  onNavigate?: () => void;
}) {
  const pathname = useLocation({ select: (l) => l.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive =
          item.to === basePath
            ? pathname === basePath
            : pathname.startsWith(`${item.to}/`) || pathname === item.to;

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium uppercase tracking-[0.14em] transition",
              isActive
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({
  brandLabel,
  navItems,
  basePath,
  user,
  children,
}: {
  brandLabel: string;
  navItems: DashboardNavItem[];
  basePath: string;
  user: AppUser;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const logout = useServerFn(logoutFn);

  const handleLogout = async () => {
    await logout();
    await router.invalidate();
    router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-border bg-background lg:flex">
        <Link to="/" className="flex items-center gap-2 px-6 py-6">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-foreground text-background font-display text-lg">
            M
          </span>
          <span className="font-display text-lg tracking-tight">Makhlouf</span>
        </Link>
        <p className="px-6 text-[10px] uppercase tracking-[0.3em] text-foreground/50">
          {brandLabel}
        </p>

        <div className="mt-6 flex-1 overflow-y-auto px-3">
          <SidebarNav navItems={navItems} basePath={basePath} />
        </div>

        <div className="border-t border-border p-4">
          <div className="rounded-sm border border-border p-3">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {user.role} account
            </p>
          </div>
          <div className="mt-2 flex gap-2">
            <Link
              to="/"
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-sm text-xs font-medium uppercase tracking-[0.14em] text-foreground/70 hover:bg-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-sm text-xs font-medium uppercase tracking-[0.14em] text-foreground/70 hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-foreground text-background font-display text-base">
            M
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/60">
            {brandLabel}
          </span>
        </Link>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
          className="grid h-10 w-10 place-items-center rounded-sm hover:bg-muted"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-30 bg-background/95 backdrop-blur-xl lg:hidden">
          <div className="flex h-full flex-col px-4 pb-6 pt-20">
            <SidebarNav navItems={navItems} basePath={basePath} onNavigate={() => setOpen(false)} />
            <div className="mt-auto space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium">{user.name}</p>
              <div className="flex gap-3">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-sm border border-foreground/30 text-xs font-medium uppercase tracking-[0.14em]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to site
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-sm bg-foreground text-xs font-medium uppercase tracking-[0.14em] text-background"
                >
                  <LogOut className="h-3.5 w-3.5" /> Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-72">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
