import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCoachExercisesFn,
  getCoachMuscleCategoriesFn,
  getCoachMuscleGroupsFn,
  getCoachSplitsFn,
} from "@/training/functions";
import { MuscleGroupsTab } from "@/components/coach/MuscleGroupsTab";
import { MuscleCategoriesTab } from "@/components/coach/MuscleCategoriesTab";
import { ExercisesTab } from "@/components/coach/ExercisesTab";
import { SplitsTab } from "@/components/coach/SplitsTab";

export const Route = createFileRoute("/coach/training")({
  component: TrainingPage,
});

function TrainingPage() {
  const muscleGroupsQuery = useQuery({
    queryKey: ["coach", "muscle-groups"],
    queryFn: () => getCoachMuscleGroupsFn(),
  });
  const muscleCategoriesQuery = useQuery({
    queryKey: ["coach", "muscle-categories"],
    queryFn: () => getCoachMuscleCategoriesFn(),
  });
  const exercisesQuery = useQuery({
    queryKey: ["coach", "exercises"],
    queryFn: () => getCoachExercisesFn(),
  });
  const splitsQuery = useQuery({
    queryKey: ["coach", "splits"],
    queryFn: () => getCoachSplitsFn(),
  });

  const muscleGroups = muscleGroupsQuery.data ?? [];
  const muscleCategories = muscleCategoriesQuery.data ?? [];
  const exercises = exercisesQuery.data ?? [];
  const splits = splitsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Programming"
        title="Training."
        description="Muscle groups, categories, exercises, and the splits built from them."
      />

      <Tabs defaultValue="muscle-groups">
        <TabsList>
          <TabsTrigger value="muscle-groups">Muscle Groups</TabsTrigger>
          <TabsTrigger value="muscle-categories">Muscle Categories</TabsTrigger>
          <TabsTrigger value="exercises">Exercises</TabsTrigger>
          <TabsTrigger value="splits">Splits</TabsTrigger>
        </TabsList>
        <TabsContent value="muscle-groups" className="mt-6">
          <MuscleGroupsTab muscleGroups={muscleGroups} isLoading={muscleGroupsQuery.isLoading} />
        </TabsContent>
        <TabsContent value="muscle-categories" className="mt-6">
          <MuscleCategoriesTab
            muscleCategories={muscleCategories}
            muscleGroups={muscleGroups}
            isLoading={muscleCategoriesQuery.isLoading}
          />
        </TabsContent>
        <TabsContent value="exercises" className="mt-6">
          <ExercisesTab
            exercises={exercises}
            muscleGroups={muscleGroups}
            isLoading={exercisesQuery.isLoading}
          />
        </TabsContent>
        <TabsContent value="splits" className="mt-6">
          <SplitsTab splits={splits} exercises={exercises} isLoading={splitsQuery.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
