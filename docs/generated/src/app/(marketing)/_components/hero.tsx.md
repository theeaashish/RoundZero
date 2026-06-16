# Hero Component

The `Hero` component is the primary landing section for the marketing page. It is designed to capture user attention, communicate the value proposition of the AI interview platform, and drive conversions through clear calls-to-action (CTAs).

## Overview
The component uses `framer-motion` to provide smooth, staggered entrance animations for its elements, creating a modern and polished feel. It serves as the entry point for users to begin their interview preparation journey.

## Key Features
- **Announcement Badge**: A pulsing, interactive badge highlighting new features (e.g., "Interactive Voice & STAR interview practice").
- **Value Proposition**: A high-impact headline and subheadline that clearly define the platform's ability to provide adaptive, resume-tailored AI interview practice.
- **Conversion CTAs**: Dual-action buttons allowing users to immediately start practicing or watch a product demo.
- **Visual Simulation**: Integrates the `AnimatedMockup` component to provide a visual preview of the platform's interface, supported by an ambient background glow for visual depth.

## Component Structure

| Element | Description |
| :--- | :--- |
| `motion.div` (Badge) | Animated announcement container with a pinging status indicator. |
| `h1` (Headline) | The primary hook, emphasizing "realistic AI interviews." |
| `p` (Subheadline) | Explains the core functionality: resume analysis, follow-up questions, and STAR feedback. |
| `Button` (Primary) | Links to `/sign-in` to initiate the user onboarding/practice flow. |
| `Button` (Secondary) | Links to the `#demo` section for product walkthroughs. |
| `AnimatedMockup` | A visual representation of the application interface. |

## Usage
This component is intended for use within the main marketing page layout. It relies on standard UI components from the project's design system (`Badge`, `Button`) and the `framer-motion` library for animations.

```tsx
import { Hero } from "@/app/(marketing)/_components/hero";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      {/* Other sections */}
    </main>
  );
}
```

## Dependencies
- **`framer-motion`**: Used for entrance animations.
- **`lucide-react`**: Provides iconography (`ArrowRight`, `Play`, `Zap`).
- **`@/components/ui/...`**: Uses the project's shared UI library for consistent styling.
- **`./animated-mockup`**: A local component providing the visual simulation of the interview interface.