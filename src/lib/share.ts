import { toast } from "sonner";

export interface ShareConfig {
  title: string;
  slug: string;
  type: string;
}

// Generates a shareable URL and attempts to share it using the Web Share API.
// Falls back to clipboard copy if the API is unavailable or fails.
export async function share(config: ShareConfig) {
  // Ensure we are on the client side
  if (typeof window === "undefined") return;

  // Build the URL based on type. Future types can be added here.
  let sharePath = "";
  if (config.type === "system-design") {
    sharePath = `/system-design/${config.slug}`;
  } else {
    // Generic fallback for other types
    sharePath = `/${config.type}/${config.slug}`;
  }

  const url = `${window.location.origin}${sharePath}`;

  const shareData: ShareData = {
    title: config.title,
    text: `Check out this ${config.type.replace("-", " ")}: ${config.title}`,
    url,
  };

  try {
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      await navigator.share(shareData);
      toast.success("Shared successfully!");
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // User cancelled the share operation
      return;
    }

    // If Web Share API fails for some other reason, fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch (clipboardError) {
      toast.error("Failed to share or copy link.");
      console.error("Share and clipboard fallback failed:", clipboardError);
    }
  }
}
