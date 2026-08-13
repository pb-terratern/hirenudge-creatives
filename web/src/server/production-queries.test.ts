import { afterEach, describe, expect, it, vi } from "vitest";

const { envMock, getDatabaseMock } = vi.hoisted(() => ({
  envMock: { DATABASE_URL: "postgresql://secret@example.neon.tech/hirenudge" as string | undefined, ENABLE_GOOGLE_WRITES: "false" },
  getDatabaseMock: vi.fn(),
}));

vi.mock("@/server/db", () => ({ getDatabase: getDatabaseMock }));
vi.mock("@/server/env", () => ({
  env: envMock,
  operationalSheetId: "tracker-id",
  productTruthSheetId: "product-truth-id",
  productionFolderId: "folder-id",
}));

import { createReferenceFromUrl, getDraftWorkspace, getSettingsHealth, listCalendarSlots, listPipelineItems, listReferences } from "@/server/production-queries";

const defaultDatabaseUrl = envMock.DATABASE_URL;

afterEach(() => {
  getDatabaseMock.mockReset();
  envMock.DATABASE_URL = defaultDatabaseUrl;
  delete process.env.OPERATIONAL_SHEET_ID;
  delete process.env.PRODUCT_TRUTH_SHEET_ID;
  delete process.env.PRODUCTION_FOLDER_ID;
});

function databaseReturning(rows: unknown[]) {
  const builder = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
  };
  builder.from.mockReturnValue(builder);
  builder.leftJoin.mockReturnValue(builder);
  builder.innerJoin.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.orderBy.mockResolvedValue(rows);
  return { select: vi.fn(() => builder) };
}

function databaseSaving(row: unknown) {
  const returning = vi.fn().mockResolvedValue([row]);
  const values = vi.fn(() => ({ returning }));
  return { insert: vi.fn(() => ({ values })) };
}

function databaseWithQueryResults(...results: unknown[][]) {
  return {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(), leftJoin: vi.fn(), innerJoin: vi.fn(), where: vi.fn(), orderBy: vi.fn(),
      };
      builder.from.mockReturnValue(builder);
      builder.leftJoin.mockReturnValue(builder);
      builder.innerJoin.mockReturnValue(builder);
      builder.where.mockReturnValue(builder);
      builder.orderBy.mockResolvedValue(results.shift() || []);
      return builder;
    }),
  };
}

