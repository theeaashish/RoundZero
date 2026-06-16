# Create Interview Page

The `CreateInterviewPage` component provides a multi-step wizard interface for users to configure and initialize a new AI-powered interview session. It handles form state, resume parsing, and billing validation before creating an interview record.

## Functionality
- **Multi-step Wizard**: Guides users through four distinct configuration steps:
  1. **Interview Type**: Select between Technical, System Design, or Behavioral interviews.
  2. **Role Details**: Define the target job title, tech stack, and experience level.
  3. **Company Context**: Provide specific company details and job descriptions.
  4. **Resume Context**: Upload or select a resume to provide the AI with personalized background information.
- **Resume Parsing**: Automatically extracts text from uploaded resumes using the `orpc` client to provide context for the AI interviewer.
- **Billing Integration**: Checks user subscription status via `orpc` before allowing the creation of a new interview, triggering an `UpgradePlanDialog` if limits are reached.
- **Form Validation**: Uses `zod` and `react-hook-form` to ensure data integrity across all steps.

## Key Components
- **`FormStepper`**: Visual indicator of the current progress through the 4-step process.
- **`ResumeUploader`**: Handles file uploads and triggers the parsing mutation.
- **`StepCompanyContext`**: A modular component for handling company-specific inputs.
- **`UpgradePlanDialog`**: A modal that prompts users to upgrade their subscription when they exceed their interview quota.

## State Management
- **`currentStep`**: Tracks the active step in the wizard.
- **`react-hook-form`**: Manages the complex form state, including conditional fields based on the selected interview type.
- **`@tanstack/react-query`**:
    - `createInterview`: Mutation to persist the interview configuration to the backend.
    - `parseResume`: Mutation to process uploaded resume files.
    - `billing.getState`: Query to fetch current user usage limits.

## Usage
This page is accessed via the `/dashboard/interview/create` route. It relies on the `orpc` client for type-safe communication with the backend and expects the user to be authenticated.

### Key Methods
- `canProceedFromStep(step)`: Validates the current form state before allowing the user to advance to the next step.
- `onResumeUpload`: Callback triggered when a file is uploaded, initiating the parsing process.
- `onSubmit`: Finalizes the configuration and triggers the `createInterview` mutation.

## Dependencies
- **`react-hook-form` & `zod`**: For form handling and schema validation.
- **`@tanstack/react-query`**: For server state and API mutations.
- **`orpc`**: For type-safe API calls.
- **`lucide-react`**: For UI iconography.