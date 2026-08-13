import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import type { Channel } from "@/domain/content-system";
import { assessResearchCoverage } from "@/domain/research-coverage";
import { selectSurfacedIdeas } from "@/domain/ideas";
import { buildIdeationInstructions } from "@/server/agents/ideation";
import { ideationResponseSchema, type IdeationCandidate, productionPacketSchema } from "@/server/agents/schemas";
import { env } from "@/server/env";

function client(): OpenAI {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured.");
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export async function researchIdeaCandidates(input: { channel: Channel; context?: string }): Promise<IdeationCandidate[]> {
  const response = await client().responses.parse({
    model: "gpt-5.6",
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
  const response = await client().responses.parse({
    model: "gpt-5.6",
    input,
    text: { format: zodTextFormat(productionPacketSchema, "hirenudge_production_packet") },
  });
  if (!response.output_parsed) throw new Error("The production agent returned no structured packet.");
  return response.output_parsed;
}
