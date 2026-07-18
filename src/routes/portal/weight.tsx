import { createFileRoute } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { PageHeader, StatCard } from "@/components/dashboard/PageHeader";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/portal/weight")({
  component: WeightPage,
});

const ENTRIES = [
  { date: "May 26", weight: 188.2 },
  { date: "Jun 2", weight: 187.0 },
  { date: "Jun 9", weight: 186.4 },
  { date: "Jun 16", weight: 185.1 },
  { date: "Jun 23", weight: 184.6 },
  { date: "Jun 30", weight: 183.8 },
  { date: "Jul 7", weight: 183.0 },
  { date: "Jul 14", weight: 182.4 },
];

const chartConfig = {
  weight: { label: "Weight (lbs)" },
} satisfies ChartConfig;

function WeightPage() {
  const current = ENTRIES[ENTRIES.length - 1].weight;
  const change = (current - ENTRIES[0].weight).toFixed(1);

  return (
    <div>
      <PageHeader
        eyebrow="Progress"
        title="Weight tracking."
        description="Weekly weigh-ins over the last 8 weeks. Placeholder data — weight logging isn't wired up yet."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Current" value={`${current} lbs`} />
        <StatCard label="Goal" value="175 lbs" hint={`${(current - 175).toFixed(1)} lbs to go`} />
        <StatCard label="Change" value={`${change} lbs`} hint="Last 8 weeks" />
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl">Trend</h2>
        <div className="mt-4 border border-border p-6">
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
            <LineChart data={ENTRIES} margin={{ left: 12, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                domain={["dataMin - 2", "dataMax + 2"]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="weight"
                type="monotone"
                stroke="currentColor"
                className="text-foreground"
                strokeWidth={2}
                dot={{ r: 3, className: "fill-foreground stroke-none" }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>

      <div className="mt-12 border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ENTRIES.slice()
              .reverse()
              .map((entry, i, arr) => {
                const prev = arr[i + 1];
                const delta = prev ? (entry.weight - prev.weight).toFixed(1) : null;
                return (
                  <TableRow key={entry.date}>
                    <TableCell className="font-medium">{entry.date}</TableCell>
                    <TableCell>{entry.weight} lbs</TableCell>
                    <TableCell className="text-muted-foreground">
                      {delta ? `${delta} lbs` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
