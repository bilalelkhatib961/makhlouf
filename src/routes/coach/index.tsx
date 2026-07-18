import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/coach/")({
  component: CoachDashboard,
});

const STATS = [
  { label: "Active Clients", value: "18", hint: "+3 this month" },
  { label: "Active Subscriptions", value: "14", hint: "2 pending renewal" },
  { label: "Monthly Revenue", value: "$8,240", hint: "dummy data" },
  { label: "Sessions This Week", value: "26", hint: "4 today" },
];

const UPCOMING = [
  { client: "Jordan Ellis", day: "Mon", time: "07:00", type: "1:1 Strength" },
  { client: "Casey Brooks", day: "Mon", time: "09:30", type: "Programming Review" },
  { client: "Riley Chen", day: "Tue", time: "06:30", type: "1:1 Strength" },
  { client: "Sam Whitfield", day: "Wed", time: "17:00", type: "Check-in Call" },
  { client: "Morgan Blake", day: "Thu", time: "12:00", type: "1:1 Strength" },
];

function CoachDashboard() {
  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Coach dashboard."
        description="Snapshot of your roster, revenue, and the week ahead. All figures below are placeholder data."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl">Upcoming Sessions</h2>
        <div className="mt-4 border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {UPCOMING.map((session) => (
                <TableRow key={`${session.client}-${session.day}-${session.time}`}>
                  <TableCell className="font-medium">{session.client}</TableCell>
                  <TableCell>{session.day}</TableCell>
                  <TableCell>{session.time}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{session.type}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
