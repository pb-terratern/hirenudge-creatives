import { z } from "zod";

import { listCalendarSlots } from "@/server/production-queries";
import { errorResponse, requireOwner } from "@/server/request";

const querySchema = z.object({ start: z.iso.datetime(), end: z.iso.datetime() }).refine((value) => new Date(value.end) > new Date(value.start), { message: "end must be after start" });

export async function GET(request: Request) {
  try {
    await requireOwner();
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return Response.json({ error: "Invalid calendar window." }, { status: 400 });
    return Response.json({ slots: await listCalendarSlots({ start: new Date(parsed.data.start), end: new Date(parsed.data.end) }) });
  } catch (error) {
    return errorResponse(error);
  }
}
