import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge } from "@/components/ui/badge";
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

const CLIENTS = [
  {
    name: "Jordan Ellis",
    email: "client@makhlouf.com",
    plan: "Elite Coaching",
    status: "Active",
    joined: "Jan 2025",
  },
  {
    name: "Casey Brooks",
    email: "casey@example.com",
    plan: "Programming Only",
    status: "Active",
    joined: "Mar 2025",
  },
  {
    name: "Riley Chen",
    email: "riley@example.com",
    plan: "Elite Coaching",
    status: "Active",
    joined: "Apr 2025",
  },
  {
    name: "Sam Whitfield",
    email: "sam@example.com",
    plan: "Hybrid",
    status: "Paused",
    joined: "Nov 2024",
  },
  {
    name: "Morgan Blake",
    email: "morgan@example.com",
    plan: "Elite Coaching",
    status: "Active",
    joined: "Jun 2025",
  },
  {
    name: "Taylor Reyes",
    email: "taylor@example.com",
    plan: "Programming Only",
    status: "Trial",
    joined: "Jul 2025",
  },
] as const;

const STATUS_VARIANT = {
  Active: "default",
  Paused: "secondary",
  Trial: "outline",
} as const;

function ClientsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Roster"
        title="Clients."
        description="Everyone you currently coach. Placeholder roster — client management isn't wired up yet."
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background">
            <Plus className="h-4 w-4" /> Add Client
          </button>
        }
      />

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CLIENTS.map((client) => (
              <TableRow key={client.email}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="text-muted-foreground">{client.email}</TableCell>
                <TableCell>{client.plan}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[client.status]}>{client.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{client.joined}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
