import { and, desc, eq } from "drizzle-orm";

import { contentItems, draftVersions, gateRuns, productionDocuments, scheduleSlots } from "@/db/schema";
import { assertContentTransition, type Channel } from "@/domain/content-system";
import { suggestNextSlot } from "@/domain/cadence";
import { createProductionPacket } from "@/server/agents/openai";
import { productionPacketSchema } from "@/server/agents/schemas";
import { getDatabase } from "@/server/db";
import { reviewProductionPacket } from "@/server/editorial";
import { readIdempotentResponse, storeIdempotentResponse } from "@/server/postgres-repository";

export async function createFirstDraft(input: { contentItemId: string; prompt: string }) {
  const database = getDatabase();
  const packet = await createProductionPacket(input.prompt);
  const [draft] = await database.insert(draftVersions).values({ contentItemId: input.contentItemId, version: 1, body: packet, revisionType: "initial" }).returning();
  await database.update(contentItems).set({ status: "drafting", selectedDraftVersionId: draft.id, updatedAt: new Date() }).where(eq(contentItems.id, input.contentItemId));
  return draft;
}

export async function reviseDraft(input: { draftId: string; type: "rewrite" | "recreate" | "restore"; instruction?: string; sourceVersionId?: string; idempotencyKey: string }) {
  const prior = await readIdempotentResponse<unknown>(input.idempotencyKey);
  if (prior) return prior;
  const database = getDatabase();
  const draft = await database.query.draftVersions.findFirst({ where: eq(draftVersions.id, input.draftId) });
  if (!draft) throw new Error("Draft version not found.");
  const content = await database.query.contentItems.findFirst({ where: eq(contentItems.id, draft.contentItemId) });
  if (!content) throw new Error("Content item not found.");
  const latest = await database.query.draftVersions.findFirst({ where: eq(draftVersions.contentItemId, content.id), orderBy: [desc(draftVersions.version)] });
  let body: Record<string, unknown>;
  if (input.type === "restore") {
    if (!input.sourceVersionId) throw new Error("A source version is required to restore.");
    const source = await database.query.draftVersions.findFirst({ where: and(eq(draftVersions.id, input.sourceVersionId), eq(draftVersions.contentItemId, content.id)) });
    if (!source) throw new Error("Restore source does not belong to this content item.");
    body = source.body;
  } else {
    body = await createProductionPacket(`Create a ${content.channel} ${content.format} for this approved treatment: ${content.topic}. ${content.approach}\nExisting immutable version: ${JSON.stringify(draft.body)}\nRevision mode: ${input.type}. Instruction: ${input.instruction || "Recreate from the approved brief."}\nDo not introduce new claims or sources.`);
  }
  const [created] = await database.insert(draftVersions).values({ contentItemId: content.id, version: (latest?.version || 0) + 1, body, revisionType: input.type, instruction: input.instruction, restoredFromId: input.type === "restore" ? input.sourceVersionId : undefined }).returning();
  await database.update(contentItems).set({ status: "drafting", selectedDraftVersionId: created.id, updatedAt: new Date() }).where(eq(contentItems.id, content.id));
  const response = { draftId: created.id, contentId: content.id, version: created.version, status: "drafting" as const };
  await storeIdempotentResponse(input.idempotencyKey, response);
  return response;
}

export async function submitDraftForReview(input: { draftId: string; idempotencyKey: string }) {
  const prior = await readIdempotentResponse<unknown>(input.idempotencyKey);
  if (prior) return prior;
  const database = getDatabase();
  const draft = await database.query.draftVersions.findFirst({ where: eq(draftVersions.id, input.draftId) });
  if (!draft) throw new Error("Draft version not found.");
  const content = await database.query.contentItems.findFirst({ where: eq(contentItems.id, draft.contentItemId) });
  if (!content) throw new Error("Content item not found.");
  assertContentTransition(content.status, "review");
  const packet = productionPacketSchema.parse(draft.body);
  const review = reviewProductionPacket(packet);
  await database.update(contentItems).set({ status: review.passed ? "ready" : "review", selectedDraftVersionId: draft.id, updatedAt: new Date() }).where(eq(contentItems.id, content.id));
  await database.insert(gateRuns).values([
    { gateId: "G6", contentItemId: content.id, draftVersionId: draft.id, decision: review.g6.length ? "failed" : "passed", evaluator: "Copy & Production Agent", inputs: { version: draft.version }, evidence: { issues: review.g6 }, reason: review.g6.join(" ") || null, schemaVersion: "1" },
    { gateId: "G7", contentItemId: content.id, draftVersionId: draft.id, decision: review.g7.length ? "failed" : "passed", evaluator: "Editorial & Trust Agent", inputs: { version: draft.version }, evidence: { issues: review.g7 }, reason: review.g7.join(" ") || null, schemaVersion: "1" },
  ]);
  const response = { draftId: draft.id, contentId: content.id, status: review.passed ? "ready" as const : "review" as const, issues: [...review.g6, ...review.g7] };
  await storeIdempotentResponse(input.idempotencyKey, response);
  return response;
}

