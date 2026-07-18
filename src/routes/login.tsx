import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { loginFn } from "@/auth/functions";
import type { UserRole } from "@/auth/types";

function roleHome(role: UserRole) {
  return role === "coach" ? "/coach" : "/portal";
}

// Only ever redirect within this app — reject absolute/protocol-relative URLs.
function sanitizeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return undefined;
  }
  return value;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = sanitizeRedirect(search.redirect);
    return redirect ? { redirect } : {};
  },
  beforeLoad: ({ context, search }) => {
    if (context.user) {
      throw redirect({ to: search.redirect ?? roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Sign In — Makhlouf" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { role } = await loginFn({ data: { email, password } });
      await router.invalidate();
      router.navigate({ to: search.redirect ?? roleHome(role) });
    } catch {
      setError("Invalid email or password.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">— Members</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">
          Welcome <span className="italic font-light">back.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground/70">
          Sign in with your coach or client account to reach your dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-sm bg-foreground px-7 text-sm font-medium uppercase tracking-[0.18em] text-background transition hover:gap-5 disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign In"}
            {!submitting && (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
