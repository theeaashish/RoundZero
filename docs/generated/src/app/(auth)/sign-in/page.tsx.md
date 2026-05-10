# Sign-In Page (`src/app/(auth)/sign-in/page.tsx`)

The `AuthPage` component serves as the entry point for user authentication. It handles session verification, redirection logic for authenticated users, and renders the login interface.

## Overview

This page is a Next.js Server Component that checks if a user is already authenticated. If a session exists, the user is automatically redirected to their intended destination (or the dashboard). If no session is found, it renders the `LoginForm` component.

## Key Functionality

- **Session Verification**: Uses `auth.api.getSession` to determine if the user is currently logged in.
- **Dynamic Redirection**: Supports custom redirect paths via `searchParams` (`redirect` or `callbackUrl`). If no parameter is provided, it defaults to `/dashboard`.
- **Metadata**: Sets the page title and description for SEO and browser tab identification.

## Props

The component accepts `searchParams` as a Promise:

| Property | Type | Description |
| :--- | :--- | :--- |
| `redirect` | `string` | Optional URL to redirect to after successful login. |
| `callbackUrl` | `string` | Alias for `redirect`. |

## Usage

This page is accessed via the `/sign-in` route. It is designed to handle post-login redirects automatically:

```text
/sign-in?redirect=/settings
```

If a user visits the above URL while already authenticated, they will be immediately redirected to `/settings`.

## Dependencies

- **`@/lib/auth`**: Provides the `auth` instance used to verify the user's session.
- **`../_components/LoginForm`**: The client-side component responsible for rendering the authentication form and handling submission logic.
- **`next/navigation`**: Used for the `redirect` function to manage navigation flow.