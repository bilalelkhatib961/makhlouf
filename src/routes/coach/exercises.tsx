import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/coach/exercises")({
  component: ExercisesPage,
});

const EXERCISES = [
  { name: "Barbell Back Squat", group: "Legs", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Bench Press", group: "Chest", equipment: "Barbell", difficulty: "Intermediate" },
  { name: "Deadlift", group: "Back", equipment: "Barbell", difficulty: "Advanced" },
  { name: "Pull-Up", group: "Back", equipment: "Bodyweight", difficulty: "Intermediate" },
  { name: "Overhead Press", group: "Shoulders", equipment: "Barbell", difficulty: "Intermediate" },
  {
    name: "Romanian Deadlift",
    group: "Hamstrings",
    equipment: "Barbell",
    difficulty: "Intermediate",
  },
  { name: "Walking Lunge", group: "Legs", equipment: "Dumbbell", difficulty: "Beginner" },
  { name: "Plank", group: "Core", equipment: "Bodyweight", difficulty: "Beginner" },
] as const;

const DIFFICULTY_VARIANT = {
  Beginner: "secondary",
  Intermediate: "outline",
  Advanced: "default",
} as const;

function ExercisesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Exercises."
        description="The exercise library used to build client programs. Placeholder data — library management isn't wired up yet."
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background">
            <Plus className="h-4 w-4" /> Add Exercise
          </button>
        }
      />

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead>Muscle Group</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Difficulty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EXERCISES.map((exercise) => (
              <TableRow key={exercise.name}>
                <TableCell className="font-medium">{exercise.name}</TableCell>
                <TableCell className="text-muted-foreground">{exercise.group}</TableCell>
                <TableCell className="text-muted-foreground">{exercise.equipment}</TableCell>
                <TableCell>
                  <Badge variant={DIFFICULTY_VARIANT[exercise.difficulty]}>
                    {exercise.difficulty}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
