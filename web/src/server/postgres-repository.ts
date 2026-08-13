import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";

import { auditEvents, generationBatches, generationJobs, ideaSources, ideas, idempotencyKeys } from "@/db/schema";
import type { Channel, IdeaStatus } from "@/domain/content-system";
import type { IdeationCandidate } from "@/server/agents/schemas";
import { getDatabase } from "@/server/db";

export async function readIdempotentResponse<T>(key: string): Promise<T | undefined> {
  const database = getDatabase();
  const row = await database.query.idempotencyKeys.findFirst({ where: eq(idempotencyKeys.key, key) });
  return row?.response as T | undefined;
}

export async function storeIdempotentResponse(key: string, response: unknown): Promise<void> {
  const database = getDatabase();
  await database.insert(idempotencyKeys).values({ key, response }).onConflictDoNothing({ target: idempotencyKeys.key });
}

export async function createGenerationBatch(input: {
  kind: "daily" | "custom";
  localDate: string;
  prompt?: string;
  results: Array<{ channel: Channel; candidates: IdeationCandidate[] }>;
}) {
  const database = getDatabase();
  const [batch] = await database.insert(generationBatches).values({ kind: input.kind, localDate: input.localDate, prompt: input.prompt, status: "complete" }).returning();
  for (const result of input.results) {
    const surfaced = result.candidates.slice(0, 4);
    await database.insert(generationJobs).values({ batchId: batch.id, channel: result.channel, attempt: 1, status: surfaced.length === 4 ? "complete" : "incomplete", error: surfaced.length === 4 ? null : `Only ${surfaced.length} qualified ideas survived.` });
    for (const candidate of surfaced) {
      const [idea] = await database.insert(ideas).values({
        batchId: batch.id,
        channel: candidate.channel,
        topic: candidate.topic,
        approach: candidate.approach,
        category: candidate.category,
        format: candidate.format,
        whyNow: candidate.whyNow,
        evidenceSummary: candidate.evidenceSummary,
        score: candidate.score,
        conceptKey: candidate.conceptKey,
        hookKey: candidate.hookKey,
        productLed: candidate.productLed,
        productModule: candidate.productModule,
        riskOrLimitation: candidate.riskOrLimitation,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).onConflictDoNothing().returning({ id: ideas.id });
      if (!idea) continue;
      const sources = candidate.researchCoverage.flatMap((coverage) => {
        if (!coverage.references.length) return [{ ideaId: idea.id, sourceGroup: coverage.group, status: coverage.status, limitation: coverage.note }];
        return coverage.references.map((url) => ({ ideaId: idea.id, sourceGroup: coverage.group, url, status: coverage.status, limitation: coverage.note }));
      });
      if (sources.length) await database.insert(ideaSources).values(sources);
    }
  }
  return batch;
}

export async function setIdeaStatus(input: { id: string; status: IdeaStatus; allowedFrom: IdeaStatus[]; actorEmail: string }) {
  const database = getDatabase();
  const [updated] = await database.update(ideas).set({ status: input.status, updatedAt: new Date() }).where(and(eq(ideas.id, input.id), inArray(ideas.status, input.allowedFrom))).returning();
  if (!updated) throw new Error(`Idea ${input.id} is missing or cannot move to ${input.status}.`);
  await database.insert(auditEvents).values({ action: `idea.${input.status}`, entityType: "idea", entityId: updated.id, payload: { actorEmail: input.actorEmail, previousAllowed: input.allowedFrom } });
  return updated;
}

export async function archiveExpiredIdeas(): Promise<number> {
  const database = getDatabase();
  const archived = await database.update(ideas).set({ status: "archived", updatedAt: new Date() }).where(and(eq(ideas.status, "surfaced"), lt(ideas.expiresAt, new Date()))).returning({ id: ideas.id });
  return archived.length;
}

export async function listIdeaWall(channel?: Channel) {
  const database = getDatabase();
  return database.select().from(ideas).where(channel ? and(eq(ideas.status, "surfaced"), eq(ideas.channel, channel)) : eq(ideas.status, "surfaced")).orderBy(desc(ideas.createdAt));
}

export async function hasCompleteDailyBatch(localDate: string): Promise<boolean> {
  const database = getDatabase();
  const rows = await database.select({ count: sql<number>`count(*)` }).from(generationJobs).innerJoin(generationBatches, eq(generationJobs.batchId, generationBatches.id)).where(and(eq(generationBatches.kind, "daily"), eq(generationBatches.localDate, localDate), eq(generationJobs.status, "complete")));
  return Number(rows[0]?.count || 0) >= 4;
}
