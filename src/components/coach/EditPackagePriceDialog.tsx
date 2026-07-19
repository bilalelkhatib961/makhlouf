import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { updatePackagePriceFn } from "@/subscriptions/functions";
import type { SubscriptionPackage } from "@/subscriptions/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EditPackagePriceDialog({
  open,
  onOpenChange,
  pkg,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: SubscriptionPackage | null;
}) {
  const queryClient = useQueryClient();
  const [price, setPrice] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !pkg) return;
    setPrice(String(pkg.price));
    setFormError(null);
  }, [open, pkg]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pkg) return;
      return updatePackagePriceFn({ data: { id: pkg.id, price: Number(price) || 0 } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "packages"] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit {pkg?.name} Price</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="package-price">Price per month ($)</Label>
            <Input
              id="package-price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Price
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
