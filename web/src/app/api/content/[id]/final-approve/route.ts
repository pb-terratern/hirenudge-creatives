import { z } from "zod";
import { errorResponse, requireIdempotencyKey, requireOwner } from "@/server/request";
import { finalApprove } from "@/server/content-operations";
const schema = z.object({ selectedDraftVersionId: z.uuid() });
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const session = await requireOwner(); const key = requireIdempotencyKey(request); const { id } = await context.params; const body = schema.parse(await request.json()); return Response.json(await finalApprove({ contentItemId: id, selectedDraftVersionId: body.selectedDraftVersionId, idempotencyKey: key, actorEmail: session?.user?.email || "owner" })); } catch (error) { return errorResponse(error); } }
