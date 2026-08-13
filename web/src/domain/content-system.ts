export const channels = ["linkedin", "instagram", "x", "youtube"] as const;
export type Channel = (typeof channels)[number];

export const ideaStatuses = [
  "surfaced",
  "saved",
  "rejected",
  "validating",
  "needs_review",
  "approved",
  "archived",
] as const;
export type IdeaStatus = (typeof ideaStatuses)[number];

export const contentStatuses = ["approved_topic", "drafting", "review", "ready", "published"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const gateDecisions = ["passed", "failed", "needs_human_review", "blocked"] as const;
export type GateDecision = (typeof gateDecisions)[number];

export const syncStatuses = ["pending", "synced", "failed"] as const;
export type SyncStatus = (typeof syncStatuses)[number];

export const scheduleStatuses = ["suggested", "confirmed", "cancelled"] as const;
export type ScheduleStatus = (typeof scheduleStatuses)[number];

const permittedTransitions: Partial<Record<ContentStatus, ContentStatus>> = {
  approved_topic: "drafting",
  drafting: "review",
  review: "ready",
};

export function assertContentTransition(from: ContentStatus, to: ContentStatus): true {
  if (permittedTransitions[from] === to) return true;
  if (from === "drafting" && to === "ready") {
    throw new Error("Drafting content must enter review before it can become ready.");
  }
  throw new Error(`Transition from ${from} to ${to} is not permitted.`);
}

export function canApproveIdea(input: { channel: Channel; g9Passed: boolean }): {
  allowed: boolean;
  reason?: string;
} {
  if (input.channel === "youtube" && !input.g9Passed) {
    return { allowed: false, reason: "YouTube remains research-only until G9 passes." };
  }
  return { allowed: true };
}

function normaliseFingerprintPart(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase("en-IN")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createConceptFingerprint(topic: string, approach: string): string {
  return `${normaliseFingerprintPart(topic)}::${normaliseFingerprintPart(approach)}`;
}

export function detectDuplicate(
  conceptKey: string,
  existing: Array<{ conceptKey: string; hookKey: string }>,
  hookKey?: string,
): { duplicate: boolean; field?: "conceptKey" | "hookKey" } {
  if (existing.some((item) => item.conceptKey === conceptKey)) {
    return { duplicate: true, field: "conceptKey" };
  }
  if (hookKey && existing.some((item) => item.hookKey === hookKey)) {
    return { duplicate: true, field: "hookKey" };
  }
  return { duplicate: false };
}
