import { motion } from "motion/react";
import portrait from "@/assets/1.png";

const STATS = [
  { n: "12+", l: "Years Experience" },
  { n: "480", l: "Clients Trained" },
  { n: "60", l: "Programs Built" },
  { n: "98%", l: "Success Rate" },
];

export function About() {
  return (
    <section className="relative py-28 lg:py-40">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 lg:grid-cols-12 lg:gap-20 lg:px-10">
        {/* Portrait */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9 }}
          className="lg:col-span-5"
        >
          <div className="relative">
            <div className="absolute -left-3 -top-3 h-full w-full border border-foreground/30" aria-hidden />
            <img
              src={portrait}
              alt="Marcus Vale, head coach"
              width={1024}
              height={1280}
              loading="lazy"
              className="relative w-full grayscale"
            />
            <div className="absolute -bottom-6 left-6 bg-foreground px-5 py-3 text-background">
              <p className="font-display text-sm tracking-[0.2em]">Marcus Vale</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-background/70">Head Coach · CSCS</p>
            </div>
          </div>
        </motion.div>

        {/* Copy */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-foreground/60">
            <span className="h-px w-8 bg-foreground/40" /> About
          </div>
          <h2 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">
            A decade <br /> of <span className="italic font-light">discipline.</span>
          </h2>
          <div className="mt-8 max-w-xl space-y-5 text-base leading-relaxed text-foreground/70">
            <p>
              I started in a damp basement gym with a single barbell and a notebook.
              Twelve years later, I&apos;ve coached pro athletes, executives, and
              everyday people through transformations that stuck.
            </p>
            <p>
              My approach blends powerlifting fundamentals, sports science, and a
              refusal to settle. No gimmicks. No shortcuts. Just clean execution,
              week after week.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="bg-background p-6"
              >
                <div className="font-display text-3xl sm:text-4xl">{s.n}</div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-foreground/55">
                  {s.l}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
