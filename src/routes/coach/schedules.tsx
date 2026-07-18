import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/coach/schedules")({
  component: SchedulesPage,
});

const SCHEDULE = [
  { day: "Monday", time: "07:00", client: "Jordan Ellis", type: "1:1 Strength" },
  { day: "Monday", time: "09:30", client: "Casey Brooks", type: "Programming Review" },
  { day: "Monday", time: "17:30", client: "Group", type: "Group HIIT" },
  { day: "Tuesday", time: "06:30", client: "Riley Chen", type: "1:1 Strength" },
  { day: "Tuesday", time: "12:00", client: "Morgan Blake", type: "1:1 Strength" },
  { day: "Wednesday", time: "17:00", client: "Sam Whitfield", type: "Check-in Call" },
  { day: "Thursday", time: "06:30", client: "Riley Chen", type: "1:1 Strength" },
  { day: "Thursday", time: "18:00", client: "Group", type: "Group HIIT" },
  { day: "Friday", time: "07:00", client: "Jordan Ellis", type: "1:1 Strength" },
  { day: "Saturday", time: "09:00", client: "Taylor Reyes", type: "Trial Session" },
];

function SchedulesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Calendar"
        title="Schedules."
        description="This week's sessions across your roster. Placeholder data — scheduling isn't wired up yet."
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background">
            <Plus className="h-4 w-4" /> Add Session
          </button>
        }
      />

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SCHEDULE.map((session, i) => (
              <TableRow key={`${session.day}-${session.time}-${i}`}>
                <TableCell className="font-medium">{session.day}</TableCell>
                <TableCell className="text-muted-foreground">{session.time}</TableCell>
                <TableCell>{session.client}</TableCell>
                <TableCell className="text-muted-foreground">{session.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
