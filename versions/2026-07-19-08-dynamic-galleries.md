# Dynamic Galleries (coach-managed, multi-gallery switcher, no more per-image captions)

## Context

`/gallery` and the landing page's gallery section both render the exact same hardcoded
`src/components/sections/Gallery.tsx` — 5 bundled images with a `tag`/`title` text caption baked
onto each one, no coach control at all. The user wants this turned into a real, coach-managed
feature: multiple named galleries (mirrors how Collections group products), a subset flagged to
show on the landing page (exactly the `showOnLandingPage` pattern Collections already uses), the
per-image caption text removed, and a way for a visitor to switch between whichever gallery is
active and page through that gallery's images.

This is architecturally almost identical to the Collections feature already built
(`src/products/collections.server.ts` / `CollectionFormDialog.tsx` / `Collections.tsx` +
`collectionsQuery(scope)`), just for images instead of products, and simpler (no cross-reference
to another collection — a gallery's images live directly on the gallery document, there's no
separate "photo" entity to CRUD independently).

## Data model (one new MongoDB collection)

```ts
// galleries
{
  _id: ObjectId;
  name: string;
  description: string;          // optional, shown as a subtitle when present
  images: Array<{ url: string }>;  // order = display order — no per-image tag/title anymore
  showOnLandingPage: boolean;   // gates `/` only — `/gallery` always shows every gallery
  createdAt: Date;
  updatedAt: Date;
}
```

No referential integrity needed on delete — nothing else references a gallery.

## Server layer (`src/galleries/`, mirrors `src/products/collections.server.ts`)

