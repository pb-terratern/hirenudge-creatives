import { describe, expect, it } from "vitest";

import { selectSurfacedIdeas } from "@/domain/ideas";

describe("daily idea selection", () => {
  it("surfaces the best four eligible unique candidates without padding", () => {
    const ideas = [
      { id: "1", score: 95, eligible: true, conceptKey: "a" },
      { id: "2", score: 90, eligible: true, conceptKey: "b" },
      { id: "3", score: 85, eligible: false, conceptKey: "c" },
      { id: "4", score: 80, eligible: true, conceptKey: "d" },
      { id: "5", score: 75, eligible: true, conceptKey: "e" },
      { id: "6", score: 70, eligible: true, conceptKey: "a" },
    ];

    expect(selectSurfacedIdeas(ideas, 4).map((idea) => idea.id)).toEqual(["1", "2", "4", "5"]);
  });

  it("returns fewer than four when research leaves fewer qualified ideas", () => {
    const ideas = [
      { id: "1", score: 95, eligible: true, conceptKey: "a" },
      { id: "2", score: 90, eligible: false, conceptKey: "b" },
    ];

    expect(selectSurfacedIdeas(ideas, 4)).toHaveLength(1);
  });
});
