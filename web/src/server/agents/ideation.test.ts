import { describe, expect, it } from "vitest";

import { buildIdeationInstructions, dailyBatchLocalDate } from "@/server/agents/ideation";

describe("ideation agent contract", () => {
  it("requires every research source group and honest access-gap reporting", () => {
    const instructions = buildIdeationInstructions("instagram", "Help freshers apply globally");
    for (const source of ["X", "LinkedIn", "YouTube", "Instagram", "Reddit", "primary", "news", "specialist"]) {
      expect(instructions).toContain(source);
    }
    expect(instructions).toContain("inaccessible");
    expect(instructions).toContain("six candidates");
  });

  it("derives the daily batch date in Asia/Kolkata", () => {
    expect(dailyBatchLocalDate(new Date("2026-08-12T20:15:00.000Z"))).toBe("2026-08-13");
  });
});
