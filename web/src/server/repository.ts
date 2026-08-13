import { randomUUID } from "node:crypto";

import type { Channel, IdeaStatus } from "@/domain/content-system";

export type IdeaRecord = {
  id: string;
  channel: Channel;
  topic: string;
  approach: string;
  category: string;
  format: string;
  conceptKey: string;
  hookKey: string;
  status: IdeaStatus;
  createdAt: Date;
};

type NewIdea = Omit<IdeaRecord, "id" | "status" | "createdAt">;

export class InMemoryContentRepository {
  private readonly ideas = new Map<string, IdeaRecord>();
  private readonly operations = new Map<string, unknown>();

  async createIdea(input: NewIdea): Promise<IdeaRecord> {
    const record: IdeaRecord = {
      ...input,
      id: randomUUID(),
      status: "surfaced",
      createdAt: new Date(),
    };
    this.ideas.set(record.id, record);
    return structuredClone(record);
  }

  async getIdea(id: string): Promise<IdeaRecord | undefined> {
    const idea = this.ideas.get(id);
    return idea ? structuredClone(idea) : undefined;
  }

  async listIdeaWall(): Promise<IdeaRecord[]> {
    return [...this.ideas.values()]
      .filter((idea) => idea.status === "surfaced")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((idea) => structuredClone(idea));
  }

  async markIdeaValidating(id: string): Promise<IdeaRecord> {
    const idea = this.ideas.get(id);
    if (!idea) throw new Error("Idea not found.");
    if (idea.status !== "surfaced" && idea.status !== "saved") {
      throw new Error(`Idea cannot be approved from ${idea.status}.`);
    }
    const updated = { ...idea, status: "validating" as const };
    this.ideas.set(id, updated);
    return structuredClone(updated);
  }

  async withIdempotency<T>(key: string, operation: () => Promise<T>): Promise<T> {
    if (this.operations.has(key)) return structuredClone(this.operations.get(key)) as T;
    const result = await operation();
    this.operations.set(key, structuredClone(result));
    return structuredClone(result);
  }
}
