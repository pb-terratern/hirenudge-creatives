import { env } from "@/server/env";
import { createGoogleClients } from "@/server/google/operations";
import { decryptToken } from "@/server/google/oauth";
import { loadGoogleIntegration } from "@/server/integration-store";

export async function googleClientsForOwner(email: string) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.TOKEN_ENCRYPTION_KEY) throw new Error("Google Workspace is not fully configured.");
  const integration = await loadGoogleIntegration(email);
  const refreshToken = decryptToken(integration.encryptedRefreshToken!, env.TOKEN_ENCRYPTION_KEY);
  return createGoogleClients(refreshToken, env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, "");
}
