import { describe, expect, it } from "vitest";

import { buildIdeationInstructions, dailyBatchLocalDate } from "@/server/agents/ideation";
import { resolveAiRuntime, resolveAiRuntimeForRequest } from "@/server/agents/openai";
import { isOperationalFlagEnabled } from "@/server/env";

describe("ideation agent contract", () => {
  it("requires every research source group and honest access-gap reporting", () => {
    const instructions = buildIdeationInstructions("instagram", "Help freshers apply globally");
    for (const source of ["X", "LinkedIn", "YouTube", "Instagram", "Reddit", "primary", "news", "specialist"]) {
      expect(instructions).toContain(source);
    }
    expect(instructions).toContain("inaccessible");
    expect(instructions).toContain("six candidates");
    expect(instructions).toContain("Do not use a real live job opening as a public example");
    expect(instructions).toContain("current Product Truth evidence");
  });

  it("derives the daily batch date in Asia/Kolkata", () => {
    expect(dailyBatchLocalDate(new Date("2026-08-12T20:15:00.000Z"))).toBe("2026-08-13");
  });
});

describe("AI runtime", () => {
  it("uses Vercel AI Gateway OIDC when an OpenAI key is not configured", () => {
    expect(resolveAiRuntime({ openAiApiKey: undefined, aiGatewayApiKey: undefined, vercelOidcToken: "oidc-token" })).toEqual({
      apiKey: "oidc-token",
      baseURL: "https://ai-gateway.vercel.sh/v1",
      model: "openai/gpt-5.6-sol",
      provider: "vercel-ai-gateway",
    });
  });

  it("prefers a direct OpenAI key when configured", () => {
    expect(resolveAiRuntime({ openAiApiKey: "openai-key", aiGatewayApiKey: "gateway-key", vercelOidcToken: "oidc-token" })).toEqual({
      apiKey: "openai-key",
      baseURL: undefined,
      model: "gpt-5.6",
      provider: "openai",
    });
  });

  it("rejects an unconfigured AI runtime", () => {
    expect(() => resolveAiRuntime({})).toThrow("AI generation is not configured");
  });

  it("uses the request-scoped Vercel OIDC token when no static AI credential exists", async () => {
    await expect(resolveAiRuntimeForRequest({}, async () => "request-oidc-token")).resolves.toMatchObject({
      apiKey: "request-oidc-token",
      provider: "vercel-ai-gateway",
      model: "openai/gpt-5.6-sol",
    });
  });
});

describe("operational flags", () => {
  it("only treats the literal true value as enabled", () => {
    expect(isOperationalFlagEnabled("true")).toBe(true);
    expect(isOperationalFlagEnabled("false")).toBe(false);
    expect(isOperationalFlagEnabled(undefined)).toBe(false);
  });
});
