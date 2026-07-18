# FORGE/01 — Auth system + role-based portal structure

> Archived plan — implemented this session. See `CLAUDE.md` for the living, current-state
> description of what was actually built; this file is a point-in-time record of the plan as
> approved, kept for future re-tracking.

## Context

FORGE/01 is currently a static marketing site (TanStack Start + React 19 + Tailwind v4 + shadcn/ui, grayscale/Anton-display design language). The user wants to evolve it into a real product with three roles — **guest** (today's public site), **coach** (a CMS to manage clients/subscriptions/products/categories/exercises/schedules), and **client** (a portal to track diet/workouts/exercises/weight).

This task is scoped to **structure + authentication only**: real MongoDB-backed login for two seeded accounts (one coach, one client), role-based redirect into two new secure areas, and the *shell/navigation/views* for those areas — populated with static dummy data, no real CRUD yet. Design must stay visually consistent with the existing site.

Confirmed locally: `mongod` is already installed and running on `127.0.0.1:27017` (no auth) — no external setup needed, I'll seed straight into it.

## Key architectural decisions

**Session mechanism**: This exact installed version of `@tanstack/react-start` (1.168.x) ships a first-class encrypted/signed cookie session helper (`useSession`/`getSession`/`updateSession`/`clearSession` from `@tanstack/react-start/server`) — the same primitive used internally by the framework. I'll use this instead of hand-rolling JWT/`jsonwebtoken`: less code, already audited, `HttpOnly`/`Secure` by default. Session payload stores `{ userId, email, name, role }` directly (sealed + integrity-checked), so most navigations resolve "who's logged in" without a Mongo round-trip — only login itself touches the DB.

**Password hashing**: `bcryptjs` (pure JS, not the native `bcrypt` binding) — this project's nitro config targets Cloudflare for prod builds, and native bindings don't run there; pure JS keeps future deploys unblocked.

**Route guards**: Following this router version's bundled auth-and-guards pattern — `beforeLoad` + `redirect()` in layout routes, auth resolved once in root `beforeLoad` and flowed through router context to children. Route guards protect page UX; since no protected server functions exist yet (all CMS/portal content is static dummy data), there's no data boundary to additionally lock down this round — but I will still add the `authMiddleware` factory now as the documented foundation for the CRUD server functions that come next.

**Layout pattern**: `coach.tsx` (layout, path `/coach`) + `coach/*.tsx` children, mirrored for `portal.tsx` — identical pattern to how `__root.tsx` + `routes/index.tsx` already work in this codebase, so no new routing concept, just one level deeper.

**Chrome**: `/coach/*` and `/portal/*` render *without* the public `Header`/`Footer` (a "separated secure view" per the request) — instead a hand-built sidebar+topbar shell using the same design tokens (grayscale, `font-display` uppercase, `border-foreground/30`, `rounded-sm`) rather than shadcn's `Sidebar` primitive, which relies on `--sidebar-*` CSS vars this theme doesn't define — building on those undefined vars would silently render unstyled. `RootComponent` in `__root.tsx` conditionally skips Header/Footer based on path prefix.

## New dependencies

- `mongodb` (official driver)
- `bcryptjs` (+ `@types/bcryptjs`)
- `tsx` (devDependency, to run the seed script)

## Data model (MongoDB `users` collection)

```ts
interface UserDoc {
  _id: ObjectId;
  email: string;       // lowercase, unique index
  passwordHash: string;
  role: "coach" | "client";
  name: string;
  createdAt: Date;
}
```

Seed accounts:
- Coach: `coach@forge01.com` / `Coach!2025` — name **Marcus Vale** (matches the existing About section's coach persona) — later renamed to `coach@makhlouf.com` when the project was rebranded
- Client: `client@forge01.com` / `Client!2025` — name **Jordan Ellis** — later renamed to `client@makhlouf.com`

## File plan (as executed)

- `src/server/` → later relocated to `src/auth/` after discovering the `**/server/**` import-protection gotcha (see `CLAUDE.md`)
- `src/routes/login.tsx`, `src/routes/coach.tsx` + `src/routes/coach/*.tsx`, `src/routes/portal.tsx` + `src/routes/portal/*.tsx`
- `src/components/dashboard/DashboardLayout.tsx` shared shell, `Header.tsx` updated for auth-aware actions
- `CLAUDE.md` created as the living reference doc

## What was explicitly NOT built this round

Public signup/registration, cart/checkout, any CMS/portal CRUD, CSRF-origin middleware, rate limiting, `/unauthorized` page.
