import { z } from "zod";

import { errorResponse, requireIdempotencyKey, requireOwner } from "@/server/request";
import { reviseDraft } from "@/server/content-operations";

const requestSchema = z.discriminatedUnion("type", [z.object({ type: z.literal("rewrite"), instruction: z.string().min(3).max(3000) }), z.object({ type: z.literal("recreate"), instruction: z.string().optional() }), z.object({ type: z.literal("restore"), sourceVersionId: z.uuid() })]);
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireOwner(); const key = requireIdempotencyKey(request); const { id } = await context.params; const body = requestSchema.parse(await request.json()); const result = await reviseDraft({ draftId: id, idempotencyKey: key, type: body.type, instruction: "instruction" in body ? body.instruction : undefined, sourceVersionId: "sourceVersionId" in body ? body.sourceVersionId : undefined }); return Response.json(result, { status: 201 }); } catch (error) { return errorResponse(error); }
}
