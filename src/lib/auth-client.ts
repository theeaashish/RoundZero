import { stripeClient } from "@better-auth/stripe/client";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    stripeClient({ subscription: true }),
    adminClient(),
    inferAdditionalFields<typeof auth>(),
  ],
});
