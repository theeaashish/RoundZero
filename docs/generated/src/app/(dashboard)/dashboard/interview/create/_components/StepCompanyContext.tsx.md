# StepCompanyContext Component

The `StepCompanyContext` component is a UI form section used within the interview creation wizard. It allows users to provide specific company details and job descriptions, which are used to tailor the AI-driven interview experience.

## Purpose
This component provides a structured input interface for:
1.  **Company Name**: Sets the context for the AI's persona and tone.
2.  **Job Description**: Provides the source material for the AI to generate relevant, role-specific interview questions.

## Key Features
*   **Real-time Character Counting**: Uses `react-hook-form`'s `useWatch` to track input length against predefined `FIELD_LIMITS`, providing immediate visual feedback to the user.
*   **Validation Integration**: Fully integrated with `react-hook-form` and Zod schemas to ensure data integrity before submission.
*   **Responsive UI**: Utilizes a card-based layout with clear iconography and descriptive text to guide the user through the input process.
*   **Performance Optimized**: Uses `useWatch` to subscribe only to the specific fields required for character counting, preventing unnecessary re-renders of the entire form.

## Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `form` | `UseFormReturn<CreateInterviewInput>` | The form instance object provided by `useForm` from `react-hook-form`. |

## Dependencies
*   **`react-hook-form`**: Manages form state and validation.
*   **`@/lib/zodSchemas/createInterview`**: Provides the `createInterviewSchema` for type safety and `FIELD_LIMITS` for input constraints.
*   **`@/components/ui`**: Uses standard UI components (Card, Form, Input, Textarea) for consistent styling.

## Usage Example

```tsx
import { useForm } from "react-hook-form";
import { StepCompanyContext } from "./StepCompanyContext";

const CreateInterviewForm = () => {
  const form = useForm<CreateInterviewInput>({
    // ... configuration
  });

  return (
    <form>
      <StepCompanyContext form={form} />
    </form>
  );
};
```