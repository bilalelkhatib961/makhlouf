import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">— {eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl leading-[0.95] sm:text-5xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border bg-background p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/50">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
