# Next.js Configuration (`next.config.ts`)

The `next.config.ts` file serves as the central configuration hub for the Next.js application. It is optimized for performance, bundle size reduction, and robust integration with external services.

## Key Features

### 1. Performance & Optimization
*   **React Compiler:** Enabled (`reactCompiler: true`) to leverage automatic memoization and performance improvements.
*   **Bundle Size Optimization:** Uses `experimental.optimizePackageImports` to prevent large barrel file imports. This ensures that only the specific components used from libraries like `lucide-react`, `framer-motion`, and `@radix-ui` are included in the final bundle.
*   **Server-Side Performance:** Configures `serverExternalPackages` to ensure heavy dependencies (e.g., `prisma`, `pg`, `mammoth`, `unpdf`) are handled correctly in the server-side environment.

### 2. Development & Debugging
*   **Waterfall Identification:** Configures `logging.fetches` to display full URLs in the console, assisting developers in identifying and eliminating network request waterfalls.

### 3. Image Handling
*   **Remote Patterns:** Configures `images.remotePatterns` to allow image loading from trusted external sources, specifically:
    *   `lh3.googleusercontent.com` (Google profile pictures)
    *   `avatars.githubusercontent.com` (GitHub profile pictures)

## Configuration Breakdown

| Category | Setting | Purpose |
| :--- | :--- | :--- |
| **Compiler** | `reactCompiler` | Enables automatic React performance optimizations. |
| **Server** | `serverExternalPackages` | Prevents bundling of heavy server-side libraries. |
| **Logging** | `logging.fetches` | Improves visibility into network requests for debugging. |
| **Images** | `remotePatterns` | Whitelists domains for `next/image` optimization. |
| **Bundling** | `optimizePackageImports` | Reduces bundle size by tree-shaking large UI libraries. |

## Usage
This configuration is automatically consumed by the Next.js build process. To add new external packages or whitelist new image domains, update the respective arrays within the `nextConfig` object.