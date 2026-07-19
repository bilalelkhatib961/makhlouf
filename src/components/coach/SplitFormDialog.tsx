import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createSplitFn, updateSplitFn } from "@/training/functions";
import type { Exercise, Split, SplitDayInput, Weekday } from "@/training/types";
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

interface ExerciseRowDraft {
  localId: string;
  exerciseId: string;
  setsText: string; // comma-separated reps, e.g. "12,10,8"
}

interface DayDraft {
  day: Weekday;
  label: string;
  exercises: ExerciseRowDraft[];
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
  return WEEKDAYS.map((day) => ({ day, label: "", exercises: [] }));
}

function parseSets(setsText: string): number[] {
  return setsText
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

interface FieldErrors {
  name?: string;
}

export function SplitFormDialog({
  open,
  onOpenChange,
  exercises,
  split,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  split: Split | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [days, setDays] = useState<DayDraft[]>(emptyDays());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (split) {
      setName(split.name);
      setDescription(split.description);
      setDurationWeeks(split.durationWeeks);
      setDays(
        split.days.map((d) => ({
          day: d.day,
          label: d.label,
          exercises: d.exercises.map((e) => ({
            localId: crypto.randomUUID(),
            exerciseId: e.exerciseId,
            setsText: e.sets.join(","),
          })),
        })),
      );
    } else {
      setName("");
      setDescription("");
      setDurationWeeks(4);
      setDays(emptyDays());
    }
    setFieldErrors({});
    setFormError(null);
  }, [open, split]);

  const updateDay = (day: Weekday, updater: (d: DayDraft) => DayDraft) => {
    setDays((prev) => prev.map((d) => (d.day === day ? updater(d) : d)));
  };

  const addExerciseRow = (day: Weekday) => {
    updateDay(day, (d) => ({
      ...d,
      exercises: [...d.exercises, { localId: crypto.randomUUID(), exerciseId: "", setsText: "" }],
    }));
  };

  const removeExerciseRow = (day: Weekday, localId: string) => {
    updateDay(day, (d) => ({ ...d, exercises: d.exercises.filter((e) => e.localId !== localId) }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const errors: FieldErrors = {};
      if (!name.trim()) errors.name = "Name is required";
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        throw new Error("Please fix the highlighted fields.");
      }

      const payloadDays: SplitDayInput[] = days.map((d) => ({
        day: d.day,
        label: d.label.trim(),
        exercises: d.exercises
          .filter((e) => e.exerciseId)
          .map((e) => ({ exerciseId: e.exerciseId, sets: parseSets(e.setsText) })),
      }));

      const input = {
        name: name.trim(),
        description: description.trim(),
        durationWeeks,
        days: payloadDays,
      };
      if (split) {
        return updateSplitFn({ data: { id: split.id, input } });
      }
      return createSplitFn({ data: input });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "splits"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{split ? "Edit Split" : "Add Split"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="split-name">Name</Label>
            <Input
              id="split-name"
              placeholder="e.g. Push Pull Legs Arms"
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
            <Label htmlFor="split-description">Description</Label>
            <Textarea
              id="split-description"
              rows={2}
              placeholder="Optional notes for this program"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="split-duration">Duration (weeks)</Label>
            <Input
              id="split-duration"
              type="number"
              min={1}
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(Number(e.target.value))}
              className="mt-2 max-w-[160px]"
            />
          </div>

          <div>
            <Label>Weekly Schedule</Label>
            <Accordion type="multiple" className="mt-2 rounded-sm border border-border px-4">
              {days.map((d) => (
                <AccordionItem key={d.day} value={d.day}>
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      {DAY_TITLES[d.day]}
                      <span className="text-xs font-normal text-muted-foreground">
                        {d.exercises.length === 0
                          ? "Rest day"
                          : `${d.exercises.length} exercise${d.exercises.length === 1 ? "" : "s"}`}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`day-label-${d.day}`}>Day label</Label>
                        <Input
                          id={`day-label-${d.day}`}
                          placeholder="e.g. Push Day"
                          value={d.label}
                          onChange={(e) =>
                            updateDay(d.day, (day) => ({ ...day, label: e.target.value }))
                          }
                          className="mt-2"
                        />
                      </div>

                      <div className="space-y-3">
                        {d.exercises.map((row) => (
                          <div key={row.localId} className="flex items-end gap-2">
                            <div className="flex-1">
                              <Label>Exercise</Label>
                              <Select
                                value={row.exerciseId}
                                onValueChange={(value) =>
                                  updateDay(d.day, (day) => ({
                                    ...day,
                                    exercises: day.exercises.map((e) =>
                                      e.localId === row.localId ? { ...e, exerciseId: value } : e,
                                    ),
                                  }))
                                }
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Select an exercise" />
                                </SelectTrigger>
                                <SelectContent>
                                  {exercises.map((ex) => (
                                    <SelectItem key={ex.id} value={ex.id}>
                                      {ex.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32">
                              <Label>Reps per set</Label>
                              <Input
                                placeholder="12,10,8"
                                value={row.setsText}
                                onChange={(e) =>
                                  updateDay(d.day, (day) => ({
                                    ...day,
                                    exercises: day.exercises.map((ex) =>
                                      ex.localId === row.localId
                                        ? { ...ex, setsText: e.target.value }
                                        : ex,
                                    ),
                                  }))
                                }
                                className="mt-2"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExerciseRow(d.day, row.localId)}
                              aria-label="Remove exercise"
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-sm hover:bg-muted"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addExerciseRow(d.day)}
                        disabled={exercises.length === 0}
                        className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-foreground/70 hover:text-foreground disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Exercise
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
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
              Save Split
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
