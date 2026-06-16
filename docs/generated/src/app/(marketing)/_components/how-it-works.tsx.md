# HowItWorks Component

The `HowItWorks` component is a marketing section designed to showcase the platform's four-step interview preparation workflow. It uses `framer-motion` for scroll-triggered animations and provides a visually engaging, interactive grid layout.

## Purpose
This component serves as a high-level overview of the user journey, guiding potential users through the platform's capabilities:
1. **Resume Analysis:** Mapping experience to job requirements.
2. **Voice Interview:** Engaging in AI-driven conversational practice.
3. **Live Coding:** Solving technical problems in a real-time editor.
4. **Instant Feedback:** Receiving actionable scorecards and improvement metrics.

## Key Features
*   **Animated Transitions:** Uses `whileInView` to trigger entrance animations as the user scrolls down the page.
*   **Interactive Cards:** Each step is contained within a card that features hover effects, including subtle background glows and icon scaling.
*   **Responsive Design:** A grid layout that adapts from a single column on mobile to a two-column layout on larger screens.
*   **Visual Hierarchy:** Uses large, low-opacity "watermark" step numbers and distinct iconography to improve readability and user engagement.

## Data Structure
The component relies on a local `features` array, which defines the content for each step:

| Property | Description |
| :--- | :--- |
| `icon` | The `lucide-react` icon component to display. |
| `title` | The heading for the step. |
| `description` | A brief explanation of the step's functionality. |
| `step` | The string representation of the step number (e.g., "01"). |
| `delay` | The animation delay value for staggered entrance effects. |

## Usage
This component is intended for use on the marketing landing page. It requires no props and can be imported directly:

```tsx
import { HowItWorks } from "@/app/(marketing)/_components/how-it-works";

export default function LandingPage() {
  return (
    <main>
      <HowItWorks />
    </main>
  );
}
```

## Dependencies
*   **`framer-motion`**: Handles entrance animations and scroll-based triggers.
*   **`lucide-react`**: Provides the iconography for each step.
*   **`@/components/ui/badge`**: Used for the section header label.