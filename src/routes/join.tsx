import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, ArrowRight, ArrowLeft, CalendarIcon, ImagePlus, Loader2, X } from "lucide-react";
import { joinFn } from "@/auth/functions";
import type { UserRole } from "@/auth/types";
import { packagesQuery } from "@/subscriptions/queries";
import { uploadJoinProfilePictureFn } from "@/clients/functions";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function roleHome(role: UserRole) {
  return role === "coach" ? "/coach" : "/portal";
}

export const Route = createFileRoute("/join")({
  loader: ({ context }) => {
    if (context.user) {
      throw redirect({ to: roleHome(context.user.role) });
    }
    return context.queryClient.ensureQueryData(packagesQuery());
  },
  head: () => ({
    meta: [{ title: "Join — Makhlouf" }],
  }),
  component: JoinPage,
});

function JoinPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: packages = [] } = useQuery(packagesQuery());

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [packageId, setPackageId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 (all optional)
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [nationality, setNationality] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const previewRef = useRef<string | null>(null);
  previewRef.current = previewUrl;

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (previewRef.current?.startsWith("blob:")) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const handleNext = () => {
    setError(null);
    if (!packageId) {
      setError("Please choose a package.");
      return;
    }
    if (!formRef.current?.reportValidity()) return;
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setStep(2);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setUploading(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadJoinProfilePictureFn({ data });
      setProfilePicture(result.url);
    } catch (err) {
      setPreviewUrl(profilePicture);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePicture = () => {
    setProfilePicture(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { role } = await joinFn({
        data: {
          name,
          email,
          password,
          packageId,
          phone,
          dob: dob ? dob.toISOString() : null,
          weight: weight.trim() ? Number(weight) : null,
          height: height.trim() ? Number(height) : null,
          nationality: nationality.trim() || null,
          profilePicture,
        },
      });
      await router.invalidate();
      router.navigate({ to: roleHome(role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="px-6 pb-16 pt-32 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">— Join Us</p>
        <h1 className="mt-4 font-display text-5xl leading-[0.95] sm:text-6xl">
          Start <span className="italic font-light">training.</span>
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">
          {step === 1
            ? "Pick a package and create your account — no payment required yet."
            : "Optional — you can always update this later from your portal settings."}
        </p>
        <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-foreground/40">
          Step {step} of 2
        </p>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-6">
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {packages.map((pkg) => {
                  const selected = pkg.id === packageId;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setPackageId(pkg.id)}
                      className={cn(
                        "rounded-sm border p-6 text-left transition flex flex-col items-start",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-display text-xl">{pkg.name}</h3>
                        {selected && <Check className="h-5 w-5 shrink-0" />}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="font-display text-3xl">${pkg.price.toFixed(2)}</p>
                        <p
                          className={cn(
                            "text-sm",
                            selected ? "text-background/70" : "text-muted-foreground",
                          )}
                        >
                          / month
                        </p>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {pkg.benefits.map((benefit) => (
                          <li
                            key={benefit}
                            className={cn(
                              "flex items-start gap-2 text-sm",
                              selected ? "text-background/80" : "text-foreground/70",
                            )}
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <div className="mt-12 max-w-md space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                  >
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <button
                  type="button"
                  onClick={handleNext}
                  className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-sm bg-foreground px-7 text-sm font-medium uppercase tracking-[0.18em] text-background transition hover:gap-5"
                >
                  Next
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="max-w-md space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                  Profile Picture
                </label>
                <div className="mt-2 flex items-center gap-3">
                  {previewUrl ? (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-foreground/30">
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
                <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60">
                  Date of Birth
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "mt-2 flex h-12 w-full items-center gap-2 border-b border-foreground/30 bg-transparent text-left text-base outline-none transition focus:border-foreground",
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

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="height"
                    className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                  >
                    Height (cm)
                  </label>
                  <input
                    id="height"
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="weight"
                    className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                  >
                    Weight (kg)
                  </label>
                  <input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="nationality"
                  className="block text-[10px] uppercase tracking-[0.25em] text-foreground/60"
                >
                  Nationality
                </label>
                <input
                  id="nationality"
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="mt-2 h-12 w-full border-b border-foreground/30 bg-transparent text-base outline-none transition focus:border-foreground"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-sm border border-foreground/30 px-6 text-sm font-medium uppercase tracking-[0.18em]"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="group inline-flex h-14 flex-1 items-center justify-center gap-3 rounded-sm bg-foreground px-7 text-sm font-medium uppercase tracking-[0.18em] text-background transition hover:gap-5 disabled:opacity-50"
                >
                  {submitting ? "Creating account…" : "Create Account"}
                  {!submitting && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
