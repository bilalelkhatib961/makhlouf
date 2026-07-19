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
- Real, dynamic **Training system**: coach CRUD at `/coach/training` (four
  tabs — Muscle Groups, Muscle Categories, Exercises, Splits) covering the
  full programming hierarchy a coach builds workouts from. See "Training"
  below.
- Real, dynamic **Clients**: coach-facing roster at `/coach/clients` reading
  real `client`-role accounts, a per-client detail page
  (`/coach/clients/$clientId`) with editable profile info (dob, weight,
  height, phone, nationality, optional profile picture), the ability to
  assign a Split with a start date, a live progress bar for the current
  assignment, and a history table of every previous assignment. See "Clients
  & Split Assignments" below.

**Still hardcoded dummy data — not built yet:**
- Dashboard, Subscriptions, Schedules in the coach CMS, and Diet, Workouts,
  Exercises, Weight in the client portal — every list/table on those pages is
  a hardcoded array in the route file, not a database read. These three coach
  pages are flagged under an "Uncompleted" heading in the `/coach` sidebar
  (see "Conventions" below) specifically so they're not mistaken for done.
  Products/Categories, Training, and now Clients were the first of these to
  go real; the same read/write/`coachMiddleware` pattern applies when the
  rest get built.
- Public signup/registration (only the originally-seeded coach/client
  accounts exist as "real" logins; `scripts/seed-clients.ts` adds more client
  accounts but only via a seed script, not a coach-facing "create client" UI
  flow — that still doesn't exist).
- Checkout/payment/orders — the cart is real, checkout is explicitly not.
- CSRF origin-check middleware, rate limiting on login, `/unauthorized` page
  (wrong-role users are just redirected to their own home instead).
- Password reset.
- Client-facing training: the client's own "what do I do today" view and
  per-set weight/rep history tracking. The coach-side half of this (assigning
  a split, tracking progress) is now built — see "Clients & Split
  Assignments" below — but nothing renders on the client-portal side yet.

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
  `role === "coach"`; every products/categories mutation uses it, every
  training mutation (`src/training/functions.ts`) reuses it verbatim, and so
  does every client mutation (`src/clients/functions.ts`). Follow this
  pattern for future coach-owned data (subscriptions, schedules) — don't
  trust a client-supplied ID alone, scope by `context.user.id`/`role`.
  `src/clients/clients.server.ts`/`assignments.server.ts` go one step further
  and re-check `role === "client"` on the target user too, so a coach can't
  accidentally attach a profile/assignment to another coach account.
- **Seed script**: `scripts/seed.ts` (run via `npm run db:seed`), deliberately
  outside `src/` — it's a standalone Node script run through `tsx`, not part
  of the Vite app bundle. `scripts/seed-catalog.ts` (`npm run db:seed:catalog`)
  seeds demo categories/products the same way. `scripts/seed-training.ts`
  (`npm run db:seed:training`) seeds demo muscle groups/categories/exercises
  and three splits. `scripts/seed-clients.ts` (`npm run db:seed:clients`)
  seeds four more client accounts plus profile/assignment data for all five —
  depends on both of the above having already run.

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

// muscleGroups — leaf-level, e.g. "Biceps — Long Head", "Rear Delt"
{ _id: ObjectId; name: string; image: string | null; createdAt: Date; updatedAt: Date; }

// muscleCategories — groups muscle groups, e.g. "Arms" contains both biceps heads
{
  _id: ObjectId;
  name: string;
  image: string | null;
  muscleGroupIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// exercises — targets exactly ONE muscle group
{
  _id: ObjectId;
  name: string;
  description: string;                // optional, "" is valid
  muscleGroupId: ObjectId;
  assets: Array<{ url: string; type: "image" | "file" | "video"; isPrimary: boolean }>;
  createdAt: Date;
  updatedAt: Date;
}

// splits — a weekly training program template, always exactly 7 day entries
{
  _id: ObjectId;
  name: string;
  description: string;                // optional
  durationWeeks: number;
  days: Array<{
    day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    label: string;                    // optional day label, e.g. "Push Day"
    exercises: Array<{ exerciseId: ObjectId; sets: number[] }>;
    // sets = one entry per set, each value is that set's target rep count,
    // e.g. [12, 10, 8] = 3 sets. An empty `exercises` array *is* the rest day.
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// clientProfiles — 1:1 with a "client"-role users doc, created lazily on first edit
{
  _id: ObjectId;
  userId: ObjectId;              // ref users._id, unique
  dob: Date | null;
  weight: number | null;         // kg
  height: number | null;         // cm
  phone: string | null;
  nationality: string | null;
  profilePicture: string | null; // /uploads/clients/<uuid>.<ext>
  createdAt: Date;
  updatedAt: Date;
}

// splitAssignments — append-only history, never edited or deleted
{
  _id: ObjectId;
  clientId: ObjectId;   // ref users._id
  splitId: ObjectId;    // ref splits._id
  startDate: Date;
  createdAt: Date;
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

"Current" vs. "history" for a client's split assignments isn't a stored flag
— it's derived by sorting `splitAssignments` for a client by `startDate` desc
(tiebreak `createdAt`): the newest one is "current", everything else is
"history". Progress/status (Upcoming / In Progress / Completed) is likewise
computed on the fly from `{startDate, durationWeeks}` vs. `new Date()` — see
`src/clients/progress.ts`'s `splitProgress()` — never cached, so it can't go
stale. Weight is kg, height is cm; no unit toggle exists.

Dashboard stats, subscriptions, schedules, diet logs, workouts, and weight
entries (client portal) are still just static arrays inside their route
files — no schema yet. Record the shape here once each one goes real.

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

Run `npm run db:seed:training` to populate 15 demo muscle groups, 6 muscle
categories, 15 exercises (one per muscle group), and three splits ("Push Pull
Legs Arms" 6 weeks, "Upper Lower Split" 8 weeks, "Full Body Strength" 10
weeks). Muscle groups/categories are idempotent (matched by `name`, same
pattern as categories above); exercises and splits are **not** — cleared and
reinserted fresh every run, same reasoning as products. Uses the same bundled
product photos as `seed-catalog.ts` for placeholder images.

Run `npm run db:seed:clients` **after** the two scripts above (it looks up
splits by name and throws a clear error if none exist yet) to populate four
more client accounts and profile/history data for all five clients — see
"Clients & Split Assignments" below for exactly what each one demonstrates.
New accounts all use password `Client!2025`, same as the original seeded
client:

| Email               | Name           |
| -------------------- | -------------- |
| casey@makhlouf.com   | Casey Brooks   |
| riley@makhlouf.com   | Riley Chen     |
| sam@makhlouf.com     | Sam Whitfield  |
| morgan@makhlouf.com  | Morgan Blake   |

Assignment history is demo data and **not** idempotent — cleared and
reinserted fresh per client every run (profiles *are* idempotent, upserted by
`userId`, same as categories/muscle groups).

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

## Training

Coach-only programming system: muscle groups → muscle categories → exercises
→ splits, each level building on the last. "Exercises" in the coach nav was
renamed to **"Training"** (`/coach/exercises` → `/coach/training`) since the
page now covers the whole hierarchy, not a flat exercise list. No
client-facing pieces exist yet — see "Still hardcoded dummy data" above.

- **Server layer** (`src/training/`, same shape as `src/products/`):
  `types.ts` (shared, client-safe), `muscle-groups.server.ts`,
  `muscle-categories.server.ts`, `exercises.server.ts`, `splits.server.ts`,
  `upload.server.ts`, `functions.ts` (the `createServerFn` RPCs — every one
  uses `coachMiddleware`, nothing here is public). **Referential integrity**
  mirrors `categories.server.ts`'s product-count block: deleting a muscle
  group is blocked if any exercise or muscle category still references it;
  deleting an exercise is blocked if any split still references it; deleting
  a split is blocked if any client still has it assigned (checks the
  `splitAssignments` collection added by the Clients feature — see below).
  Muscle categories have no incoming references from anything else, so they
  delete freely.
- **Media upload generalized beyond images**: exercises need image *and*
  video uploads, but the original `src/products/upload.server.ts` hardcoded
  image-only mimetypes. Pulled the disk-write logic out into a new
  `src/lib/upload.server.ts` (`saveAsset(file, folder, allowedMimeMap)` —
  generic mkdir/randomUUID/writeFile) and a new `src/lib/assets.ts` (shared
  `AssetType`/`Asset`, which `src/products/types.ts` now re-exports as
  `ProductAsset` so every existing product import kept working unchanged).
  `src/products/upload.server.ts`'s `saveProductImage` became a thin wrapper
  over `saveAsset(file, "products", IMAGE_MIMES)` — same behavior, zero
  product-side risk. `src/training/upload.server.ts` exports two thin
  wrappers of its own: `saveExerciseAsset` (`saveAsset(file, "exercises",
  ...)`, images + video) and `saveMuscleImage` (`saveAsset(file, "muscles",
  ...)`, images only — used by both the Muscle Groups and Muscle Categories
  forms rather than reusing the product upload endpoint, to keep the
  `products` upload folder scoped to products only).
- **Coach CMS** (`/coach/training`): one route, four tabs (shadcn `Tabs`) —
  Muscle Groups, Muscle Categories, Exercises, Splits — in that order since
  it's also the natural setup order for a coach starting from scratch.
  `MuscleGroupsTab`/`MuscleGroupFormDialog` (name + single-image picker, no
  array — a group only ever has one image). `MuscleCategoriesTab`/
  `MuscleCategoryFormDialog` (name, image, checkbox picker over muscle
  groups — same picker pattern as `CollectionFormDialog`'s product list).
  `ExercisesTab`/`ExerciseFormDialog` (name, description, muscle group
  `Select`, plus `ExerciseAssetFields.tsx` — a standalone asset uploader
  supporting mixed image/video with primary selection, built fresh rather
  than extracting `ProductVariantFields.tsx` to avoid touching already-
  verified product code for a same-day feature; renders a muted `<video>`
  thumbnail instead of `<img>` for video assets). `SplitsTab`/
  `SplitFormDialog` (name, description, duration in weeks, then a shadcn
  `Accordion` — one item per weekday, first real use of that primitive in
  this app — each expandable to a day-label input and a repeatable list of
  exercise rows; reps are entered as a comma-separated string like "12,10,8"
  and parsed to `number[]` on submit via `parseSets()`). All four dialogs
  follow the established blob-preview upload pattern
  (`URL.createObjectURL(file)` shown immediately, swapped for the real
  server URL once the upload resolves) so new media never shows broken
  before save.
- **Seed data**: `scripts/seed-training.ts` — see "Seed accounts" above.

## Clients & Split Assignments

Coach-facing roster and per-client detail page. Reads real `client`-role
`users` docs — no client account creation UI exists yet (see "Still hardcoded
dummy data" above), only the seed scripts add more.

- **Server layer** (`src/clients/`, same shape as `src/training/`):
  `types.ts` (shared, client-safe — `ClientProfile`, `SplitAssignment`,
  `ClientListItem`, `ClientDetail`), `progress.ts` (pure, no I/O —
  `splitProgress(startDate, durationWeeks)` → `{ percent, status, weekLabel,
  endDate }`, reused by both the roster's inline mini-progress and the detail
  page's big progress card so the two never disagree), `clients.server.ts`
  (`listClients()`, `getClientDetail(userId)`, `upsertClientProfile`),
  `assignments.server.ts` (`listAssignmentsForClient` — resolves
  `splitName`/`durationWeeks` via a name map, same pattern as
  `splits.server.ts`'s `exerciseNameMap()`; `assignSplit` — validates the
  target user is actually `role: "client"` and the split exists, then inserts
  one append-only row), `upload.server.ts` (`saveClientProfilePicture`, a
  thin wrapper over `saveAsset(file, "clients", IMAGE_MIMES)`), `functions.ts`
  (the RPCs, all `coachMiddleware`). Dates cross the RPC boundary as ISO
  strings in both directions — server converts `new Date(iso)` in, calls
  `.toISOString()` out — consistent with every other primitive-only RPC in
  this app.
- **Coach CMS**: `/coach/clients` (`src/routes/coach/clients.tsx`) is a single
  table — avatar (`Avatar`/`AvatarFallback`, first-initial fallback), name,
  email, phone, nationality, current-split name + a compact `Progress` bar,
  joined date — each row a click-through (`useNavigate`, not `Link`, since
  the whole `TableRow` is the click target) to
  `/coach/clients/$clientId`. That detail route's **file is named
  `coach/clients_.$clientId.tsx`** (trailing underscore before the dot) —
  without it, TanStack Router's file-based routing treats `clients.$clientId`
  as a *child* of `clients.tsx` (since they share the `clients` segment),
  which silently renders the parent list page's component instead of the
  detail page for any `/coach/clients/:id` URL, because `ClientsPage` has no
  `<Outlet />`. The trailing underscore is this router's documented
  "de-nest from the same-named parent" escape — keeps the resolved URL as
  `/coach/clients/$clientId` while making `getParentRoute` point at the
  `coach` layout directly instead of `coach/clients`. Watch for this any time
  a new dynamic child route is added under an existing same-named list route.
  The detail page itself: a profile card (dob/weight/height/phone/
  nationality, **Edit** → `ClientProfileFormDialog.tsx` — dob via a
  `Popover`+`Calendar` date-picker, this app's first use of that combo;
  profile picture via the established single-image blob-preview pattern from
  `MuscleGroupFormDialog.tsx`, rendered as a circle instead of a square), a
  current-split card (`Progress` bar, week label, status `Badge`, **Assign
  Split** → `AssignSplitDialog.tsx` — a `Select` over `getCoachSplitsFn()`
  plus the same date-picker, defaulting to today), and a history table
  (every assignment except the current one). `AssignSplitDialog` adapts based
  on whether `splitProgress(currentAssignment)` is `"in-progress"`: if not
  (no current assignment, or it's upcoming/completed), it's a plain "Assign
  Split" with a manual start-date picker, same as above; if it **is**
  in-progress, the button/dialog title become "Replace Split", the date
  picker is replaced by a `RadioGroup` (`ui/radio-group.tsx`) asking the
  coach to either start the new split fresh from 0% (`startDate = now`) or
  keep the current progress (`startDate` = the current assignment's own
  `startDate`, carried over unchanged onto the new split). There's no
  separate "replace" mutation — both paths call the same `assignSplitFn`,
  just with a different computed `startDate`; "current vs. history" already
  being purely derived (latest by `startDate` wins) means inserting a new
  row with an old `startDate` naturally supersedes the in-progress one. Every
  dialog date-picker trigger
  is a hand-rolled `<button>` styled to match the rest of the app rather than
  shadcn's `Button` component — this codebase never uses `Button` directly
  outside `ui/` internals (e.g. `alert-dialog.tsx`'s `buttonVariants()`),
  since its rounded-md/primary-color defaults don't match the site's sharp
  `rounded-sm` grayscale system.
- **Sidebar "Uncompleted" grouping**: `DashboardNavItem`
  (`src/components/dashboard/DashboardLayout.tsx`) gained an optional
  `status?: "todo"` field. `coach.tsx`'s `NAV_ITEMS` marks Dashboard,
  Subscriptions, and Schedules with it; `SidebarNav` renders those after a
  dimmed "Uncompleted" label (still fully clickable — a memory aid, not a
  lock), in both the desktop sidebar and mobile slide-over since both share
  the one component. While building this, fixed a latent bug in the same
  component: `Link`'s own default active-matching is prefix-based, so the
  Dashboard link (`to="/coach"`) was marking itself `aria-current="page"` on
  every coach sub-route, not just `/coach` itself. Fixed by adding
  `activeOptions={{ exact: true }}` to every nav `Link` — the component
  already computed its own `isActive` for styling via `useLocation`, this
  just stops the router's *own* indicator from disagreeing with it.
- **Seed data**: `scripts/seed-clients.ts` — see "Seed accounts" above. Each
  of the 5 seeded clients demonstrates a different state on purpose: Jordan
  Ellis (full profile, one completed + one in-progress assignment), Casey
  Brooks (full profile, single early in-progress assignment), Riley Chen
  (full profile, three-entry history), Sam Whitfield (full profile, but every
  assignment's duration has fully elapsed — demonstrates the "current
  assignment renders as Completed" state rather than showing nothing), Morgan
  Blake (no profile row, no assignments at all — the fully-empty state).

## Conventions

- **Routing**: TanStack Start file-based routing under `src/routes/` — see
  `src/routes/README.md` for the exact file→URL rules (don't use Next.js/
  Remix conventions). `coach.tsx` + `coach/*.tsx` and `portal.tsx` +
  `portal/*.tsx` are layout routes exactly like `__root.tsx` + `index.tsx`
  already worked before this session — same pattern, one level deeper. A
  dynamic route nested under a same-named list route (e.g. a detail page for
  `clients.tsx`) needs the trailing-underscore de-nesting convention
  (`clients_.$clientId.tsx`) or it silently renders the list page's component
  instead — see "Clients & Split Assignments" for the full explanation; this
  app's first dynamic route hit it.
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
- Removing a product/exercise/muscle-group/muscle-category/client-profile
  asset (or deleting the record entirely) does not delete the underlying file
  from `public/uploads/<folder>/` — only the DB reference goes away. Fine for
  now; revisit if disk usage becomes a real concern.
- The coach can now assign a split to a client and track progress (see
  "Clients & Split Assignments"), but nothing on the **client** side exists
  yet: the client's own "what do I do today" view and per-set weight/rep
  history. The `splits.days[].exercises[].sets` shape was designed to support
  a future per-set "completed" flag and history log without a schema change,
  but neither exists yet.
- Weight/height are assumed kg/cm with no unit toggle — revisit if a client
  outside that convention needs it.
- No cross-tab/cross-session live sync for shop data — a guest's already-open
  tab won't see a coach's edit until it refetches (page reload / remount).
  No websockets/polling built for this; matches the MVP scope of the ask.
- **The public site is collection-driven, not "every active product,
  always visible."** A product that isn't included in any collection won't
  appear on `/` or `/shop` at all, even if it's active with stock. This is a
  deliberate consequence of the Collections feature, not a bug — no fallback
  "uncategorized products" section was requested or built. Worth revisiting
  if a coach ever reports a product "disappearing."
