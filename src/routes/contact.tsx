import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Mail, MapPin, Phone, ArrowRight, Check } from "lucide-react";
import { submitContactMessageFn } from "@/contact/functions";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const submitMutation = useMutation({
    mutationFn: () =>
      submitContactMessageFn({
        data: { name, email, phone: phone.trim() || null, message },
      }),
    onSuccess: () => setSent(true),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitMutation.mutate();
  };

  return (
    <div className="pt-24">
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">— Get in touch</p>
        <h1 className="mt-4 font-display text-6xl leading-[0.9] sm:text-7xl lg:text-8xl">
          Let&apos;s <span className="italic font-light">talk.</span>
        </h1>
      </div>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-24 lg:grid-cols-12 lg:gap-20 lg:px-10">
        {sent ? (
          <div className="lg:col-span-7 flex items-start gap-4 border border-border p-8">
            <Check className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="font-display text-2xl">Message sent.</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                Thanks for reaching out — we&apos;ll be in touch shortly.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                Message
              </label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
              />
            </div>

            {submitMutation.isError && (
              <p className="text-sm text-destructive">
                {submitMutation.error instanceof Error
                  ? submitMutation.error.message
                  : "Something went wrong. Please try again."}
              </p>
            )}

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="group inline-flex h-14 items-center gap-3 rounded-sm bg-foreground px-7 text-sm font-medium uppercase tracking-[0.18em] text-background transition hover:gap-5 disabled:opacity-50"
            >
              {submitMutation.isPending ? "Sending…" : "Send Message"}{" "}
              {!submitMutation.isPending && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </form>
        )}

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
