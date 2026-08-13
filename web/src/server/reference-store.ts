import { eq } from "drizzle-orm";
import { references } from "@/db/schema";
import { getDatabase } from "@/server/db";

export async function saveUploadedReference(input: { blobUrl: string; title: string; mimeType?: string; notes?: string; sourceChannel?: string }) {
  const database = getDatabase();
  const [reference] = await database.insert(references).values({ kind: "upload", title: input.title, blobUrl: input.blobUrl, notes: input.notes, sourceChannel: input.sourceChannel, verificationStatus: "unverified", tags: input.mimeType ? [input.mimeType] : [] }).returning();
  return reference;
}

export async function deleteReference(id: string) {
  const database = getDatabase();
  return database.delete(references).where(eq(references.id, id)).returning();
}
