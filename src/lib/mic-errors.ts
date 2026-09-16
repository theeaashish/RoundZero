const MIC_ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError: "Microphone blocked — allow access from the address bar",
  PermissionDeniedError:
    "Microphone blocked — allow access from the address bar",
  NotFoundError: "No microphone found on this device",
  DevicesNotFoundError: "No microphone found on this device",
  OverconstrainedError: "No microphone found on this device",
  NotReadableError: "Microphone is busy — close other apps using it",
};

const getErrorName = (error: unknown): string =>
  (error as { name?: string } | null)?.name ?? "";

export function isMicError(error: unknown): boolean {
  return getErrorName(error) in MIC_ERROR_MESSAGES;
}

export function describeMicError(error: unknown): string {
  const byName = MIC_ERROR_MESSAGES[getErrorName(error)];
  if (byName) return byName;
  if (error instanceof Error && error.message) return error.message;
  return "Failed to connect real-time transcription";
}
