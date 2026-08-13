import { eq } from "drizzle-orm";

import { contentItems, gateRuns, ideaSources, ideas, productionDocuments, syncJobs } from "@/db/schema";
import type { ResearchCoverageEntry, ResearchSourceGroup } from "@/domain/research-coverage";
import { getDatabase } from "@/server/db";
import { env } from "@/server/env";
import { createGoogleClients, createApprovedWorkspaceArtifacts, readProductTruthForModule } from "@/server/google/operations";
import { decryptToken } from "@/server/google/oauth";
import { loadGoogleIntegration } from "@/server/integration-store";
import { readIdempotentResponse, storeIdempotentResponse } from "@/server/postgres-repository";
import { validateApproval } from "@/server/validation";

function coverageFromSources(sources: Array<{ sourceGroup: string; url: string | null; status: string; limitation: string | null }>): ResearchCoverageEntry[] {
  const groups = new Map<ResearchSourceGroup, ResearchCoverageEntry>();
  for (const source of sources) {
    const group = source.sourceGroup as ResearchSourceGroup;
    const current = groups.get(group) || { group, status: source.status as ResearchCoverageEntry["status"], references: [], note: source.limitation || undefined };
    if (source.url) current.references.push(source.url);
    groups.set(group, current);
  }
  return [...groups.values()];
}

export async function approveIdeaDurably(input: { ideaId: string; idempotencyKey: string; actorEmail: string; reviewerNote?: string }) {
  const prior = await readIdempotentResponse<unknown>(input.idempotencyKey);
  if (prior) return prior;
  const database = getDatabase();
  const idea = await database.query.ideas.findFirst({ where: eq(ideas.id, input.ideaId) });
  if (!idea) throw new Error("Idea not found.");
  if (!(["surfaced", "saved"] as string[]).includes(idea.status)) throw new Error(`Idea cannot be approved from ${idea.status}.`);
  await database.update(ideas).set({ status: "validating", updatedAt: new Date() }).where(eq(ideas.id, idea.id));
  const sources = await database.select().from(ideaSources).where(eq(ideaSources.ideaId, idea.id));

  let productTruth: Awaited<ReturnType<typeof readProductTruthForModule>> | undefined;
  let clients: ReturnType<typeof createGoogleClients> | undefined;
  if (idea.productLed || env.ENABLE_GOOGLE_WRITES === "true") {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.TOKEN_ENCRYPTION_KEY) throw new Error("Google Workspace is not fully configured.");
    const integration = await loadGoogleIntegration(input.actorEmail);
    const refreshToken = decryptToken(integration.encryptedRefreshToken!, env.TOKEN_ENCRYPTION_KEY);
    clients = createGoogleClients(refreshToken, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, "");
    if (idea.productLed && idea.productModule) productTruth = await readProductTruthForModule(clients, idea.productModule);
  }
  const validation = validateApproval({ channel: idea.channel, g9Passed: idea.g9Passed, coverage: coverageFromSources(sources), productLed: idea.productLed, productModule: idea.productModule, productTruth });
  await database.insert(gateRuns).values([
    { gateId: "G3", ideaId: idea.id, decision: "passed", evaluator: "Priyansh", inputs: { reviewerNote: input.reviewerNote || null }, evidence: {}, schemaVersion: "1" },
    { gateId: "G4", ideaId: idea.id, decision: validation.passed ? "passed" : "needs_human_review", evaluator: "Content Director", inputs: { conceptKey: idea.conceptKey, hookKey: idea.hookKey }, evidence: { reasons: validation.reasons }, reason: validation.reasons.join(" ") || null, schemaVersion: "1" },
  ]);
  if (!validation.passed) {
    await database.update(ideas).set({ status: "needs_review", updatedAt: new Date() }).where(eq(ideas.id, idea.id));
    const response = { id: idea.id, status: "needs_review" as const, reasons: validation.reasons };
    await storeIdempotentResponse(input.idempotencyKey, response);
    return response;
  }

  const parentPackId = `PACK-${idea.id.slice(0, 8).toUpperCase()}`;
  const [content] = await database.insert(contentItems).values({ ideaId: idea.id, channel: idea.channel, topic: idea.topic, approach: idea.approach, category: idea.category, format: idea.format, parentPackId, conceptKey: idea.conceptKey, hookKey: idea.hookKey }).returning();
  await database.update(ideas).set({ status: "approved", parentPackId, updatedAt: new Date() }).where(eq(ideas.id, idea.id));
  await database.insert(productionDocuments).values({ contentItemId: content.id, syncStatus: "pending" });

  if (env.ENABLE_GOOGLE_WRITES === "true" && clients) {
    try {
      const artifacts = await createApprovedWorkspaceArtifacts({ clients, contentId: content.id, channel: content.channel, topic: content.topic, approach: content.approach, category: content.category, format: content.format, documentBody: [content.topic, "", "VALIDATED TREATMENT", content.approach, "", "SOURCES", ...sources.map((source) => source.url).filter(Boolean) as string[], ...(validation.approvedSafeWording ? ["", "APPROVED PRODUCT WORDING", validation.approvedSafeWording] : []), ...(validation.limitations.length ? ["", "REQUIRED LIMITATIONS", ...validation.limitations] : [])].join("\n") });
      await database.update(productionDocuments).set({ googleDocId: artifacts.googleDocId, googleDocUrl: artifacts.googleDocUrl, sheetMetadataId: artifacts.metadataId, syncStatus: "synced", updatedAt: new Date() }).where(eq(productionDocuments.contentItemId, content.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sync failed.";
      await database.update(productionDocuments).set({ syncStatus: "failed", lastError: message, updatedAt: new Date() }).where(eq(productionDocuments.contentItemId, content.id));
      await database.insert(syncJobs).values({ contentItemId: content.id, action: "create_approved_artifacts", status: "failed", attempt: 1, lastError: message });
    }
  }
  const response = { id: idea.id, status: "approved" as const, contentId: content.id, syncEnabled: env.ENABLE_GOOGLE_WRITES === "true" };
  await storeIdempotentResponse(input.idempotencyKey, response);
  return response;
}
