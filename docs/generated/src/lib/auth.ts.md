# Authentication Module (`src/lib/auth.ts`)

The `auth.ts` file serves as the central authentication configuration for the application, powered by [Better Auth](https://www.better-auth.com/). It integrates database persistence, social authentication, session management, and Stripe billing synchronization.

## Overview

This module initializes the `betterAuth` instance, configuring how users authenticate, how their sessions are managed, and how their subscription status is synchronized with Stripe.

## Key Components

### 1. Configuration
*   **Database:** Uses `prismaAdapter` with PostgreSQL to persist user data and sessions.
*   **Authentication Methods:**
    *   **Email/Password:** Disabled.
    *   **Social Providers:** Google and GitHub are enabled using environment variables.
    *   **Account Linking:** Enabled for trusted providers (Google/GitHub), allowing users to merge accounts.
*   **Session Management:** Sessions expire after 7 days, with a rolling update interval of 24 hours.
*   **User Schema:** Extends the base user model with custom fields: `role`, `banned`, `banReason`, and `banExpires`.

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

## Usage

To use the authentication instance in your application (e.g., in API routes or Server Components):

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Example: Getting the current session
const session = await auth.api.getSession({
  headers: await headers(),
});
```

### Subscription Handling
The Stripe integration is fully automated. When a subscription event occurs (e.g., a user upgrades their plan), the `onEvent` and `onSubscriptionComplete` hooks trigger `syncSubscriptionSnapshotFromStripe`, ensuring the local database reflects the current state of the Stripe subscription without manual intervention.