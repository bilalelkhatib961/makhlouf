import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/coach/categories")({
  component: CategoriesPage,
});

const CATEGORIES = [
  { name: "Supplement", products: 1, description: "Protein, aminos, and performance fuel." },
  { name: "Apparel", products: 2, description: "Training tees, hoodies, and outerwear." },
  { name: "Accessory", products: 2, description: "Straps, shakers, and small gear." },
  { name: "Program", products: 1, description: "Structured multi-week training blocks." },
];

function CategoriesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Storefront"
        title="Categories."
        description="How products are grouped in the shop. Placeholder data — category management isn't wired up yet."
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background">
            <Plus className="h-4 w-4" /> Add Category
          </button>
        }
      />

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CATEGORIES.map((category) => (
              <TableRow key={category.name}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground">{category.products}</TableCell>
                <TableCell className="text-foreground/70">{category.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
