import { describe, expect, it } from "vitest";

import { InMemoryContentRepository } from "@/server/repository";

describe("content repository", () => {
  it("removes approved ideas from the surfaced wall immediately", async () => {
    const repository = new InMemoryContentRepository();
    const idea = await repository.createIdea({
      channel: "instagram",
      topic: "A country-specific resume is not a translation exercise",
      approach: "Compare decision-changing differences without claiming universal rules.",
      category: "Country resumes",
      format: "Reel",
      conceptKey: "country-resume-decisions",
      hookKey: "translation-is-not-localisation",
    });

    await repository.markIdeaValidating(idea.id);

    expect(await repository.listIdeaWall()).toEqual([]);
    expect((await repository.getIdea(idea.id))?.status).toBe("validating");
  });

  it("returns the same result for a repeated idempotent operation", async () => {
    const repository = new InMemoryContentRepository();
    let calls = 0;
    const first = await repository.withIdempotency("approve:idea-1", async () => {
      calls += 1;
      return { contentId: "content-1" };
    });
    const second = await repository.withIdempotency("approve:idea-1", async () => {
      calls += 1;
      return { contentId: "content-2" };
    });

    expect(first).toEqual({ contentId: "content-1" });
    expect(second).toEqual(first);
    expect(calls).toBe(1);
  });
});
