import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { getCoachClientDetailFn } from "@/clients/functions";
import { splitProgress, type SplitAssignmentStatus } from "@/clients/progress";
import type { SplitAssignment } from "@/clients/types";
import type { DietPlanAssignment } from "@/diet/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientProfileFormDialog } from "@/components/coach/ClientProfileFormDialog";
import { AssignSplitDialog } from "@/components/coach/AssignSplitDialog";
import { AssignDietPlanDialog } from "@/components/coach/AssignDietPlanDialog";

export const Route = createFileRoute("/coach/clients_/$clientId")({
  component: ClientDetailPage,
});

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const STATUS_LABEL: Record<SplitAssignmentStatus, string> = {
  upcoming: "Upcoming",
  "in-progress": "In Progress",
  completed: "Completed",
};

const STATUS_VARIANT: Record<SplitAssignmentStatus, "outline" | "default" | "secondary"> = {
  upcoming: "outline",
  "in-progress": "default",
  completed: "secondary",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AssignmentRow({ assignment }: { assignment: SplitAssignment }) {
  const progress = splitProgress(assignment.startDate, assignment.durationWeeks);
  return (
    <TableRow>
      <TableCell className="font-medium">{assignment.splitName}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(assignment.startDate)}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(progress.endDate.toISOString())}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[progress.status]}>{STATUS_LABEL[progress.status]}</Badge>
      </TableCell>
    </TableRow>
  );
}

function DietAssignmentRow({ assignment }: { assignment: DietPlanAssignment }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{assignment.dietPlanName}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(assignment.startDate)}</TableCell>
    </TableRow>
  );
}

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const detailQuery = useQuery({
    queryKey: ["coach", "client", clientId],
    queryFn: () => getCoachClientDetailFn({ data: { clientId } }),
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [assignSplitOpen, setAssignSplitOpen] = useState(false);
  const [assignDietPlanOpen, setAssignDietPlanOpen] = useState(false);

  if (detailQuery.isLoading || !detailQuery.data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const client = detailQuery.data;
  const currentProgress = client.currentAssignment
    ? splitProgress(client.currentAssignment.startDate, client.currentAssignment.durationWeeks)
    : null;

  return (
    <div>
      <Link
        to="/coach/clients"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Clients
      </Link>

      <PageHeader eyebrow="Client" title={`${client.name}.`} description={client.email} />

      <div className="border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={client.profile.profilePicture ?? undefined} alt="" />
              <AvatarFallback>{initials(client.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display text-xl">{client.name}</p>
              <p className="text-xs text-muted-foreground">
                Joined {formatDate(client.joinedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditProfileOpen(true)}
            aria-label="Edit profile"
            className="grid h-9 w-9 place-items-center rounded-sm hover:bg-muted"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Date of Birth
            </dt>
            <dd className="mt-1">
              {client.profile.dob ? formatDate(client.profile.dob) : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Weight
            </dt>
            <dd className="mt-1">
              {client.profile.weight !== null ? `${client.profile.weight} kg` : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Height
            </dt>
            <dd className="mt-1">
              {client.profile.height !== null ? `${client.profile.height} cm` : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Phone
            </dt>
            <dd className="mt-1">{client.profile.phone ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Nationality
            </dt>
            <dd className="mt-1">{client.profile.nationality ?? "Not set"}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
        <div className="border border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="font-display text-xl">Current Split</p>
            <button
              onClick={() => setAssignSplitOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-sm bg-foreground px-4 text-xs font-medium uppercase tracking-[0.18em] text-background"
            >
              <Plus className="h-3.5 w-3.5" />
              {currentProgress?.status === "in-progress" ? "Replace Split" : "Assign Split"}
            </button>
          </div>

          {client.currentAssignment && currentProgress ? (
            <div className="mt-6">
              <p className="text-lg font-medium">{client.currentAssignment.splitName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Started {formatDate(client.currentAssignment.startDate)} · Ends{" "}
                {formatDate(currentProgress.endDate.toISOString())}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Progress value={currentProgress.percent} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{currentProgress.percent}%</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{currentProgress.weekLabel}</span>
                <Badge variant={STATUS_VARIANT[currentProgress.status]}>
                  {STATUS_LABEL[currentProgress.status]}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">No split assigned yet.</p>
          )}
        </div>

        <div className="border border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="font-display text-xl">Current Diet Plan</p>
            <button
              onClick={() => setAssignDietPlanOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-sm bg-foreground px-4 text-xs font-medium uppercase tracking-[0.18em] text-background"
            >
              <Plus className="h-3.5 w-3.5" />
              {client.currentDietPlan ? "Replace Diet Plan" : "Assign Diet Plan"}
            </button>
          </div>

          {client.currentDietPlan ? (
            <div className="mt-6">
              <p className="text-lg font-medium">{client.currentDietPlan.dietPlanName}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assigned since {formatDate(client.currentDietPlan.startDate)}
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">No diet plan assigned yet.</p>
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl">Split History</h2>
        <div className="mt-4 border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Split</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No previous splits.
                  </TableCell>
                </TableRow>
              )}
              {client.history.map((assignment) => (
                <AssignmentRow key={assignment.id} assignment={assignment} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-2xl">Diet Plan History</h2>
        <div className="mt-4 border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diet Plan</TableHead>
                <TableHead>Start Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {client.dietPlanHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                    No previous diet plans.
                  </TableCell>
                </TableRow>
              )}
              {client.dietPlanHistory.map((assignment) => (
                <DietAssignmentRow key={assignment.id} assignment={assignment} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ClientProfileFormDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        client={client}
      />
      <AssignSplitDialog
        open={assignSplitOpen}
        onOpenChange={setAssignSplitOpen}
        clientId={client.id}
        currentAssignment={client.currentAssignment}
      />
      <AssignDietPlanDialog
        open={assignDietPlanOpen}
        onOpenChange={setAssignDietPlanOpen}
        clientId={client.id}
      />
    </div>
  );
}