export async function finalApprove(input: { contentItemId: string; selectedDraftVersionId: string; idempotencyKey: string }) {
  const prior = await readIdempotentResponse<unknown>(input.idempotencyKey);
  if (prior) return prior;
  const database = getDatabase();
  const content = await database.query.contentItems.findFirst({ where: eq(contentItems.id, input.contentItemId) });
  if (!content || content.status !== "ready") throw new Error("Only Ready content can receive G8 final approval.");
  const draft = await database.query.draftVersions.findFirst({ where: and(eq(draftVersions.id, input.selectedDraftVersionId), eq(draftVersions.contentItemId, content.id)) });
  if (!draft) throw new Error("Selected draft does not belong to this content item.");
  const production = await database.query.productionDocuments.findFirst({ where: eq(productionDocuments.contentItemId, content.id) });
  if (!production || production.syncStatus !== "synced") throw new Error("Calendar eligibility is blocked until the Google Sheet row and production Doc are synced.");
  await database.update(draftVersions).set({ approved: true, updatedAt: new Date() }).where(eq(draftVersions.id, draft.id));
  await database.update(contentItems).set({ selectedDraftVersionId: draft.id, finalApprovedAt: new Date(), updatedAt: new Date() }).where(eq(contentItems.id, content.id));
  await database.insert(gateRuns).values({ gateId: "G8", contentItemId: content.id, draftVersionId: draft.id, decision: "passed", evaluator: "Priyansh", inputs: { version: draft.version }, evidence: {}, schemaVersion: "1" });
  const occupied = (await database.select({ scheduledFor: scheduleSlots.scheduledFor }).from(scheduleSlots).where(eq(scheduleSlots.channel, content.channel))).map((slot) => slot.scheduledFor.toISOString());
  const suggestion = suggestNextSlot({ channel: content.channel, after: new Date(), occupied });
  const [slot] = await database.insert(scheduleSlots).values({ contentItemId: content.id, channel: content.channel, scheduledFor: suggestion, status: "suggested" }).returning();
  const response = { contentId: content.id, selectedDraftVersionId: draft.id, finalApproved: true, suggestedScheduleId: slot.id, suggestedFor: suggestion.toISOString() };
  await storeIdempotentResponse(input.idempotencyKey, response);
  return response;
}

export async function confirmSchedule(input: { contentItemId: string; channel: Channel; scheduledFor: Date; idempotencyKey: string }) {
  const prior = await readIdempotentResponse<unknown>(input.idempotencyKey);
  if (prior) return prior;
  const database = getDatabase();
  const content = await database.query.contentItems.findFirst({ where: eq(contentItems.id, input.contentItemId) });
  if (!content?.finalApprovedAt) throw new Error("G8 final approval is required before calendar confirmation.");
  if (content.channel !== input.channel) throw new Error("Schedule channel must match the approved content channel.");
  const production = await database.query.productionDocuments.findFirst({ where: eq(productionDocuments.contentItemId, content.id) });
  if (production?.syncStatus !== "synced") throw new Error("Google Workspace sync must be healthy before calendar confirmation.");
  const [slot] = await database.insert(scheduleSlots).values({ contentItemId: content.id, channel: input.channel, scheduledFor: input.scheduledFor, status: "confirmed" }).returning();
  const response = { scheduleId: slot.id, status: slot.status, scheduledFor: slot.scheduledFor.toISOString() };
  await storeIdempotentResponse(input.idempotencyKey, response);
  return response;
}
