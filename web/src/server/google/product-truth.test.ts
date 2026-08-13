import { describe, expect, it } from "vitest";
import { resolveProductTruth } from "@/server/google/product-truth";

describe("Product Truth reader", () => {
  it("selects the matching capability and preserves its limitation", () => {
    const truth = resolveProductTruth({ module: "Nudge Studio", capabilityValues: [["Module", "Capability", "Truth Status", "Safe Wording", "Limitations", "Evidence Source", "Last Verified"], ["Nudge Studio", "Tailor", "Verified Live", "Checks and tailors a resume", "Review every suggested edit", "Studio screenshots", "2026-08-07"]], conflictValues: [["Module", "Existing Claim", "Conflict", "Decision"], ["Nudge Studio", "Guarantees interviews", "Outcome cannot be guaranteed", "Blocked"]] });
    expect(truth.safeWording).toBe("Checks and tailors a resume");
    expect(truth.limitation).toBe("Review every suggested edit");
    expect(truth.conflict).toContain("Outcome cannot be guaranteed");
  });
});
