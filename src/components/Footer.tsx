import { Link } from "@tanstack/react-router";
import { Camera, Video, AtSign, Mail } from "lucide-react";
const Instagram = Camera;
const Youtube = Video;
const Twitter = AtSign;

export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4 lg:px-10">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-background text-foreground font-display text-lg">
              F
            </span>
            <span className="font-display text-xl">FORGE/01</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-background/60">
            Premium training, programs, and gear engineered for athletes who refuse average.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm tracking-[0.2em] text-background/70">Explore</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {(
              [
                { label: "Home", to: "/" },
                { label: "About", to: "/about" },
                { label: "Gallery", to: "/gallery" },
                { label: "Shop", to: "/shop" },
                { label: "Contact", to: "/contact" },
              ] as const
            ).map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="text-background/80 hover:text-background">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm tracking-[0.2em] text-background/70">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-background/80">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> hello@forge01.com
            </li>
            <li>1 Iron Way, Brooklyn NY</li>
          </ul>
          <div className="mt-5 flex items-center gap-3">
            {[Instagram, Youtube, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="grid h-9 w-9 place-items-center rounded-sm border border-background/20 transition hover:bg-background hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-background/60 md:flex-row lg:px-10">
          <p>© {new Date().getFullYear()} FORGE/01. All rights reserved.</p>
          <p className="uppercase tracking-[0.2em]">Forged in iron · Built to last</p>
        </div>
      </div>
    </footer>
  );
}
