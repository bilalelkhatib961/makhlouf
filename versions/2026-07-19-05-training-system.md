# Training system (Muscle Groups, Muscle Categories, Exercises, Splits) — coach-only

## Context

The coach CMS's "Exercises" page is currently a static dummy table. The user wants it replaced
with a real, interconnected training-management system — the same tabbed-page pattern already
proven with Products/Categories/Collections — covering four entities:

1. **Muscle groups** (leaf-level, e.g. "Biceps — Long Head", "Rear Delt")
2. **Muscle categories** (group the muscle groups, e.g. "Arms" contains both biceps heads)
3. **Exercises** (target one muscle group, carry image/video media)
4. **Splits** (a weekly training program, e.g. "Push Pull Legs Arms" — assigns exercises with
   sets/reps to specific weekdays)

This round is **coach-authoring only** — no client-facing assignment, no workout-history/"set
completed" tracking. The user explicitly flagged those as a later phase and said to just keep them
in mind, not build them now.

## Naming

"Exercises" → **"Training"** in the coach nav (`/coach/exercises` → `/coach/training`) — it's the
better umbrella term now that the page covers muscle groups/categories/exercises/splits as one
system, not just a flat exercise list. Tab order follows the user's own dependency-ordered
enumeration (groups → categories → exercises → splits), which also happens to be the natural setup
order for a coach starting from scratch.

## Data model (four new MongoDB collections)

```ts
// muscleGroups
{ _id: ObjectId; name: string; image?: string; createdAt: Date; updatedAt: Date; }

// muscleCategories
{ _id: ObjectId; name: string; image?: string; muscleGroupIds: ObjectId[]; createdAt: Date; updatedAt: Date; }
// category → picks its groups, same relationship shape as Collection → Products (a picker of
// checkboxes over existing muscle groups) — reuses a UX pattern you're already used to.

// exercises
{
  _id: ObjectId;
  name: string;
  description: string;        // optional in the form — not explicitly requested, but a "how to
                               // perform it" note is cheap and matches the Product description
                               // precedent; leave blank if not needed
  muscleGroupId: ObjectId;     // single group, per "assign it to short head biceps"
  assets: Array<{ url: string; type: "image" | "video"; isPrimary: boolean }>;
  createdAt: Date;
  updatedAt: Date;
}

// splits
{
  _id: ObjectId;
  name: string;
  description: string;         // optional
  durationWeeks: number;       // "split duration" — read as program length in weeks
  days: Array<{
    day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
    label: string;             // optional day label, e.g. "Push Day" — your own examples name
                                // each day this way, so it's a natural field to add
    exercises: Array<{ exerciseId: ObjectId; sets: number[] }>;
    // sets = one entry per set, each value is that set's target rep count, e.g. [12, 10, 8] = 3
    // sets. An empty `exercises` array *is* the rest day — no separate boolean needed.
  }>;                           // always exactly 7 entries, Monday–Sunday
  createdAt: Date;
  updatedAt: Date;
}
```

Deliberately **not** building yet (per your "later on" framing): a per-set "completed" checkbox,
per-client split assignment, or client-facing weight/rep history — those belong to the client-side
workout-log phase, not the split template itself.

**Referential integrity** (matches the existing Category→Product delete-block pattern):
deleting a muscle group is blocked if any exercise or muscle category still references it; deleting
an exercise is blocked if any split still references it.

## Media upload: generalizing beyond images

Exercises need image **and video** uploads, but `src/products/upload.server.ts` currently hardcodes
image-only mimetypes and an `"image"` asset type. Rather than duplicate the disk-write logic:
- New `src/lib/assets.ts` — shared `AssetType`/`Asset` shape (currently duplicated as
  `ProductAsset` in `src/products/types.ts`); that file re-exports `Asset` as `ProductAsset` so
  every existing product/variant import keeps working unchanged.
- New `src/lib/upload.server.ts` — generic `saveAsset(file, folder, allowedMimeMap)` doing the
  actual mkdir/randomUUID/writeFile work.
