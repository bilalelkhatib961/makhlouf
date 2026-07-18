export type UserRole = "coach" | "client";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
