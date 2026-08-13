import { z } from "zod";

import { createReferenceFromUrl, listReferences } from "@/server/production-queries";
import { errorResponse, requireOwner } from "@/server/request";

const listQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  tag: z.string().trim().min(1).max(48).optional(),
  verificationStatus: z.string().trim().min(1).max(48).optional(),
});
const createSchema = z.object({
  url: z.url().max(2048),
  title: z.string().trim().min(1).max(240),
  notes: z.string().trim().max(4_000).optional(),
  tags: z.array(z.string().trim().min(1).max(48)).max(12).optional(),
  sourceChannel: z.string().trim().min(1).max(80).optional(),
});

export async function GET(request: Request) {
  try {
    await requireOwner();
    const parsed = listQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return Response.json({ error: "Invalid references query." }, { status: 400 });
    return Response.json({ references: await listReferences(parsed.data) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireOwner();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid reference body." }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Invalid reference body." }, { status: 400 });
    return Response.json({ reference: await createReferenceFromUrl(parsed.data) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
