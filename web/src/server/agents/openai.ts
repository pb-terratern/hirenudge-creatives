import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getVercelOidcToken } from "@vercel/oidc";

import type { Channel } from "@/domain/content-system";
import { assessResearchCoverage } from "@/domain/research-coverage";
import { selectSurfacedIdeas } from "@/domain/ideas";
import { buildIdeationInstructions } from "@/server/agents/ideation";
import { ideationResponseSchema, type IdeationCandidate, productionPacketSchema } from "@/server/agents/schemas";
import { env } from "@/server/env";

export function resolveAiRuntime(input: {
  openAiApiKey?: string;
  aiGatewayApiKey?: string;
  vercelOidcToken?: string;
}) {
  if (input.openAiApiKey) {
    return { apiKey: input.openAiApiKey, baseURL: undefined, model: "gpt-5.6", provider: "openai" as const };
  }
  const gatewayCredential = input.aiGatewayApiKey || input.vercelOidcToken;
  if (gatewayCredential) {
    return {
      apiKey: gatewayCredential,
      baseURL: "https://ai-gateway.vercel.sh/v1",
      model: "openai/gpt-5.6-sol",
      provider: "vercel-ai-gateway" as const,
    };
  }
  throw new Error("AI generation is not configured. Enable Vercel AI Gateway or provide OPENAI_API_KEY.");
}

export async function resolveAiRuntimeForRequest(
  input: Parameters<typeof resolveAiRuntime>[0],
  loadOidcToken: () => Promise<string> = getVercelOidcToken,
) {
  try {
    return resolveAiRuntime(input);
  } catch (error) {
    if (input.openAiApiKey || input.aiGatewayApiKey || input.vercelOidcToken) throw error;
    const token = await loadOidcToken();
    return resolveAiRuntime({ ...input, vercelOidcToken: token });
  }
}

async function client(): Promise<{ openai: OpenAI; model: string }> {
  const ai = await resolveAiRuntimeForRequest({
    openAiApiKey: env.OPENAI_API_KEY,
    aiGatewayApiKey: env.AI_GATEWAY_API_KEY,
    vercelOidcToken: env.VERCEL_OIDC_TOKEN,
  });
  return { openai: new OpenAI({ apiKey: ai.apiKey, baseURL: ai.baseURL }), model: ai.model };
}

export async function researchIdeaCandidates(input: { channel: Channel; context?: string }): Promise<IdeationCandidate[]> {
  const { openai, model } = await client();
  const response = await openai.responses.parse({
    model,
    tools: [{ type: "web_search" }],
    tool_choice: "required",
    input: buildIdeationInstructions(input.channel, input.context),
    text: { format: zodTextFormat(ideationResponseSchema, "hirenudge_idea_candidates") },
  });
  const parsed = response.output_parsed;
  if (!parsed) throw new Error("The research agent returned no structured candidates.");
  return selectSurfacedIdeas(
    parsed.candidates.map((candidate) => ({
      ...candidate,
      id: candidate.conceptKey,
      eligible: candidate.eligible && assessResearchCoverage(candidate.researchCoverage).complete,
    })),
    4,
  );
}

export async function createProductionPacket(input: string) {
  const { openai, model } = await client();
  const response = await openai.responses.parse({
    model,
    input,
    text: { format: zodTextFormat(productionPacketSchema, "hirenudge_production_packet") },
  });
  if (!response.output_parsed) throw new Error("The production agent returned no structured packet.");
  return response.output_parsed;
}