- `src/products/upload.server.ts`'s `saveProductImage` becomes a thin wrapper calling
  `saveAsset(file, "products", IMAGE_MIMES)` — same signature, same behavior, zero risk to the
  already-verified product upload flow.
- New `src/training/upload.server.ts` exports `saveExerciseAsset(file)` calling
  `saveAsset(file, "exercises", IMAGE_AND_VIDEO_MIMES)`.

For the coach's exercise-asset picker, I'll build a fresh, standalone component rather than
extracting/refactoring `ProductVariantFields.tsx`'s existing inline blob-preview upload logic —
same technique (immediate `URL.createObjectURL` preview, swapped for the real URL once upload
resolves, so this domain doesn't inherit last round's "broken until save" bug either), but kept
separate to avoid touching already-verified, working product code for a same-day feature.

## Server layer (`src/training/`, mirrors `src/products/`)

`types.ts`, `muscle-groups.server.ts`, `muscle-categories.server.ts`, `exercises.server.ts`,
`splits.server.ts`, `upload.server.ts`, `functions.ts`. Every RPC uses `coachMiddleware` (from
`src/auth/middleware.server.ts`, already built) — nothing here is public yet, so no split between
public/admin reads like products needed.

## Coach CMS UI

`src/routes/coach/training.tsx` (new, replaces deleted `coach/exercises.tsx`); `src/routes/coach.tsx`'s
nav entry updates label + path. Same `Tabs` + per-tab `useQuery` + `useMutation`/`invalidateQueries`
pattern as `coach/products.tsx`.

- **Muscle Groups tab**: table (image thumbnail, name, actions) + dialog (name, single-image
  picker — simpler than the array-based product/exercise uploader since a group has one image).
- **Muscle Categories tab**: table (image, name, group count, actions) + dialog (name, image,
  checkbox list of muscle groups — same shape as `CollectionFormDialog.tsx`'s product picker).
- **Exercises tab**: table (primary asset thumbnail, name, muscle group, asset count, actions) +
  dialog (name, description, muscle group `Select`, asset uploader supporting image+video with
  primary selection — mirrors `ProductVariantFields.tsx`'s asset UI, adapted for the new fresh
  component described above).
- **Splits tab**: table (name, duration, active-day count, total exercises, actions) + dialog
  (name, description, duration-in-weeks, then a shadcn `Accordion` — one item per weekday, already
  installed and unused until now — each expandable to a label input + a repeatable list of
  "exercise + reps-per-set" rows; reps entered as a comma-separated list like "12,10,8", parsed to
  `number[]` on submit, consistent with how variant option-lists were parsed earlier in this
  project). Keeping all 7 days behind an accordion is what keeps this, the most complex form in the
  app, manageable on screen.

## Seed data

Add a `scripts/seed-training.ts` (npm script `db:seed:training`) so the tabs aren't empty on first
load — a handful of muscle groups/categories, a handful of exercises (reusing the existing seeded
product photos as placeholder images, same trick `seed-catalog.ts` used), and one seeded split
("Push Pull Legs Arms") assigning a few of them across the week — demonstrating the exact flow
described in the request end-to-end.

## Docs

`CLAUDE.md`: new "Training" section (mirroring "Products & Catalog"'s structure) documenting the
data model, the upload generalization, and the explicit "client-facing assignment/history is a
later phase" boundary. Approved plan archived to
`versions/2026-07-19-05-training-system.md` per the standing convention.

## Verification

1. `npm run db:seed:training` — confirm groups/categories/exercises/a split land correctly
2. `npx tsc --noEmit` / `npx eslint .` clean, `npx vite build` succeeds
3. As coach: create a muscle group with an image; create a category and assign that group to it;
   create an exercise with an uploaded image *and* video, assign the muscle group, confirm the new
   video asset previews immediately (no broken-media flash, same fix as the product upload bug);
   create a split, expand Monday, add the exercise with reps "12,10,8", leave another day empty
   (rest), save, reopen to confirm everything round-trips
4. Confirm delete is blocked with a clear message when: deleting a muscle group still referenced by
   an exercise or category; deleting an exercise still referenced by a split
5. Confirm `/coach` sidebar shows "Training" (not "Exercises") pointing at `/coach/training`
