import bcrypt from "bcryptjs";
import type { ObjectId } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { UserRole } from "./types";

export interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  createdAt: Date;
}

// Hash of a throwaway string, computed once with the same cost factor as real
// password hashes. Checked against when no user is found so a login attempt
// for a nonexistent email takes the same time as a wrong-password attempt.
const DUMMY_PASSWORD_HASH = "$2b$12$dWrOmJVJ9gUOvswKTn1SrOfDbLrUbt/SQZrRVQUSyOIagGw61dHDq";

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const db = await getDb();
  return db.collection<UserDoc>("users").findOne({ email: email.toLowerCase() });
}

export async function verifyPassword(hash: string | undefined, plain: string): Promise<boolean> {
  return bcrypt.compare(plain, hash ?? DUMMY_PASSWORD_HASH);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
