import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/portal/")({
  component: ClientDashboard,
});

const STATS = [
  { label: "Current Weight", value: "182.4 lbs", hint: "-5.8 lbs in 6 weeks" },
  { label: "Avg Daily Calories", value: "2,410 kcal", hint: "7-day average" },
  { label: "Workouts This Week", value: "3 / 5", hint: "2 remaining" },
  { label: "Streak", value: "12 days", hint: "Personal best: 21" },
];

const WEEKLY_PLAN = [
  { day: "Mon", focus: "Push", status: "Done" },
  { day: "Tue", focus: "Pull", status: "Done" },
  { day: "Wed", focus: "Legs", status: "Done" },
  { day: "Thu", focus: "Rest", status: "Rest" },
  { day: "Fri", focus: "Push", status: "Today" },
  { day: "Sat", focus: "Pull", status: "Upcoming" },
  { day: "Sun", focus: "Rest", status: "Rest" },
] as const;

const STATUS_VARIANT = {
  Done: "default",
  Today: "outline",
  Upcoming: "secondary",
  Rest: "secondary",
} as const;

function ClientDashboard() {
  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Welcome back, Jordan."
        description="Here's where things stand this week. All figures below are placeholder data."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="font-display text-2xl">This Week</h2>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {WEEKLY_PLAN.map((entry) => (
              <div
                key={entry.day}
                className={`flex flex-col items-center gap-2 border p-3 text-center ${
                  entry.status === "Today" ? "border-foreground" : "border-border"
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {entry.day}
                </span>
                <span className="text-xs font-medium">{entry.focus}</span>
                <Badge variant={STATUS_VARIANT[entry.status]} className="text-[9px]">
                  {entry.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <h2 className="font-display text-2xl">Today — Push Day</h2>
          <div className="mt-4 border border-border p-6">
            <p className="text-sm text-foreground/70">Chest, Shoulders, Triceps</p>
            <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              6 exercises · ~55 min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
