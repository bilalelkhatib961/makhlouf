import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, User, LogIn, UserPlus } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/gallery", label: "Gallery" },
  { to: "/shop", label: "Shop" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4 lg:px-10">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-foreground text-background font-display text-lg">
            F
          </span>
          <span className="font-display text-xl tracking-tight">FORGE/01</span>
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
          <button
            aria-label="Sign in"
            className="hidden h-10 items-center gap-2 rounded-sm px-3 text-sm font-medium text-foreground/80 hover:text-foreground sm:inline-flex"
          >
            <LogIn className="h-4 w-4" /> Sign In
          </button>
          <button
            aria-label="Register"
            className="hidden h-10 items-center gap-2 rounded-sm bg-foreground px-4 text-sm font-medium uppercase tracking-wider text-background transition-transform hover:scale-[1.02] active:scale-100 md:inline-flex"
          >
            <UserPlus className="h-4 w-4" /> Join
          </button>
          <button aria-label="Account" className="grid h-10 w-10 place-items-center rounded-sm hover:bg-muted">
            <User className="h-5 w-5" />
          </button>
          <button aria-label="Cart" className="relative grid h-10 w-10 place-items-center rounded-sm hover:bg-muted">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
              2
            </span>
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
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="h-12 rounded-sm border border-foreground text-sm font-medium uppercase tracking-wider">
                Sign In
              </button>
              <button className="h-12 rounded-sm bg-foreground text-sm font-medium uppercase tracking-wider text-background">
                Join
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
