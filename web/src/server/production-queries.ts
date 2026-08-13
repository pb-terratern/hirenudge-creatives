import { and, arrayContains, asc, desc, eq, gte, ilike, lt, or } from "drizzle-orm";

import { contentItems, draftVersions, gateRuns, ideaSources, integrationAccounts, productionDocuments, references, scheduleSlots } from "@/db/schema";
import { getDatabase } from "@/server/db";
import { env } from "@/server/env";
import { assertAllowedReferenceUrl } from "@/server/security";

export type PipelineQuery = {
  status?: "approved_topic" | "drafting" | "review" | "ready" | "published";
  search?: string;
};

export async function listPipelineItems(input: PipelineQuery = {}) {
  const database = getDatabase();
  const query = database
    .select({
      content: contentItems,
      production: {
        syncStatus: productionDocuments.syncStatus,
        googleDocUrl: productionDocuments.googleDocUrl,
      },
      selectedDraft: {
        id: draftVersions.id,
        version: draftVersions.version,
        approved: draftVersions.approved,
      },
    })
    .from(contentItems)
    .leftJoin(productionDocuments, eq(productionDocuments.contentItemId, contentItems.id))
    .leftJoin(draftVersions, eq(draftVersions.id, contentItems.selectedDraftVersionId));

  const searchCondition = input.search ? or(ilike(contentItems.topic, `%${input.search}%`), ilike(contentItems.category, `%${input.search}%`)) : undefined;
  const condition = input.status && searchCondition
    ? and(eq(contentItems.status, input.status), searchCondition)
    : input.status ? eq(contentItems.status, input.status) : searchCondition;
  const rows = await (condition ? query.where(condition).orderBy(desc(contentItems.updatedAt)) : query.orderBy(desc(contentItems.updatedAt)));

  return rows.map((row) => ({
    ...row.content,
    sync: {
      status: row.production?.syncStatus || "pending",
      documentUrl: row.production?.googleDocUrl || null,
    },
    selectedDraft: row.selectedDraft?.id ? row.selectedDraft : null,
  }));
}

export async function listCalendarSlots(input: { start: Date; end: Date }) {
  const database = getDatabase();
  const rows = await database
    .select({
      slot: scheduleSlots,
      content: {
        id: contentItems.id,
        topic: contentItems.topic,
        format: contentItems.format,
        status: contentItems.status,
      },
    })
    .from(scheduleSlots)
    .innerJoin(contentItems, eq(contentItems.id, scheduleSlots.contentItemId))
    .where(and(gte(scheduleSlots.scheduledFor, input.start), lt(scheduleSlots.scheduledFor, input.end)))
    .orderBy(asc(scheduleSlots.scheduledFor));

  return rows.map((row) => ({ ...row.slot, scheduledFor: row.slot.scheduledFor.toISOString(), content: row.content }));
}

export async function listReferences(input: { search?: string; tag?: string; verificationStatus?: string } = {}) {
  const database = getDatabase();
  const conditions = [
    input.search ? or(ilike(references.title, `%${input.search}%`), ilike(references.notes, `%${input.search}%`)) : undefined,
    input.tag ? arrayContains(references.tags, [input.tag]) : undefined,
    input.verificationStatus ? eq(references.verificationStatus, input.verificationStatus) : undefined,
  ].filter((condition) => condition !== undefined);
  const query = database.select().from(references);
  const rows = await (conditions.length ? query.where(and(...conditions)).orderBy(desc(references.updatedAt)) : query.orderBy(desc(references.updatedAt)));

  return rows.map((row) => {
    const { extractedText, ...reference } = row;
    void extractedText;
    return reference;
  });
}

export async function createReferenceFromUrl(input: { url: string; title: string; notes?: string; tags?: string[]; sourceChannel?: string }) {
  const safeUrl = assertAllowedReferenceUrl(input.url);
  const database = getDatabase();
  const [created] = await database
    .insert(references)
    .values({
      kind: "url",
      title: input.title,
      url: safeUrl.toString(),
      notes: input.notes,
      tags: input.tags || [],
      sourceChannel: input.sourceChannel,
      verificationStatus: "unverified",
    })
    .returning();
  const { extractedText, ...reference } = created;
  void extractedText;
  return reference;
}

