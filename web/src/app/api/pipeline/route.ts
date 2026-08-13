import { z } from "zod";

import { contentStatuses } from "@/domain/content-system";
import { errorResponse, requireOwner } from "@/server/request";
import { listPipelineItems } from "@/server/production-queries";

const querySchema = z.object({
  status: z.enum(contentStatuses).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export async function GET(request: Request) {
  try {
    await requireOwner();
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return Response.json({ error: "Invalid pipeline query." }, { status: 400 });
    return Response.json({ items: await listPipelineItems(parsed.data) });
  } catch (error) {
    return errorResponse(error);
  }
}
