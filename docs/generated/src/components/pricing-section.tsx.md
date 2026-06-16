# PricingSection Component

The `PricingSection` component is a reusable, responsive UI component designed to display subscription plans. It integrates with Stripe for billing, handles authentication-aware call-to-actions, and provides error handling for common checkout issues.

## Key Functionality

*   **Dynamic Plan Rendering**: Fetches and displays plan configurations using `getPublicPlanConfigs`.
*   **Authentication Awareness**: Adjusts button labels and behavior based on the user's session status (e.g., "Start for free" vs. "Upgrade to Pro").
*   **Stripe Integration**: 
    *   Handles the checkout flow via `authClient.subscription.upgrade`.
    *   Supports plan upgrades and downgrades (scheduling downgrades at the end of the billing period).
    *   Redirects users to Stripe Checkout sessions.
*   **Error Handling**: Includes a `CheckoutIssueDialog` to provide user-friendly feedback for common billing errors, such as Stripe mode mismatches or stale customer data.
*   **State Management**: Tracks loading states during checkout redirection to prevent duplicate submissions.

## Components & Dependencies

*   **`PricingCard`**: A compound component pattern used to structure the visual representation of each plan (Header, Price, Body, Features).
*   **`authClient`**: Used for session management and triggering subscription upgrades.
*   **`orpc` / `orpcClient`**: Used to fetch the current user's billing state and prepare the backend for checkout.
*   **`CheckoutIssueDialog`**: A specialized modal for displaying actionable error messages related to billing.

## Usage

The component is designed to be dropped into a landing page or pricing page. It accepts optional configuration for the header section:

```tsx
import { PricingSection } from "@/components/pricing-section";

export default function PricingPage() {
  return (
    <PricingSection 
      title="Choose your plan" 
      subtitle="Flexible options for every stage." 
    />
  );
}
```

## Key Logic

### `getPlanButtonLabel`
This helper function determines the text displayed on the call-to-action button based on:
1.  **Authentication status**: Prompts for sign-in if the user is unauthenticated.
2.  **Current plan**: Identifies if the user is already on the plan or needs to upgrade/downgrade.

### `handleCheckout`
The primary event handler for the "Choose Plan" button:
1.  **Unauthenticated**: Redirects to sign-in with a `callbackUrl`.
2.  **Free Plan**: Redirects to the dashboard.
3.  **Active Plan**: Redirects to the billing management page.
4.  **Paid Plan**: Initiates the Stripe checkout process, handling potential errors via `openCheckoutIssueDialog`.