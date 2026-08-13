import { buildGoogleAuthorizationUrl } from "@/server/google/oauth";
import { createOauthState } from "@/server/oauth-state";
import { env } from "@/server/env";
import { errorResponse, requireOwner } from "@/server/request";

export async function GET(request: Request) {
  try {
    await requireOwner();
    if (!env.GOOGLE_CLIENT_ID || !env.AUTH_SECRET) throw new Error("Google OAuth is not configured.");
    const redirectUri = new URL("/api/integrations/google/callback", request.url).toString();
    const url = buildGoogleAuthorizationUrl({ clientId: env.GOOGLE_CLIENT_ID, redirectUri, state: createOauthState(env.AUTH_SECRET) });
    return Response.redirect(url);
  } catch (error) { return errorResponse(error); }
}
