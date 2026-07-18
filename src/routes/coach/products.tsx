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

export const Route = createFileRoute("/coach/products")({
  component: ProductsPage,
});

const PRODUCTS = [
  {
    name: "Makhlouf Protein · Isolate",
    category: "Supplement",
    price: "$64",
    stock: "142",
    status: "Active",
  },
  {
    name: "Iron Heavyweight Hoodie",
    category: "Apparel",
    price: "$128",
    stock: "58",
    status: "Active",
  },
  {
    name: "Pro Lifting Straps",
    category: "Accessory",
    price: "$32",
    stock: "210",
    status: "Active",
  },
  {
    name: "Matte Steel Shaker",
    category: "Accessory",
    price: "$28",
    stock: "12",
    status: "Low Stock",
  },
  {
    name: "12-Week Hypertrophy Block",
    category: "Program",
    price: "$149",
    stock: "—",
    status: "Active",
  },
  {
    name: "Performance Training Tee",
    category: "Apparel",
    price: "$58",
    stock: "0",
    status: "Out of Stock",
  },
] as const;

const STATUS_VARIANT = {
  Active: "default",
  "Low Stock": "secondary",
  "Out of Stock": "destructive",
} as const;

function ProductsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Storefront"
        title="Products."
        description="What's live in the shop. Placeholder catalog — product management isn't wired up yet."
        action={
          <button className="inline-flex h-11 items-center gap-2 rounded-sm bg-foreground px-5 text-xs font-medium uppercase tracking-[0.18em] text-background">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        }
      />

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRODUCTS.map((product) => (
              <TableRow key={product.name}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.category}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell className="text-muted-foreground">{product.stock}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[product.status]}>{product.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
