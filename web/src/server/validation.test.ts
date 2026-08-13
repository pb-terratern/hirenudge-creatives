import { describe, expect, it } from "vitest";

import { researchSourceGroups } from "@/domain/research-coverage";
import { validateApproval } from "@/server/validation";

const completeCoverage = researchSourceGroups.map((group) => ({ group, status: "checked" as const, references: [`https://example.com/${group}`] }));

describe("full approval validation", () => {
  it("passes an evidence-complete non-product idea", () => {
    expect(validateApproval({ channel: "instagram", g9Passed: false, coverage: completeCoverage, productLed: false }).passed).toBe(true);
  });

  it("blocks a product claim without verified truth and safe wording", () => {
    const result = validateApproval({ channel: "linkedin", g9Passed: false, coverage: completeCoverage, productLed: true, productModule: "Resume Studio", productTruth: { found: true, status: "Demonstrated in Development" } });
    expect(result.passed).toBe(false);
    expect(result.reasons.join(" ")).toContain("cannot be presented as verified-live");
  });

  it("keeps YouTube research-only before G9", () => {
    expect(validateApproval({ channel: "youtube", g9Passed: false, coverage: completeCoverage, productLed: false }).reasons[0]).toContain("G9");
  });
});
