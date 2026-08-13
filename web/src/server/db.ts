import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";
import { env } from "@/server/env";

export function getDatabase() {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return drizzle(neon(env.DATABASE_URL), { schema });
}
