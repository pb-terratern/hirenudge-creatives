import { getSettingsHealth } from "@/server/production-queries";
import { errorResponse, requireOwner } from "@/server/request";

export async function GET(_request: Request) {
  try {
    void _request;
    await requireOwner();
    return Response.json({ health: await getSettingsHealth() });
  } catch (error) {
    return errorResponse(error);
  }
}
