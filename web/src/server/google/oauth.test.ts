import { describe, expect, it } from "vitest";

import { buildGoogleAuthorizationUrl, decryptToken, encryptToken } from "@/server/google/oauth";

describe("Google offline authorization", () => {
  it("requests offline access with CSRF state and Workspace scopes", () => {
    const url = buildGoogleAuthorizationUrl({
      clientId: "client-id",
      redirectUri: "https://example.com/api/integrations/google/callback",
      state: "csrf-state",
    });

    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("csrf-state");
    expect(url.searchParams.get("scope")).toContain("spreadsheets");
    expect(url.searchParams.get("scope")).toContain("documents");
  });

  it("encrypts refresh tokens with authenticated encryption", () => {
    const key = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptToken("refresh-token-secret", key);

    expect(encrypted).not.toContain("refresh-token-secret");
    expect(decryptToken(encrypted, key)).toBe("refresh-token-secret");
  });
});
