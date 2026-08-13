import { describe, expect, it, vi } from "vitest";

const { createReferenceFromUrlMock, getDraftWorkspaceMock, getSettingsHealthMock, listCalendarSlotsMock, listReferencesMock, requireOwnerMock } = vi.hoisted(() => ({
  createReferenceFromUrlMock: vi.fn(),
  getDraftWorkspaceMock: vi.fn(),
  getSettingsHealthMock: vi.fn(),
  listCalendarSlotsMock: vi.fn(),
  listReferencesMock: vi.fn(),
  requireOwnerMock: vi.fn().mockResolvedValue({ user: { email: "owner@example.com" } }),
}));

vi.mock("@/server/production-queries", () => ({
  createReferenceFromUrl: createReferenceFromUrlMock,
  getDraftWorkspace: getDraftWorkspaceMock,
  getSettingsHealth: getSettingsHealthMock,
  listCalendarSlots: listCalendarSlotsMock,
  listReferences: listReferencesMock,
}));
vi.mock("@/server/request", () => ({
  requireOwner: requireOwnerMock,
  errorResponse: (error: unknown) => Response.json({ error: error instanceof Error ? error.message : "Unknown request error." }, { status: 500 }),
}));

import { GET as getCalendar } from "@/app/api/calendar/route";
import { GET as getDraft } from "@/app/api/drafts/[id]/route";
import { GET as getReferences, POST as postReference } from "@/app/api/references/route";
import { GET as getSettingsHealthRoute } from "@/app/api/settings/health/route";

describe("production read routes", () => {
  it("returns calendar slots only for a valid requested window", async () => {
    listCalendarSlotsMock.mockResolvedValue([{ id: "f9328298-99c0-47c5-8714-943efa54040f" }]);
    const response = await getCalendar(new Request("https://hirenudge.example/api/calendar?start=2026-08-17T00:00:00.000Z&end=2026-08-24T00:00:00.000Z"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ slots: [{ id: "f9328298-99c0-47c5-8714-943efa54040f" }] });
  });

  it("returns filtered references and creates a validated URL reference", async () => {
    listReferencesMock.mockResolvedValue([{ id: "f9328298-99c0-47c5-8714-943efa54040f" }]);
    createReferenceFromUrlMock.mockResolvedValue({ id: "f9328298-99c0-47c5-8714-943efa54040f", kind: "url" });
    const listResponse = await getReferences(new Request("https://hirenudge.example/api/references?tag=official"));
    const createResponse = await postReference(new Request("https://hirenudge.example/api/references", { method: "POST", body: JSON.stringify({ url: "https://example.gov/remote", title: "Official guidance", tags: ["official"] }) }));
    await expect(listResponse.json()).resolves.toEqual({ references: [{ id: "f9328298-99c0-47c5-8714-943efa54040f" }] });
    expect(createResponse.status).toBe(201);
    await expect(createResponse.json()).resolves.toEqual({ reference: { id: "f9328298-99c0-47c5-8714-943efa54040f", kind: "url" } });
  });

  it("rejects malformed draft IDs before querying and returns a found workspace", async () => {
    const invalid = await getDraft(new Request("https://hirenudge.example/api/drafts/not-an-id"), { params: Promise.resolve({ id: "not-an-id" }) });
    expect(invalid.status).toBe(400);
    getDraftWorkspaceMock.mockResolvedValue({ content: { id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee" }, versions: [], gates: [], sources: [] });
    const valid = await getDraft(new Request("https://hirenudge.example/api/drafts/ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee"), { params: Promise.resolve({ id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee" }) });
    expect(valid.status).toBe(200);
    await expect(valid.json()).resolves.toEqual({ workspace: { content: { id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee" }, versions: [], gates: [], sources: [] } });
  });

  it("returns secret-safe settings health", async () => {
    process.env.OPERATIONAL_SHEET_ID = "tracker-id";
    process.env.PRODUCT_TRUTH_SHEET_ID = "product-truth-id";
    process.env.PRODUCTION_FOLDER_ID = "folder-id";
    getSettingsHealthMock.mockResolvedValue({ database: { configured: true, status: "configured" } });
    const response = await getSettingsHealthRoute(new Request("https://hirenudge.example/api/settings/health"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ health: { database: { configured: true, status: "configured" } } });
    expect(requireOwnerMock).toHaveBeenCalled();
    delete process.env.OPERATIONAL_SHEET_ID;
    delete process.env.PRODUCT_TRUTH_SHEET_ID;
    delete process.env.PRODUCTION_FOLDER_ID;
  });
});
