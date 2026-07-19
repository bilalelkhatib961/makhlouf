export type PackageSlug = "basic" | "premium";

export interface SubscriptionPackage {
  id: string;
  slug: PackageSlug;
  name: string;
  price: number;
  durationMonths: number;
  benefits: string[];
}

export interface SubscriptionAssignment {
  id: string;
  packageId: string;
  packageName: string;
  price: number;
  durationMonths: number;
  startDate: string; // ISO date string
}

export interface AssignPackageInput {
  clientId: string;
  packageId: string;
  startDate: string; // ISO date string
}
