import { z } from "zod";

import { getDraftWorkspace } from "@/server/production-queries";
import { errorResponse, requireOwner } from "@/server/request";

const idSchema = z.uuid();

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireOwner();
    const { id } = await context.params;
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) return Response.json({ error: "Invalid draft workspace ID." }, { status: 400 });
    const workspace = await getDraftWorkspace(parsed.data);
    if (!workspace) return Response.json({ error: "Draft workspace not found." }, { status: 404 });
    return Response.json({ workspace });
  } catch (error) {
    return errorResponse(error);
  }
}
