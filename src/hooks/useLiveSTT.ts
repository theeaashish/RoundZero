"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
const DEEPGRAM_ENDPOINTING_MS = 2000;
const DEEPGRAM_UTTERANCE_END_MS = 2000;
const DEFAULT_DEADMAN_TIMEOUT_MS = 3000;
const RECORDER_TIMESLICE_MS = 100;
const CONNECTION_TIMEOUT_MS = 10_000;
const KEEP_ALIVE_INTERVAL_MS = 8000;

const DEEPGRAM_PARAMS = new URLSearchParams({
  model: "nova-3",
  language: "en-US",
  smart_format: "true",
  interim_results: "true",
  endpointing: DEEPGRAM_ENDPOINTING_MS.toString(),
  utterance_end_ms: DEEPGRAM_UTTERANCE_END_MS.toString(),
  vad_events: "true",
}).toString();

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

function getSupportedMimeType(): string {
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

  const assembledTranscriptRef = useRef("");
  const utterancePreviewRef = useRef("");
  const isSpeakingRef = useRef(false);
  const speechStartNotifiedRef = useRef(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

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
    setIsRecording(false);
    resetUtterance();
  }, [resetUtterance]);

  const pauseMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    setIsRecording(false);
  }, []);

  const resumeMic = useCallback(() => {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    resetUtterance();
    setIsRecording(Boolean(streamRef.current));
  }, [resetUtterance]);

  const runConnectAttempt = useCallback(async () => {
    const generation = connectionGenerationRef.current + 1;
    connectionGenerationRef.current = generation;
    setConnectionState("connecting");

    try {
      const { apiKey } = await orpcClient.media.deepgramToken({});
      if (connectionGenerationRef.current !== generation) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });
      if (connectionGenerationRef.current !== generation) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      streamRef.current = stream;

      const ws = new WebSocket(`${DEEPGRAM_WSS_BASE}?${DEEPGRAM_PARAMS}`, [
        "token",
        apiKey,
      ]);
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Deepgram connection timed out"));
        }, CONNECTION_TIMEOUT_MS);

        ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Failed to connect to Deepgram"));
        };
        ws.onclose = () => {
          clearTimeout(timeout);
          reject(new Error("Deepgram closed before connecting"));
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

      ws.onclose = () => {
        if (
          connectionGenerationRef.current !== generation ||
          wsRef.current !== ws
        ) {
          return;
        }
        cleanup();
        setConnectionState("disconnected");
      };
      ws.onerror = () => {
        if (
          connectionGenerationRef.current !== generation ||
          wsRef.current !== ws
        ) {
          return;
        }
        cleanup();
        setConnectionState("failed");
      };

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

      keepAliveRef.current = setInterval(() => {
        if (
          connectionGenerationRef.current === generation &&
          wsRef.current === ws &&
          ws.readyState === WebSocket.OPEN
        ) {
          ws.send(JSON.stringify({ type: "KeepAlive" }));
        }
      }, KEEP_ALIVE_INTERVAL_MS);

      setConnectionState("connected");
      setIsRecording(true);
    } catch (error) {
      if (connectionGenerationRef.current === generation) {
        cleanup();
        setConnectionState("failed");
      }
      throw error;
    }
  }, [cleanup, finalizeCurrentUtterance, resetDeadmanTimeout]);

  const connect = useCallback(async () => {
    if (connectAttemptRef.current) {
      return connectAttemptRef.current;
    }
    if (wsRef.current) return;

    const attempt = runConnectAttempt();
    connectAttemptRef.current = attempt;
    try {
      await attempt;
    } finally {
      if (connectAttemptRef.current === attempt) {
        connectAttemptRef.current = null;
      }
    }
  }, [runConnectAttempt]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState("disconnected");
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

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
