# Comparison Component

The `Comparison` component is a marketing section designed to highlight the competitive advantages of the RoundZero platform against traditional interview preparation methods (e.g., practicing with peers or using LeetCode).

## Purpose
This component provides a visual, data-driven comparison table that demonstrates why RoundZero is a superior tool for interview preparation. It uses interactive animations and clear status indicators to communicate feature availability across different platforms.

## Key Components

### `comparisonData`
A constant array of objects defining the features to be compared. Each object contains:
* `feature`: The name of the capability (e.g., "Voice-based practice").
* `peers`, `leetcode`, `roundzero`: Boolean or string values indicating support (`true`, `false`, or `"partial"`).

### `StatusIcon`
A helper component that renders a visual indicator based on the status of a feature:
* **True**: A green checkmark (`Check`) in an emerald container.
* **False**: A grey 'X' (`X`) in a muted container.
* **Partial**: A yellow minus sign (`Minus`) in a yellow container.

### `Comparison` (Main Export)
The primary functional component that renders the section. It includes:
* **Header Section**: Uses `framer-motion` for entrance animations and displays a `Badge` to highlight the platform's value proposition.
* **Comparison Table**: A responsive table structure that highlights the "RoundZero" column with a distinct background color (`bg-primary/10`) to draw user attention.
* **Animations**: Utilizes `framer-motion` to animate the table rows as they enter the viewport, creating a polished, professional feel.

## Usage

The component is intended for use on marketing or landing pages. It requires no props and can be imported directly into your page layout:

```tsx
import { Comparison } from "@/app/(marketing)/_components/comparison";

export default function LandingPage() {
  return (
    <main>
      {/* ... other sections */}
      <Comparison />
    </main>
  );
}
```

## Technical Details
* **Styling**: Uses Tailwind CSS for layout and styling, including `backdrop-blur` and custom border gradients.
* **Responsiveness**: The table is wrapped in an `overflow-x-auto` container with a `min-w-[700px]` constraint to ensure it remains readable on smaller screens while maintaining layout integrity.
* **Dependencies**: 
    * `framer-motion`: For scroll-triggered entrance animations.
    * `lucide-react`: For iconography.
    * `@/components/ui/badge`: For consistent UI labeling.