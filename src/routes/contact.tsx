import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Makhlouf" },
      { name: "description", content: "Apply for coaching, ask a question, or visit the studio." },
      { property: "og:title", content: "Contact — Makhlouf" },
      {
        property: "og:description",
        content: "Apply for coaching, ask a question, or visit the studio.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">— Get in touch</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] sm:text-7xl lg:text-8xl">
          Let&apos;s <span className="italic font-light">talk.</span>
        </h1>
      </div>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-24 lg:grid-cols-12 lg:gap-20 lg:px-10">
        <form className="lg:col-span-7 space-y-6">
          {[
            { l: "Name", t: "text" },
            { l: "Email", t: "email" },
            { l: "Phone", t: "tel" },
          ].map((f) => (
            <div key={f.l}>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                {f.l}
              </label>
              <input
                type={f.t}
                className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
              />
            </div>
          ))}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
              Message
            </label>
            <textarea
              rows={5}
              className="mt-2 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
            />
          </div>
          <button
            type="button"
            className="group inline-flex h-14 items-center gap-3 rounded-sm bg-foreground px-7 text-sm font-medium uppercase tracking-[0.18em] text-background transition hover:gap-5"
          >
            Send Message{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <aside className="lg:col-span-5">
          <div className="border border-border p-8">
            <h3 className="font-display text-2xl">The Studio</h3>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> 1 Iron Way, Brooklyn NY 11201
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" /> hello@makhlouf.com
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" /> +1 (212) 555 0182
              </li>
            </ul>
          </div>
          <div className="mt-6 bg-foreground p-8 text-background">
            <p className="text-[10px] uppercase tracking-[0.3em] text-background/60">Hours</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Mon — Fri</span>
                <span>05:00 — 22:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sat</span>
                <span>07:00 — 19:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sun</span>
                <span>08:00 — 16:00</span>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
