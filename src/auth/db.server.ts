import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | undefined;

function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI env var is required");
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB_NAME ?? "makhlouf");
}
