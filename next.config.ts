import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Rule 3: Server-Side Performance
  serverExternalPackages: [
    "prisma",
    "pg",
    "mammoth",
    "unpdf",
    "@react-pdf/renderer",
  ],

  // Rule 1: Eliminating Waterfalls (Helps identify them in dev)
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Stable top-level properties in Next.js 15+
  typedRoutes: true,

  experimental: {
    // Rule 2: Bundle Size Optimization (Avoid Barrel File Imports)
    // This is still in experimental in some versions/types
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "recharts",
      "date-fns",
      "sonner",
      "vaul",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-progress",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
};

export default nextConfig;
