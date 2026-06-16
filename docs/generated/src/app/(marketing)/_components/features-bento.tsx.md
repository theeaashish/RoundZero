# FeaturesBento Component

The `FeaturesBento` component is a marketing section designed to showcase the core capabilities of the interview preparation platform. It uses a responsive "bento grid" layout with interactive animations to highlight key features.

## Purpose
This component serves as the primary feature overview on the landing page. It visually demonstrates the platform's value proposition, including AI-driven simulation, voice interaction, and technical assessment tools.

## Key Features
The grid consists of six distinct cards, each featuring:
*   **Adaptive AI Interviewer:** Demonstrates dynamic follow-up questioning and conversational depth.
*   **Voice Mode:** Highlights real-time, natural voice-to-voice practice capabilities.
*   **Resume-Tailored Questions:** Shows how the platform parses user resumes and job descriptions to generate relevant interview loops.
*   **Performance Analytics:** Displays visual feedback on pacing, filler word usage, and STAR method competency.
*   **Monaco Code Editor:** Showcases the integrated coding environment for technical assessments.
*   **On-Demand Rounds:** Emphasizes the 24/7 availability of the platform for immediate practice.

## Technical Implementation
*   **Animations:** Utilizes `framer-motion` for scroll-triggered entrance animations (`initial`, `whileInView`) and subtle hover effects.
*   **Styling:** Built with Tailwind CSS, featuring a dark/light mode-aware design using custom background colors and border utilities.
*   **Visual Simulations:** Each card includes a "mini-UI" simulation (e.g., code snippets, progress bars, or audio waveforms) to provide immediate context for the feature being described.
*   **Responsiveness:** Uses a grid layout (`grid-cols-1 md:grid-cols-6`) to ensure the bento grid adapts gracefully from mobile devices to large desktop screens.

## Usage
This component is intended for use within the marketing pages (e.g., the landing page) to provide a high-level summary of the platform's functionality.

```tsx
import { FeaturesBento } from "@/app/(marketing)/_components/features-bento";

export default function LandingPage() {
  return (
    <main>
      <FeaturesBento />
    </main>
  );
}
```

## Dependencies
*   **`framer-motion`**: Used for entrance animations and the pulse effects in the visual simulations.
*   **`lucide-react`**: Provides the iconography for each feature card.
*   **`@/components/ui/badge`**: Used for the section header label.