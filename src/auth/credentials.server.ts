import bcrypt from "bcryptjs";
import { MongoServerError, ObjectId } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { AppUser, UserRole } from "./types";

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

// Self-registration — always creates a "client" account (the coach account is
// singular and pre-seeded, never created through this path).
export async function createClientUser(
  email: string,
  name: string,
  password: string,
): Promise<AppUser> {
  const db = await getDb();
  const passwordHash = await hashPassword(password);
  const normalizedEmail = email.toLowerCase();
  const _id = new ObjectId();
  try {
    await db.collection<UserDoc>("users").insertOne({
      _id,
      email: normalizedEmail,
      passwordHash,
      role: "client",
      name,
      createdAt: new Date(),
    });
  } catch (err) {
    if (err instanceof MongoServerError && err.code === 11000) {
      throw new Error("An account with this email already exists.");
    }
    throw err;
  }
  return { id: _id.toString(), email: normalizedEmail, name, role: "client" };
}

export async function updateUserName(userId: string, name: string): Promise<void> {
  const db = await getDb();
  await db
    .collection<UserDoc>("users")
    .updateOne({ _id: new ObjectId(userId) }, { $set: { name } });
}
