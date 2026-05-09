# Next.js Configuration (`next.config.ts`)

The `next.config.ts` file serves as the central configuration hub for the Next.js application. It is optimized for performance, developer experience, and strict type safety.

## Key Features

### 1. Performance & Optimization
*   **Bundle Size Optimization:** Uses `experimental.optimizePackageImports` to automatically tree-shake and import only the necessary components from heavy libraries (e.g., `lucide-react`, `framer-motion`, and various `@radix-ui` primitives). This prevents large bundle sizes caused by barrel file imports.
*   **Server-Side Performance:** The `serverExternalPackages` configuration ensures that heavy dependencies (like `prisma`, `pg`, and PDF processing libraries) are treated as external, optimizing server-side execution and cold starts.
*   **React Compiler:** Enabled (`reactCompiler: true`) to leverage automatic memoization, reducing the need for manual `useMemo` and `useCallback` hooks.

### 2. Developer Experience
*   **Waterfall Identification:** Configured `logging.fetches` to display full URLs in the console, assisting developers in identifying and debugging network request waterfalls.
*   **Type Safety:** `typedRoutes` is enabled, providing full TypeScript support for internal application links, reducing runtime navigation errors.

### 3. Image Handling
The application is configured to allow remote images from trusted social authentication providers to support user profile avatars:
*   `lh3.googleusercontent.com` (Google)
*   `avatars.githubusercontent.com` (GitHub)

## Configuration Summary

| Feature | Setting | Purpose |
| :--- | :--- | :--- |
| **React Compiler** | `true` | Automatic component memoization. |
| **Typed Routes** | `true` | Compile-time link validation. |
| **Logging** | `fetches.fullUrl: true` | Debugging network performance. |
| **Image Domains** | Google/GitHub | Allow-listing for social auth avatars. |

## Usage
This configuration is automatically consumed by the Next.js build process. No manual invocation is required. When adding new heavy UI libraries, ensure they are added to the `optimizePackageImports` array to maintain optimal bundle performance.