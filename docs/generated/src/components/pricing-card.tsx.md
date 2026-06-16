# Pricing Card Component

The `pricing-card.tsx` file provides a modular, highly customizable set of sub-components used to construct professional pricing tables or individual pricing cards. It leverages Tailwind CSS for styling and follows a composition-based pattern, allowing developers to assemble pricing layouts that fit specific design requirements.

## Key Components

The module exports several functional components that act as building blocks:

*   **`Card`**: The main container wrapper.
*   **`Header`**: The top section of the card, supporting an `isPopular` prop to highlight specific plans.
*   **`Plan` / `PlanName`**: Used to define the title and layout of the plan header.
*   **`Badge`**: A small label component, useful for "Recommended" or "New" tags.
*   **`Price` / `MainPrice` / `Period` / `OriginalPrice`**: A suite of components for displaying pricing information, including support for strikethrough original prices.
*   **`Body`**: The container for the feature list.
*   **`List` / `ListItem`**: Semantic `<ul>` and `<li>` elements for displaying plan features.
*   **`Separator`**: A decorative divider with optional text, useful for separating tiers or feature sets.

## Usage Example

You can compose these components to create a standard pricing card:

```tsx
import * as Pricing from "@/components/pricing-card";

export function MyPricingCard() {
  return (
    <Pricing.Card>
      <Pricing.Header isPopular>
        <Pricing.Plan>
          <Pricing.PlanName>Pro Plan</Pricing.PlanName>
          <Pricing.Badge>Popular</Pricing.Badge>
        </Pricing.Plan>
        <Pricing.Price>
          <Pricing.MainPrice>$29</Pricing.MainPrice>
          <Pricing.Period>/ month</Pricing.Period>
        </Pricing.Price>
        <Pricing.Description>Everything you need to scale.</Pricing.Description>
      </Pricing.Header>
      
      <Pricing.Body>
        <Pricing.List>
          <Pricing.ListItem>Unlimited projects</Pricing.ListItem>
          <Pricing.ListItem>Advanced analytics</Pricing.ListItem>
        </Pricing.List>
      </Pricing.Body>
    </Pricing.Card>
  );
}
```

## Technical Details

*   **Styling**: Uses the `cn` utility function (from `@/lib/utils`) to merge Tailwind classes, ensuring compatibility with existing project themes.
*   **Extensibility**: Every component accepts standard HTML attributes via `React.ComponentProps`, allowing for easy addition of event handlers, custom IDs, or additional Tailwind classes.
*   **Design System**: The components are designed to be responsive, with font sizes and padding scaling appropriately for mobile and desktop viewports.