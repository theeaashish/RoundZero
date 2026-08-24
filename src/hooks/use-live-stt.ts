"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  assertMicAvailable,
  buildDeepgramParams,
  getSupportedMimeType,
  isMicError,
  sleep,
} from "@/lib/live-stt-utils";
import { orpcClient } from "@/lib/orpc-client";

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "failed";

export interface LiveSTTOptions {
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onUtteranceEnd?: (assembledTranscript: string) => void;
  onSpeechStarted?: () => void;
  utteranceTimeoutMs?: number;
  /** Domain terms (tech stack etc.) boosted for recognition accuracy */
  keyterms?: string[];
}

export interface LiveSTTState {
  connectionState: ConnectionState;
  isRecording: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  finalizeCurrentUtterance: () => string;
  pauseMic: () => void;
  resumeMic: () => void;
}

const DEEPGRAM_WSS_BASE = "wss://api.deepgram.com/v1/listen";
const DEFAULT_DEADMAN_TIMEOUT_MS = 1500;
const RECORDER_TIMESLICE_MS = 100;
const CONNECTION_TIMEOUT_MS = 10_000;
const KEEP_ALIVE_INTERVAL_MS = 8000;

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 1000;
// Dev servers cold-start RPC routes and networks blip — one quiet retry on
// token/socket acquisition stops first-attempt flakiness from killing sessions.
const TRANSIENT_RETRY_DELAY_MS = 1200;

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

async function acquireMicAndToken(): Promise<{
  apiKey: string;
  stream: MediaStream;
}> {
  // Start both concurrently, but make sure a late token failure never leaks
  // the already-acquired mic stream.
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
    stream.getTracks().forEach((track) => {
      track.stop();
    });
    throw error;
  }
}

