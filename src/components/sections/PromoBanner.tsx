import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

export function PromoBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-foreground text-background noise-overlay">
      {/* Scrolling marquee */}
      <div className="border-y border-background/15 py-5">
        <div className="flex w-max animate-marquee gap-16 whitespace-nowrap font-display text-3xl sm:text-4xl">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-16">
              {["STRENGTH", "DISCIPLINE", "HYPERTROPHY", "MOBILITY", "PRECISION", "GRIT"].map((w) => (
                <span key={w} className="flex items-center gap-16">
                  {w}
                  <span className="inline-block h-2 w-2 rounded-full bg-background/40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-12 lg:px-10 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-8"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-background/60">
            — Founder&apos;s Note
          </p>
          <blockquote className="mt-6 font-display text-4xl leading-[1.02] sm:text-6xl lg:text-7xl">
            &ldquo;You don&apos;t rise to the level of your goals.
            <span className="italic font-light"> You fall to the level of your systems.</span>&rdquo;
          </blockquote>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="lg:col-span-4"
        >
          <div className="border border-background/20 p-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-background/60">Featured · Membership</p>
            <h3 className="mt-3 font-display text-3xl">Elite Coaching</h3>
            <p className="mt-3 text-sm leading-relaxed text-background/70">
              1:1 programming, weekly check-ins, and access to the full FORGE/01 system.
            </p>
            <button className="group mt-6 inline-flex items-center gap-2 border-b border-background pb-1 text-sm uppercase tracking-[0.18em]">
              Apply Now
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
