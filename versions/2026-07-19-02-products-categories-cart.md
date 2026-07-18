# Dynamic Products/Categories CMS (tabbed) + public shop + cart

> Archived plan — implemented this session, then partially superseded by
> `2026-07-19-03-per-variant-pricing-fixes.md` (pricing/stock/assets moved from product-level to
> per-variant). See `CLAUDE.md` for the current-state description; this file is a point-in-time
> record kept for re-tracking.

## Context

`/coach/products` and `/coach/categories` were two separate pages backed by hardcoded arrays, and the public shop (`Products.tsx`, used on both `/` and `/shop`) was also a hardcoded array. Goal: one merged `/coach/products` page with Products/Categories tabs, backed by real MongoDB data with full CRUD (create/edit/delete, image upload), the public shop rendering that same live data with a product-detail dialog, and a functional cart (add/edit/remove — explicitly **no checkout**).

## Data model (two new MongoDB collections, as first built)

```ts
// categories
{ _id: ObjectId, name: string, createdAt: Date, updatedAt: Date }

// products (original shape — since revised, see plan 03)
{
  _id: ObjectId,
  categoryId: ObjectId,
  title: string,
  description: string,
  basePrice: number,      // cost price — coach-only
  sellingPrice: number,   // list price shown to guests
  discount: number,       // 0-100
  quantity: number,       // stock — not tracked per-variant
  assets: Array<{ url: string; type: "image" | "file" | "video"; isPrimary: boolean }>,
  variants: Array<{ name: string; options: string[] }>,  // option axes, e.g. Size: [S,M,L]
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

## Image upload — local filesystem, no new service

`public/uploads/products/` — Vite serves `publicDir` at `/` in dev and copies it into `dist/client` on build, which nitro's configured `publicDir` already points at. A `FormData`-accepting server function writes the file with a `crypto.randomUUID()` name and returns `{ url, type }`. Restricted to image mimetypes.

## Server-side structure

`src/products/` (mirrors `src/auth/`'s `.server.ts`-suffix / no-`server`-directory convention):
`types.ts`, `categories.server.ts`, `products.server.ts` (public vs. admin read projections),
`upload.server.ts`, `functions.ts`. `src/auth/middleware.server.ts` gained `coachMiddleware`
(composes `authMiddleware` + a role check), applied to every mutating function.

## Coach CMS: merged tabbed page

`src/routes/coach/products.tsx` (replaces the old static products page + deleted
`categories.tsx`), shadcn `Tabs`, TanStack Query + `useMutation`/`invalidateQueries`.
`react-hook-form` + `zod` for the product form's scalar fields; assets/variants as local
component state.

## Public shop + cart

`Products.tsx` dynamic via `useQuery`; `ProductQuickView.tsx` dialog with variant pickers.
Cart: pure client state (`src/cart/CartContext.tsx`, Context + `localStorage`, guests can use it),
`CartSheet.tsx` slide-over, disabled "Checkout" button.

## Seed data

`scripts/seed-catalog.ts` — 4 categories, 6 products, copies `src/assets/product-*.jpg` into
`public/uploads/products/`.

## What was explicitly out of scope

Checkout/payment, order records, per-variant stock tracking, deleting uploaded files from disk on
removal, cross-tab/cross-session live sync.
