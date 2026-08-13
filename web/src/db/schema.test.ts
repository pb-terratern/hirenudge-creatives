import { describe, expect, it } from "vitest";

import { tableNames } from "@/db/schema";

describe("database contract", () => {
  it("contains every durable entity required by the operating workflow", () => {
    expect(tableNames).toEqual([
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
    ]);
  });
});