export const useLiveSTT = (options: LiveSTTOptions = {}): LiveSTTState => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isRecording, setIsRecording] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadmanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionGenerationRef = useRef(0);
  const connectAttemptRef = useRef<Promise<void> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const assembledTranscriptRef = useRef("");
  const utterancePreviewRef = useRef("");
  const isSpeakingRef = useRef(false);
  const speechStartNotifiedRef = useRef(false);
  const isRecordingRef = useRef(false);
  const hasEverConnectedRef = useRef(false);
  const userDisconnectRequestedRef = useRef(false);
  const connectRef = useRef<() => Promise<void>>(async () => {});

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const resetUtterance = useCallback(() => {
    assembledTranscriptRef.current = "";
    utterancePreviewRef.current = "";
    isSpeakingRef.current = false;
    speechStartNotifiedRef.current = false;
  }, []);

  const finalizeCurrentUtterance = useCallback(() => {
    if (deadmanTimeoutRef.current) {
      clearTimeout(deadmanTimeoutRef.current);
      deadmanTimeoutRef.current = null;
    }

    const assembled = (
      utterancePreviewRef.current || assembledTranscriptRef.current
    ).trim();
    resetUtterance();

    if (assembled) {
      optionsRef.current.onUtteranceEnd?.(assembled);
    }

    return assembled;
  }, [resetUtterance]);

  const resetDeadmanTimeout = useCallback(() => {
    if (deadmanTimeoutRef.current) {
      clearTimeout(deadmanTimeoutRef.current);
    }
    deadmanTimeoutRef.current = setTimeout(
      finalizeCurrentUtterance,
      optionsRef.current.utteranceTimeoutMs ?? DEFAULT_DEADMAN_TIMEOUT_MS,
    );
  }, [finalizeCurrentUtterance]);

  const cleanup = useCallback(() => {
    connectionGenerationRef.current += 1;

    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
    }
    if (deadmanTimeoutRef.current) {
      clearTimeout(deadmanTimeoutRef.current);
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const mediaRecorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.stop();
    }

    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => {
      track.stop();
    });

    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    }

    keepAliveRef.current = null;
    deadmanTimeoutRef.current = null;
    isRecordingRef.current = false;
    setIsRecording(false);
    resetUtterance();
  }, [resetUtterance]);

  const pauseMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    isRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  const resumeMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    isRecordingRef.current = Boolean(streamRef.current);
    resetUtterance();
    setIsRecording(Boolean(streamRef.current));
  }, [resetUtterance]);

  // Exponential-backoff retry for unexpected drops. Only used once a session
  // has connected successfully; initial failures surface as "failed" so the
  // user can act (e.g. grant mic permission).
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setConnectionState("failed");
      return;
    }

    reconnectAttemptsRef.current += 1;
    setConnectionState("connecting");
    const delay =
      RECONNECT_BASE_DELAY_MS * 2 ** (reconnectAttemptsRef.current - 1);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      void connectRef.current().catch(() => {});
    }, delay);
  }, []);

  const runConnectAttempt = useCallback(async () => {
    const generation = connectionGenerationRef.current + 1;
    connectionGenerationRef.current = generation;
    setConnectionState("connecting");

    try {
      userDisconnectRequestedRef.current = false;
      assertMicAvailable();

      // Token minting and mic permission run concurrently for a faster start.
      const { apiKey, stream } = await acquireMicAndToken();

      if (connectionGenerationRef.current !== generation) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      streamRef.current = stream;

      wsRef.current = new WebSocket(
        `${DEEPGRAM_WSS_BASE}?${buildDeepgramParams(optionsRef.current.keyterms)}`,
        ["token", apiKey],
      );
      const ws = wsRef.current;

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

      if (
        connectionGenerationRef.current !== generation ||
        wsRef.current !== ws
      ) {
        return;
      }
      if (ws.readyState !== WebSocket.OPEN) {
        throw new Error("Deepgram closed during connection setup");
      }

      ws.onmessage = (event) => {
        if (
          connectionGenerationRef.current !== generation ||
          wsRef.current !== ws
        ) {
          return;
        }

        try {
          const data = JSON.parse(event.data);

          if (data.type === "SpeechStarted") {
            isSpeakingRef.current = true;
            if (!speechStartNotifiedRef.current) {
              speechStartNotifiedRef.current = true;
              optionsRef.current.onSpeechStarted?.();
            }
            return;
          }

          if (data.type === "UtteranceEnd") {
            if (assembledTranscriptRef.current.trim()) {
              finalizeCurrentUtterance();
            } else {
              resetUtterance();
            }
            return;
          }

          if (data.type !== "Results" || !data.channel?.alternatives?.[0]) {
            return;
          }

          const transcript = data.channel.alternatives[0].transcript;
          if (!transcript) return;

          isSpeakingRef.current = true;
          if (!speechStartNotifiedRef.current) {
            speechStartNotifiedRef.current = true;
            optionsRef.current.onSpeechStarted?.();
          }

          if (data.is_final) {
            assembledTranscriptRef.current =
              `${assembledTranscriptRef.current} ${transcript}`.trim();
            utterancePreviewRef.current = assembledTranscriptRef.current;
            optionsRef.current.onFinalTranscript?.(utterancePreviewRef.current);

            if (data.speech_final) {
              finalizeCurrentUtterance();
              return;
            }
          } else {
            const interim =
              `${assembledTranscriptRef.current} ${transcript}`.trim();
            utterancePreviewRef.current = interim;
            optionsRef.current.onInterimTranscript?.(interim);
          }

          resetDeadmanTimeout();
        } catch (error) {
          console.error("[LiveSTT] Failed to parse message:", error);
        }
      };

      // Unexpected drop: salvage the partial utterance, tear down, and retry
      // with backoff while the user was actively recording. The error handler
      // is a no-op because a `close` event always follows and owns teardown.
      ws.onclose = () => {
        if (
          connectionGenerationRef.current !== generation ||
          wsRef.current !== ws
        ) {
          return;
        }
        const shouldReconnect =
          hasEverConnectedRef.current && isRecordingRef.current;

        finalizeCurrentUtterance();
        cleanup();

        if (shouldReconnect) {
          scheduleReconnect();
        } else {
          setConnectionState("disconnected");
        }
      };
      ws.onerror = () => {};

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (
          connectionGenerationRef.current === generation &&
          wsRef.current === ws &&
          event.data.size > 0 &&
          ws.readyState === WebSocket.OPEN
        ) {
          ws.send(event.data);
        }
      };
      mediaRecorder.start(RECORDER_TIMESLICE_MS);
      isRecordingRef.current = true;

      keepAliveRef.current = setInterval(() => {
        if (
          connectionGenerationRef.current === generation &&
          wsRef.current === ws &&
          ws.readyState === WebSocket.OPEN
        ) {
          ws.send(JSON.stringify({ type: "KeepAlive" }));
        }
      }, KEEP_ALIVE_INTERVAL_MS);

      hasEverConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
      setConnectionState("connected");
      setIsRecording(true);
    } catch (error) {
      if (connectionGenerationRef.current === generation) {
        cleanup();
        if (hasEverConnectedRef.current) {
          scheduleReconnect();
        } else {
          setConnectionState("failed");
        }
      }
      throw error;
    }
  }, [
    cleanup,
    finalizeCurrentUtterance,
    resetDeadmanTimeout,
    scheduleReconnect,
    resetUtterance,
  ]);

  const connect = useCallback(async () => {
    if (connectAttemptRef.current) {
      return connectAttemptRef.current;
    }
    if (wsRef.current) return;

    const attempt = (async () => {
      try {
        await runConnectAttempt();
      } catch (error) {
        // Established sessions already have the backoff reconnect cycle; this
        // single retry only rescues cold-start flakiness on first connect.
        // Mic problems are permanent — retrying would just re-prompt.
        if (
          hasEverConnectedRef.current ||
          isMicError(error) ||
          userDisconnectRequestedRef.current
        ) {
          throw error;
        }

        console.warn(
          "[LiveSTT] First connect attempt failed, retrying once:",
          error,
        );
        await sleep(TRANSIENT_RETRY_DELAY_MS);

        if (
          wsRef.current ||
          userDisconnectRequestedRef.current ||
          connectAttemptRef.current
        ) {
          return;
        }

        await runConnectAttempt();
      }
    })();

    connectAttemptRef.current = attempt;
    try {
      await attempt;
    } finally {
      if (connectAttemptRef.current === attempt) {
        connectAttemptRef.current = null;
      }
    }
  }, [runConnectAttempt]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    userDisconnectRequestedRef.current = true;
    cleanup();
    setConnectionState("disconnected");
  }, [cleanup]);

  useEffect(() => {
    return () => {
      const ws = wsRef.current;
      if (ws) {
        ws.close();
      }
      cleanup();
    };
  }, [cleanup]);

  return {
    connectionState,
    isRecording,
    connect,
    disconnect,
    finalizeCurrentUtterance,
    pauseMic,
    resumeMic,
  };
};
