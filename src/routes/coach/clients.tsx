import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCoachClientsFn } from "@/clients/functions";
import { splitProgress } from "@/clients/progress";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/coach/clients")({
  component: ClientsPage,
});

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ClientsPage() {
  const navigate = useNavigate();
  const clientsQuery = useQuery({
    queryKey: ["coach", "clients"],
    queryFn: () => getCoachClientsFn(),
  });
  const clients = clientsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Roster"
        title="Clients."
        description="Everyone you currently coach, with their profile info and current program."
      />

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Nationality</TableHead>
              <TableHead>Current Split</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!clientsQuery.isLoading && clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No clients yet.
                </TableCell>
              </TableRow>
            )}
            {clients.map((client) => {
              const progress = client.currentAssignment
                ? splitProgress(
                    client.currentAssignment.startDate,
                    client.currentAssignment.durationWeeks,
                  )
                : null;
              return (
                <TableRow
                  key={client.id}
                  onClick={() =>
                    navigate({ to: "/coach/clients/$clientId", params: { clientId: client.id } })
                  }
                  className="cursor-pointer"
                >
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={client.profile.profilePicture ?? undefined} alt="" />
                      <AvatarFallback>{initials(client.name)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-muted-foreground">{client.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.profile.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.profile.nationality ?? "—"}
                  </TableCell>
                  <TableCell>
                    {client.currentAssignment && progress ? (
                      <div className="min-w-40">
                        <p className="text-sm">{client.currentAssignment.splitName}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Progress value={progress.percent} className="h-1.5 w-24" />
                          <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                            {progress.percent}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No active split</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(client.joinedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
