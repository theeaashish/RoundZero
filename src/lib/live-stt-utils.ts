// 500ms of silence ends the turn — the single biggest voice-to-voice latency
// lever. 2000ms made users wait two full seconds before the AI even started
// thinking. Pairs with the interrupted-answer handling in the live prompt.
export const DEEPGRAM_ENDPOINTING_MS = 500;

// Deepgram rejects the WebSocket handshake outright (close 1002) for values
// below 1000 — verified empirically against their API. Turn-taking latency is
// governed by endpointing anyway; this only delays the UtteranceEnd event.
export const DEEPGRAM_UTTERANCE_END_MS = 1000;

// getUserMedia only exists in secure contexts (https:// or localhost). Opening
// the app over LAN http:// throws a bare TypeError with no explanation.
export function assertMicAvailable(): void {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new Error(
      "Microphone needs a secure connection — open via localhost or HTTPS",
    );
  }
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia
  ) {
    throw new Error("Audio capture is not supported in this browser");
  }
}

// Media errors are permanent (user/device problems); everything else — token
// fetch, socket upgrade — is worth one retry.
export function isMicError(error: unknown): boolean {
  const name = (error as { name?: string })?.name ?? "";
  return [
    "NotAllowedError",
    "PermissionDeniedError",
    "NotFoundError",
    "DevicesNotFoundError",
    "OverconstrainedError",
    "NotReadableError",
  ].includes(name);
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  return (
    types.find(
      (type) =>
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(type),
    ) ?? ""
  );
}

export function buildDeepgramParams(keyterms?: string[]): string {
  const params = new URLSearchParams({
    model: "nova-3",
    language: "en-US",
    smart_format: "true",
    interim_results: "true",
    endpointing: DEEPGRAM_ENDPOINTING_MS.toString(),
    utterance_end_ms: DEEPGRAM_UTTERANCE_END_MS.toString(),
    vad_events: "true",
  });

  for (const term of keyterms ?? []) {
    const trimmed = term.trim();
    if (trimmed) params.append("keyterm", trimmed);
  }

  return params.toString();
}
