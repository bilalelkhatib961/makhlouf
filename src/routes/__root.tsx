import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AmbientBackground } from "../components/AmbientBackground";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl">404</h1>
        <h2 className="mt-4 font-display text-xl">Off the path</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page isn&apos;t part of the program.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex h-12 items-center justify-center rounded-sm bg-foreground px-6 text-sm font-medium uppercase tracking-[0.18em] text-background">
            Back to base
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Something broke a rep</h1>
        <p className="mt-2 text-sm text-muted-foreground">Reload and try the set again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="h-11 rounded-sm bg-foreground px-5 text-sm font-medium uppercase tracking-[0.18em] text-background"
          >
            Try again
          </button>
          <a href="/" className="h-11 rounded-sm border border-foreground/30 px-5 text-sm font-medium uppercase leading-[2.75rem] tracking-[0.18em]">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FORGE/01 — Premium Personal Training & Performance Gear" },
      { name: "description", content: "Elite personal training, intelligent programming, and premium fitness gear engineered for athletes who refuse average." },
      { name: "author", content: "FORGE/01" },
      { property: "og:title", content: "FORGE/01 — Premium Personal Training & Performance Gear" },
      { property: "og:description", content: "Elite personal training, intelligent programming, and premium fitness gear engineered for athletes who refuse average." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FORGE/01 — Premium Personal Training & Performance Gear" },
      { name: "twitter:description", content: "Elite personal training, intelligent programming, and premium fitness gear engineered for athletes who refuse average." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3cc3d6d3-3525-44c6-b5e6-9f64202d4c74/id-preview-02ef610c--128af0dd-bb8c-4ecf-9c93-227f8201c5da.lovable.app-1781944587407.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3cc3d6d3-3525-44c6-b5e6-9f64202d4c74/id-preview-02ef610c--128af0dd-bb8c-4ecf-9c93-227f8201c5da.lovable.app-1781944587407.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AmbientBackground />
      <Header />
      <main className="relative">
        <Outlet />
      </main>
      <Footer />
    </QueryClientProvider>
  );
}
