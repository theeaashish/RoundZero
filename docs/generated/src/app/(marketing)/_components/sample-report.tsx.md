# SampleReport Component

The `SampleReport` component is a marketing-focused UI element designed to showcase the platform's analytical capabilities. It features an interactive, simulated dashboard that demonstrates how users receive feedback on their interview performance.

## Purpose
This component serves as a visual proof-of-concept for potential users, highlighting the depth of data provided by the platform's reporting engine. It uses interactive tabs to display different categories of feedback, such as technical accuracy, STAR structure, and speech delivery.

## Key Features
*   **Interactive Dashboard Mockup:** A simulated browser window that allows users to toggle between three distinct report views:
    *   **Overview Scores:** High-level performance metrics and improvement trends.
    *   **STAR Structure:** Breakdown of the Situation, Task, Action, and Result framework.
    *   **Speech Delivery:** Analysis of pacing, filler words, and AI-driven recommendations.
*   **Animated Transitions:** Utilizes `framer-motion` for smooth entrance animations and tab switching.
*   **Responsive Design:** Adapts to different screen sizes, ensuring the dashboard remains readable on mobile and desktop.
*   **Visual Polish:** Includes ambient glows, glassmorphism effects, and floating UI elements to create a high-fidelity "product-first" marketing experience.

## Component Structure

### State Management
*   `activeTab`: A local state variable (`overview` | `star` | `speech`) that determines which content panel is currently rendered within the dashboard mockup.

### Data
*   `feedbackItems`: An array of objects defining the key value propositions (Communication, Technical Accuracy, Progress Tracking) displayed in the left-hand column.

### Helper Components
*   `Volume2Icon`: A custom SVG icon component used within the Speech Delivery tab to represent AI recommendations.

## Usage Example

The component is designed to be dropped directly into a marketing page (e.g., the landing page) without requiring external props:

```tsx
import { SampleReport } from "@/app/(marketing)/_components/sample-report";

export default function LandingPage() {
  return (
    <main>
      {/* ... other sections */}
      <SampleReport />
    </main>
  );
}
```

## Dependencies
*   **`framer-motion`**: Used for entrance animations and smooth tab transitions.
*   **`lucide-react`**: Provides the iconography for the feature list and dashboard elements.
*   **`@/components/ui/badge`**: Used for the "Detailed Analytics" header tag.