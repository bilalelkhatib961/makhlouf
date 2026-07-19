import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCoachDietPlansFn, getCoachFoodsFn, getCoachMealsFn } from "@/diet/functions";
import { FoodsTab } from "@/components/coach/FoodsTab";
import { MealsTab } from "@/components/coach/MealsTab";
import { DietPlansTab } from "@/components/coach/DietPlansTab";

export const Route = createFileRoute("/coach/diet")({
  component: DietPage,
});

function DietPage() {
  const foodsQuery = useQuery({
    queryKey: ["coach", "foods"],
    queryFn: () => getCoachFoodsFn(),
  });
  const mealsQuery = useQuery({
    queryKey: ["coach", "meals"],
    queryFn: () => getCoachMealsFn(),
  });
  const dietPlansQuery = useQuery({
    queryKey: ["coach", "dietPlans"],
    queryFn: () => getCoachDietPlansFn(),
  });

  const foods = foodsQuery.data ?? [];
  const meals = mealsQuery.data ?? [];
  const dietPlans = dietPlansQuery.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Programming"
        title="Diet."
        description="Food, meals, and the diet plans built from them."
      />

      <Tabs defaultValue="food">
        <TabsList>
          <TabsTrigger value="food">Food</TabsTrigger>
          <TabsTrigger value="meals">Meals</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>
        <TabsContent value="food" className="mt-6">
          <FoodsTab foods={foods} isLoading={foodsQuery.isLoading} />
        </TabsContent>
        <TabsContent value="meals" className="mt-6">
          <MealsTab meals={meals} isLoading={mealsQuery.isLoading} />
        </TabsContent>
        <TabsContent value="plans" className="mt-6">
          <DietPlansTab dietPlans={dietPlans} meals={meals} isLoading={dietPlansQuery.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
