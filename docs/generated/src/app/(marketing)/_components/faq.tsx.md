# FAQ Component

The `FAQ` component is a marketing section designed to address common user queries regarding the RoundZero platform. It provides an interactive, accordion-style interface that explains the AI interview process, security measures, and platform capabilities.

## Purpose
This component serves as a self-service support resource on the marketing landing page, helping to build user trust and clarify the value proposition of the AI-driven interview preparation tool.

## Key Features
*   **Interactive Accordion**: Uses the Radix UI-based `Accordion` component to keep the interface clean while allowing users to expand specific questions.
*   **Animated Transitions**: Leverages `framer-motion` to provide smooth entrance animations for the section header, individual FAQ items, and the final call-to-action.
*   **Responsive Design**: Optimized for various screen sizes, ensuring readability on both mobile and desktop devices.
*   **Thematic Styling**: Uses custom Tailwind CSS classes to match the platform's aesthetic, including dark mode support and subtle hover effects.

## Data Structure
The component iterates over a static `faqs` array containing objects with the following structure:
*   `question`: The string displayed as the accordion trigger.
*   `answer`: The detailed response displayed when the accordion is expanded.

## Usage
The component is intended to be imported and used within the marketing landing page layout:

```tsx
import { FAQ } from "@/app/(marketing)/_components/faq";

export default function LandingPage() {
  return (
    <main>
      {/* Other sections */}
      <FAQ />
    </main>
  );
}
```

## Dependencies
*   **`framer-motion`**: Handles entrance and scroll-triggered animations.
*   **`lucide-react`**: Provides the `HelpCircle` icon.
*   **`@/components/ui/accordion`**: A reusable UI component for collapsible content.
*   **`@/components/ui/badge`**: Used for the section header label.