# Makhlouf — Project Reference

Living notes for this project. Update this file as we build — it's the shared
memory between sessions, not a one-time spec. When a task changes something
described here, edit the relevant section instead of leaving it stale.

**Plan archive**: whenever a non-trivial task goes through a Plan-mode approval,
save a copy of the approved plan to `versions/YYYY-MM-DD-NN-short-name.md` (NN =
sequence number for that day) once it's implemented — a point-in-time record for
re-tracking later, even after this file's "current state" description moves on.
Don't ask before doing this, just keep it up to date automatically.

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

**Built:**
- MongoDB-backed auth for two seeded accounts (one coach, one client),
  role-based routing/redirects, full navigation shell for `/coach` and `/portal`.
- Real, dynamic **Products, Categories & Collections**: coach CRUD (with image
  upload) at `/coach/products` (three tabs), a public shop reading the same
  live data (`/` and `/shop`, rendered as collection sections), a product
  quick-view dialog, and a client-side cart (add/edit/remove, stock-aware
  quantity limits — **no checkout**). See "Products & Catalog" below.

**Still hardcoded dummy data — not built yet:**
- Clients, Subscriptions, Exercises, Schedules in the coach CMS, and Diet,
  Workouts, Exercises, Weight in the client portal — every list/table on
  those pages is a hardcoded array in the route file, not a database read.
  Products/Categories were the first of these to go real; the same
  read/write/`coachMiddleware` pattern applies when the rest get built.
