# AudioSamples Component

The `AudioSamples` component is a marketing section designed to showcase the platform's AI-driven interview capabilities through interactive audio previews. It provides users with a visual and auditory demonstration of different interview scenarios, such as behavioral rounds, technical deep-dives, and AI feedback sessions.

## Overview

This component features a grid of interactive cards, each representing a specific type of interview session. Users can toggle playback for each sample, which triggers a simulated "live" waveform animation.

### Key Features
*   **Interactive Playback:** Users can play/pause audio samples. Playback is currently simulated with a 5-second auto-stop timer.
*   **Dynamic Waveform Visualization:** The `AudioWaveform` sub-component uses `framer-motion` to animate bars, simulating real-time audio activity when a sample is playing.
*   **Responsive Design:** Built with a grid layout that adapts from a single column on mobile to three columns on desktop.
*   **Visual Feedback:** Includes hover effects, pulse animations for active playback, and subtle background gradients to enhance user engagement.

## Components

### `AudioSamples` (Main Export)
The primary container for the section. It manages the state of the currently playing audio sample using the `playing` state variable.

*   **`samples`**: A static array defining the metadata for each audio demo (title, description, duration, and styling).
*   **`togglePlay(id)`**: A handler that manages the playback state. If a user clicks a different sample, it switches the active state; clicking the same sample pauses it.

### `AudioWaveform`
A visual representation of audio activity.
*   **Props**:
    *   `isPlaying` (boolean): Determines whether the animation should be active.
    *   `gradient` (string): Used for styling the waveform bars.
*   **Functionality**: Uses `useEffect` to update the height of 24 bars at 100ms intervals when `isPlaying` is true, creating a randomized "bouncing" effect.

## Usage

This component is intended for use on marketing or landing pages. It requires no external props and can be dropped directly into a page:

```tsx
import { AudioSamples } from "@/app/(marketing)/_components/audio-samples";

export default function LandingPage() {
  return (
    <main>
      <AudioSamples />
    </main>
  );
}
```

## Dependencies
*   **`framer-motion`**: Used for smooth entrance animations and the dynamic waveform bar transitions.
*   **`lucide-react`**: Provides the UI icons (`Headphones`, `Play`, `Pause`, `Volume2`).
*   **`@/components/ui/badge`**: Used for the section header label.