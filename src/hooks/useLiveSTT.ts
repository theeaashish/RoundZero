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
  utteranceTimeoutMs?: number; // Configurable silence timeout to detect end of speech
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
const DEEPGRAM_ENDPOINTING_MS = 700;
const DEFAULT_UTTERANCE_TIMEOUT_MS = 900;

const DEEPGRAM_PARAMS = new URLSearchParams({
  model: "nova-3",
  language: "en-US",
  smart_format: "true",
  interim_results: "true",
  endpointing: DEEPGRAM_ENDPOINTING_MS.toString(),
}).toString();

const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

const RECORDER_TIMESLICE_MS = 200;

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const type of types) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported(type)
    ) {
      return type;
    }
  }
  return "";
}

export const useLiveSTT = (options: LiveSTTOptions = {}): LiveSTTState => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isRecording, setIsRecording] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const assembledTranscriptRef = useRef<string>("");
  const utterancePreviewRef = useRef<string>("");
  const utteranceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isSpeakingRef = useRef(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const finalizeCurrentUtterance = useCallback(() => {
    if (utteranceTimeoutRef.current) {
      clearTimeout(utteranceTimeoutRef.current);
      utteranceTimeoutRef.current = null;
    }

    const assembled = (
      utterancePreviewRef.current || assembledTranscriptRef.current
    ).trim();

    if (assembled) {
      optionsRef.current.onUtteranceEnd?.(assembled);
    }

    assembledTranscriptRef.current = "";
    utterancePreviewRef.current = "";
    isSpeakingRef.current = false;
    return assembled;
  }, []);

  const triggerUtteranceEnd = useCallback(() => {
    finalizeCurrentUtterance();
  }, [finalizeCurrentUtterance]);

  const resetUtteranceTimeout = useCallback(() => {
    if (utteranceTimeoutRef.current) {
      clearTimeout(utteranceTimeoutRef.current);
    }
    utteranceTimeoutRef.current = setTimeout(() => {
      triggerUtteranceEnd();
    }, optionsRef.current.utteranceTimeoutMs ?? DEFAULT_UTTERANCE_TIMEOUT_MS);
  }, [triggerUtteranceEnd]);

  const cleanup = useCallback(() => {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    if (utteranceTimeoutRef.current) clearTimeout(utteranceTimeoutRef.current);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      wsRef.current.close();
    }

    wsRef.current = null;
    mediaRecorderRef.current = null;
    streamRef.current = null;
    keepAliveRef.current = null;
    utteranceTimeoutRef.current = null;

    setIsRecording(false);
    isSpeakingRef.current = false;
    assembledTranscriptRef.current = "";
    utterancePreviewRef.current = "";
  }, []);

  const pauseMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
    setIsRecording(false);
  }, []);

  const resumeMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
    assembledTranscriptRef.current = "";
    utterancePreviewRef.current = "";
    isSpeakingRef.current = false;
    setIsRecording(true);
  }, []);

  const connect = useCallback(async () => {
    if (connectionState === "connecting" || connectionState === "connected")
      return;

    setConnectionState("connecting");

    try {
      const { apiKey } = await orpcClient.media.deepgramToken({});

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS,
      });
      streamRef.current = stream;

      const wsUrl = `${DEEPGRAM_WSS_BASE}?${DEEPGRAM_PARAMS}`;
      const ws = new WebSocket(wsUrl, ["token", apiKey]);
      wsRef.current = ws;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timeout")), 10000);
        ws.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        ws.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Failed"));
        };
      });

      setConnectionState("connected");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "Results" && data.channel?.alternatives?.[0]) {
            const alternative = data.channel.alternatives[0];
            const transcript = alternative.transcript;

            if (transcript) {
              if (!isSpeakingRef.current) {
                isSpeakingRef.current = true;
                optionsRef.current.onSpeechStarted?.();
              }

              if (data.is_final) {
                assembledTranscriptRef.current =
                  `${assembledTranscriptRef.current} ${transcript}`.trim();
                utterancePreviewRef.current = assembledTranscriptRef.current;
                optionsRef.current.onFinalTranscript?.(
                  utterancePreviewRef.current,
                );
              } else {
                const interim =
                  `${assembledTranscriptRef.current} ${transcript}`.trim();
                utterancePreviewRef.current = interim;
                optionsRef.current.onInterimTranscript?.(interim);
              }

              resetUtteranceTimeout();
            }
          }
        } catch (e) {
          console.error("STT parsing error:", e);
        }
      };

      ws.onclose = () => {
        setConnectionState("disconnected");
        setIsRecording(false);
      };

      ws.onerror = () => setConnectionState("failed");

      const mimeType = getSupportedMimeType();
      const recorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };

      mediaRecorder.start(RECORDER_TIMESLICE_MS);
      setIsRecording(true);

      keepAliveRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "KeepAlive" }));
        }
      }, 8000);
    } catch (error) {
      cleanup();
      setConnectionState("failed");
      throw error;
    }
  }, [connectionState, cleanup, resetUtteranceTimeout]);

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
