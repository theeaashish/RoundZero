# TrustBar Component

The `TrustBar` component is a marketing section designed to build user confidence by showcasing the caliber of companies users can prepare for and highlighting key platform performance metrics. It is intended for use on landing pages or marketing-facing routes.

## Overview
The component is divided into two primary sections:
1.  **Company Showcase:** A list of top-tier tech companies presented with subtle entrance animations and hover effects.
2.  **Value Proposition Stats:** A grid of three cards highlighting core platform features (latency, evaluation frameworks, and availability) using icons and descriptive text.

## Key Features
*   **Animations:** Utilizes `framer-motion` for staggered entrance animations, hover scaling, and smooth opacity transitions.
*   **Responsive Design:** Uses a grid layout that adapts from a single column on mobile to a three-column layout on desktop.
*   **Visual Polish:** Includes subtle border dividers, background gradients, and backdrop effects to maintain a modern, professional aesthetic consistent with the rest of the application.
*   **Interactive Elements:** Company names feature a hover-to-highlight effect, and stat cards feature a subtle background glow on hover.

## Data Structure
The component relies on two internal constant arrays:
*   `companies`: A simple string array of company names.
*   `stats`: An array of objects containing:
    *   `icon`: A `lucide-react` icon component.
    *   `value`: The primary metric (e.g., "180ms").
    *   `label`: The feature title.
    *   `sublabel`: A brief description of the feature.

## Usage
The component is self-contained and requires no props. It can be imported and placed directly into any marketing page:

```tsx
import { TrustBar } from "@/app/(marketing)/_components/trust-bar";

export default function LandingPage() {
  return (
    <main>
      {/* ... other sections */}
      <TrustBar />
    </main>
  );
}
```

## Dependencies
*   **`framer-motion`**: Used for all entrance and hover animations.
*   **`lucide-react`**: Provides the iconography for the stat cards.
*   **Tailwind CSS**: Used for styling, including custom gradients and responsive layout utilities.