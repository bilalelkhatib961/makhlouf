import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/portal/exercises")({
  component: ExercisesPage,
});

const TODAY_EXERCISES = [
  { name: "Barbell Bench Press", sets: 4, reps: "6-8", target: "185 lbs" },
  { name: "Incline Dumbbell Press", sets: 3, reps: "8-10", target: "65 lbs" },
  { name: "Overhead Press", sets: 3, reps: "8-10", target: "95 lbs" },
  { name: "Lateral Raise", sets: 3, reps: "12-15", target: "20 lbs" },
  { name: "Cable Tricep Pushdown", sets: 3, reps: "12-15", target: "50 lbs" },
  { name: "Overhead Tricep Extension", sets: 3, reps: "12-15", target: "35 lbs" },
];

function ExercisesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Friday — Push Day"
        title="Today's exercises."
        description="Sets, reps, and target load assigned by your coach. Placeholder data — set logging isn't wired up yet."
      />

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead>Sets</TableHead>
              <TableHead>Reps</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TODAY_EXERCISES.map((exercise) => (
              <TableRow key={exercise.name}>
                <TableCell className="font-medium">{exercise.name}</TableCell>
                <TableCell className="text-muted-foreground">{exercise.sets}</TableCell>
                <TableCell className="text-muted-foreground">{exercise.reps}</TableCell>
                <TableCell>{exercise.target}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
