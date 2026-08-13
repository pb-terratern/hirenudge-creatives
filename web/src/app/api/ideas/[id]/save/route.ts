import { errorResponse, requireIdempotencyKey, requireOwner } from "@/server/request";
import { readIdempotentResponse, setIdeaStatus, storeIdempotentResponse } from "@/server/postgres-repository";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const session = await requireOwner(); const key = requireIdempotencyKey(request); const prior = await readIdempotentResponse(key); if (prior) return Response.json(prior); const { id } = await context.params; const idea = await setIdeaStatus({ id, status: "saved", allowedFrom: ["surfaced"], actorEmail: session?.user?.email || "owner" }); const response = { id: idea.id, status: idea.status }; await storeIdempotentResponse(key, response); return Response.json(response); } catch (error) { return errorResponse(error); }
}
