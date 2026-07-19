import { useEffect, useRef, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, ImagePlus, Loader2, X } from "lucide-react";
import {
  getOwnClientProfileFn,
  updateOwnClientProfileFn,
  uploadOwnProfilePictureFn,
} from "@/clients/functions";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Route = createFileRoute("/portal/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileQuery = useQuery({
    queryKey: ["portal", "profile"],
    queryFn: () => getOwnClientProfileFn(),
  });

  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const data = profileQuery.data;
    if (!data) return;
    setName(data.name);
    setDob(data.profile.dob ? new Date(data.profile.dob) : undefined);
    setWeight(data.profile.weight !== null ? String(data.profile.weight) : "");
    setHeight(data.profile.height !== null ? String(data.profile.height) : "");
    setPhone(data.profile.phone ?? "");
    setNationality(data.profile.nationality ?? "");
    setPreviewUrl(data.profile.profilePicture);
    setProfilePicture(data.profile.profilePicture);
  }, [profileQuery.data]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFormError(null);
    setSaved(false);
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadOwnProfilePictureFn({ data });
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
    setSaved(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      return updateOwnClientProfileFn({
        data: {
          name,
          profile: {
            dob: dob ? dob.toISOString() : null,
            weight: weight.trim() ? Number(weight) : null,
            height: height.trim() ? Number(height) : null,
            phone: phone.trim() || null,
            nationality: nationality.trim() || null,
            profilePicture,
          },
        },
      });
    },
    onSuccess: async () => {
      setFormError(null);
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["portal", "profile"] });
      await router.invalidate();
    },
    onError: (err: Error) => {
      setSaved(false);
      setFormError(err.message);
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings."
        description="Update your personal information. Everything here is optional except your name."
      />

      {profileQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {profileQuery.data && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="max-w-lg space-y-5"
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
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              className="mt-2"
              required
            />
          </div>

          <div>
            <Label>Email</Label>
            <p className="mt-2 flex h-10 items-center rounded-sm border border-border bg-muted px-3 text-sm text-muted-foreground">
              {profileQuery.data.email}
            </p>
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
                  onSelect={(d) => {
                    setDob(d);
                    setSaved(false);
                  }}
                  captionLayout="dropdown"
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="settings-weight">Weight (kg)</Label>
              <Input
                id="settings-weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setSaved(false);
                }}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="settings-height">Height (cm)</Label>
              <Input
                id="settings-height"
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setSaved(false);
                }}
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="settings-phone">Phone</Label>
              <Input
                id="settings-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setSaved(false);
                }}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="settings-nationality">Nationality</Label>
              <Input
                id="settings-nationality"
                value={nationality}
                onChange={(e) => {
                  setNationality(e.target.value);
                  setSaved(false);
                }}
                className="mt-2"
              />
            </div>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
          {saved && !formError && <p className="text-sm text-foreground/70">Saved.</p>}

          <button
            type="submit"
            disabled={saveMutation.isPending || uploading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background disabled:opacity-50"
          >
            {(saveMutation.isPending || uploading) && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
}
