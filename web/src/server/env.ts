import { z } from "zod";

const serverEnvSchema = z.object({
  AUTH_SECRET: z.string().min(32).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  OWNER_EMAIL: z.email().default("priyanshbajpai@gmail.com"),
  DATABASE_URL: z.url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().min(24).optional(),
  TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  ENABLE_GOOGLE_WRITES: z.enum(["true", "false"]).default("false"),
  ENABLE_DAILY_GENERATION: z.enum(["true", "false"]).default("false"),
});

export const env = serverEnvSchema.parse(process.env);
