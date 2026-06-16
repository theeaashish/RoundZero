# AnimatedMockup Component

The `AnimatedMockup` component is a marketing UI element designed to simulate an interactive AI interview session. It provides a visual demonstration of the platform's capabilities, including session setup, AI-user interaction, real-time analysis, and feedback generation.

## Purpose
This component serves as a high-fidelity visual aid for landing pages or marketing materials, showcasing the "RoundZero" interview experience without requiring actual backend integration. It uses `framer-motion` to create smooth transitions between different stages of an interview.

## Key Features

*   **Simulated Lifecycle:** Automatically cycles through five distinct stages:
    1.  **Setup:** Displays the configuration phase with a typing effect for the target role.
    2.  **AI Speaking:** Simulates the AI interviewer asking a question with a visual voice waveform.
    3.  **User Speaking:** Simulates a candidate's response, featuring dynamic keyword highlighting for technical terms.
    4.  **Analyzing:** Displays a progress bar and status updates while the AI "processes" the response.
    5.  **Scorecard:** Presents a final feedback summary with metrics and actionable insights.
*   **Dynamic Visuals:**
    *   **Typing Effects:** Simulates human-like text entry for roles and responses.
    *   **Voice Waveforms:** Uses `framer-motion` to animate bars, mimicking audio input/output.
    *   **Keyword Highlighting:** The `highlightKeywords` helper function automatically styles technical jargon (e.g., "Redis", "120ms") to emphasize technical depth.
*   **Responsive Design:** Built with a grid-based layout that adapts from a sidebar-focused desktop view to a streamlined mobile-friendly interface.

## Technical Implementation

### State Management
The component uses a local `stage` state to control the animation loop. An `useEffect` hook manages an asynchronous sequence that updates text content and progress percentages, ensuring the simulation runs continuously.

### Helper Functions
*   **`highlightKeywords(text: string)`**: A utility that parses text and wraps specific technical terms in styled `<span>` elements. It applies distinct colors (e.g., emerald for performance metrics) to highlight key technical achievements.

### Dependencies
*   **`framer-motion`**: Used for entrance/exit animations and the continuous waveform pulse effects.
*   **`lucide-react`**: Provides the iconography for the UI (e.g., `Mic`, `Brain`, `Terminal`).

## Usage
The component is self-contained and can be dropped into any page within the `(marketing)` route:

```tsx
import { AnimatedMockup } from "@/app/(marketing)/_components/animated-mockup";

export default function LandingPage() {
  return (
    <section>
      <AnimatedMockup />
    </section>
  );
}
```

*Note: This component is intended for demonstration purposes and does not connect to the actual `InterviewContext` or backend services.*