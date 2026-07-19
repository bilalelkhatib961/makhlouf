import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { assignSplitFn } from "@/clients/functions";
import { splitProgress } from "@/clients/progress";
import type { SplitAssignment } from "@/clients/types";
import { getCoachSplitsFn } from "@/training/functions";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProgressChoice = "restart" | "keep";

export function AssignSplitDialog({
  open,
  onOpenChange,
  clientId,
  currentAssignment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  currentAssignment: SplitAssignment | null;
}) {
  const queryClient = useQueryClient();
  const splitsQuery = useQuery({
    queryKey: ["coach", "splits"],
    queryFn: () => getCoachSplitsFn(),
  });
  const splits = splitsQuery.data ?? [];

  const currentProgress = currentAssignment
    ? splitProgress(currentAssignment.startDate, currentAssignment.durationWeeks)
    : null;
  const isReplacing = currentProgress?.status === "in-progress";

  const [splitId, setSplitId] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [progressChoice, setProgressChoice] = useState<ProgressChoice>("restart");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSplitId("");
    setStartDate(new Date());
    setProgressChoice("restart");
    setFormError(null);
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!splitId) throw new Error("Please choose a split.");
      const resolvedStartDate =
        isReplacing && currentAssignment
          ? progressChoice === "keep"
            ? currentAssignment.startDate
            : new Date().toISOString()
          : startDate.toISOString();
      return assignSplitFn({
        data: { clientId, splitId, startDate: resolvedStartDate },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "clients"] });
      queryClient.invalidateQueries({ queryKey: ["coach", "client", clientId] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isReplacing ? "Replace Split" : "Assign Split"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          {isReplacing && currentAssignment && currentProgress && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{currentAssignment.splitName}</span> is
              currently in progress ({currentProgress.weekLabel}, {currentProgress.percent}%).
              Choose a new split and what to do with that progress below.
            </p>
          )}

          <div>
            <Label htmlFor="assign-split">Split</Label>
            <Select value={splitId} onValueChange={setSplitId}>
              <SelectTrigger id="assign-split" className="mt-2">
                <SelectValue placeholder="Select a split" />
              </SelectTrigger>
              <SelectContent>
                {splits.map((split) => (
                  <SelectItem key={split.id} value={split.id}>
                    {split.name} — {split.durationWeeks}w
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isReplacing ? (
            <div>
              <Label>Progress</Label>
              <RadioGroup
                value={progressChoice}
                onValueChange={(value) => setProgressChoice(value as ProgressChoice)}
                className="mt-2"
              >
                <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 text-sm">
                  <RadioGroupItem value="restart" className="mt-0.5" />
                  <span>
                    <span className="block font-medium">Start fresh from 0%</span>
                    <span className="block text-xs text-muted-foreground">
                      Discards the current split's progress. The new split starts today.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 text-sm">
                  <RadioGroupItem value="keep" className="mt-0.5" />
                  <span>
                    <span className="block font-medium">Keep current progress</span>
                    <span className="block text-xs text-muted-foreground">
                      Carries over the same start date, so progress applies to the new split
                      immediately.
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </div>
          ) : (
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "mt-2 flex h-10 w-full items-center gap-2 rounded-sm border border-border px-3 text-left text-sm",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    {format(startDate, "PPP")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isReplacing ? "Replace Split" : "Assign Split"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
