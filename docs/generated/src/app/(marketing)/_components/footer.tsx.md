# Footer Component

The `Footer` component is a comprehensive, responsive footer designed for the marketing pages of the RoundZero platform. It features a high-conversion Call-to-Action (CTA) section followed by a multi-column navigation structure, newsletter subscription, and social media links.

## Overview

- **File Path:** `src/app/(marketing)/_components/footer.tsx`
- **Dependencies:** `framer-motion` (for animations), `lucide-react` (for iconography), and internal UI components (`Button`, `Input`).
- **Purpose:** Provides site-wide navigation, legal links, and a final conversion point for users to sign up or schedule a demo.

## Key Components

### 1. CTA Section
Located at the top of the footer, this section uses `framer-motion` to animate into view. It includes:
- A compelling headline and sub-headline.
- Primary and secondary action buttons ("Start practicing for free" and "Schedule a demo").

### 2. Main Footer Grid
A structured grid layout containing:
- **Brand Identity:** Displays the logo and a brief mission statement.
- **Newsletter Subscription:** An input field and button for user engagement.
- **Navigation Links:** Categorized into four columns:
    - **Product:** Features, Pricing, Demo, Changelog.
    - **Company:** About, Blog, Careers, Press Kit.
    - **Resources:** Documentation, Help Center, Community, Contact.
    - **Legal:** Privacy Policy, Terms of Service, Cookie Policy.

### 3. Bottom Bar
Contains the copyright notice and social media icons (Twitter, LinkedIn, GitHub) for external community engagement.

## Usage

The `Footer` component is intended to be imported and placed at the bottom of your marketing layout pages.

```tsx
import { Footer } from "@/app/(marketing)/_components/footer";

export default function MarketingLayout({ children }) {
  return (
    <main>
      {children}
      <Footer />
    </main>
  );
}
```

## Technical Details

- **Responsive Design:** Uses Tailwind CSS grid and flexbox utilities to stack columns on mobile and expand to a 6-column grid on larger screens.
- **Animations:** Utilizes `framer-motion`'s `whileInView` property to trigger a subtle fade-in and slide-up animation for the CTA section as the user scrolls to the bottom of the page.
- **Styling:** Employs a modern aesthetic with `backdrop-blur`, `border-border/50` for subtle dividers, and `muted-foreground` for secondary text to maintain visual hierarchy.