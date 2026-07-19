# Subscriptions (2 fixed packages, price-only editing) + public self-registration ("Join Us")

## Context

`/coach/subscriptions` is still the original dummy page (4 fake hardcoded plans), and there's no
public signup at all — CLAUDE.md has flagged "no public signup exists" as an open question since
the auth system was first built. This round answers it: clients self-register through a new
public "Join" flow, picking one of exactly two fixed packages (Basic / Premium) as part of signing
up. Unlike every other coach-CMS entity built so far, this one is deliberately **not** full CRUD —
the user was explicit that there are only ever two packages, both fixed at 1 month, and the coach
can only ever edit the **price**. Everything else (name, benefits, duration) is seeded once and
never exposed as editable.

Package benefits, from the request:
- **Basic**: diet plan + workout plan only.
- **Premium**: everything Basic has, plus full weights/sets/reps tracking, diet tracking, 1-on-1
  private in-person coaching sessions, and the ability to book a session time on the coach's
  calendar.

Explicitly **not** in scope: payment/billing integration, any enforcement of what a package
"unlocks" (no gating of client-portal features by package), and any booking/calendar system itself
— just the packages, assigning them, and the signup flow that picks one.

## Data model (two new MongoDB collections)

```ts
// subscriptionPackages — always exactly 2 docs, seeded once; only `price` is ever coach-edited
{
  _id: ObjectId;
  slug: "basic" | "premium";   // fixed identity
  name: string;                 // fixed, e.g. "Basic"
  price: number;                 // the ONLY coach-editable field
  durationMonths: number;       // fixed at 1, never exposed as editable
  benefits: string[];           // fixed, seeded, never exposed as editable
  createdAt: Date;
  updatedAt: Date;
}

// subscriptionAssignments — append-only history, mirrors dietPlanAssignments exactly
{
  _id: ObjectId;
  clientId: ObjectId;
  packageId: ObjectId;
  startDate: Date;
  createdAt: Date;
}
```

