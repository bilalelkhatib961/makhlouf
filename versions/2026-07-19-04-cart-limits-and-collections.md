# Cart stock limits, discount preview, default variant selection, Collections

## Context

Four follow-up asks after the per-variant pricing rework:

1. **Cart quantity steppers must respect real stock**, whether add-to-cart happens from the shop
   card, the quick-view dialog, or the cart drawer itself — and must account for how much of that
   exact variant is *already* in the cart, not just the raw stock number.
2. **Coach should see the computed post-discount price** while editing a variant, not just the raw
   discount percentage.
3. **The quick-view dialog should default to a real, named variant** instead of forcing the guest
   to open a "Choose a variant" placeholder before seeing anything concrete. The coach already has
   a `name` field per variant (added last session for exactly this); the gap is that the dialog
   currently *requires* an explicit choice before showing/enabling anything.
4. **New "Collections" concept**: the coach names a collection, writes a description, picks which
   products belong to it, and flags whether it shows on the landing page (`/`). `/shop` shows every
   collection that exists. The existing hardcoded "Built for the grind." / "Gear, fuel, and
   programs we actually use. Curated. Tested. Minimal." section in `Products.tsx` is explicitly
   called out as the template — it becomes the *first seeded collection*, and the component that
   renders it becomes collection-driven instead of a single static section.

## 1. Stock-aware cart quantity limits

