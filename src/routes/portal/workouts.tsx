import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/portal/workouts")({
  component: WorkoutsPage,
});

const WORKOUTS = [
  {
    day: "Monday",
    focus: "Push — Chest, Shoulders, Triceps",
    exercises: 6,
    duration: "55 min",
    status: "Completed",
  },
  {
    day: "Tuesday",
    focus: "Pull — Back, Biceps",
    exercises: 6,
    duration: "50 min",
    status: "Completed",
  },
  {
    day: "Wednesday",
    focus: "Legs — Quads, Hamstrings, Glutes",
    exercises: 7,
    duration: "60 min",
    status: "Completed",
  },
  { day: "Thursday", focus: "Rest / Mobility", exercises: 0, duration: "—", status: "Rest" },
  {
    day: "Friday",
    focus: "Push — Chest, Shoulders, Triceps",
    exercises: 6,
    duration: "55 min",
    status: "Today",
  },
  {
    day: "Saturday",
    focus: "Pull — Back, Biceps",
    exercises: 6,
    duration: "50 min",
    status: "Upcoming",
  },
  { day: "Sunday", focus: "Rest", exercises: 0, duration: "—", status: "Rest" },
] as const;

const STATUS_VARIANT = {
  Completed: "default",
  Today: "outline",
  Upcoming: "secondary",
  Rest: "secondary",
} as const;

function WorkoutsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Training"
        title="This week's workouts."
        description="Your assigned training split. Placeholder data — workout logging isn't wired up yet."
      />

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Focus</TableHead>
              <TableHead>Exercises</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {WORKOUTS.map((workout) => (
              <TableRow key={workout.day}>
                <TableCell className="font-medium">{workout.day}</TableCell>
                <TableCell className="text-foreground/70">{workout.focus}</TableCell>
                <TableCell className="text-muted-foreground">{workout.exercises || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{workout.duration}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[workout.status]}>{workout.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
