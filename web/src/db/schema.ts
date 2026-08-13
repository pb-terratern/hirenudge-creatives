import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const channelEnum = pgEnum("channel", ["linkedin", "instagram", "x", "youtube"]);
export const ideaStatusEnum = pgEnum("idea_status", [
  "surfaced",
  "saved",
  "rejected",
  "validating",
  "needs_review",
  "approved",
  "archived",
]);
export const contentStatusEnum = pgEnum("content_status", [
  "approved_topic",
  "drafting",
  "review",
  "ready",
  "published",
]);
export const gateDecisionEnum = pgEnum("gate_decision", [
  "passed",
  "failed",
  "needs_human_review",
  "blocked",
]);
export const syncStatusEnum = pgEnum("sync_status", ["pending", "synced", "failed"]);
export const scheduleStatusEnum = pgEnum("schedule_status", ["suggested", "confirmed", "cancelled"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  ...timestamps,
});

export const integrationAccounts = pgTable("integration_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  scope: text("scope"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  ...timestamps,
});

export const generationBatches = pgTable("generation_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  localDate: text("local_date").notNull(),
  prompt: text("prompt"),
  status: text("status").notNull().default("pending"),
  ...timestamps,
});

export const generationJobs = pgTable(
  "generation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id").references(() => generationBatches.id, { onDelete: "cascade" }).notNull(),
    channel: channelEnum("channel").notNull(),
    attempt: integer("attempt").notNull().default(0),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    ...timestamps,
  },
  (table) => [uniqueIndex("generation_job_attempt").on(table.batchId, table.channel, table.attempt)],
);

export const references = pgTable("references", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  blobUrl: text("blob_url"),
  notes: text("notes"),
  tags: text("tags").array().notNull().default([]),
  sourceChannel: text("source_channel"),
  verificationStatus: text("verification_status").notNull().default("unverified"),
  extractedText: text("extracted_text"),
  ...timestamps,
});

export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id").references(() => generationBatches.id, { onDelete: "set null" }),
    channel: channelEnum("channel").notNull(),
    topic: text("topic").notNull(),
    approach: text("approach").notNull(),
    category: text("category").notNull(),
    format: text("format").notNull(),
    whyNow: text("why_now"),
    evidenceSummary: text("evidence_summary"),
    status: ideaStatusEnum("status").notNull().default("surfaced"),
    score: integer("score").notNull().default(0),
    parentPackId: text("parent_pack_id"),
    conceptKey: text("concept_key").notNull(),
    hookKey: text("hook_key").notNull(),
    productLed: boolean("product_led").notNull().default(false),
    productModule: text("product_module"),
    riskOrLimitation: text("risk_or_limitation"),
    g9Passed: boolean("g9_passed").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ideas_concept_key_unique").on(table.conceptKey),
    uniqueIndex("ideas_hook_key_unique").on(table.hookKey),
    index("ideas_wall_lookup").on(table.status, table.channel, table.createdAt),
  ],
);

export const ideaSources = pgTable("idea_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "cascade" }).notNull(),
  referenceId: uuid("reference_id").references(() => references.id, { onDelete: "set null" }),
  sourceGroup: text("source_group").notNull(),
  url: text("url"),
  status: text("status").notNull(),
  limitation: text("limitation"),
  ...timestamps,
});

export const contentItems = pgTable("content_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "set null" }).unique(),
  channel: channelEnum("channel").notNull(),
  topic: text("topic").notNull(),
  approach: text("approach").notNull(),
  category: text("category").notNull(),
  format: text("format").notNull(),
  status: contentStatusEnum("status").notNull().default("approved_topic"),
  parentPackId: text("parent_pack_id").notNull(),
  conceptKey: text("concept_key").notNull(),
  hookKey: text("hook_key").notNull(),
  selectedDraftVersionId: uuid("selected_draft_version_id"),
  finalApprovedAt: timestamp("final_approved_at", { withTimezone: true }),
  ...timestamps,
});

export const draftVersions = pgTable(
  "draft_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
    version: integer("version").notNull(),
    body: jsonb("body").$type<Record<string, unknown>>().notNull(),
    revisionType: text("revision_type").notNull(),
    instruction: text("instruction"),
    restoredFromId: uuid("restored_from_id"),
    approved: boolean("approved").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("draft_content_version_unique").on(table.contentItemId, table.version)],
);

export const productionDocuments = pgTable("production_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull().unique(),
  googleDocId: text("google_doc_id").unique(),
  googleDocUrl: text("google_doc_url"),
  sheetMetadataId: integer("sheet_metadata_id"),
  syncStatus: syncStatusEnum("sync_status").notNull().default("pending"),
  lastError: text("last_error"),
  ...timestamps,
});

export const gateRuns = pgTable("gate_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  gateId: text("gate_id").notNull(),
  ideaId: uuid("idea_id").references(() => ideas.id, { onDelete: "cascade" }),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }),
  draftVersionId: uuid("draft_version_id").references(() => draftVersions.id, { onDelete: "cascade" }),
  decision: gateDecisionEnum("decision").notNull(),
  evaluator: text("evaluator").notNull(),
  inputs: jsonb("inputs").notNull(),
  evidence: jsonb("evidence").notNull(),
  reason: text("reason"),
  model: text("model"),
  schemaVersion: text("schema_version").notNull(),
  elapsedMs: integer("elapsed_ms"),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const scheduleSlots = pgTable("schedule_slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  channel: channelEnum("channel").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  status: scheduleStatusEnum("status").notNull().default("suggested"),
  ...timestamps,
});

export const syncJobs = pgTable("sync_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  action: text("action").notNull(),
  status: syncStatusEnum("status").notNull().default("pending"),
  attempt: integer("attempt").notNull().default(0),
  lastError: text("last_error"),
  ...timestamps,
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(),
  response: jsonb("response").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Kept explicit so this contract is stable across Drizzle's private symbol changes.
export const tableNames = [
  "users",
  "integration_accounts",
  "generation_batches",
  "generation_jobs",
  "references",
  "ideas",
  "idea_sources",
  "gate_runs",
  "content_items",
  "draft_versions",
  "production_documents",
  "schedule_slots",
  "sync_jobs",
  "audit_events",
  "idempotency_keys",
] as const;
