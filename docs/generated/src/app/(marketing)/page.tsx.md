# Marketing Landing Page (`src/app/(marketing)/page.tsx`)

The `page.tsx` file serves as the public-facing landing page for **RoundZero**. It acts as the primary entry point for visitors, providing a comprehensive overview of the platform's value proposition, features, and pricing.

## Purpose
The landing page is designed to convert prospective users by showcasing the AI-powered interview preparation capabilities of the platform. It utilizes a modular architecture, composing various marketing components into a cohesive, visually engaging experience.

## Key Components
The page is structured as a single-page layout composed of the following modular components:

*   **`Navbar`**: Global navigation for the marketing site.
*   **`Hero`**: The primary call-to-action section introducing the platform.
*   **`TrustBar`**: Social proof section (e.g., logos of companies or testimonials).
*   **`FeaturesBento`**: A grid-based layout highlighting core platform features.
*   **`HowItWorks`**: A step-by-step guide on using the AI interview tools.
*   **`SampleReport`**: A preview of the AI-generated feedback reports.
*   **`Comparison`**: A feature comparison table (e.g., vs. traditional methods).
*   **`AudioSamples`**: Demonstrations of the AI voice/feedback capabilities.
*   **`Pricing`**: Subscription tiers and plan details.
*   **`FAQ`**: Common questions to address user concerns.
*   **`Footer`**: Site-wide footer containing links and legal information.

## Visual Design
The page implements a "premium" aesthetic using:
*   **Noise Background**: A subtle texture applied to the `bg-background` for visual depth.
*   **Animated Mesh Gradients**: Uses absolute-positioned, pulse-animated circular divs with `blur-3xl` to create a modern, high-end feel without overwhelming the content.
*   **Responsive Layout**: Built with Tailwind CSS to ensure the marketing content remains accessible across all device sizes.

## Metadata
The page exports standard Next.js metadata for SEO optimization:
*   **Title**: "RoundZero - Master Your Interview Skills"
*   **Description**: Focuses on AI-powered feedback, real-time analysis, and interview improvement.

## Usage
This file is the default export for the root marketing route. It does not require props and is intended to be rendered server-side. To modify the content or structure of the landing page, update the individual components located in `src/app/(marketing)/_components/`.