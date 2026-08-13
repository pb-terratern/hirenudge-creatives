import { describe, expect, it, vi } from "vitest";

import { contentApi } from "@/lib/production-client";

describe("contentApi", () => {
  it("loads the pipeline items from the production endpoint without a demo fallback", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));

    await expect(contentApi.listContent(fetcher)).resolves.toEqual([]);
    expect(fetcher).toHaveBeenCalledWith("/api/pipeline", expect.objectContaining({ signal: undefined }));
  });

  it("sends a rewrite instruction and idempotency key to the selected draft", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ draftId: "draft-2" }), { status: 201 }));

    await contentApi.reviseDraft(fetcher, "draft-1", { type: "rewrite", instruction: "Lead with the applicant decision." }, "request-1");

    expect(fetcher).toHaveBeenCalledWith("/api/drafts/draft-1/revise", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "content-type": "application/json", "idempotency-key": "request-1" }),
      body: JSON.stringify({ type: "rewrite", instruction: "Lead with the applicant decision." }),
    }));
  });

  it("surfaces an API error instead of substituting sample data", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Unavailable" }), { status: 503 }));

    await expect(contentApi.listSchedule(fetcher, { start: "2026-08-17T00:00:00.000Z", end: "2026-08-24T00:00:00.000Z" })).rejects.toThrow("Unavailable");
  });

  it("unwraps a created reference returned by the references endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ reference: { id: "ref-1", title: "Official guidance", kind: "url", tags: [], verificationStatus: "unverified" } }), { status: 201 }));

    await expect(contentApi.createReference(fetcher, { url: "https://example.com", title: "Official guidance" }, "request-1")).resolves.toMatchObject({ id: "ref-1", title: "Official guidance" });
  });

  it("adapts a draft workspace and health response wrapper for the UI", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ workspace: { content: { id: "content-1", channel: "linkedin", topic: "Proof", category: "Applications", format: "Text", status: "drafting", sync: { status: "synced", documentUrl: "https://docs.google.com/document/d/doc/edit" } }, versions: [{ id: "draft-1", version: 1, body: { finalCopyOrScript: "Copy" }, revisionType: "initial" }], gates: [], sources: [] } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ health: { database: { configured: true }, googleWorkspace: { writesEnabled: false, manifestConfigured: true }, googleIntegration: { connected: true } } }), { status: 200 }));

    await expect(contentApi.getContent(fetcher, "content-1")).resolves.toMatchObject({ drafts: [{ id: "draft-1" }], production: { googleDocUrl: "https://docs.google.com/document/d/doc/edit" } });
    await expect(contentApi.getHealth(fetcher)).resolves.toMatchObject({ googleConnected: true, safeToWrite: false, workspaceSynced: true });
    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/drafts/content-1", expect.objectContaining({ signal: undefined }));
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/settings/health", expect.objectContaining({ signal: undefined }));
  });
});
