# Makhlouf — Project Reference

Living notes for this project. Update this file as we build — it's the shared
memory between sessions, not a one-time spec. When a task changes something
described here, edit the relevant section instead of leaving it stale.

## What this is

A personal training brand site (Makhlouf) evolving from a static marketing
site into a real product with three roles:

- **Guest** — anyone not logged in. Sees the public marketing site: home,
  about, gallery, shop, contact. Can browse the e-shop and image galleries.
  No account required.
- **Coach** — runs a CMS to manage the business: clients, subscriptions,
  products, categories, training exercises, client schedules. One coach
  account exists today (the site's persona, Marcus Vale); the model doesn't
  yet assume multiple coaches.
- **Client** — has a personal portal to track diet, workout days, exercises,
  and body weight over time. More tracking features will likely be added
  later (the user mentioned this explicitly — expect this list to grow).

Guest, coach, and client are strictly separate experiences. Coach and client
each get their own "secure app" shell (sidebar + topbar), not the public
marketing header/footer.

## Current status (as of this session)

**Built:** MongoDB-backed auth for two seeded accounts (one coach, one
client), role-based routing/redirects, and the full navigation shell + static
dummy-data views for both `/coach` and `/portal`.

**Explicitly not built yet** — these are real gaps, not oversights:
- Any CRUD (add/edit/delete client, product, exercise, schedule entry, meal
  log, weight entry, etc.) — every list/table in `/coach/*` and `/portal/*`
  is a hardcoded array in the route file, not a database read.
- Public signup/registration (only the two seeded accounts exist; the coach
  presumably creates client accounts, but that flow doesn't exist yet).
- Cart/checkout for the e-shop.
- `authMiddleware` (see below) exists but nothing uses it yet — no
  server function currently reads/writes per-user data.
- CSRF origin-check middleware, rate limiting on login, `/unauthorized` page
  (wrong-role users are just redirected to their own home instead).
- Password reset.

When any of the above gets built, move it out of this list into the
architecture notes below and describe how it actually works.

## Auth architecture

- **Session**: `@tanstack/react-start/server`'s built-in `useSession` —
  an encrypted + signed `HttpOnly` cookie, not a hand-rolled JWT. Wrapped in
  `src/auth/session.server.ts` (`getAuthSession()`). Payload is
  `{ userId, email, name, role }`, so most navigations resolve "who's
  logged in" without a Mongo round-trip.
- **Passwords**: `bcryptjs` (pure JS — the native `bcrypt` binding won't run
  if this ever deploys to Cloudflare, which is nitro's configured default
  target in `vite.config.ts`). Hashing/verification lives in
  `src/auth/credentials.server.ts`, including a precomputed dummy-hash
  constant so a login attempt against a nonexistent email takes the same
  time as a wrong-password attempt.
- **Server functions** (`src/auth/functions.ts`): `loginFn`,
  `logoutFn`, `getSessionUserFn`. Login rotates the session (clears, then
  reissues) on every successful auth.
- **Route guards**: `src/routes/__root.tsx`'s `beforeLoad` calls
  `getSessionUserFn()` once and puts `{ user }` into router context. Every
  route sees it via `Route.useRouteContext()`. `coach.tsx` and `portal.tsx`
  (layout routes) each have their own `beforeLoad` that redirects
  unauthenticated visitors to `/login?redirect=...` and redirects an
  authenticated-but-wrong-role user to their own home (client hitting
  `/coach` → `/portal`, and vice versa) rather than showing an error page.
- **`authMiddleware`** (`src/auth/middleware.server.ts`): not used by
  anything yet. This is the foundation for future protected server
  functions — route guards protect page UX only, NOT the server function
  endpoint itself (it's callable directly regardless of which route renders
  it). Any future `createServerFn` that reads/writes per-user data
  (add a client, log a meal, log a weight entry, etc.) must add
  `.middleware([authMiddleware])` and scope its query by
  `context.user.id`/`role` — don't trust a client-supplied ID alone.
- **Seed script**: `scripts/seed.ts` (run via `npm run db:seed`), deliberately
  outside `src/` — it's a standalone Node script run through `tsx`, not part
  of the Vite app bundle.

## Data model

MongoDB, database name `makhlouf` (see `.env` / `MONGODB_DB_NAME`). Only one
collection exists so far:

```ts
// users
{
  _id: ObjectId;
  email: string;        // lowercase, unique index
  passwordHash: string;
  role: "coach" | "client";
  name: string;
  createdAt: Date;
}
```

Everything else (clients list, subscriptions, products, categories,
exercises, schedules, diet logs, workouts, weight entries) is still just
static arrays inside the route files — there is no schema for them yet.
When we build real CRUD for one of these, this is the place to record the
collection shape once it exists.

### Seed accounts

Run `npm run db:seed` against a local `mongod` (this machine already has one
running on `127.0.0.1:27017`, no auth). It's idempotent — safe to re-run.

| Role   | Email                | Password     | Name          |
| ------ | --------------------- | ------------ | ------------- |
| Coach  | coach@makhlouf.com    | Coach!2025   | Marcus Vale   |
| Client | client@makhlouf.com   | Client!2025  | Jordan Ellis  |

## Conventions

- **Routing**: TanStack Start file-based routing under `src/routes/` — see
  `src/routes/README.md` for the exact file→URL rules (don't use Next.js/
  Remix conventions). `coach.tsx` + `coach/*.tsx` and `portal.tsx` +
  `portal/*.tsx` are layout routes exactly like `__root.tsx` + `index.tsx`
  already worked before this session — same pattern, one level deeper.
- **Server-only files** end in `.server.ts`. **Never name a directory
  `server/`** (e.g. `src/server/`) — `@lovable.dev/vite-tanstack-config`
  configures the TanStack Start import-protection plugin with
  `client: { files: ["**/server/**"] }`, which denies importing *anything*
  under a path containing a `server` segment from client-rendered code, not
  just files suffixed `.server.ts`. This is stricter than the framework's
  own default (`**/*.server.*`) and it's why auth code lives in `src/auth/`
  instead: `functions.ts` (no `.server.` suffix) holds the `createServerFn`
  RPCs that client components legitimately need to import and call
  (`loginFn`, `logoutFn`), while the true server-only helpers alongside it
  (`db.server.ts`, `session.server.ts`, `credentials.server.ts`,
  `middleware.server.ts`) stay protected by the filename-suffix rule. Learned
  this the hard way once already — don't reintroduce a `server/` directory.
- **Design system**: strict grayscale palette (see `src/styles.css`), `Anton`
  display font (`font-display`, always uppercase) for headings, `Inter` for
  body text, sharp `rounded-sm` corners, `border-foreground/30` hairlines,
  uppercase `tracking-[0.14em]`–`tracking-[0.3em]` for small labels/eyebrows.
  The `/coach` and `/portal` shells deliberately do NOT use shadcn's
  `Sidebar` primitive (`src/components/ui/sidebar.tsx`) — it depends on
  `--sidebar-*` CSS variables this theme never defines. The hand-built
  `src/components/dashboard/DashboardLayout.tsx` follows the same tokens as
  the rest of the site instead.
- **Dummy-data pages**: coach/portal list & table pages follow one shape —
  a `PageHeader` (from `src/components/dashboard/PageHeader.tsx`) with an
  eyebrow/title/description and an optional inert action button, then a
  `border border-border` wrapped shadcn `Table` or a card grid. Follow this
  shape when adding new dummy pages so the CMS/portal stay visually
  consistent with each other.
- **Package manager**: `npm` locally (this machine doesn't have `bun`, even
  though `bun.lock`/`bunfig.toml` exist from the Lovable side — both
  lockfiles are currently present; be aware of drift if you install anything
  new).
- Keep `npx tsc --noEmit` and `npx eslint .` at zero errors/warnings — this
  was true before this session and should stay true.

## Open questions / notes for next time

- No production deployment target for MongoDB has been chosen. Nitro
  defaults to a Cloudflare build target per `vite.config.ts`'s comment, and
  the official `mongodb` Node driver does not run on Cloudflare Workers
  (no raw TCP sockets). Local dev is unaffected. When deployment comes up,
  decide between: switching the nitro preset to a Node target, or using
  MongoDB's Atlas Data API / a Workers-compatible driver.
- No public signup exists — figure out whether clients self-register or the
  coach invites/creates them before building that flow.
- "May add additional [client-tracking] features in the future" — the user
  flagged this explicitly, so don't assume diet/workouts/exercises/weight is
  the final feature set for the client portal.
