import "server-only";

import { createRouterClient } from "@orpc/server";
import { os_context } from "@/server/orpc";
import { appRouter } from "@/server/routers/app";

/**
 * Initialize the server-side oRPC client.
 * A fresh client avoids stale router method shapes during dev HMR.
 * The context function is still called per-request for fresh headers.
 */
export function initializeServerClient() {
  return createRouterClient(appRouter, {
    context: async () => {
      // Headers will be provided per-request via Next.js
      const { headers } = await import("next/headers");
      return os_context({ headers: await headers() });
    },
  });
}

// Export the client for direct use
export const serverClient = initializeServerClient();
