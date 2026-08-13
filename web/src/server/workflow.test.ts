import { describe, expect, it } from "vitest";

import { ContentWorkflowService } from "@/server/workflow";
import { InMemoryContentRepository } from "@/server/repository";

describe("approval workflow", () => {
  it("creates no operational artifacts when full validation fails", async () => {
    const repository = new InMemoryContentRepository();
    const idea = await repository.createIdea({ channel: "instagram", topic: "Topic that needs review", approach: "An exact treatment with evidence checks.", category: "Applications", format: "Reel", conceptKey: "needs-review", hookKey: "needs-review-hook" });
    let syncCalls = 0;
    const service = new ContentWorkflowService(repository, {
      validate: async () => ({ passed: false, reasons: ["Primary evidence missing"] }),
      syncApprovedTreatment: async () => { syncCalls += 1; return { contentId: "never" }; },
    });

    const result = await service.approveIdea(idea.id, "approval-key");

    expect(result).toEqual({ status: "needs_review", reasons: ["Primary evidence missing"] });
    expect(syncCalls).toBe(0);
  });

  it("runs operational sync once after validation passes", async () => {
    const repository = new InMemoryContentRepository();
    const idea = await repository.createIdea({ channel: "linkedin", topic: "Approved direction", approach: "A treatment backed by original evidence.", category: "Applications", format: "Text post", conceptKey: "approved-direction", hookKey: "approved-hook" });
    let syncCalls = 0;
    const service = new ContentWorkflowService(repository, {
      validate: async () => ({ passed: true, reasons: [] }),
      syncApprovedTreatment: async () => { syncCalls += 1; return { contentId: "content-1" }; },
    });

    expect(await service.approveIdea(idea.id, "approval-key")).toEqual({ status: "approved", contentId: "content-1" });
    expect(await service.approveIdea(idea.id, "approval-key")).toEqual({ status: "approved", contentId: "content-1" });
    expect(syncCalls).toBe(1);
  });
});
