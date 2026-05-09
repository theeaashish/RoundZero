# Authentication Module (`src/lib/auth.ts`)

The `auth.ts` file serves as the central authentication configuration for the application, powered by [Better Auth](https://www.better-auth.com/). It integrates database persistence, social authentication, session management, and Stripe billing synchronization.

## Overview

This module initializes the `betterAuth` instance, configuring how users authenticate, how their sessions are managed, and how their subscription status is synchronized with Stripe.

## Key Features

### 1. Authentication & Security
*   **Social Providers:** Supports Google and GitHub authentication.
*   **Account Linking:** Enabled for trusted providers, allowing users to link multiple social accounts to a single identity.
*   **Session Management:** Configured for a 7-day expiration with a 24-hour update interval.
*   **Custom User Schema:** Extends the base user model with fields for `role`, `banned` status, `banReason`, and `banExpires`.

### 2. Plugins
*   **`nextCookies`:** Handles cookie-based session management for Next.js.
*   **`admin`:** Provides administrative capabilities.
*   **`stripe`:** Integrates Stripe billing directly into the auth flow:
    *   **Auto-provisioning:** Automatically creates a Stripe customer record upon user sign-up.
    *   **Subscription Sync:** Uses `syncSubscriptionSnapshotFromStripe` to keep the local database in sync with Stripe events (created, updated, deleted).
    *   **Plan Management:** Fetches subscription plans via `getStripeSubscriptionPlans()`.

## Exports

| Export | Type | Description |
| :--- | :--- | :--- |
| `auth` | `BetterAuth` | The primary authentication instance. |
| `Auth` | `Type` | The TypeScript type definition for the auth instance. |
| `UserRole` | `Union` | Defines valid user roles (`"user" \| "admin"`). |
| `Session` | `Type` | The inferred type for the application's session object. |

## Usage Example

To use the authentication instance in your application (e.g., in API routes or server components):

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
```

## Dependencies
*   **Database:** Uses `prismaAdapter` with a PostgreSQL provider.
*   **Environment:** Relies on `env` for sensitive credentials (Google/GitHub keys, Stripe secrets).
*   **Billing:** Integrates with local billing utilities (`@/lib/billing/*`) to ensure data consistency between Stripe and the local database.