describe("production queries", () => {
  it("returns pipeline cards with their production sync and selected immutable draft", async () => {
    getDatabaseMock.mockReturnValue(databaseReturning([
      {
        content: {
          id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee",
          channel: "instagram",
          topic: "Remote-ready proof before the application form",
          approach: "Show four useful kinds of proof.",
          category: "Global applications",
          format: "Reel",
          status: "drafting",
          parentPackId: "PACK-ED9CABEB",
          conceptKey: "remote-proof",
          hookKey: "proof-first",
          selectedDraftVersionId: "5d0d2fd3-b98f-45df-b2e0-cff23a83f892",
          finalApprovedAt: null,
          createdAt: new Date("2026-08-13T04:00:00.000Z"),
          updatedAt: new Date("2026-08-13T04:00:00.000Z"),
        },
        production: { syncStatus: "synced", googleDocUrl: "https://docs.google.com/document/d/abc" },
        selectedDraft: { id: "5d0d2fd3-b98f-45df-b2e0-cff23a83f892", version: 2, approved: false },
      },
    ]));

    await expect(listPipelineItems()).resolves.toEqual([
      expect.objectContaining({
        id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee",
        status: "drafting",
        sync: { status: "synced", documentUrl: "https://docs.google.com/document/d/abc" },
        selectedDraft: { id: "5d0d2fd3-b98f-45df-b2e0-cff23a83f892", version: 2, approved: false },
      }),
    ]);
  });

  it("returns calendar slots in the requested time window with their content", async () => {
    getDatabaseMock.mockReturnValue(databaseReturning([
      {
        slot: {
          id: "f9328298-99c0-47c5-8714-943efa54040f",
          contentItemId: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee",
          channel: "linkedin",
          scheduledFor: new Date("2026-08-17T04:30:00.000Z"),
          status: "confirmed",
          createdAt: new Date("2026-08-13T04:00:00.000Z"),
          updatedAt: new Date("2026-08-13T04:00:00.000Z"),
        },
        content: {
          id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee",
          topic: "Remote-ready proof before the application form",
          format: "Text post",
          status: "ready",
        },
      },
    ]));

    await expect(listCalendarSlots({ start: new Date("2026-08-17T00:00:00.000Z"), end: new Date("2026-08-24T00:00:00.000Z") })).resolves.toEqual([
      expect.objectContaining({
        id: "f9328298-99c0-47c5-8714-943efa54040f",
        scheduledFor: "2026-08-17T04:30:00.000Z",
        status: "confirmed",
        content: { id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee", topic: "Remote-ready proof before the application form", format: "Text post", status: "ready" },
      }),
    ]);
  });

  it("returns references without their extracted private file text", async () => {
    getDatabaseMock.mockReturnValue(databaseReturning([
      {
        id: "f9328298-99c0-47c5-8714-943efa54040f",
        kind: "url",
        title: "Official guidance on remote work",
        url: "https://example.gov/remote-work",
        blobUrl: null,
        notes: "Useful orientation.",
        tags: ["remote", "official"],
        sourceChannel: "web",
        verificationStatus: "verified",
        extractedText: "Private extraction that must not leave the reference library API.",
        createdAt: new Date("2026-08-13T04:00:00.000Z"),
        updatedAt: new Date("2026-08-13T04:00:00.000Z"),
      },
    ]));

    await expect(listReferences()).resolves.toEqual([
      expect.objectContaining({
        id: "f9328298-99c0-47c5-8714-943efa54040f",
        title: "Official guidance on remote work",
        url: "https://example.gov/remote-work",
        tags: ["remote", "official"],
        verificationStatus: "verified",
      }),
    ]);
    await expect(listReferences()).resolves.not.toContainEqual(expect.objectContaining({ extractedText: expect.anything() }));
  });

  it("creates a URL reference only after normalising its safe URL", async () => {
    getDatabaseMock.mockReturnValue(databaseSaving({
      id: "f9328298-99c0-47c5-8714-943efa54040f",
      kind: "url",
      title: "Remote work guide",
      url: "https://example.gov/remote-work",
      blobUrl: null,
      notes: null,
      tags: ["official"],
      sourceChannel: null,
      verificationStatus: "unverified",
      extractedText: null,
      createdAt: new Date("2026-08-13T04:00:00.000Z"),
      updatedAt: new Date("2026-08-13T04:00:00.000Z"),
    }));

    await expect(createReferenceFromUrl({ url: "https://example.gov/remote-work", title: "Remote work guide", tags: ["official"] })).resolves.toMatchObject({
      kind: "url",
      url: "https://example.gov/remote-work",
      verificationStatus: "unverified",
    });
  });

  it("returns a draft workspace with immutable versions, gate decisions, and attached sources", async () => {
    getDatabaseMock.mockReturnValue(databaseWithQueryResults(
      [{
        content: { id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee", ideaId: "1ea6d32e-62bc-4939-979c-d7327b9f3850", topic: "Remote-ready proof", status: "review", selectedDraftVersionId: "5d0d2fd3-b98f-45df-b2e0-cff23a83f892" },
        production: { syncStatus: "synced", googleDocUrl: "https://docs.google.com/document/d/abc" },
      }],
      [{ id: "a945750e-0c19-45b8-9fe1-d778a6cdb0e9", version: 1, body: { finalCopyOrScript: "First version" }, revisionType: "initial", instruction: null, restoredFromId: null, approved: false, createdAt: new Date("2026-08-12T04:00:00.000Z") }],
      [{ id: "c73063fb-bd3a-4885-b3bb-91f0078d45af", gateId: "G7", decision: "passed", evaluator: "Editorial & Trust Agent", reason: null, draftVersionId: "a945750e-0c19-45b8-9fe1-d778a6cdb0e9", createdAt: new Date("2026-08-12T05:00:00.000Z") }],
      [{ source: { id: "3fa1a65d-2c0b-4fcc-8e82-51252d554993", sourceGroup: "primary", url: "https://example.gov/remote", status: "verified", limitation: null }, reference: { id: "f9328298-99c0-47c5-8714-943efa54040f", title: "Official guidance", url: "https://example.gov/remote", verificationStatus: "verified" } }],
    ));

    await expect(getDraftWorkspace("ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee")).resolves.toMatchObject({
      content: { id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee", sync: { status: "synced", documentUrl: "https://docs.google.com/document/d/abc" } },
      versions: [{ version: 1, revisionType: "initial", body: { finalCopyOrScript: "First version" } }],
      gates: [{ gateId: "G7", decision: "passed" }],
      sources: [{ sourceGroup: "primary", reference: { title: "Official guidance" } }],
    });
  });

  it("reports settings health as booleans and status labels without disclosing secret values", async () => {
    process.env.OPERATIONAL_SHEET_ID = "tracker-id";
    process.env.PRODUCT_TRUTH_SHEET_ID = "product-truth-id";
    process.env.PRODUCTION_FOLDER_ID = "folder-id";
    getDatabaseMock.mockReturnValue(databaseReturning([{ provider: "google-workspace", expiresAt: new Date("2026-09-13T04:00:00.000Z") }]));

    await expect(getSettingsHealth()).resolves.toEqual({
      database: { configured: true, status: "configured" },
      googleWorkspace: { writesEnabled: false, manifestConfigured: true, status: "disabled" },
      googleIntegration: { connected: true, status: "connected" },
    });
    await expect(getSettingsHealth()).resolves.not.toHaveProperty("databaseUrl");
  });

  it("reports a missing database without attempting a database query", async () => {
    envMock.DATABASE_URL = undefined;

    await expect(getSettingsHealth()).resolves.toMatchObject({
      database: { configured: false, status: "missing" },
      googleIntegration: { connected: false, status: "not_connected" },
    });
    expect(getDatabaseMock).not.toHaveBeenCalled();
  });
});
