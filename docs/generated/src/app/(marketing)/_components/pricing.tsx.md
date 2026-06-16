# Pricing Component

The `Pricing` component is a marketing-facing section designed to display subscription tiers or service plans. It serves as a landing page element that encourages user conversion by highlighting the value proposition of the platform.

## Overview
This component acts as a wrapper for the reusable `PricingSection` component, providing specific branding, layout constraints, and structural styling (such as top-border dividers and responsive padding) to fit within the marketing site's design system.

## Key Components

*   **`PricingSection`**: An imported shared component that handles the internal logic and rendering of the pricing cards, features, and toggle states.
*   **`section#pricing`**: The root container, which includes a decorative top border and responsive vertical padding to ensure proper spacing on different screen sizes.

## Usage

The component is intended to be used within the marketing pages (e.g., the landing page). It requires no props as the content is hardcoded for the specific marketing context.

```tsx
import { Pricing } from "@/app/(marketing)/_components/pricing";

export default function LandingPage() {
  return (
    <main>
      {/* ... other sections */}
      <Pricing />
    </main>
  );
}
```

## Technical Details

*   **Client-Side Rendering**: Marked with `"use client"`, allowing for potential interactivity within the `PricingSection` (such as monthly/yearly toggles).
*   **Styling**: Utilizes Tailwind CSS for layout, including:
    *   `max-w-7xl` for consistent content alignment.
    *   `bg-linear-to-r` for a subtle, modern divider effect at the top of the section.
    *   Responsive padding (`py-24 lg:py-32`) to maintain visual balance across mobile and desktop viewports.