- Public signup/registration (only the two seeded accounts exist; the coach
  presumably creates client accounts, but that flow doesn't exist yet).
- Checkout/payment/orders — the cart is real, checkout is explicitly not.
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
- **`authMiddleware`** (`src/auth/middleware.server.ts`): attach to any
  `createServerFn` that reads/writes private data. Route guards protect page
  UX only, NOT the server function endpoint itself (it's callable directly
  regardless of which route renders it). There's also **`coachMiddleware`**
  (same file) — composes `authMiddleware` and additionally checks
  `role === "coach"`; every products/categories mutation uses it. Follow this
  pattern for future coach-owned data (clients, subscriptions, exercises,
  schedules) — don't trust a client-supplied ID alone, scope by
  `context.user.id`/`role`.
- **Seed script**: `scripts/seed.ts` (run via `npm run db:seed`), deliberately
  outside `src/` — it's a standalone Node script run through `tsx`, not part
  of the Vite app bundle. `scripts/seed-catalog.ts` (`npm run db:seed:catalog`)
  seeds demo categories/products the same way.

## Data model

MongoDB, database name `makhlouf` (see `.env` / `MONGODB_DB_NAME`).

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

// categories
{ _id: ObjectId; name: string; createdAt: Date; updatedAt: Date; }

// products
{
  _id: ObjectId;
  categoryId: ObjectId;
  title: string;
  description: string;
  variants: Array<{
    id: string;            // app-generated (crypto.randomUUID()), not an ObjectId — embedded, not a separate collection
    name: string;          // coach label, e.g. "M", "Black / L" — "" is valid for a single-SKU product
    basePrice: number;     // cost — coach-only, never sent to public reads
    sellingPrice: number;  // list price shown to guests
    discount: number;      // 0-100, percent off sellingPrice
    quantity: number;      // stock — per variant
    isActive: boolean;     // per variant — no product-level isActive
    assets: Array<{ url: string; type: "image" | "file" | "video"; isPrimary: boolean }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// collections
{
  _id: ObjectId;
  name: string;
  description: string;
  productIds: ObjectId[];       // order = display order
  showOnLandingPage: boolean;   // gates `/` only — `/shop` always shows every collection
  createdAt: Date;
  updatedAt: Date;
}
```

Pricing, stock, active-state, and images all live **per variant**, not on the product — a
"simple" product (no real size/color choice) is just a product with exactly one variant, name
left blank. Every product has ≥1 variant, enforced by `productInputSchema`'s
`z.array(variantSchema).min(1)` in `src/products/functions.ts`. There is no product-level
`isActive`: public visibility is derived — a product appears only if it has ≥1 active variant,
and `listProductsPublic` (`src/products/products.server.ts`) returns only the active variants
(and strips `basePrice`) for each. This was a deliberate correction mid-build (see
`versions/2026-07-19-03-per-variant-pricing-fixes.md`) after the first cut had pricing/stock/assets
flat on the product with `variants` as bare option-axis metadata (`{name, options[]}`) — that
shape is gone.

Clients list, subscriptions, exercises, schedules, diet logs, workouts, and
weight entries are still just static arrays inside their route files — no
schema yet. Record the shape here once each one goes real.

### Seed accounts

Run `npm run db:seed` against a local `mongod` (this machine already has one
running on `127.0.0.1:27017`, no auth). It's idempotent — safe to re-run.

| Role   | Email                | Password     | Name          |
| ------ | --------------------- | ------------ | ------------- |
| Coach  | coach@makhlouf.com    | Coach!2025   | Marcus Vale   |
| Client | client@makhlouf.com   | Client!2025  | Jordan Ellis  |

Run `npm run db:seed:catalog` to populate demo categories + products + one
collection. Categories are idempotent (matched by `name`); products and the
collection are **not** — the script clears both collections and reinserts
fresh every run, since it's demo data and simplest to fully replace on schema
changes rather than migrate in place. The seeded collection is named "Built
for the grind." with description "Gear, fuel, and programs we actually use.
Curated. Tested. Minimal." (the site's original hardcoded shop-section copy,
now real data) and references all 6 seeded products, `showOnLandingPage: true`.

## Products & Catalog

- **Server layer** (`src/products/`, same `.server.ts`-suffix pattern as
  `src/auth/` — see the directory-naming gotcha below): `types.ts` (shared,
  client-safe), `categories.server.ts`, `products.server.ts` (two read
  paths — `listProductsPublic` strips `basePrice`/`isActive` and returns only
  each product's active variants, excluding products left with zero after
  that filter; `listProductsAdmin` returns everything), `collections.server.ts`
  (`listCollectionsPublic(onlyLandingPage)` calls `listProductsPublic()` once
  and resolves each collection's `productIds` against it, preserving
  collection order and silently dropping ids that no longer resolve — e.g. a
  deleted or deactivated product; `listCollectionsAdmin` returns raw
  `productIds` for the coach table/picker), `upload.server.ts`, `functions.ts`
  (the `createServerFn` RPCs — `getPublicCollectionsFn` is the only public one
  without `coachMiddleware`; there is no standalone "all products" public RPC
  since the shop is collection-driven now).
- **Image upload**: local filesystem, no cloud service. `upload.server.ts`
  writes to `public/uploads/products/<uuid>.<ext>` (created on first write)
  via a `FormData`-accepting server function; Vite serves `public/` at `/` in
  dev and copies it into `dist/client` on build, which nitro's `publicDir`
  already points at — works with zero extra config. Restricted to image
  mimetypes for now (`upload.server.ts`'s `EXTENSION_BY_MIME` map). If this
  ever needs to survive a Cloudflare deploy (see the MongoDB driver caveat
  above — same underlying problem), local filesystem writes won't work
  there either; swap for S3/Cloudinary/R2 at that point. New uploads render
  from an in-browser `URL.createObjectURL(file)` preview, never the raw
  server URL, inside the coach form — see `ProductVariantFields.tsx`. The
  variant form also shows a live "Price after discount" readout next to the
  Discount % field so the coach doesn't have to do the math.
- **Coach CMS** (`/coach/products`): one route, three tabs (shadcn `Tabs`) —
  Products, Categories, Collections — built as
  `src/components/coach/ProductsTab.tsx` / `CategoriesTab.tsx` /
  `CollectionsTab.tsx` / `ProductFormDialog.tsx` / `ProductVariantFields.tsx`
  (one repeatable block per variant) / `CollectionFormDialog.tsx` (name,
  description, "show on landing page" switch, and a scrollable checkbox list
  over the coach's product list — shadcn `Checkbox`, no combobox dependency
  needed at this catalog size). Data via TanStack Query; mutations use
  `useMutation` + `invalidateQueries` so the coach's own edits show up
  immediately. `ProductFormDialog`/`CollectionFormDialog` deliberately do
  **not** use `react-hook-form` — dynamic arrays (variants, per-variant
  assets, picked products) fit plain `useState` + a manual submit-time check
  better than RHF's field-array API for these shapes (simple scalar fields
  are plain controlled inputs, same pattern as `CategoriesTab.tsx`'s form).
- **Collections drive the public shop** — `src/components/sections/Collections.tsx`
  (renamed from `Products.tsx`, which rendered one hardcoded section; now
  renders one `CollectionSection` per collection) takes a `scope: "landing" |
  "shop"` prop and fetches `collectionsQuery(scope)`
  (`src/products/queries.ts`, a `queryOptions()` factory keyed by scope so
  `index.tsx`/`shop.tsx` can also `ensureQueryData` it in their route
  `loader` — avoids a loading-state flash on first paint). `scope="landing"`
  only fetches collections with `showOnLandingPage: true`; `scope="shop"`
  fetches all of them. `src/components/sections/CollectionSection.tsx` is the
  actual header/scroller/card section (previously inlined in `Products.tsx`),
  parametrized by `collection.name`/`description`/`products` instead of the
  old hardcoded "Built for the grind." copy — that copy is now the seeded
  collection's actual name/description (see seed data below), not
  placeholder text. Each section owns its own scroll ref so multiple
  collections on one page don't fight over it. The whole card is clickable
  (opens `src/components/ProductQuickView.tsx`) — the "Add"/"Eye" buttons
  `stopPropagation()` so they don't double-fire the card's own click. Card
  price shows "From $X" when a product has more than one variant (the
  cheapest active one). `ProductQuickView` defaults `selectedVariantId` to
  the first in-stock variant (falling back to the first variant if everything
  is sold out) as soon as it opens, rather than forcing a "choose one"
  placeholder — the picker (`Select`, shown only when >1 variant) shows a
  real variant name immediately and "Add to Cart" is actionable right away.
- **Cart**: pure client state, not a DB-backed order — guests can use it
  without an account (`src/cart/CartContext.tsx`, Context + `localStorage`,
  hydrated post-mount only to avoid SSR mismatches). Mounted in
  `__root.tsx`'s public branch (same place `Header`/`Footer` render). Line
  identity is `` `${productId}__${variantId}` `` (exported as `lineKey()` so
  other components can look up "is this variant already in the cart" without
  duplicating the format string), so different variants of the same product
  are separate cart lines. Every `CartItem` carries `maxQuantity` — a
  snapshot of the variant's stock taken at add-time, not a live lookup (the
  cart has no server round-trip and there's no checkout yet to reconcile
  against real stock) — `addItem`/`updateQuantity` both clamp to it, and
  `CartSheet.tsx`'s `+`/`ProductQuickView.tsx`'s `+` disable once quantity
  reaches `maxQuantity` **minus whatever's already in the cart for that exact
  variant**; `-` disables at 1 (the trash icon is the only way to remove a
  line now — decrementing to 0 via `-` no longer auto-removes it). Cart
  open/close state lives in `CartContext` too
  (`isOpen`/`openCart`/`closeCart`/`setCartOpen`), not local `useState` in
  `Header.tsx` — needed so `CollectionSection.tsx`/`ProductQuickView.tsx`
  (neither a descendant of `Header`) can call `cart.openCart()` right after
  `addItem()` to auto-open the drawer as add-to-cart confirmation.
  `src/components/CartSheet.tsx` is the slide-over UI, reads `isOpen` directly
  from `useCart()` (no props). **Checkout is a disabled button, on purpose**
  — not built yet.

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
  own default (`**/*.server.*`) and it's why this code is split into
  neutrally-named directories instead — `src/auth/` and `src/products/`, each
  with an unsuffixed `functions.ts` (the `createServerFn` RPCs client
  components legitimately need to import and call) alongside the true
  server-only helpers (`*.server.ts`, protected by the filename-suffix rule).
  `src/lib/db.server.ts` (the shared Mongo client singleton) is imported by
  both. Learned this the hard way once already — don't reintroduce a
  `server/` directory anywhere.
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
- **Clickable elements show a pointer cursor globally** — `src/styles.css`'s
  `@layer base` has `button:not(:disabled), [role="button"]:not([aria-disabled="true"])
  { cursor: pointer }`, since browsers default `<button>` to `cursor: default`
  (unlike `<a>`). Covers every hand-rolled button site-wide from one place;
  don't add per-element `cursor-pointer` classes for plain buttons. Non-button
  clickable elements (like the shop product card, a `<div onClick>`) still
  need an explicit `cursor-pointer` class since the base-layer rule only
  targets `<button>`/`role="button"`.
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
- Removing a product asset (or deleting a product entirely) does not delete
  the underlying file from `public/uploads/products/` — only the DB
  reference goes away. Fine for now; revisit if disk usage becomes a real
  concern.
- No cross-tab/cross-session live sync for shop data — a guest's already-open
  tab won't see a coach's edit until it refetches (page reload / remount).
  No websockets/polling built for this; matches the MVP scope of the ask.
- **The public site is collection-driven, not "every active product,
  always visible."** A product that isn't included in any collection won't
  appear on `/` or `/shop` at all, even if it's active with stock. This is a
  deliberate consequence of the Collections feature, not a bug — no fallback
  "uncategorized products" section was requested or built. Worth revisiting
  if a coach ever reports a product "disappearing."
