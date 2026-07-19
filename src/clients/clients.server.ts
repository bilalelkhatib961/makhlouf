import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import { listDietPlanAssignmentsForClient } from "@/diet/diet-assignments.server";
import { listAssignmentsForClient } from "./assignments.server";
import type { ClientDetail, ClientListItem, ClientProfile, ClientProfileInput } from "./types";

export interface ClientProfileDoc {
  _id: ObjectId;
  userId: ObjectId;
  dob: Date | null;
  weight: number | null;
  height: number | null;
  phone: string | null;
  nationality: string | null;
  profilePicture: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientUserDoc {
  _id: ObjectId;
  email: string;
  name: string;
  role: "coach" | "client";
  createdAt: Date;
}

async function profilesCollection(): Promise<Collection<ClientProfileDoc>> {
  const db = await getDb();
  return db.collection<ClientProfileDoc>("clientProfiles");
}

function toProfile(doc: ClientProfileDoc | null | undefined): ClientProfile {
  return {
    dob: doc?.dob ? doc.dob.toISOString() : null,
    weight: doc?.weight ?? null,
    height: doc?.height ?? null,
    phone: doc?.phone ?? null,
    nationality: doc?.nationality ?? null,
    profilePicture: doc?.profilePicture ?? null,
  };
}

export async function listClients(): Promise<ClientListItem[]> {
  const db = await getDb();
  const [users, profiles] = await Promise.all([
    db.collection<ClientUserDoc>("users").find({ role: "client" }).sort({ name: 1 }).toArray(),
    (await profilesCollection()).find().toArray(),
  ]);
  const profileByUserId = new Map(profiles.map((p) => [p.userId.toString(), p]));

  return Promise.all(
    users.map(async (user) => {
      const [assignments, dietAssignments] = await Promise.all([
        listAssignmentsForClient(user._id.toString()),
        listDietPlanAssignmentsForClient(user._id.toString()),
      ]);
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        joinedAt: user.createdAt.toISOString(),
        profile: toProfile(profileByUserId.get(user._id.toString())),
        currentAssignment: assignments[0] ?? null,
        currentDietPlan: dietAssignments[0] ?? null,
      };
    }),
  );
}

export async function getClientDetail(userId: string): Promise<ClientDetail> {
  const db = await getDb();
  const user = await db
    .collection<ClientUserDoc>("users")
    .findOne({ _id: new ObjectId(userId), role: "client" });
  if (!user) throw new Error("Client not found");

  const [profileDoc, assignments, dietAssignments] = await Promise.all([
    (await profilesCollection()).findOne({ userId: user._id }),
    listAssignmentsForClient(userId),
    listDietPlanAssignmentsForClient(userId),
  ]);
  const [currentAssignment, ...history] = assignments;
  const [currentDietPlan, ...dietPlanHistory] = dietAssignments;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    joinedAt: user.createdAt.toISOString(),
    profile: toProfile(profileDoc),
    currentAssignment: currentAssignment ?? null,
    history,
    currentDietPlan: currentDietPlan ?? null,
    dietPlanHistory,
  };
}

export async function upsertClientProfile(
  userId: string,
  input: ClientProfileInput,
): Promise<void> {
  const db = await getDb();
  const user = await db
    .collection<ClientUserDoc>("users")
    .findOne({ _id: new ObjectId(userId), role: "client" });
  if (!user) throw new Error("Client not found");

  const collection = await profilesCollection();
  const now = new Date();
  await collection.updateOne(
    { userId: user._id },
    {
      $set: {
        dob: input.dob ? new Date(input.dob) : null,
        weight: input.weight,
        height: input.height,
        phone: input.phone,
        nationality: input.nationality,
        profilePicture: input.profilePicture,
        updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), userId: user._id, createdAt: now },
    },
    { upsert: true },
  );
}
