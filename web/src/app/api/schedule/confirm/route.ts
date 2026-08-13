import { z } from "zod";
import { channels } from "@/domain/content-system";
import { errorResponse, requireIdempotencyKey, requireOwner } from "@/server/request";
import { confirmSchedule } from "@/server/content-operations";
const schema = z.object({ contentItemId: z.uuid(), channel: z.enum(channels), scheduledFor: z.iso.datetime(), finalApproved: z.literal(true), workspaceSynced: z.literal(true) });
export async function POST(request: Request) { try { await requireOwner(); const key = requireIdempotencyKey(request); const body = schema.parse(await request.json()); if (body.channel === "youtube") throw new Error("YouTube has no production cadence until G9 passes."); return Response.json(await confirmSchedule({ contentItemId: body.contentItemId, channel: body.channel, scheduledFor: new Date(body.scheduledFor), idempotencyKey: key })); } catch (error) { return errorResponse(error); } }
