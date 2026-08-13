import { errorResponse, requireIdempotencyKey, requireOwner } from "@/server/request";
import { submitDraftForReview } from "@/server/content-operations";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { await requireOwner(); const key = requireIdempotencyKey(request); const { id } = await context.params; return Response.json(await submitDraftForReview({ draftId: id, idempotencyKey: key })); } catch (error) { return errorResponse(error); } }
