import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, User, LogIn, UserPlus, LogOut, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutFn } from "@/auth/functions";
import type { AppUser } from "@/auth/types";
import { useCart } from "@/cart/CartContext";
import { CartSheet } from "@/components/CartSheet";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/gallery", label: "Gallery" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header({ user }: { user: AppUser | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const logout = useServerFn(logoutFn);
  const cart = useCart();
  const portalHome = user?.role === "coach" ? "/coach" : "/portal";

  const handleLogout = async () => {
    await logout();
    await router.invalidate();
    setOpen(false);
    router.navigate({ to: "/" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4 lg:px-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-foreground text-background font-display text-lg">
            M
          </span>
          <span className="font-display text-xl tracking-tight">Makhlouf</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center justify-center gap-10 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="link-underline text-sm font-medium uppercase tracking-[0.18em] text-foreground/80 hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account"
                  className="grid h-10 w-10 place-items-center rounded-sm hover:bg-muted"
                >
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs font-normal capitalize text-muted-foreground">
                    {user.role} account
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={portalHome} className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    {user.role === "coach" ? "Coach CMS" : "Client Portal"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                to="/login"
                aria-label="Sign in"
                className="hidden h-10 items-center gap-2 rounded-sm px-3 text-sm font-medium text-foreground/80 hover:text-foreground sm:inline-flex"
              >
                <LogIn className="h-4 w-4" /> Sign In
              </Link>
              <button
                aria-label="Register"
                className="hidden h-10 items-center gap-2 rounded-sm bg-foreground px-4 text-sm font-medium uppercase tracking-wider text-background transition-transform hover:scale-[1.02] active:scale-100 md:inline-flex"
              >
                <UserPlus className="h-4 w-4" /> Join
              </button>
            </>
          )}
          <button
            aria-label="Cart"
            onClick={cart.openCart}
            className="relative grid h-10 w-10 place-items-center rounded-sm hover:bg-muted"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.totalCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {cart.totalCount}
              </span>
            )}
          </button>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-sm hover:bg-muted lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-6 py-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/50 py-4 font-display text-2xl uppercase tracking-tight"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  to={portalHome}
                  onClick={() => setOpen(false)}
                  className="grid h-12 place-items-center rounded-sm bg-foreground text-sm font-medium uppercase tracking-wider text-background"
                >
                  {user.role === "coach" ? "Coach CMS" : "Client Portal"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="h-12 rounded-sm border border-foreground text-sm font-medium uppercase tracking-wider"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="grid h-12 place-items-center rounded-sm border border-foreground text-sm font-medium uppercase tracking-wider"
                >
                  Sign In
                </Link>
                <button className="h-12 rounded-sm bg-foreground text-sm font-medium uppercase tracking-wider text-background">
                  Join
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      <CartSheet />
    </header>
  );
}
