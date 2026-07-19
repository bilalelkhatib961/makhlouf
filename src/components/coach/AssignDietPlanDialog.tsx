import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { assignDietPlanFn, getCoachDietPlansFn } from "@/diet/functions";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export function AssignDietPlanDialog({
  open,
  onOpenChange,
  clientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}) {
  const queryClient = useQueryClient();
  const dietPlansQuery = useQuery({
    queryKey: ["coach", "dietPlans"],
    queryFn: () => getCoachDietPlansFn(),
  });
  const dietPlans = dietPlansQuery.data ?? [];

  const [dietPlanId, setDietPlanId] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDietPlanId("");
    setStartDate(new Date());
    setFormError(null);
  }, [open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!dietPlanId) throw new Error("Please choose a diet plan.");
      return assignDietPlanFn({
        data: { clientId, dietPlanId, startDate: startDate.toISOString() },
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
          <DialogTitle>Assign Diet Plan</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="assign-diet-plan">Diet Plan</Label>
            <Select value={dietPlanId} onValueChange={setDietPlanId}>
              <SelectTrigger id="assign-diet-plan" className="mt-2">
                <SelectValue placeholder="Select a diet plan" />
              </SelectTrigger>
              <SelectContent>
                {dietPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Assign Diet Plan
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
