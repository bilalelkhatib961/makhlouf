# Per-variant pricing/stock/assets + UX fixes (product cards, cart auto-open, upload preview bug)

## Context

Follow-up correction after the products/categories/cart feature shipped. Four asks:

1. **Product cards should be fully clickable** (not just the small eye icon), and every button
   site-wide should show a pointer cursor — browsers default `<button>` to `cursor: default`,
   unlike `<a>`, so none of the hand-rolled buttons in this app currently look clickable on hover.
2. **Pricing/stock/media/active-state are currently global per product, but need to be per
   variant.** Right now `basePrice`/`sellingPrice`/`discount`/`quantity`/`isActive`/`assets` live
   on the product document, and `variants` is just a list of option *axes* (`{name:"Size",
   options:["S","M","L"]}`) with no price/stock/image data of their own. The user wants each
   variant (e.g. each size, each color) to carry its own price, stock, active flag, and photos —
   because a supplement might have one simple SKU while a hoodie needs a different price/stock
   per size. This is a real data-model correction, not additive — the old "option axes" concept
   goes away.
3. **Newly uploaded images render broken until the product is saved and the edit dialog is
   reopened.** Root cause: the `<img>` tag is pointed straight at the freshly-returned
   `/uploads/products/<uuid>.jpg` server URL, and something in the dev pipeline (Vite's static
   `public/` serving vs. the file only just having been `writeFile`'d) doesn't reliably serve that
   exact URL on the very first request. Existing (already-saved) images are unaffected because
   they're old enough to be reliably served. Fixing the per-variant asset UI (item 2) is the
   natural place to also fix this: render an in-browser `URL.createObjectURL(file)` preview
   immediately on selection and never swap it for the server URL within that dialog session — this
   sidesteps the race entirely rather than chasing its exact cause in the dev server.
4. **Adding to cart should auto-open the cart drawer** as confirmation, from both the shop card's
   quick-add and the quick-view dialog's "Add to Cart".

## Data model change

```ts
// products collection — was: { ...fields..., basePrice, sellingPrice, discount, quantity, assets, variants: {name,options[]}[], isActive }
{
  _id: ObjectId;
  categoryId: ObjectId;
  title: string;
  description: string;
  variants: Array<{
    id: string;            // app-generated stable string (crypto.randomUUID()), not a Mongo ObjectId — embedded, not a separate collection
    name: string;          // coach label, e.g. "M", "Black / L" — "" is valid for a single-SKU product
    basePrice: number;     // coach-only
    sellingPrice: number;
    discount: number;      // 0-100
    quantity: number;
    isActive: boolean;
    assets: Array<{ url: string; type: "image" | "file" | "video"; isPrimary: boolean }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

- **At least one variant is always required** — a "simple" product (no real option axes) is just a
  product with exactly one variant, name optional/blank. This replaces the old "variants: []" empty
  case.
- **No more product-level `isActive`.** A product's public visibility is derived: it appears if and
  only if it has ≥1 active variant, and only the active variants are shown/purchasable. This is a
  deliberate removal, not an oversight — matches "linked to each variant and not global."
- Public reads (`listProductsPublic`) filter to `isActive: true` variants only and drop `basePrice`
  (same cost-hiding rule as before, now applied per-variant); admin reads return everything.

## Files

**`src/products/types.ts`** — replace `ProductVariantGroup`/flat product fields with
`ProductVariant` (full shape above) and `ProductVariantPublic`/`ProductVariantAdmin` (the
basePrice/isActive split), nested under `ProductPublic.variants` / `ProductAdmin.variants`.

**`src/products/products.server.ts`** — `ProductDoc` loses the flat pricing/asset/active fields,
gains `variants: VariantDoc[]`. `listProductsPublic` queries `{"variants.isActive": true}` and maps
each product's `variants` down to the active subset (stripping `basePrice`/`isActive`); products
left with zero variants after filtering are excluded. `createProduct`/`updateProduct` just persist
the submitted `variants` array as-is — removing a variant from the array on update is enough to
delete it, no special-case needed.

**`src/products/functions.ts`** — `productInputSchema` nests a `variants: z.array(variantSchema).min(1, ...)` instead of flat scalar fields.

**`src/components/coach/ProductFormDialog.tsx`** — drop `react-hook-form` for this form (the
per-variant dynamic arrays with async upload state fit plain `useState` + a manual submit-time
check better than RHF's field-array API for this shape; `title`/`description`/`categoryId` become
plain controlled inputs, matching how `CategoriesTab.tsx` already does its simpler form). Variants
render via a new **`src/components/coach/ProductVariantFields.tsx`** (one block per variant:
name, base/selling price, discount, quantity, active switch, its own image uploader, remove
button disabled when it's the last one). New variant image uploads use the blob-preview technique
from item 3 above (`URL.createObjectURL` shown immediately and never replaced; the real
`/uploads/...` URL is only used in the payload sent on Save). Save is disabled while any asset is
mid-upload.

**`src/components/coach/ProductsTab.tsx`** — table adapts to multiple variants: price shows a
single value or a `$min – $max` range, quantity is the sum across variants, the status badge
reflects "at least one active variant," and a small variant-count indicator is added.

**Public shop** (`src/components/sections/Products.tsx`, `src/components/ProductQuickView.tsx`):
- Card price = min active-variant price (prefixed "From" when >1 variant); card image = primary
  asset of the cheapest/first active variant; "Sold Out" when every variant's quantity is 0.
- The whole card becomes `onClick`-able (opens quick-view) with `cursor-pointer`; the "Add" and
  "Eye" buttons call `stopPropagation()` so they don't double-fire the card's own handler.
- Quick "Add" on the card adds directly to cart only when the product has exactly one variant;
  otherwise it opens the quick-view dialog to force a choice (same rule as before, now keyed off
  variant count instead of option-group presence).
- `ProductQuickView` shows a variant picker (`Select` listing each variant's `name`) only when
  there's more than one; picking one swaps the displayed price/stock/images to that variant's own
  data. Adding to cart uses the selected variant's `id`.

**Cart** (`src/cart/CartContext.tsx`, `src/components/CartSheet.tsx`, `src/components/Header.tsx`):
- `CartItem`/`addItem` input replaces `variant?: Record<string,string>` with `variantId: string` +
  `variantName?: string` — line identity (`key`) becomes `` `${productId}__${variantId}` ``, simpler
  than the old sorted-signature scheme since a variant id is already a stable unique SKU reference.
- Cart open/close state moves **into `CartContext`** (`isOpen`, `openCart`, `closeCart`,
  `setCartOpen`) instead of being local `useState` in `Header.tsx` — needed so `Products.tsx` and
  `ProductQuickView.tsx` (neither of which is a descendant of `Header`) can call `cart.openCart()`
  right after `addItem()` for item 4. `CartSheet` reads `isOpen`/`setCartOpen` from `useCart()`
  directly instead of taking `open`/`onOpenChange` props; `Header`'s cart button calls
  `cart.openCart()` and renders `<CartSheet />` with no props.

**`scripts/seed-catalog.ts`** — rewritten to the new shape: `products.deleteMany({})` at the start
(dummy/demo data, safe to fully replace rather than migrate), single-variant entries for the
non-apparel products, four named-size variants (S/M/L/XL) for the two apparel products (same
photo/price across sizes, stock split across them) — preserves the existing discount and
sold-out demo scenarios.

**`src/styles.css`** — already done this turn: `button:not(:disabled), [role="button"]:not([aria-disabled="true"]) { cursor: pointer }` added to `@layer base`, covers every hand-rolled button site-wide without touching each one individually.

**`CLAUDE.md`** — update the "Products & Catalog" data-model snippet to the new per-variant shape.

## Verification

1. `npm run db:seed:catalog` — confirm it clears and reseeds cleanly, apparel products show 4 variants each
2. `npx tsc --noEmit` / `npx eslint .` clean, `npx vite build` succeeds
3. Dev server, as coach: edit a product, add a new variant with a freshly uploaded image — confirm
   it renders immediately (no broken-image flash) without needing to save+reopen; save; confirm the
   products table shows the right price range/total quantity/variant count
4. As guest: confirm shop cards show "From $X" for multi-variant products, whole card is clickable
   with a pointer cursor, quick-view shows a variant picker only when >1 variant exists, adding to
   cart auto-opens the drawer
5. Confirm every button across public/coach/portal shows a pointer cursor on hover (spot-check a
   few pages — this is a global CSS change so one confirmation covers the whole app)
