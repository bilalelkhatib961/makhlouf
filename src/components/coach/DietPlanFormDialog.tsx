import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getCoachClientsFn } from "@/clients/functions";
import { createDietPlanFn, updateDietPlanFn } from "@/diet/functions";
import { mealsNutrition, recommendMacros, roundTotals, type DietGoal } from "@/diet/nutrition";
import type { DietPlan, DietPlanDayInput, Meal } from "@/diet/types";
import type { Weekday } from "@/training/types";
import { WEEKDAYS } from "@/training/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MealRowDraft {
  localId: string;
  mealId: string;
}

interface DayDraft {
  day: Weekday;
  label: string;
  meals: MealRowDraft[];
}

const DAY_TITLES: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function emptyDays(): DayDraft[] {
  return WEEKDAYS.map((day) => ({ day, label: "", meals: [] }));
}

interface FieldErrors {
  name?: string;
}

function deltaLabel(actual: number, target: number, unit: string): string {
  const diff = Math.round(actual - target);
  if (diff === 0) return `on target`;
  return diff > 0 ? `+${diff}${unit} over target` : `${diff}${unit} under target`;
}

export function DietPlanFormDialog({
  open,
  onOpenChange,
  meals,
  dietPlan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meals: Meal[];
  dietPlan: DietPlan | null;
}) {
  const queryClient = useQueryClient();
  const mealsById = new Map<string, Meal>(meals.map((m) => [m.id, m]));

  const clientsQuery = useQuery({
    queryKey: ["coach", "clients"],
    queryFn: () => getCoachClientsFn(),
  });
  const clients = clientsQuery.data ?? [];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<DayDraft[]>(emptyDays());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [helperClientId, setHelperClientId] = useState("");
  const [helperGoal, setHelperGoal] = useState<DietGoal>("bulk");

  useEffect(() => {
    if (!open) return;
    if (dietPlan) {
      setName(dietPlan.name);
      setDescription(dietPlan.description);
      setDays(
        dietPlan.days.map((d) => ({
          day: d.day,
          label: d.label,
          meals: d.meals.map((m) => ({ localId: crypto.randomUUID(), mealId: m.mealId })),
        })),
      );
    } else {
      setName("");
      setDescription("");
      setDays(emptyDays());
    }
    setHelperClientId("");
    setHelperGoal("bulk");
    setFieldErrors({});
    setFormError(null);
  }, [open, dietPlan]);

  const updateDay = (day: Weekday, updater: (d: DayDraft) => DayDraft) => {
    setDays((prev) => prev.map((d) => (d.day === day ? updater(d) : d)));
  };

  const addMealRow = (day: Weekday) => {
    updateDay(day, (d) => ({
      ...d,
      meals: [...d.meals, { localId: crypto.randomUUID(), mealId: "" }],
    }));
  };

  const removeMealRow = (day: Weekday, localId: string) => {
    updateDay(day, (d) => ({ ...d, meals: d.meals.filter((m) => m.localId !== localId) }));
  };

  const helperClient = clients.find((c) => c.id === helperClientId) ?? null;
  const macroTarget = helperClient ? recommendMacros(helperClient.profile, helperGoal) : null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors: FieldErrors = {};
      if (!name.trim()) errors.name = "Name is required";
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the highlighted fields.");
      }

      const payloadDays: DietPlanDayInput[] = days.map((d) => ({
        day: d.day,
        label: d.label.trim(),
        mealIds: d.meals.filter((m) => m.mealId).map((m) => m.mealId),
      }));

      const input = { name: name.trim(), description: description.trim(), days: payloadDays };
      if (dietPlan) {
        return updateDietPlanFn({ data: { id: dietPlan.id, input } });
      }
      return createDietPlanFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "dietPlans"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dietPlan ? "Edit Diet Plan" : "Add Diet Plan"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="diet-plan-name">Name</Label>
            <Input
              id="diet-plan-name"
              placeholder="e.g. Lean Bulk Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="diet-plan-description">Description</Label>
            <Textarea
              id="diet-plan-description"
              rows={2}
              placeholder="Optional notes for this plan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="rounded-sm border border-border p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/50">
              Macro helper
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a client and a goal to see a recommended daily target, compared against each
              day's totals below — an estimate to help size this plan, not a substitute for
              professional assessment.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <Label>Client</Label>
                <Select value={helperClientId} onValueChange={setHelperClientId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Goal</Label>
                <Select value={helperGoal} onValueChange={(v) => setHelperGoal(v as DietGoal)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bulk">Bulk</SelectItem>
                    <SelectItem value="cut">Cut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {helperClientId && !macroTarget && (
              <p className="mt-3 text-xs text-destructive">
                This client has no weight/height set yet — can't compute a recommendation.
              </p>
            )}
            {macroTarget && (
              <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="font-display text-lg">{macroTarget.calories}</p>
                  <p className="text-xs text-muted-foreground">target kcal</p>
                </div>
                <div>
                  <p className="font-display text-lg">{macroTarget.carbsGrams}g</p>
                  <p className="text-xs text-muted-foreground">carbs</p>
                </div>
                <div>
                  <p className="font-display text-lg">{macroTarget.proteinGrams}g</p>
                  <p className="text-xs text-muted-foreground">protein</p>
                </div>
                <div>
                  <p className="font-display text-lg">{macroTarget.fatGrams}g</p>
                  <p className="text-xs text-muted-foreground">fat</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label>Weekly Schedule</Label>
            <Accordion type="multiple" className="mt-2 rounded-sm border border-border px-4">
              {days.map((d) => {
                const dayTotals = roundTotals(
                  mealsNutrition(
                    d.meals.filter((m) => m.mealId).map((m) => m.mealId),
                    mealsById,
                  ),
                );
                return (
                  <AccordionItem key={d.day} value={d.day}>
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        {DAY_TITLES[d.day]}
                        <span className="text-xs font-normal text-muted-foreground">
                          {d.meals.length === 0
                            ? "No meals"
                            : `${d.meals.length} meal${d.meals.length === 1 ? "" : "s"} · ${dayTotals.calories} kcal`}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`day-label-${d.day}`}>Day label</Label>
                          <Input
                            id={`day-label-${d.day}`}
                            placeholder="e.g. High Carb Day"
                            value={d.label}
                            onChange={(e) =>
                              updateDay(d.day, (day) => ({ ...day, label: e.target.value }))
                            }
                            className="mt-2"
                          />
                        </div>

                        <div className="space-y-3">
                          {d.meals.map((row) => (
                            <div key={row.localId} className="flex items-end gap-2">
                              <div className="flex-1">
                                <Label>Meal</Label>
                                <Select
                                  value={row.mealId}
                                  onValueChange={(value) =>
                                    updateDay(d.day, (day) => ({
                                      ...day,
                                      meals: day.meals.map((m) =>
                                        m.localId === row.localId ? { ...m, mealId: value } : m,
                                      ),
                                    }))
                                  }
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select a meal" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {meals.map((meal) => (
                                      <SelectItem key={meal.id} value={meal.id}>
                                        {meal.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMealRow(d.day, row.localId)}
                                aria-label="Remove meal"
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-sm hover:bg-muted"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => addMealRow(d.day)}
                          disabled={meals.length === 0}
                          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-foreground/70 hover:text-foreground disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Meal
                        </button>

                        {d.meals.length > 0 && (
                          <div className="rounded-sm border border-border p-3 text-sm">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span>{dayTotals.calories} kcal</span>
                              <span className="text-muted-foreground">
                                {dayTotals.carbs}g carbs · {dayTotals.protein}g protein ·{" "}
                                {dayTotals.fat}g fat
                              </span>
                            </div>
                            {macroTarget && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {deltaLabel(dayTotals.calories, macroTarget.calories, " kcal")} ·{" "}
                                {deltaLabel(
                                  dayTotals.protein,
                                  macroTarget.proteinGrams,
                                  "g protein",
                                )}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Diet Plan
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
