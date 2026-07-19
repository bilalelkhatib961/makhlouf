# Dynamic Clients section + split assignment (coach-only)

## Context

The coach CMS's "Clients" page is currently a static dummy table (six hardcoded
names). The user wants it wired to real client accounts in MongoDB, plus a new
capability: the coach can assign one of the existing Splits (built in the prior
Training-system round) to a client with a start date, see a progress bar for
the client's current program, and browse that client's history of previously
assigned splits. Clients also need richer profile fields (dob, weight, height,
phone, nationality, optional profile picture) so the coach has real context on
each person. The user also wants the coach sidebar to visually separate what's
actually built (Clients, Products, Training) from what's still dummy data
(Dashboard, Subscriptions, Schedules), and wants the database seeded with
several realistic, varied client records (different profiles, different split
histories, one with no data at all) plus a couple more splits to assign from.

This round is explicitly coach-facing only — no client-portal changes (that
side of the app, and any client self-registration flow, remains out of scope
and undecided, per CLAUDE.md's existing open questions).

## Data model (two new MongoDB collections)

```ts
// clientProfiles — 1:1 with a "client"-role users doc, created lazily
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

// splitAssignments — append-only history, never edited/deleted
{
  _id: ObjectId;
  clientId: ObjectId;   // ref users._id
  splitId: ObjectId;    // ref splits._id
  startDate: Date;
  createdAt: Date;
}
```

No `isActive` flag on assignments. "Current" assignment = the one with the
latest `startDate` (tiebreak `createdAt`); everything else is "history". The
detail page computes and displays the real status (Upcoming / In Progress /
Completed) from `startDate` + the split's `durationWeeks`, so assigning a
future-dated split is honestly represented rather than hidden behind a flag.
Progress is computed purely client-side from `{startDate, durationWeeks}` vs.
`new Date()` — no stored/cached percentage to go stale.

Weight is kg, height is cm — documented as the assumed units (no unit toggle).
`clientProfiles` fields are all nullable/optional; a client with no profile
row yet just renders as "not set" everywhere (matches the "add a client with
no data at all" seed request).

## Server layer (`src/clients/`, mirrors `src/training/`)

- `types.ts` — client-safe: `ClientProfile`, `SplitAssignment`, `ClientListItem`
  (id, name, email, joinedAt, profile, currentAssignment), `ClientDetail`
  (`ClientListItem` + `history: SplitAssignment[]`), `ClientProfileInput`,
  `AssignSplitInput`. Dates cross the RPC boundary as ISO strings in both
  directions (consistent with how the rest of the app only ever sends
  primitives) — server converts `new Date(iso)` on the way in, `.toISOString()`
  on the way out.
- `clients.server.ts` — `listClients()` (join `users` where `role: "client"`
  with `clientProfiles` by `userId`, plus each client's current assignment via
  `assignments.server.ts`), `getClientDetail(userId)` (profile + full
  assignment history), `upsertClientProfile(userId, input)` (create-or-update
  by `userId`, same upsert shape as `scripts/seed.ts`'s account upsert).
- `assignments.server.ts` — `listAssignmentsForClient(clientId)` (resolves
  `splitName`/`durationWeeks` via a name map, same pattern as
  `src/training/splits.server.ts`'s `exerciseNameMap()`; sorted desc), 
  `assignSplit(input)` (validates the client user exists and has
  `role: "client"`, validates the split exists, inserts one row — no delete/
  edit, since re-assigning is how a mistake gets corrected and that's
  consistent with "history" being append-only).
- `upload.server.ts` — `saveClientProfilePicture(file)`, a thin wrapper over
  the existing generic `saveAsset(file, "clients", IMAGE_MIMES)` from
  `src/lib/upload.server.ts` (built in the Training round) — zero new upload
  infrastructure needed.
- `functions.ts` — `getCoachClientsFn`, `getCoachClientDetailFn`,
  `updateClientProfileFn`, `assignSplitFn`, `uploadClientProfilePictureFn`.
  All wrapped in `coachMiddleware` (from `src/auth/middleware.server.ts`) —
  same pattern as every other coach-owned domain; nothing here is public.
  Splits themselves are already readable via the existing
  `getCoachSplitsFn` (`src/training/functions.ts`) — reused as-is for the
  "assign a split" picker, no new endpoint needed.

## Coach CMS UI

- **`src/routes/coach/clients.tsx`** (rewritten): fetches `getCoachClientsFn()`
  via `useQuery`, renders a table — avatar (`Avatar`/`AvatarFallback` from
  `src/components/ui/avatar.tsx`, first-initial fallback), name, email, phone,
  nationality, current split name + a compact inline `Progress` bar (or an
  em-dash if no current assignment), joined date. Each row is a `Link` to
  `/coach/clients/$clientId` (TanStack Start dynamic route — file name
  `clients.$clientId.tsx`, this app's first dynamic route; confirmed
  convention in `src/routes/README.md`). No "Add Client" action — account
  creation/signup is still an explicit open question in CLAUDE.md, out of
  scope here.
- **`src/routes/coach/clients.$clientId.tsx`** (new): fetches
  `getCoachClientDetailFn({clientId})`. Layout:
  - Header: avatar, name, email, joined date.
  - Profile card: dob, weight (kg), height (cm), phone, nationality — each
    "Not set" when null — with an **Edit** button opening
    `ClientProfileFormDialog` (dob via `Popover` + `Calendar` — this app's
    first use of that combo, standard shadcn date-picker recipe; weight/
    height number inputs; phone/nationality text inputs; profile picture via
    the established blob-preview single-image pattern from
    `MuscleGroupFormDialog.tsx`). Only these new profile fields are editable
    here — name/email stay untouched (account management is out of scope).
  - Current Split card: split name, start date, duration, a `Progress` bar,
    and a status label (Upcoming / In Progress / Completed) computed by a new
    small pure helper `src/clients/progress.ts` (`splitProgress(startDate,
    durationWeeks) → { percent, status, weekLabel }`), reused by both the list
    row's mini-progress and this card. An **Assign Split** button opens
    `AssignSplitDialog` — `Select` over `getCoachSplitsFn()` results + the
    same date-picker pattern as the profile dialog, defaulting to today.
  - History table: every assignment except the current one, each row showing
    split name, start date, computed end date (`startDate + durationWeeks`),
    and the same computed status badge.
- New dialogs: `src/components/coach/ClientProfileFormDialog.tsx`,
  `src/components/coach/AssignSplitDialog.tsx`. Both follow the existing
  `useMutation` + `invalidateQueries(["coach", "clients"])`/`["coach",
  "client", clientId]` pattern used everywhere else in the coach CMS.

## Sidebar: "Uncompleted" grouping

`DashboardNavItem` (`src/components/dashboard/DashboardLayout.tsx`) gets one
new optional field: `status?: "todo"`. `src/routes/coach.tsx`'s `NAV_ITEMS`
marks Dashboard, Subscriptions, and Schedules with `status: "todo"` (Clients
loses it, since it's real now). `SidebarNav` splits items into two groups and
renders the `status: "todo"` ones after a small uppercase "Uncompleted"
divider/label, visually dimmed (lower opacity) but still fully clickable —
this is a memory aid, not a lock. Applies to both the desktop sidebar and the
mobile slide-over (both already render through the same `SidebarNav`
component, so one change covers both).

## Seed data

- **Extend `scripts/seed-training.ts`**: add two more splits alongside the
  existing "Push Pull Legs Arms" — "Upper Lower Split" (4 days/week, 8 weeks)
  and "Full Body Strength" (3 days/week, 10 weeks) — reusing the same already-
  seeded exercises. Splits stay in the `exercises`/`splits` deleteMany-and-
  reinsert block, same as today (still demo data, still safest to fully
  replace on shape changes).
- **New `scripts/seed-clients.ts`** (`npm run db:seed:clients`): requires
  `db:seed` (base accounts) and `db:seed:training` (splits) to have already
  run — throws a clear error if no splits exist yet, telling the coach which
  script to run first. Seeds four additional client accounts reusing the
  existing dummy-data names for continuity (Casey Brooks, Riley Chen, Sam
  Whitfield, Morgan Blake — same `bcryptjs`/upsert-by-email pattern as
  `scripts/seed.ts`, password `Client!2025`), then gives every client
  (including the original seeded Jordan Ellis) a **different** shape of data
  so the coach UI has real variety to inspect:
  - Jordan Ellis — full profile, two-entry history (an earlier split now
    "Completed", a more recent one "In Progress").
  - Casey Brooks — full profile, single assignment started a few days ago
    ("In Progress", early).
  - Riley Chen — full profile, three-entry history (two "Completed", current
    one "In Progress").
  - Sam Whitfield — full profile, but only past ("Completed") assignments —
    demonstrates the "no current program" state.
  - Morgan Blake — no profile row and no assignments at all — demonstrates
    the fully-empty state.
  Profile pictures reuse the bundled `src/assets/portrait.jpg`/`gallery-*.jpg`
  files copied into `public/uploads/clients/`, same trick `seed-catalog.ts`/
  `seed-training.ts` already use for placeholder media.

## Docs

`CLAUDE.md`: new "Clients" section (mirroring "Training"'s structure) —
data model, the append-only-assignment/progress-computation design, the
sidebar "Uncompleted" convention, and the seed scripts. Move Clients out of
"Still hardcoded dummy data" (Dashboard/Subscriptions/Schedules remain).
Approved plan archived to `versions/2026-07-19-06-clients-and-splits.md`.

## Verification

1. `npm run db:seed:training` (now 3 splits) then `npm run db:seed:clients` —
   confirm 4 new accounts + varied profiles/histories land correctly.
2. `npx tsc --noEmit` / `npx eslint .` clean, `npx vite build` succeeds.
3. As coach: `/coach` sidebar shows Clients/Products/Training normally and
   Dashboard/Subscriptions/Schedules under a dimmed "Uncompleted" group, still
   clickable. `/coach/clients` shows all 5 real clients with correct current-
   split/progress per the seeded variety above. Open Jordan Ellis's detail
   page — edit profile fields including a new profile picture upload (no
   broken-image flash), confirm it saves and re-renders. Assign a new split
   with a future start date to Casey Brooks, confirm it becomes "current" and
   shows "Upcoming" / 0% until that date. Confirm Morgan Blake's detail page
   renders cleanly with all-empty state (no crashes on null profile/empty
   history).
4. Confirm `assignSplitFn`/`updateClientProfileFn` reject a `clientId` that
   isn't an actual `role: "client"` user (defense-in-depth, matches the
   coach-scoping pattern used elsewhere).
