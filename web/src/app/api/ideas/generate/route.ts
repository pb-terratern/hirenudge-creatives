import { z } from "zod";

import { channels } from "@/domain/content-system";
import { researchIdeaCandidates } from "@/server/agents/openai";
import { dailyBatchLocalDate } from "@/server/agents/ideation";
import { createGenerationBatch, listIdeas, readIdempotentResponse, storeIdempotentResponse } from "@/server/postgres-repository";
import { errorResponse, requireIdempotencyKey, requireOwner } from "@/server/request";

const requestSchema = z.object({ channels: z.array(z.enum(channels)).min(1), prompt: z.string().max(4000).optional() });

export async function GET(request: Request) {
  try {
    await requireOwner();
    const value = new URL(request.url).searchParams.get("channel");
    const channel = value ? z.enum(channels).parse(value) : undefined;
    const status = z.enum(["surfaced", "saved", "rejected", "validating", "needs_review", "approved", "archived"]).parse(new URL(request.url).searchParams.get("status") || "surfaced");
    return Response.json({ ideas: await listIdeas({ channel, status }) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireOwner();
    const key = requireIdempotencyKey(request);
    const prior = await readIdempotentResponse(key);
    if (prior) return Response.json(prior);
    const body = requestSchema.parse(await request.json());
    const results = await Promise.all(body.channels.map(async (channel) => ({ channel, candidates: await researchIdeaCandidates({ channel, context: body.prompt }) })));
    const batch = await createGenerationBatch({ kind: "custom", localDate: dailyBatchLocalDate(new Date()), prompt: body.prompt, results });
    const response = { batchId: batch.id, results };
    await storeIdempotentResponse(key, response);
    return Response.json(response, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
