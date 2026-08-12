import { createClient, type LiveSchema } from "@deepgram/sdk";
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

// STT configuration options
export interface STTOptions {
  model?: "nova-2" | "nova-2-general" | "nova-2-meeting" | "nova-2-phonecall";
  language?: string;
  smartFormat?: boolean;
  interimResults?: boolean;
  utteranceEndMs?: number;
  vadEvents?: boolean;
}

// Default STT configuration
const DEFAULT_STT_OPTIONS: Required<STTOptions> = {
  model: "nova-2",
  language: "en-US",
  smartFormat: true,
  interimResults: true,
  utteranceEndMs: 1000,
  vadEvents: true,
};

// TTS configuration
export type TTSEncoding =
  | "linear16"
  | "mp3"
  | "opus"
  | "flac"
  | "alaw"
  | "mulaw";
export type TTSContainer = "wav" | "ogg" | "none";

type TTSVoiceOption = { voice?: TTSVoice };

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

// Create a real-time STT WebSocket connection
export const createSTTWebSocket = (options: STTOptions = {}) => {
  const config: LiveSchema = {
    model: options.model ?? DEFAULT_STT_OPTIONS.model,
    language: options.language ?? DEFAULT_STT_OPTIONS.language,
    smart_format: options.smartFormat ?? DEFAULT_STT_OPTIONS.smartFormat,
    interim_results:
      options.interimResults ?? DEFAULT_STT_OPTIONS.interimResults,
    utterance_end_ms:
      options.utteranceEndMs ?? DEFAULT_STT_OPTIONS.utteranceEndMs,
    vad_events: options.vadEvents ?? DEFAULT_STT_OPTIONS.vadEvents,
  };

  return deepgram.listen.live(config);
};

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

  const response = await deepgram.speak.request(
    { text },
    {
      model: voice,
      encoding,
      ...(container ? { container } : {}),
    },
  );

  const stream = await response.getStream();
  if (!stream) {
    throw new Error("TTS generation failed: No stream returned from Deepgram");
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
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
