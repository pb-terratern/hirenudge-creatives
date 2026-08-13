import { describe, expect, it, vi } from "vitest";

const { listPipelineItemsMock, requireOwnerMock } = vi.hoisted(() => ({
  listPipelineItemsMock: vi.fn(),
  requireOwnerMock: vi.fn().mockResolvedValue({ user: { email: "owner@example.com" } }),
}));

vi.mock("@/server/production-queries", () => ({ listPipelineItems: listPipelineItemsMock }));
vi.mock("@/server/request", () => ({
  requireOwner: requireOwnerMock,
  errorResponse: (error: unknown) => Response.json({ error: error instanceof Error ? error.message : "Unknown request error." }, { status: 500 }),
}));

import { GET } from "@/app/api/pipeline/route";

describe("GET /api/pipeline", () => {
  it("returns owner-visible pipeline cards filtered by a valid status", async () => {
    listPipelineItemsMock.mockResolvedValue([{ id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee", status: "drafting" }]);

    const response = await GET(new Request("https://hirenudge.example/api/pipeline?status=drafting"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [{ id: "ed9cabeb-1e0e-42fb-9f3a-5e0a635331ee", status: "drafting" }] });
    expect(requireOwnerMock).toHaveBeenCalledOnce();
    expect(listPipelineItemsMock).toHaveBeenCalledWith({ status: "drafting", search: undefined });
  });
});
