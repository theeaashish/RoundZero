import { z } from "zod";

export const STREAM_EVENT = {
  UserMessage: "user-message",
  TextDelta: "text-delta",
  AudioChunk: "audio-chunk",
  AudioError: "audio-error",
  AudioComplete: "audio-complete",
  MessageComplete: "message-complete",
  Error: "error",
} as const;

export type StreamEventName = (typeof STREAM_EVENT)[keyof typeof STREAM_EVENT];

export const StreamEventSchemas = {
  [STREAM_EVENT.UserMessage]: z.object({
    turnId: z.string(),
    persistedId: z.string(),
    createdAt: z.string(),
  }),
  [STREAM_EVENT.TextDelta]: z.object({
    turnId: z.string(),
    text: z.string(),
  }),
  [STREAM_EVENT.AudioChunk]: z.object({
    turnId: z.string(),
    chunkIndex: z.number().int().nonnegative(),
    audioBase64: z.string(),
    text: z.string().optional(),
  }),
  [STREAM_EVENT.AudioError]: z.object({
    turnId: z.string(),
    chunkIndex: z.number().int(),
  }),
  [STREAM_EVENT.AudioComplete]: z.object({
    turnId: z.string(),
    chunkCount: z.number().int().nonnegative(),
  }),
  [STREAM_EVENT.MessageComplete]: z.object({
    turnId: z.string(),
    persistedId: z.string(),
    createdAt: z.string(),
    content: z.string(),
  }),
  [STREAM_EVENT.Error]: z.object({
    turnId: z.string(),
    message: z.string(),
  }),
} as const;

export type StreamEventData<K extends StreamEventName> = z.infer<
  (typeof StreamEventSchemas)[K]
>;

export type StreamEvent = {
  [K in StreamEventName]: { event: K } & StreamEventData<K>;
}[StreamEventName];

/** Server-side: serialize one event into SSE wire format. */
export function encodeSseEvent<K extends StreamEventName>(
  event: K,
  data: StreamEventData<K>,
): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** Client-side: validate an SSE message into a typed event. Returns null for unknown/malformed events. */
export function parseStreamEvent(
  eventName: string,
  rawData: string,
): StreamEvent | null {
  const schema = StreamEventSchemas[eventName as StreamEventName];
  if (!schema) return null;
  try {
    const json: unknown = JSON.parse(rawData);
    const result = schema.safeParse(json);
    if (!result.success) return null;
    return { event: eventName, ...result.data } as StreamEvent;
  } catch {
    return null;
  }
}
