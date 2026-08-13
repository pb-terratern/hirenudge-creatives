import { errorResponse, requireIdempotencyKey, requireOwner } from "@/server/request";
import { retryApprovedWorkspaceSync } from "@/server/durable-workflow";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) { try { const session = await requireOwner(); const key = requireIdempotencyKey(request); const { id } = await context.params; return Response.json(await retryApprovedWorkspaceSync({ syncJobId: id, actorEmail: session?.user?.email || "owner", idempotencyKey: key })); } catch (error) { return errorResponse(error); } }
