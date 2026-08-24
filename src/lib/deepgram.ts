import { createClient } from "@deepgram/sdk";
import { env } from "@/config/env";

// Deepgram SDK client instance (singleton)
export const deepgram = createClient(env.DEEPGRAM_API_KEY);

// Voice options for TTS - Aura voices (more natural sounding)
export const TTS_VOICES = {
  // Female voices
  ASTERIA: "aura-asteria-en", // Warm, professional
  LUNA: "aura-luna-en", // Soft, friendly
  STELLA: "aura-stella-en", // Clear, articulate
  ATHENA: "aura-athena-en", // Confident, authoritative
  HERA: "aura-hera-en", // Mature, sophisticated
  // Male voices
  ORION: "aura-orion-en", // Deep, professional
  ARCAS: "aura-arcas-en", // Friendly, conversational
  PERSEUS: "aura-perseus-en", // Clear, energetic
  ANGUS: "aura-angus-en", // Warm, approachable
  ORPHEUS: "aura-orpheus-en", // Smooth, natural - RECOMMENDED for interviews
  HELIOS: "aura-helios-en", // Bright, engaging
  ZEUS: "aura-zeus-en", // Authoritative, commanding
} as const;

// Default voice for interview AI (Orpheus is most natural-sounding male voice)
export const DEFAULT_INTERVIEW_VOICE = TTS_VOICES.ORPHEUS;

export type TTSVoice = (typeof TTS_VOICES)[keyof typeof TTS_VOICES];

// TTS configuration
export type TTSEncoding =
  | "linear16"
  | "mp3"
  | "opus"
  | "flac"
  | "alaw"
  | "mulaw";
export type TTSContainer = "wav" | "ogg" | "none";

type TTSVoiceOption = { voice?: TTSVoice; signal?: AbortSignal };

export type TTSOptions = TTSVoiceOption &
  (
    | { encoding: "mp3"; container?: never }
    | {
        encoding?: Exclude<TTSEncoding, "mp3">;
        container?: TTSContainer;
      }
  );

const DEFAULT_TTS_OPTIONS = {
  voice: TTS_VOICES.ASTERIA,
  encoding: "linear16",
  container: "wav",
} as const;

// Convert text to speech using Deepgram aura return buffer containing audio data
export const textToSpeech = async (
  text: string,
  options: TTSOptions = {},
): Promise<Buffer> => {
  const voice = options.voice ?? DEFAULT_TTS_OPTIONS.voice;
  const encoding = options.encoding ?? DEFAULT_TTS_OPTIONS.encoding;
  const container =
    encoding === "mp3"
      ? undefined
      : (options.container ??
        (encoding === "linear16" ? DEFAULT_TTS_OPTIONS.container : undefined));
  const searchParams = new URLSearchParams({ model: voice, encoding });
  if (container) {
    searchParams.set("container", container);
  }

  const response = await fetch(
    `https://api.deepgram.com/v1/speak?${searchParams.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
        Accept: "audio/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: options.signal,
    },
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `TTS generation failed (${response.status})${details ? `: ${details}` : ""}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
};

// Create a temporary API key for client-side STT
export const createTemporaryApiKey = async (
  ttlSeconds: number = 600,
): Promise<string> => {
  const { result } = await deepgram.manage.createProjectKey(
    env.DEEPGRAM_PROJECT_ID,
    {
      comment: "Temporary key for client STT",
      scopes: ["usage:write"],
      time_to_live_in_seconds: ttlSeconds,
    },
  );

  if (!result?.key) {
    throw new Error("Failed to create temporary Deepgram API key");
  }

  return result.key;
};