export async function getDraftWorkspace(contentItemId: string) {
  const database = getDatabase();
  const [row] = await database
    .select({
      content: contentItems,
      production: {
        syncStatus: productionDocuments.syncStatus,
        googleDocUrl: productionDocuments.googleDocUrl,
      },
    })
    .from(contentItems)
    .leftJoin(productionDocuments, eq(productionDocuments.contentItemId, contentItems.id))
    .where(eq(contentItems.id, contentItemId))
    .orderBy(desc(contentItems.updatedAt));
  if (!row) return undefined;

  const [versions, gates, sources] = await Promise.all([
    database.select({
      id: draftVersions.id,
      version: draftVersions.version,
      body: draftVersions.body,
      revisionType: draftVersions.revisionType,
      instruction: draftVersions.instruction,
      restoredFromId: draftVersions.restoredFromId,
      approved: draftVersions.approved,
      createdAt: draftVersions.createdAt,
    }).from(draftVersions).where(eq(draftVersions.contentItemId, row.content.id)).orderBy(desc(draftVersions.version)),
    database.select({
      id: gateRuns.id,
      gateId: gateRuns.gateId,
      decision: gateRuns.decision,
      evaluator: gateRuns.evaluator,
      reason: gateRuns.reason,
      draftVersionId: gateRuns.draftVersionId,
      createdAt: gateRuns.createdAt,
    }).from(gateRuns).where(row.content.ideaId
      ? or(eq(gateRuns.contentItemId, row.content.id), eq(gateRuns.ideaId, row.content.ideaId))
      : eq(gateRuns.contentItemId, row.content.id)).orderBy(desc(gateRuns.createdAt)),
    row.content.ideaId
      ? database.select({
        source: {
          id: ideaSources.id,
          sourceGroup: ideaSources.sourceGroup,
          url: ideaSources.url,
          status: ideaSources.status,
          limitation: ideaSources.limitation,
        },
        reference: {
          id: references.id,
          title: references.title,
          url: references.url,
          verificationStatus: references.verificationStatus,
        },
      }).from(ideaSources).leftJoin(references, eq(references.id, ideaSources.referenceId)).where(eq(ideaSources.ideaId, row.content.ideaId)).orderBy(desc(ideaSources.createdAt))
      : Promise.resolve([]),
  ]);

  return {
    content: {
      ...row.content,
      sync: { status: row.production?.syncStatus || "pending", documentUrl: row.production?.googleDocUrl || null },
    },
    versions,
    gates,
    sources: sources.map(({ source, reference }) => ({ ...source, reference: reference?.id ? reference : null })),
  };
}

export async function getSettingsHealth() {
  const workspaceConfigured = Boolean(process.env.OPERATIONAL_SHEET_ID && process.env.PRODUCT_TRUTH_SHEET_ID && process.env.PRODUCTION_FOLDER_ID);
  const writesEnabled = env.ENABLE_GOOGLE_WRITES === "true";
  const googleWorkspace = {
    writesEnabled,
    manifestConfigured: workspaceConfigured,
    status: !workspaceConfigured ? "needs_configuration" : writesEnabled ? "enabled" : "disabled",
  };
  if (!env.DATABASE_URL) {
    return {
      database: { configured: false, status: "missing" },
      googleWorkspace,
      googleIntegration: { connected: false, status: "not_connected" },
    };
  }

  let integrations: Array<{ provider: string; expiresAt: Date | null }>;
  try {
    const database = getDatabase();
    integrations = await database
      .select({ provider: integrationAccounts.provider, expiresAt: integrationAccounts.expiresAt })
      .from(integrationAccounts)
      .where(eq(integrationAccounts.provider, "google-workspace"))
      .orderBy(desc(integrationAccounts.updatedAt));
  } catch {
    return {
      database: { configured: true, status: "unavailable" },
      googleWorkspace,
      googleIntegration: { connected: false, status: "unavailable" },
    };
  }
  const connected = integrations.length > 0;

  return {
    database: { configured: true, status: "configured" },
    googleWorkspace,
    googleIntegration: { connected, status: connected ? "connected" : "not_connected" },
  };
}
