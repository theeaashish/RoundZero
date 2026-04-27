import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    DEEPGRAM_API_KEY: z.string().min(1),
    DEEPGRAM_PROJECT_ID: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
    S3_BUCKET_NAME: z.string().min(1),
    S3_ENDPOINT: z.url().default("https://t3.storage.dev"),
    S3_REGION: z.string().default("auto"),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
  },

  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_ROUNZERO_PRO_PRICE_ID: z.string().min(1),
    NEXT_PUBLIC_ROUNZERO_ELITE_PRICE_ID: z.string().min(1),
  },

  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_ROUNZERO_PRO_PRICE_ID:
      process.env.NEXT_PUBLIC_ROUNZERO_PRO_PRICE_ID,
    NEXT_PUBLIC_ROUNZERO_ELITE_PRICE_ID:
      process.env.NEXT_PUBLIC_ROUNZERO_ELITE_PRICE_ID,
  },
});
