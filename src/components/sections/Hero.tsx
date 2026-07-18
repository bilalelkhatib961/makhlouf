import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import heroImg from "@/assets/hero-athlete.jpg";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-screen items-end overflow-hidden pt-24">
      {/* Image layer */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Athlete deadlifting in dark gym"
          width={1600}
          height={1920}
          className="h-full w-full object-cover grayscale"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 pb-20 lg:px-10 lg:pb-32">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-foreground/70"
        >
          <span className="h-px w-10 bg-foreground/50" />
          Est. 2014 · Personal Training & Performance
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="mt-6 max-w-5xl font-display text-[clamp(3rem,9vw,8.5rem)] leading-[0.88] tracking-tight"
        >
          Train like
          <br />
          <span className="italic font-light tracking-tighter">you mean</span> it.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-8 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg"
        >
          Elite coaching, intelligent programming, and premium gear — built for the athlete who
          treats discipline as a lifestyle, not a phase.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <button className="group inline-flex h-14 items-center gap-3 rounded-sm bg-foreground px-7 text-sm font-medium uppercase tracking-[0.18em] text-background transition-all hover:gap-5">
            Start Training
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="group inline-flex h-14 items-center gap-3 rounded-sm border border-foreground/30 bg-background/30 px-7 text-sm font-medium uppercase tracking-[0.18em] backdrop-blur transition hover:border-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-foreground text-background">
              <Play className="h-3 w-3 translate-x-px" />
            </span>
            Watch Reel
          </button>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-16 grid max-w-3xl grid-cols-3 gap-6 border-t border-foreground/20 pt-8"
        >
          {[
            ["12+", "Years"],
            ["480", "Clients"],
            ["98%", "Retention"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-3xl sm:text-4xl">{n}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-foreground/60">{l}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Side marker */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 -rotate-90 text-xs uppercase tracking-[0.4em] text-foreground/50 lg:block">
        Scroll · Discover · Forge
      </div>
    </section>
  );
}