- `types.ts`: `GalleryImage { url }`, `Gallery { id, name, description, images, showOnLandingPage }`
  (one shape suffices for both admin and public — there's no sensitive field to strip, unlike
  products' `basePrice`).
- `galleries.server.ts`: `listGalleriesAdmin()`, `listGalleriesPublic(onlyLandingPage: boolean)`,
  `createGallery`, `updateGallery`, `deleteGallery` — same CRUD shape as `categories.server.ts`.
- `upload.server.ts`: `saveGalleryImage(file)`, thin wrapper over the existing generic
  `saveAsset(file, "galleries", IMAGE_MIMES)` from `src/lib/upload.server.ts` — zero new upload
  infrastructure needed.
- `functions.ts`: `getPublicGalleriesFn` (public, no `coachMiddleware` — mirrors
  `getPublicCollectionsFn`), `getCoachGalleriesFn`, `createGalleryFn`, `updateGalleryFn`,
  `deleteGalleryFn`, `uploadGalleryImageFn` (rest all `coachMiddleware`).
- `queries.ts`: `galleriesQuery(scope: "landing" | "gallery")` — a `queryOptions()` factory keyed
  by scope, identical shape to `src/products/queries.ts`'s `collectionsQuery(scope)`, so
  `index.tsx`/`gallery.tsx` can both `ensureQueryData` it in their route `loader` (same pattern
  `shop.tsx` already uses for `collectionsQuery("shop")`).

## Coach CMS UI

- **`/coach/galleries`** (new route, `src/routes/coach/galleries.tsx`): a single page, no tabs
  needed (one entity, no sub-hierarchy) — table (cover thumbnail = first image, name, image count,
  "On Landing Page" badge, actions) + **Add Gallery** button, same list-page shape as
  `CollectionsTab.tsx`. Nav item added to `coach.tsx`'s `NAV_ITEMS` (real, not "Uncompleted"),
  placed after Diet — `Images` icon from `lucide-react`.
- **`GalleryFormDialog.tsx`**: name, description (`Textarea`), "show on landing page" (`Switch`,
  same as `CollectionFormDialog.tsx`), and a multi-image uploader — a fresh, simpler sibling of
  `ExerciseAssetFields.tsx`: no "type" (images only) and no "primary" flag (galleries don't need
  one — the first image is simply the implicit cover), just add-multiple / remove-one / blob-preview
  same as every other upload flow in this app. Built inline in the dialog rather than as a shared
  component, following the precedent `ExerciseAssetFields` set (fresh small component beats
  over-generalizing an existing one with a different shape).

## Public-facing: rewrite `src/components/sections/Gallery.tsx`

- Takes a `scope: "landing" | "gallery"` prop (exactly like `Collections`), fetches
  `galleriesQuery(scope)`.
- **Gallery switcher**: when more than one gallery is in scope, a row of pill buttons (hand-rolled,
  matching the site's existing uppercase-tracking label language — not the shadcn `Tabs` component,
  which is a dashboard-only primitive never used on the public site) lets the visitor pick which
  gallery is "active"; defaults to the first. The horizontal image scroller renders only the active
  gallery's images. `/` only ever fetches the 2 landing-flagged galleries (scope="landing"), so the
  switcher there toggles between exactly those 2; `/gallery` fetches every gallery.
- **Captions removed**: the per-image bottom-gradient `tag`/`title` overlay is deleted entirely —
  images render clean, keeping the existing hover-scale/grayscale treatment.
- **Lightbox gets prev/next**: currently the lightbox just shows a static enlarged image with a
  close button, no navigation. Track the open image by *index* within the active gallery's images
  array (not just a URL string) so `ChevronLeft`/`ChevronRight` buttons (already imported, already
  used for the horizontal-scroll controls) can step through it — this is the concrete
  "switch between gallery images" ask. Add a `keydown` listener (left/right arrow keys) while the
  lightbox is open as a natural extension of the same feature, closing on `Escape` too (was
  previously only closable by clicking the backdrop/button).
- `index.tsx`: loader gains `context.queryClient.ensureQueryData(galleriesQuery("landing"))`
  alongside the existing `collectionsQuery("landing")` call; renders `<Gallery scope="landing" />`.
- `src/routes/gallery.tsx`: loader gains `ensureQueryData(galleriesQuery("gallery"))` (mirrors
  `shop.tsx`'s pattern exactly); renders `<Gallery scope="gallery" />`.
- Empty state: mirrors `Collections.tsx`'s "No products available yet" — if the scoped gallery list
  is empty (and not loading), render a short "No galleries yet — check back soon." message instead
  of the section.

## Seed data

New `scripts/seed-galleries.ts` (`npm run db:seed:galleries`): creates 4 galleries with different
names — e.g. "Strength Sessions", "Conditioning & Cardio", "Physique Progress", "Combat Training" —
reusing the bundled `gallery-1.jpg`…`gallery-5.jpg` (plus `hero-athlete.jpg`/`portrait.jpg` for
extra variety) as placeholder images copied into `public/uploads/galleries/`, same trick
`seed-catalog.ts` established. Exactly 2 of the 4 get `showOnLandingPage: true`. Demo data, cleared
and reinserted fresh every run (same reasoning as `seed-training.ts`'s exercises/splits — simplest
to fully replace on schema changes rather than migrate in place; there's no cross-script dependency
on gallery names from anywhere else, so no idempotent name-matching needed here).

## Docs

`CLAUDE.md`: new "Galleries" section (mirrors "Products & Catalog"'s structure) covering the data
model, the scope-based public query, the switcher/lightbox UX, and the seed script. Move Galleries
out of anywhere it might be implied "static" in the "Current status" built-list. Approved plan
archived to `versions/2026-07-19-08-dynamic-galleries.md`.

## Verification

1. `npm run db:seed:galleries` — confirm 4 galleries land, exactly 2 flagged for landing.
2. `npx tsc --noEmit` / `npx eslint .` clean, `npx vite build` succeeds.
3. As coach: create a gallery with several uploaded images (confirm no broken-image flash), toggle
   "show on landing page", delete an image from an existing gallery, delete a whole gallery.
4. As guest: `/` shows only the 2 landing-flagged galleries with a switcher between them; `/gallery`
   shows all 4 with a switcher; images render with no caption text; opening the lightbox and using
   the arrow buttons (and arrow keys) correctly steps through the active gallery's images and wraps
   or stops sensibly at the ends; `Escape` closes it.
5. Confirm `/coach` sidebar shows "Galleries" pointing at `/coach/galleries`.
