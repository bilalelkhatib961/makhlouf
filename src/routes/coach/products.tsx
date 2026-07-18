import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCoachCategoriesFn,
  getCoachCollectionsFn,
  getCoachProductsFn,
} from "@/products/functions";
import { ProductsTab } from "@/components/coach/ProductsTab";
import { CategoriesTab } from "@/components/coach/CategoriesTab";
import { CollectionsTab } from "@/components/coach/CollectionsTab";

export const Route = createFileRoute("/coach/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const categoriesQuery = useQuery({
    queryKey: ["coach", "categories"],
    queryFn: () => getCoachCategoriesFn(),
  });
  const productsQuery = useQuery({
    queryKey: ["coach", "products"],
    queryFn: () => getCoachProductsFn(),
  });
  const collectionsQuery = useQuery({
    queryKey: ["coach", "collections"],
    queryFn: () => getCoachCollectionsFn(),
  });

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const collections = collectionsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Storefront"
        title="Products."
        description="What's live in the shop — organized by category, with real inventory."
      />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductsTab
            products={products}
            categories={categories}
            isLoading={productsQuery.isLoading}
          />
        </TabsContent>
        <TabsContent value="categories" className="mt-6">
          <CategoriesTab
            categories={categories}
            products={products}
            isLoading={categoriesQuery.isLoading}
          />
        </TabsContent>
        <TabsContent value="collections" className="mt-6">
          <CollectionsTab
            collections={collections}
            products={products}
            isLoading={collectionsQuery.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
