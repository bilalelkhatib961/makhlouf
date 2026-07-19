import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db.server";
import type { Gallery, GalleryInput } from "./types";

export interface GalleryDoc {
  _id: ObjectId;
  name: string;
  description: string;
  images: Array<{ url: string }>;
  showOnLandingPage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

async function galleriesCollection(): Promise<Collection<GalleryDoc>> {
  const db = await getDb();
  return db.collection<GalleryDoc>("galleries");
}

function toGallery(doc: GalleryDoc): Gallery {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    images: doc.images,
    showOnLandingPage: doc.showOnLandingPage,
  };
}

export async function listGalleriesAdmin(): Promise<Gallery[]> {
  const collection = await galleriesCollection();
  const docs = await collection.find().sort({ createdAt: 1 }).toArray();
  return docs.map(toGallery);
}

export async function listGalleriesPublic(onlyLandingPage: boolean): Promise<Gallery[]> {
  const collection = await galleriesCollection();
  const query = onlyLandingPage ? { showOnLandingPage: true } : {};
  const docs = await collection.find(query).sort({ createdAt: 1 }).toArray();
  return docs.map(toGallery);
}

export async function createGallery(input: GalleryInput): Promise<Gallery> {
  const collection = await galleriesCollection();
  const now = new Date();
  const doc: GalleryDoc = {
    _id: new ObjectId(),
    name: input.name.trim(),
    description: input.description.trim(),
    images: input.images,
    showOnLandingPage: input.showOnLandingPage,
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(doc);
  return toGallery(doc);
}

export async function updateGallery(id: string, input: GalleryInput): Promise<void> {
  const collection = await galleriesCollection();
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: input.name.trim(),
        description: input.description.trim(),
        images: input.images,
        showOnLandingPage: input.showOnLandingPage,
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) throw new Error("Gallery not found");
}

export async function deleteGallery(id: string): Promise<void> {
  const collection = await galleriesCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) throw new Error("Gallery not found");
}
