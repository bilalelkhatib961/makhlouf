import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { ContactMessageInput } from "./types";

export interface ContactMessageDoc {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: Date;
}

export async function submitContactMessage(input: ContactMessageInput): Promise<void> {
  const db = await getDb();
  await db.collection<ContactMessageDoc>("contactMessages").insertOne({
    _id: new ObjectId(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    message: input.message,
    createdAt: new Date(),
  });
}
