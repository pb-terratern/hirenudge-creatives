import { describe, expect, it } from "vitest";

import { suggestNextSlot } from "@/domain/cadence";

describe("calendar cadence", () => {
  it("suggests the next unoccupied LinkedIn slot in Asia/Kolkata", () => {
    const result = suggestNextSlot({
      channel: "linkedin",
      after: new Date("2026-08-17T08:00:00.000Z"),
      occupied: ["2026-08-18T04:30:00.000Z"],
    });

    expect(result.toISOString()).toBe("2026-08-20T04:30:00.000Z");
  });

  it("does not allocate YouTube production slots", () => {
    expect(() =>
      suggestNextSlot({ channel: "youtube", after: new Date("2026-08-17T00:00:00.000Z"), occupied: [] }),
    ).toThrow("YouTube has no production cadence until G9 passes.");
  });
});
