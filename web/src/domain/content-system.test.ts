import { describe, expect, it } from "vitest";

import {
  assertContentTransition,
  canApproveIdea,
  createConceptFingerprint,
  detectDuplicate,
} from "@/domain/content-system";

describe("content workflow policy", () => {
  it("rejects a transition that bypasses editorial review", () => {
    expect(() => assertContentTransition("drafting", "ready")).toThrow(
      "Drafting content must enter review before it can become ready.",
    );
  });

  it("allows only the canonical forward tracker transitions", () => {
    expect(assertContentTransition("approved_topic", "drafting")).toBe(true);
    expect(assertContentTransition("drafting", "review")).toBe(true);
    expect(assertContentTransition("review", "ready")).toBe(true);
  });

  it("keeps YouTube research-only until G9 passes", () => {
    expect(canApproveIdea({ channel: "youtube", g9Passed: false })).toEqual({
      allowed: false,
      reason: "YouTube remains research-only until G9 passes.",
    });
    expect(canApproveIdea({ channel: "youtube", g9Passed: true }).allowed).toBe(true);
  });

  it("detects concept reuse even when casing and punctuation differ", () => {
    const candidate = createConceptFingerprint(
      "Resume proof beats keyword stuffing",
      "Show freshers how evidence improves a tailored resume.",
    );
    const existing = createConceptFingerprint(
      "RESUME proof beats keyword-stuffing!",
      "Show freshers how evidence improves a tailored resume",
    );

    expect(detectDuplicate(candidate, [{ conceptKey: existing, hookKey: "old-hook" }])).toEqual({
      duplicate: true,
      field: "conceptKey",
    });
  });
});
