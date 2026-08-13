import { channels } from "@/domain/content-system";
import { researchIdeaCandidates } from "@/server/agents/openai";
import { dailyBatchLocalDate } from "@/server/agents/ideation";
import { env, isOperationalFlagEnabled } from "@/server/env";
import { archiveExpiredIdeas, createGenerationBatch, hasCompleteDailyBatch } from "@/server/postgres-repository";

export async function GET(request: Request) {
  if (!isOperationalFlagEnabled(env.ENABLE_DAILY_GENERATION)) return Response.json({ skipped: true, reason: "Daily generation kill switch is off." });
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const localDate = dailyBatchLocalDate(new Date());
  if (await hasCompleteDailyBatch(localDate)) return Response.json({ skipped: true, reason: "A complete daily batch already exists.", localDate });
  const results = await Promise.all(channels.map(async (channel) => ({ channel, candidates: await researchIdeaCandidates({ channel }) })));
  const batch = await createGenerationBatch({ kind: "daily", localDate, results });
  const archived = await archiveExpiredIdeas();
  return Response.json({ localDate, batchId: batch.id, archived, results });
}
