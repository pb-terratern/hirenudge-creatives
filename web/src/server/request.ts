import { auth } from "@/auth";
import { env } from "@/server/env";
import { isAllowedOwner } from "@/server/auth-policy";

export async function requireOwner() {
  if (process.env.NODE_ENV !== "production" && (process.env.E2E_BYPASS_AUTH === "true" || !env.AUTH_SECRET)) return { user: { email: env.OWNER_EMAIL } };
  const session = await auth();
  if (!isAllowedOwner(session?.user?.email, env.OWNER_EMAIL)) throw new Error("Unauthorized");
  return session;
}

export function requireIdempotencyKey(request: Request): string {
  const key = request.headers.get("idempotency-key")?.trim();
  if (!key) throw new Error("Idempotency-Key header is required.");
  return key;
}

export function errorResponse(error: unknown): Response {
  const message = error instanceof Error ? error.message : "Unknown request error.";
  const status = message === "Unauthorized" ? 401 : message.includes("required") ? 400 : 500;
  return Response.json({ error: message }, { status });
}
