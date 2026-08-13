import { describe, expect, it } from "vitest";

import { assessResearchCoverage, researchSourceGroups } from "@/domain/research-coverage";

describe("research coverage protocol", () => {
  it("requires social listening and authoritative web evidence before an idea is approval-ready", () => {
    const result = assessResearchCoverage([
      { group: "primary", status: "checked", references: ["https://example.gov/data"] },
      { group: "news_search", status: "checked", references: ["https://example.com/report"] },
      { group: "x", status: "checked", references: ["https://x.com/example/status/1"] },
      { group: "linkedin", status: "checked", references: ["https://linkedin.com/posts/example"] },
      { group: "youtube", status: "checked", references: ["https://youtube.com/watch?v=example"] },
      { group: "instagram", status: "checked", references: ["https://instagram.com/p/example"] },
      { group: "reddit", status: "checked", references: ["https://reddit.com/r/jobs/example"] },
      { group: "specialist", status: "checked", references: ["https://example.org/guide"] },
    ]);

    expect(result).toEqual({ complete: true, gaps: [] });
    expect(researchSourceGroups).toHaveLength(8);
  });

  it("reports inaccessible channels as explicit gaps instead of claiming they were checked", () => {
    const result = assessResearchCoverage([
      { group: "primary", status: "checked", references: ["https://example.gov/data"] },
      { group: "reddit", status: "inaccessible", references: [] },
    ]);

    expect(result.complete).toBe(false);
    expect(result.gaps).toContain("reddit: inaccessible");
    expect(result.gaps).toContain("x: not checked");
  });
});
