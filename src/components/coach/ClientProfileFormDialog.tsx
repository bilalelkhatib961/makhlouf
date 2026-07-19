import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, ImagePlus, Loader2, X } from "lucide-react";
import { updateClientProfileFn, uploadClientProfilePictureFn } from "@/clients/functions";
import type { ClientListItem } from "@/clients/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ClientProfileFormDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientListItem;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  previewRef.current = previewUrl;

  useEffect(() => {
    if (!open) return;
    setDob(client.profile.dob ? new Date(client.profile.dob) : undefined);
    setWeight(client.profile.weight !== null ? String(client.profile.weight) : "");
    setHeight(client.profile.height !== null ? String(client.profile.height) : "");
    setPhone(client.profile.phone ?? "");
    setNationality(client.profile.nationality ?? "");
    setPreviewUrl(client.profile.profilePicture);
    setProfilePicture(client.profile.profilePicture);
    setFormError(null);
  }, [open, client]);

  useEffect(() => {
    if (open) return;
    if (previewRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewRef.current);
  }, [open]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFormError(null);
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadClientProfilePictureFn({ data });
      setProfilePicture(result.url);
    } catch (err) {
      setPreviewUrl(profilePicture);
      setFormError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePicture = () => {
    setProfilePicture(null);
    setPreviewUrl(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = {
        dob: dob ? dob.toISOString() : null,
        weight: weight.trim() ? Number(weight) : null,
        height: height.trim() ? Number(height) : null,
        phone: phone.trim() || null,
        nationality: nationality.trim() || null,
        profilePicture,
      };
      return updateClientProfileFn({ data: { clientId: client.id, input } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "clients"] });
      queryClient.invalidateQueries({ queryKey: ["coach", "client", client.id] });
      onOpenChange(false);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Client Profile</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label>Profile Picture</Label>
            <div className="mt-2 flex items-center gap-3">
              {previewUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border">
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 grid place-items-center bg-background/70">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removePicture}
                    aria-label="Remove profile picture"
                    className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-full bg-background/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-dashed border-foreground/30 text-foreground/50 hover:text-foreground"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          </div>

          <div>
            <Label>Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "mt-2 flex h-10 w-full items-center gap-2 rounded-sm border border-border px-3 text-left text-sm",
                    !dob && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  {dob ? format(dob, "PPP") : "Not set"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dob}
                  onSelect={setDob}
                  captionLayout="dropdown"
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client-weight">Weight (kg)</Label>
              <Input
                id="client-weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="client-height">Height (cm)</Label>
              <Input
                id="client-height"
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="client-nationality">Nationality</Label>
              <Input
                id="client-nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <button
              type="submit"
              disabled={saveMutation.isPending || uploading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
            >
              {(saveMutation.isPending || uploading) && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Save Profile
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