Cart items don't currently know the variant's stock ceiling, so nothing can bound the steppers.
`CartItem`/`addItem` (`src/cart/CartContext.tsx`) gain `maxQuantity: number` — a snapshot of
`variant.quantity` taken at add-time (not a live lookup; the cart is guest-usable client state with
no server round-trip, and there's no checkout yet to reconcile against real-time stock anyway).
`addItem` clamps to `maxQuantity` both on insert and when merging into an existing line.

- **`ProductQuickView.tsx`**: compute `alreadyInCart` by looking up the cart line for
  `(product.id, displayVariant.id)`; `remainingStock = displayVariant.quantity - alreadyInCart`.
  The qty stepper's `+` disables at `quantity >= remainingStock`, `-` disables at `quantity <= 1`.
  Pass `maxQuantity: displayVariant.quantity` on add.
- **`Products.tsx`** card quick-add (single-variant products only): disable the "Add" button once
  `alreadyInCart >= variant.quantity` (can't add more than exists).
- **`CartSheet.tsx`**: `+` disables at `item.quantity >= item.maxQuantity`; `-` disables at
  `item.quantity <= 1` (no more auto-remove-at-zero via the stepper — the trash icon is the
  explicit removal action now, so decrementing to 0 via `-` is no longer how you remove a line).

## 2. Coach sees the discounted price live

`ProductVariantFields.tsx` — next to the Discount % field, a small read-only line:
`Price after discount: $X.XX`, computed from the variant's own `sellingPrice`/`discount` state on
every render (no new state, just a derived display).

## 3. Quick-view defaults to a named variant

`ProductQuickView.tsx`'s reset effect currently sets `selectedVariantId` only when there's exactly
one variant, forcing a manual choice otherwise. Change: always pick a sensible default — the first
*in-stock* variant, falling back to the first variant overall if every variant is sold out — so the
`Select` shows a real name (or the cheapest one) immediately and "Add to Cart" is actionable right
away. The guest can still reopen the dropdown and pick a different variant. This removes
`needsVariantChoice`/"Choose a Variant" placeholder-forcing entirely; drop that state and the
associated button-text branch.

## 4. Collections

### Data model (new `collections` MongoDB collection)

```ts
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

### Server layer

`src/products/collections.server.ts` (same pattern as `categories.server.ts`):
`listCollectionsAdmin` (raw, all collections, for the coach table + edit-dialog prefill),
`listCollectionsPublic(onlyLandingPage: boolean)` — calls the existing `listProductsPublic()` once,
builds an id→product map, and for each qualifying collection maps `productIds` through that map
(preserving collection order, silently dropping ids that no longer resolve to an active product),
`createCollection`/`updateCollection`/`deleteCollection`. `src/products/functions.ts` gains
`getPublicCollectionsFn` (validator `{ onlyLandingPage: boolean }`, no auth) and the four
coach-only CRUD RPCs (`coachMiddleware`, same as products/categories).

`getPublicProductsFn`/`publicProductsQuery` become unused once `Products.tsx` is rewritten to be
collection-driven (nothing else calls the "all active products, ungrouped" shape) — removing them
rather than leaving dead code. `listProductsPublic()` itself stays, now consumed internally by
`listCollectionsPublic`.

### Coach CMS: third tab

`src/routes/coach/products.tsx`'s `Tabs` gains a third `TabsTrigger`/`TabsContent` — "Collections" —
backed by a new `src/components/coach/CollectionsTab.tsx` + `CollectionFormDialog.tsx` (same
table/dialog/`AlertDialog`-delete shape as `CategoriesTab.tsx`). The dialog: name (Input),
description (Textarea), "Show on landing page" (Switch), and a product picker — a bordered
`max-h-64 overflow-y-auto` list of checkboxes (shadcn `Checkbox`, already installed, unused until
now) over the coach's full product list (`getCoachProductsFn`, already fetched by the parent page)
— simplest fit for a moderate catalog size, no new combobox dependency needed.

### Public rendering — `Products.tsx` → `Collections.tsx`

Renamed (it stops rendering "all products in one grid" and starts rendering "each qualifying
collection as its own section") and takes a `scope: "landing" | "shop"` prop. Fetches
`getPublicCollectionsFn({ data: { onlyLandingPage: scope === "landing" } })` via a `collectionsQuery(scope)`
query-options factory in `src/products/queries.ts` (mirrors the removed `publicProductsQuery`
but keyed by scope), maps over the result rendering one section per collection — each section is
today's existing header/scroller/card markup verbatim, just parametrized by
`collection.name`/`collection.description`/`collection.products` instead of the hardcoded
"Built for the grind." copy, with its own scroll ref (extracted into a small `CollectionSection`
subcomponent so multiple sections don't fight over one ref). `src/routes/index.tsx` and
`src/routes/shop.tsx` update their `loader`s to `ensureQueryData(collectionsQuery("landing"))` /
`("shop")` respectively (same SSR-prefetch pattern as before, just re-keyed), and their JSX passes
the matching `scope` prop.

### Seed data

`scripts/seed-catalog.ts` additionally seeds one collection — name "Built for the grind.",
description "Gear, fuel, and programs we actually use. Curated. Tested. Minimal.", every seeded
product's id, `showOnLandingPage: true` — matching the exact example called out in the request.
`collections.deleteMany({})` at the start alongside the existing `products.deleteMany({})`, same
full-replace-on-reseed approach.

### Known limitation (documented, not silently dropped)

A product that isn't included in any collection won't appear on `/` or `/shop` anymore — the public
site is now collection-driven rather than "every active product, always visible." Not asked to
build a fallback "uncategorized" section, so not adding one; noted in `CLAUDE.md` so it reads as a
deliberate scope boundary, not a bug, next time someone notices a product missing from the shop.

## Files touched

`src/cart/CartContext.tsx`, `src/components/CartSheet.tsx`, `src/components/ProductQuickView.tsx`,
`src/components/coach/ProductVariantFields.tsx`, `src/products/types.ts`,
`src/products/collections.server.ts` (new), `src/products/functions.ts`, `src/products/queries.ts`,
`src/components/coach/CollectionsTab.tsx` (new), `src/components/coach/CollectionFormDialog.tsx`
(new), `src/routes/coach/products.tsx`, `src/components/sections/Products.tsx` → renamed
`Collections.tsx` (+ new `CollectionSection.tsx` subcomponent), `src/routes/index.tsx`,
`src/routes/shop.tsx`, `scripts/seed-catalog.ts`, `CLAUDE.md`.

## Verification

1. `npm run db:seed:catalog` — confirm the "Built for the grind." collection is created referencing
   all 6 products
2. `npx tsc --noEmit` / `npx eslint .` clean, `npx vite build` succeeds
3. As guest: add 2 of a 3-in-stock variant from the shop card, open quick-view for the same
   product, confirm the qty stepper caps at 1 remaining (3 stock − 2 already in cart); confirm `+`
   in the cart drawer disables at the stock ceiling and `-` disables at 1 (not auto-removing)
4. Open quick-view for a multi-variant product — confirm a real variant name shows immediately
   (no forced placeholder) and "Add to Cart" is enabled right away
5. As coach: edit a variant, confirm the discount-adjusted price updates live as you type; create a
   collection with 2 products and "Show on landing page" on, confirm it appears on `/`; create a
   second collection with landing off, confirm it appears on `/shop` but not `/`
6. Archive this plan to `versions/2026-07-19-04-cart-limits-and-collections.md` per the standing
   convention in `CLAUDE.md`, and update `CLAUDE.md`'s data model / current-status sections
