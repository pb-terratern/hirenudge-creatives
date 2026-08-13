import { describe, expect, it } from "vitest";

import { isAllowedOwner } from "@/server/auth-policy";

describe("owner authentication", () => {
  it("matches the allowlisted owner case-insensitively", () => {
    expect(isAllowedOwner("PriyanshBajpai@GMAIL.COM", "priyanshbajpai@gmail.com")).toBe(true);
    expect(isAllowedOwner("another@example.com", "priyanshbajpai@gmail.com")).toBe(false);
  });
});
