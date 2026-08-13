import { google } from "googleapis";

import { env } from "@/server/env";
import { encryptToken } from "@/server/google/oauth";
import { ensureOwnerUser, storeGoogleIntegration } from "@/server/integration-store";
import { verifyOauthState } from "@/server/oauth-state";
import { errorResponse, requireOwner } from "@/server/request";

export async function GET(request: Request) {
  try {
    const session = await requireOwner();
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.AUTH_SECRET || !env.TOKEN_ENCRYPTION_KEY) throw new Error("Google OAuth is not configured.");
    const url = new URL(request.url);
    const state = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code");
    if (!verifyOauthState(state, env.AUTH_SECRET) || !code) throw new Error("Google OAuth callback state is invalid.");
    const redirectUri = new URL("/api/integrations/google/callback", request.url).toString();
    const oauth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri);
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) throw new Error("Google did not return an offline refresh token. Reconnect with consent.");
    const encryptedRefreshToken = encryptToken(tokens.refresh_token, env.TOKEN_ENCRYPTION_KEY);
    const ownerEmail = session?.user?.email || env.OWNER_EMAIL;
    const userId = await ensureOwnerUser(ownerEmail);
    await storeGoogleIntegration({
      userId,
      encryptedRefreshToken,
      scope: tokens.scope,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    });
    return Response.redirect(new URL("/settings?google=connected", request.url));
  } catch (error) { return errorResponse(error); }
}
