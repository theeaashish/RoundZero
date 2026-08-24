export const joinTranscriptSegments = (...segments: string[]) =>
  segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(" ");

export const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

// Map low-level media errors to actionable messages; anything else surfaces
// the real reason (token endpoint, socket upgrade, secure context) instead of
// one generic "failed" toast for every failure mode.
export const describeSttError = (error: unknown): string => {
  const name = (error as { name?: string })?.name ?? "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Microphone blocked — allow access from the address bar";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "No microphone found on this device";
    case "NotReadableError":
      return "Microphone is busy — close other apps using it";
    default:
      return error instanceof Error
        ? error.message
        : "Failed to connect real-time transcription";
  }
};
