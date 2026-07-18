export type AssetType = "image" | "file" | "video";

export interface ProductAsset {
  url: string;
  type: AssetType;
  isPrimary: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface ProductVariantPublic {
  id: string;
  name: string;
  sellingPrice: number;
  discount: number;
  quantity: number;
  assets: ProductAsset[];
}

export interface ProductVariantAdmin extends ProductVariantPublic {
  basePrice: number;
  isActive: boolean;
}

export interface ProductPublic {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  variants: ProductVariantPublic[];
}

export interface ProductAdmin {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  variants: ProductVariantAdmin[];
}

export interface CategoryInput {
  name: string;
}

export interface ProductVariantInput {
  id: string;
  name: string;
  basePrice: number;
  sellingPrice: number;
  discount: number;
  quantity: number;
  isActive: boolean;
  assets: ProductAsset[];
}

export interface ProductInput {
  categoryId: string;
  title: string;
  description: string;
  variants: ProductVariantInput[];
}

export interface CollectionPublic {
  id: string;
  name: string;
  description: string;
  products: ProductPublic[];
}

export interface CollectionAdmin {
  id: string;
  name: string;
  description: string;
  productIds: string[];
  showOnLandingPage: boolean;
}

export interface CollectionInput {
  name: string;
  description: string;
  productIds: string[];
  showOnLandingPage: boolean;
}
