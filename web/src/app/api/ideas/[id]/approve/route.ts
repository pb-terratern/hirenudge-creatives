import { z } from "zod";

import { errorResponse, requireIdempotencyKey, requireOwner } from "@/server/request";
import { approveIdeaDurably } from "@/server/durable-workflow";

const requestSchema = z.object({ reviewerNote: z.string().max(2000).optional() });
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const session = await requireOwner(); const key = requireIdempotencyKey(request); const { id } = await context.params; const body = requestSchema.parse(await request.json()); const result = await approveIdeaDurably({ ideaId: id, idempotencyKey: key, actorEmail: session?.user?.email || "owner", reviewerNote: body.reviewerNote }); return Response.json(result, { status: result && typeof result === "object" && "status" in result && result.status === "needs_review" ? 422 : 201 }); } catch (error) { return errorResponse(error); }
}
