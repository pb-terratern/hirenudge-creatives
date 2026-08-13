import { and, eq } from "drizzle-orm";

import { integrationAccounts, users } from "@/db/schema";
import { getDatabase } from "@/server/db";

export async function storeGoogleIntegration(input: { userId: string; encryptedRefreshToken: string; scope?: string; expiresAt?: Date }) {
  const database = getDatabase();
  const existing = await database.query.integrationAccounts.findFirst({ where: eq(integrationAccounts.userId, input.userId) });
  if (existing) {
    await database.update(integrationAccounts).set({ encryptedRefreshToken: input.encryptedRefreshToken, scope: input.scope, expiresAt: input.expiresAt, updatedAt: new Date() }).where(eq(integrationAccounts.id, existing.id));
    return existing.id;
  }
  const [created] = await database.insert(integrationAccounts).values({ userId: input.userId, provider: "google-workspace", encryptedRefreshToken: input.encryptedRefreshToken, scope: input.scope, expiresAt: input.expiresAt }).returning({ id: integrationAccounts.id });
  return created.id;
}

export async function ensureOwnerUser(email: string): Promise<string> {
  const database = getDatabase();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await database.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
  if (existing) return existing.id;
  const [created] = await database
    .insert(users)
    .values({ email: normalizedEmail })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });
  if (created) return created.id;
  const raced = await database.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
  if (!raced) throw new Error("Unable to create the owner account.");
  return raced.id;
}

export async function loadGoogleIntegration(email: string) {
  const database = getDatabase();
  const user = await database.query.users.findFirst({ where: eq(users.email, email.trim().toLowerCase()) });
  if (!user) throw new Error("The owner account has not connected Google Workspace.");
  const integration = await database.query.integrationAccounts.findFirst({ where: and(eq(integrationAccounts.userId, user.id), eq(integrationAccounts.provider, "google-workspace")) });
  if (!integration?.encryptedRefreshToken) throw new Error("Google Workspace is not connected with offline access.");
  return integration;
}
