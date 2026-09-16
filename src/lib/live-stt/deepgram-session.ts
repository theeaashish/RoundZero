import {
  buildDeepgramParams,
  getSupportedMimeType,
} from "@/lib/live-stt-utils";
import { orpcClient } from "@/lib/orpc-client";
import type { UtteranceAssembler } from "./utterance-assembler";

const DEEPGRAM_WSS_BASE = "wss://api.deepgram.com/v1/listen";
const RECORDER_TIMESLICE_MS = 100;
const CONNECTION_TIMEOUT_MS = 10_000;
const KEEP_ALIVE_INTERVAL_MS = 8000;

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export interface DeepgramSessionHandlers {
  /** Fired on an unexpected close AFTER a successful open. The owner is
   * responsible for calling dispose(). */
  onUnexpectedClose: () => void;
}

/** Owns exactly one mic stream + WebSocket + recorder + keepalive. */
export class DeepgramSession {
  private readonly ws: WebSocket;
  private readonly recorder: MediaRecorder;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private disposed = false;
  readonly stream: MediaStream;

  private constructor(
    stream: MediaStream,
    ws: WebSocket,
    private readonly assembler: UtteranceAssembler,
    private readonly handlers: DeepgramSessionHandlers,
  ) {
    this.stream = stream;
    this.ws = ws;
    this.recorder = this.startRecorder();
    this.keepAliveTimer = setInterval(
      () => this.sendKeepAlive(),
      KEEP_ALIVE_INTERVAL_MS,
    );
    this.wireSocketEvents();
  }

  static async connect(options: {
    keyterms?: string[];
    assembler: UtteranceAssembler;
    handlers: DeepgramSessionHandlers;
  }): Promise<DeepgramSession> {
    const { apiKey, stream } = await acquireMicAndToken();
    let ws: WebSocket | null = null;
    try {
      ws = await openDeepgramSocket(apiKey, options.keyterms);
      return new DeepgramSession(
        stream,
        ws,
        options.assembler,
        options.handlers,
      );
    } catch (error) {
      if (ws) {
        try {
          (ws as WebSocket).close();
        } catch {
          // Socket was already closed or closing.
        }
      }
      stopStreamTracks(stream);
      throw error;
    }
  }

  pause(): void {
    this.stream.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
  }

  resume(): void {
    this.stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
  }

  /** Idempotent teardown of everything the session owns. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    if (this.recorder.state !== "inactive") {
      this.recorder.ondataavailable = null;
      this.recorder.stop();
    }

    stopStreamTracks(this.stream);

    this.ws.onmessage = null;
    this.ws.onclose = null;
    this.ws.onerror = null;
    if (
      this.ws.readyState === WebSocket.OPEN ||
      this.ws.readyState === WebSocket.CONNECTING
    ) {
      this.ws.close();
    }
  }

  private startRecorder(): MediaRecorder {
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined,
    );
    recorder.ondataavailable = (event) => {
      if (
        !this.disposed &&
        event.data.size > 0 &&
        this.ws.readyState === WebSocket.OPEN
      ) {
        this.ws.send(event.data);
      }
    };
    recorder.start(RECORDER_TIMESLICE_MS);
    return recorder;
  }

  private sendKeepAlive(): void {
    if (this.disposed || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: "KeepAlive" }));
  }

  private wireSocketEvents(): void {
    this.ws.onmessage = (event) => {
      if (this.disposed) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "SpeechStarted") {
          this.assembler.handleSpeechStarted();
          return;
        }
        if (data.type === "UtteranceEnd") {
          this.assembler.handleUtteranceEnd();
          return;
        }
        if (data.type !== "Results" || !data.channel?.alternatives?.[0]) return;
        const transcript = data.channel.alternatives[0].transcript;
        if (!transcript) return;
        this.assembler.handleTranscript(
          transcript,
          Boolean(data.is_final),
          Boolean(data.speech_final),
        );
      } catch (error) {
        console.error("[LiveSTT] Failed to parse message:", error);
      }
    };

    // A `close` event always follows an `error`, so `error` carries no
    // handler. Do NOT set `disposed` here: the owner still needs dispose()
    // to stop the recorder and mic tracks.
    this.ws.onclose = () => {
      if (this.disposed) return;
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.handlers.onUnexpectedClose();
    };
    this.ws.onerror = () => {};
  }
}

async function openDeepgramSocket(
  apiKey: string,
  keyterms?: string[],
): Promise<WebSocket> {
  const ws = new WebSocket(
    `${DEEPGRAM_WSS_BASE}?${buildDeepgramParams(keyterms)}`,
    ["token", apiKey],
  );

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Deepgram connection timed out"));
    }, CONNECTION_TIMEOUT_MS);

    ws.onopen = () => {
      clearTimeout(timeout);
      resolve();
    };
    // A `close` event always follows an error and carries the close code,
    // so all rejection detail is surfaced from there.
    ws.onerror = () => {};
    ws.onclose = (event) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Deepgram handshake failed (code ${event.code}${event.reason ? `: ${event.reason}` : ""})`,
        ),
      );
    };
  });

  if (ws.readyState !== WebSocket.OPEN) {
    throw new Error("Deepgram closed during connection setup");
  }
  return ws;
}

// Start token minting and mic acquisition concurrently, but make sure a
// late token failure never leaks the already-acquired mic stream.
async function acquireMicAndToken(): Promise<{
  apiKey: string;
  stream: MediaStream;
}> {
  const tokenPromise = orpcClient.media.deepgramToken({});

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: AUDIO_CONSTRAINTS,
    });
  } catch (error) {
    void tokenPromise.catch(() => {});
    throw error;
  }

  try {
    const { apiKey } = await tokenPromise;
    return { apiKey, stream };
  } catch (error) {
    stopStreamTracks(stream);
    throw error;
  }
}

function stopStreamTracks(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}
