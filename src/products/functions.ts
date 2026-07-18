import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { coachMiddleware } from "@/auth/middleware.server";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "./categories.server";
import {
  createCollection,
  deleteCollection,
  listCollectionsAdmin,
  listCollectionsPublic,
  updateCollection,
} from "./collections.server";
import { createProduct, deleteProduct, listProductsAdmin, updateProduct } from "./products.server";
import { saveProductImage } from "./upload.server";

const categoryInputSchema = z.object({ name: z.string().min(1, "Name is required") });

const assetSchema = z.object({
  url: z.string().min(1),
  type: z.enum(["image", "file", "video"]),
  isPrimary: z.boolean(),
});

const variantSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  basePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  discount: z.number().min(0).max(100),
  quantity: z.number().int().min(0),
  isActive: z.boolean(),
  assets: z.array(assetSchema),
});

const productInputSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

const collectionInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  productIds: z.array(z.string().min(1)),
  showOnLandingPage: z.boolean(),
});

// --- Reads (public — no auth, guests browse the shop) ---

export const getPublicCollectionsFn = createServerFn({ method: "GET" })
  .validator(z.object({ onlyLandingPage: z.boolean() }))
  .handler(async ({ data }) => listCollectionsPublic(data.onlyLandingPage));

export const getCoachCategoriesFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => {
    return listCategories();
  });

export const getCoachProductsFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => {
    return listProductsAdmin();
  });

export const getCoachCollectionsFn = createServerFn({ method: "GET" })
  .middleware([coachMiddleware])
  .handler(async () => {
    return listCollectionsAdmin();
  });

// --- Category mutations (coach-only) ---

export const createCategoryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(categoryInputSchema)
  .handler(async ({ data }) => createCategory(data));

export const updateCategoryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: categoryInputSchema }))
  .handler(async ({ data }) => updateCategory(data.id, data.input));

export const deleteCategoryFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteCategory(data.id));

// --- Product mutations (coach-only) ---

export const createProductFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(productInputSchema)
  .handler(async ({ data }) => createProduct(data));

export const updateProductFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: productInputSchema }))
  .handler(async ({ data }) => updateProduct(data.id, data.input));

export const deleteProductFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteProduct(data.id));

// --- Collection mutations (coach-only) ---

export const createCollectionFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(collectionInputSchema)
  .handler(async ({ data }) => createCollection(data));

export const updateCollectionFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1), input: collectionInputSchema }))
  .handler(async ({ data }) => updateCollection(data.id, data.input));

export const deleteCollectionFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => deleteCollection(data.id));

// --- Asset upload (coach-only) ---

export const uploadProductAssetFn = createServerFn({ method: "POST" })
  .middleware([coachMiddleware])
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Expected a file field named 'file'");
    return file;
  })
  .handler(async ({ data: file }) => saveProductImage(file));
