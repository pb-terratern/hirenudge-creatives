import type { InMemoryContentRepository } from "@/server/repository";

type Dependencies = {
  validate(ideaId: string): Promise<{ passed: boolean; reasons: string[] }>;
  syncApprovedTreatment(ideaId: string): Promise<{ contentId: string }>;
};

export class ContentWorkflowService {
  constructor(private readonly repository: InMemoryContentRepository, private readonly dependencies: Dependencies) {}

  async approveIdea(ideaId: string, idempotencyKey: string): Promise<{ status: "needs_review"; reasons: string[] } | { status: "approved"; contentId: string }> {
    return this.repository.withIdempotency(idempotencyKey, async () => {
      await this.repository.markIdeaValidating(ideaId);
      const validation = await this.dependencies.validate(ideaId);
      if (!validation.passed) return { status: "needs_review" as const, reasons: validation.reasons };
      const synced = await this.dependencies.syncApprovedTreatment(ideaId);
      return { status: "approved" as const, contentId: synced.contentId };
    });
  }
}
