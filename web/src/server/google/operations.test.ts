import { describe, expect, it } from "vitest";

import { extractSheetRowNumber, trackerTabForChannel } from "@/server/google/operations";

describe("Google operations mapping", () => {
  it("uses the exact channel tabs from the operational tracker", () => {
    expect(trackerTabForChannel("linkedin")).toBe("LinkedIn");
    expect(trackerTabForChannel("instagram")).toBe("Instagram");
    expect(trackerTabForChannel("x")).toBe("X");
    expect(trackerTabForChannel("youtube")).toBe("YouTube");
  });

  it("extracts a single appended row from an A1 updated range", () => {
    expect(extractSheetRowNumber("Instagram!A7:F7")).toBe(7);
    expect(() => extractSheetRowNumber("Instagram!A7:F8")).toThrow("Expected a single appended tracker row.");
  });
});