"Current vs. history" is the same derived latest-`startDate`-wins pattern as splits/diet plans.
"Active until" is computed on the fly as `startDate + durationMonths` (via date-fns' `addMonths`,
already a dependency) — no stored/cached expiry, no status badge/enforcement, matching the
explicit "nothing functional for now" instruction (just an informational date, unlike the split
card's progress bar).

## Server layer (`src/subscriptions/`, mirrors `src/diet/`)

- `types.ts`: `SubscriptionPackage`, `SubscriptionAssignment`, `AssignPackageInput`.
- `packages.server.ts`: `listPackages()` (one shape serves public + admin, nothing sensitive to
  strip), `updatePackagePrice(id, price)` — deliberately **not** a generic `updatePackage(id,
  input)`; the narrow function signature is the enforcement that price is the only editable field.
- `assignments.server.ts`: `listSubscriptionAssignmentsForClient(clientId)`, `assignPackage(input)`
  — validates the target user is `role: "client"` and the package exists, same guard shape as
  `src/diet/diet-assignments.server.ts`'s `assignDietPlan`.
- `functions.ts`: `getPublicPackagesFn` (public, no `coachMiddleware` — the Join page needs it),
  `getCoachPackagesFn`, `updatePackagePriceFn`, `assignPackageFn` (rest all `coachMiddleware`).

**Auth extension** for self-registration (`src/auth/`):
- `credentials.server.ts` gains `createClientUser(email, name, password)` — hashes via the
  existing `hashPassword`, inserts a `role: "client"` user, catches the Mongo duplicate-key error
  (code `11000` on the existing unique email index) and rethrows a clear "An account with this
  email already exists" message.
- `functions.ts` gains `joinFn` — validates `{name, email, password, packageId}`, calls
  `createClientUser`, then `assignPackage` (imported from `@/subscriptions/assignments.server`,
  same cross-domain-server-import pattern `clients.server.ts` already uses for diet), then sets the
  session exactly like `loginFn` does (`session.clear()` + `session.update()`), returns
  `{ role: "client" }` so the caller can redirect the same way `loginFn`'s caller does.

## Coach CMS UI

- **`/coach/subscriptions`** (rewrite `src/routes/coach/subscriptions.tsx`): fetches
  `getCoachPackagesFn()`, renders the 2 packages as cards (name, price, "1 month", benefits list)
  — no "Add Package" action (fixed set of 2), no delete. Each card's only action is **Edit Price**
  → a small `EditPackagePriceDialog.tsx` with a single price number input. `coach.tsx`'s
  `NAV_ITEMS` drops `status: "todo"` from the Subscriptions entry — it's real now.
- **Client detail page** (`src/routes/coach/clients_.$clientId.tsx`): a new "Subscription" card
  slotted into the existing `grid-cols-2` row alongside Current Split / Current Diet Plan (wraps to
  its own row, same as the grid already does) — package name, price, "Active until {date}",
  **Assign/Replace Package** → new `AssignPackageDialog.tsx` (`Select` a package + the same
  date-picker `AssignDietPlanDialog` uses, defaulting to today). A "Subscription History" table
  follows the existing Split/Diet History tables, same two-column shape as the diet history table.
  `src/clients/types.ts`/`clients.server.ts` gain `currentSubscription`/`subscriptionHistory`,
  wired in exactly the way `currentDietPlan`/`dietPlanHistory` were added last round (import
  `listSubscriptionAssignmentsForClient` from `@/subscriptions/assignments.server`).

## Public "Join Us" flow

- New route `src/routes/join.tsx`: loader does `ensureQueryData` on a `getPublicPackagesFn` query
  (same SSR-prefetch pattern as `shop.tsx`/`gallery.tsx`), has a `beforeLoad` redirect for an
  already-logged-in visitor (mirrors `login.tsx`'s guard). One page: the 2 packages rendered as
  selectable cards (click to pick one, visually highlighted — same selected/unselected visual
  language `AssignSplitDialog`'s `RadioGroup` choice cards already established), then a form
  (name, email, password, confirm-password — client-side mismatch check before submit) styled
  identically to `login.tsx`'s form (same underlined inputs, same submit-button treatment). Submit
  calls `joinFn`, then `router.invalidate()` + `navigate({ to: "/portal" })`, mirroring
  `login.tsx`'s post-auth flow exactly.
- `src/components/Header.tsx`: the two currently-static "Join" `<button>`s (desktop header +
  mobile drawer) become `Link to="/join"`, matching how the adjacent "Sign In" link already works.

## Seed data

New `scripts/seed-subscriptions.ts` (`npm run db:seed:subscriptions`, run after `db:seed:clients`):
- Upserts the 2 packages by `slug` — `$set` on the fixed fields (name, durationMonths, benefits) so
  copy edits in the script propagate on re-run, but price only via `$setOnInsert` so re-running the
  script never clobbers a coach's already-edited price (packages are a stable real entity here, not
  disposable demo data — different from how `seed-catalog.ts`/`seed-training.ts` fully replace
  their demo collections every run).
- Assigns packages to the existing seeded clients for variety (mirrors "assign them to my different
  clients"): e.g. Jordan Ellis and Riley Chen → Premium, Casey Brooks and Sam Whitfield → Basic,
  Morgan Blake → none (consistent with their already-established fully-empty state). Assignment
  history is demo data, cleared and reinserted fresh per client each run, same reasoning as
  `seed-diet.ts`'s diet assignments.

## Docs

`CLAUDE.md`: new "Subscriptions" section (mirrors "Diet"'s structure) covering the data model, the
price-only-editable constraint and why the function signature enforces it, the "Active until"
computation, and the seed script. Update "Current status" to move Subscriptions out of the
"Uncompleted" list and note the new public Join flow. Update the "Open questions" bullet that
previously said "no public signup exists" — it's now answered (self-service, package required).
Approved plan archived to `versions/2026-07-19-09-subscriptions-and-join.md`.

## Verification

1. `npm run db:seed:subscriptions` — confirm exactly 2 packages land, and 4 clients get a
   subscription assignment (Morgan Blake stays unassigned).
2. `npx tsc --noEmit` / `npx eslint .` clean, `npx vite build` succeeds.
3. As coach: `/coach/subscriptions` shows Basic/Premium with correct benefits; edit Premium's
   price, confirm it saves and re-running the seed script doesn't reset it. Open a client detail
   page, assign/replace their package, confirm "Active until" and history update correctly.
4. As guest: visit `/join` (via the header "Join" button), pick a package, fill the form, submit —
   confirm a new client account is created, logged in, and redirected to `/portal`; confirm
   signing up with an already-used email shows a clear error instead of a crash.
5. Confirm `/coach` sidebar shows "Subscriptions" as a normal (not "Uncompleted") item.
