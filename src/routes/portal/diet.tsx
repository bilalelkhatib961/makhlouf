import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/dashboard/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/portal/diet")({
  component: DietPage,
});

const MEALS = [
  {
    meal: "Breakfast",
    time: "07:30",
    items: "Oats, whey isolate, banana, almond butter",
    calories: 620,
    protein: 42,
  },
  {
    meal: "Lunch",
    time: "12:30",
    items: "Grilled chicken, rice, broccoli, olive oil",
    calories: 780,
    protein: 55,
  },
  {
    meal: "Snack",
    time: "15:30",
    items: "Greek yogurt, blueberries, honey",
    calories: 260,
    protein: 18,
  },
  {
    meal: "Dinner",
    time: "19:00",
    items: "Salmon, sweet potato, asparagus",
    calories: 690,
    protein: 48,
  },
];

const totalCalories = MEALS.reduce((sum, m) => sum + m.calories, 0);
const totalProtein = MEALS.reduce((sum, m) => sum + m.protein, 0);

function DietPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Nutrition"
        title="Today's diet."
        description="Your logged meals for today. Placeholder data — meal logging isn't wired up yet."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Calories"
          value={`${totalCalories} kcal`}
          hint="Target: 2,400 kcal"
        />
        <StatCard label="Total Protein" value={`${totalProtein} g`} hint="Target: 170 g" />
        <StatCard label="Meals Logged" value={`${MEALS.length}`} hint="For today" />
      </div>

      <div className="mt-12 border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meal</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Calories</TableHead>
              <TableHead>Protein</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MEALS.map((meal) => (
              <TableRow key={meal.meal}>
                <TableCell className="font-medium">{meal.meal}</TableCell>
                <TableCell className="text-muted-foreground">{meal.time}</TableCell>
                <TableCell className="text-foreground/70">{meal.items}</TableCell>
                <TableCell>{meal.calories} kcal</TableCell>
                <TableCell>{meal.protein} g</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
