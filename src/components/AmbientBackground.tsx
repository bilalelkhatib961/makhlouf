/**
 * Subtle floating gym-inspired shapes layered behind page content.
 * Pure SVG, grayscale only, very low opacity — adds depth without distraction.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Soft grayscale gradient wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.95_0_0)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.93_0_0)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,oklch(0.18_0_0)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.15_0_0)_0%,transparent_55%)]" />

      {/* Grid pattern */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Weight plate top-right */}
      <svg
        className="absolute -right-32 top-20 h-[28rem] w-[28rem] animate-float-slow text-foreground/[0.04]"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="95" fill="currentColor" />
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground/[0.06]"
        />
        <circle
          cx="100"
          cy="100"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-foreground/[0.08]"
        />
      </svg>

      {/* Dumbbell silhouette bottom-left */}
      <svg
        className="absolute -left-20 bottom-40 h-72 w-[36rem] animate-float-reverse text-foreground/[0.05]"
        viewBox="0 0 600 200"
      >
        <rect x="0" y="50" width="80" height="100" rx="8" fill="currentColor" />
        <rect x="80" y="80" width="40" height="40" fill="currentColor" />
        <rect x="120" y="92" width="360" height="16" fill="currentColor" />
        <rect x="480" y="80" width="40" height="40" fill="currentColor" />
        <rect x="520" y="50" width="80" height="100" rx="8" fill="currentColor" />
      </svg>

      {/* Diagonal accent line */}
      <div className="absolute left-1/2 top-1/3 h-[1px] w-[60vw] -translate-x-1/2 rotate-[-12deg] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />

      {/* Small floating plate */}
      <svg
        className="absolute right-1/4 bottom-10 h-40 w-40 animate-float-slow text-foreground/[0.05]"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="14" />
        <circle cx="100" cy="100" r="20" fill="currentColor" />
      </svg>
    </div>
  );
}
