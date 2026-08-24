"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_VOLUME = 1;

interface AudioChunk {
  chunkIndex: number;
  /** Base64-encoded MP3 audio for one sentence */
  audioBase64: string;
  turnId: string;
}

export interface StreamingAudioPlayerState {
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  prepare: () => Promise<void>;
  startStreamingTurn: (turnId: string) => void;
  queueAudioChunk: (chunk: AudioChunk) => void;
  markAudioComplete: (turnId: string) => void;
  playEncodedAudio: (audioUrl: string) => void;
  stop: () => void;
}

export const useStreamingAudioPlayer = (): StreamingAudioPlayerState => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const pendingChunksRef = useRef<Map<number, AudioBuffer>>(new Map());
  const expectedChunkIndexRef = useRef(0);
  const activeTurnIdRef = useRef<string | null>(null);
  const isDrainingRef = useRef(false);
  const isStreamCompleteRef = useRef(false);
  // Chunks handed to decodeAudioData but not yet resolved — "audio-complete"
  // can arrive while the last sentence is still decoding, so completion must
  // wait for these too or isPlaying flickers off early.
  const pendingDecodesRef = useRef(0);

  const legacyAudioRef = useRef<HTMLAudioElement | null>(null);
  const legacyPlaybackGenerationRef = useRef(0);

  const getOrCreateAudioGraph = useCallback(() => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      const AudioContextClass =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext;
      const context = new AudioContextClass();
      const gainNode = context.createGain();

      gainNode.gain.value = volume;
      gainNode.connect(context.destination);

      audioContextRef.current = context;
      gainNodeRef.current = gainNode;
    }

    const context = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    if (!context || !gainNode) {
      throw new Error("Failed to initialize Web Audio");
    }

    return { context, gainNode };
  }, [volume]);

  const stop = useCallback(() => {
    activeTurnIdRef.current = null;
    pendingChunksRef.current.clear();
    expectedChunkIndexRef.current = 0;
    nextStartTimeRef.current = 0;
    isStreamCompleteRef.current = true;

    const activeSources = activeSourcesRef.current;
    activeSourcesRef.current = new Set();
    for (const source of activeSources) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // The source may already have ended.
      }
      source.disconnect();
    }

    legacyPlaybackGenerationRef.current += 1;
    const legacyAudio = legacyAudioRef.current;
    if (legacyAudio) {
      legacyAudio.onplay = null;
      legacyAudio.onended = null;
      legacyAudio.onerror = null;
      legacyAudio.pause();
      legacyAudio.removeAttribute("src");
      legacyAudio.load();
    }

    setIsPlaying(false);
  }, []);

  const startStreamingTurn = useCallback(
    (turnId: string) => {
      stop();
      activeTurnIdRef.current = turnId;
      isStreamCompleteRef.current = false;
      setIsPlaying(true);
    },
    [stop],
  );

  const maybeFinishPlayback = useCallback(() => {
    if (
      isStreamCompleteRef.current &&
      activeSourcesRef.current.size === 0 &&
      pendingChunksRef.current.size === 0 &&
      pendingDecodesRef.current === 0
    ) {
      setIsPlaying(false);
    }
  }, []);

  const markAudioComplete = useCallback(
    (turnId: string) => {
      if (activeTurnIdRef.current !== turnId) return;
      isStreamCompleteRef.current = true;
      maybeFinishPlayback();
    },
    [maybeFinishPlayback],
  );

  const scheduleBuffer = useCallback(
    (audioBuffer: AudioBuffer, context: AudioContext, gainNode: GainNode) => {
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);

      const scheduleTime = Math.max(
        context.currentTime + 0.02,
        nextStartTimeRef.current,
      );
      nextStartTimeRef.current = scheduleTime + audioBuffer.duration;
      activeSourcesRef.current.add(source);

      source.onended = () => {
        source.disconnect();
        activeSourcesRef.current.delete(source);
        maybeFinishPlayback();
      };

      source.start(scheduleTime);
      setIsPlaying(true);
    },
    [maybeFinishPlayback],
  );

  const drainPendingChunks = useCallback(async () => {
    if (isDrainingRef.current) return;
    isDrainingRef.current = true;

    try {
      const { context, gainNode } = getOrCreateAudioGraph();
      if (context.state === "suspended") {
        await context.resume();
      }
      if (context.state !== "running") {
        throw new Error(`AudioContext is ${context.state}`);
      }

      while (pendingChunksRef.current.has(expectedChunkIndexRef.current)) {
        const chunkIndex = expectedChunkIndexRef.current;
        const audioBuffer = pendingChunksRef.current.get(chunkIndex);
        if (!audioBuffer) break;

        pendingChunksRef.current.delete(chunkIndex);
        expectedChunkIndexRef.current += 1;
        scheduleBuffer(audioBuffer, context, gainNode);
      }
    } catch (error) {
      console.error("[StreamingAudioPlayer] Unable to start playback:", error);
    } finally {
      isDrainingRef.current = false;
    }
  }, [getOrCreateAudioGraph, scheduleBuffer]);

  const prepare = useCallback(async () => {
    const { context } = getOrCreateAudioGraph();
    if (context.state === "suspended") {
      await context.resume();
    }
    if (context.state !== "running") {
      throw new Error(`AudioContext is ${context.state}`);
    }

    await drainPendingChunks();
  }, [drainPendingChunks, getOrCreateAudioGraph]);

  const queueAudioChunk = useCallback(
    ({ chunkIndex, audioBase64, turnId }: AudioChunk) => {
      if (
        !audioBase64 ||
        activeTurnIdRef.current !== turnId ||
        !Number.isInteger(chunkIndex) ||
        chunkIndex < expectedChunkIndexRef.current ||
        pendingChunksRef.current.has(chunkIndex)
      ) {
        return;
      }

      try {
        const { context } = getOrCreateAudioGraph();

        const binary = window.atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < bytes.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        if (bytes.byteLength === 0) return;

        // decodeAudioData resamples to the context rate and hands back a ready
        // AudioBuffer — no manual Int16→Float32 conversion. Chunks may finish
        // decoding out of order; the expectedChunkIndex drain restores order.
        pendingDecodesRef.current += 1;
        context
          .decodeAudioData(bytes.buffer)
          .catch((error) => {
            console.error("[StreamingAudioPlayer] Chunk decode failed:", error);
            // Substitute near-silence so one bad sentence can't stall the
            // whole ordered playback pipeline.
            return context.createBuffer(1, 1, context.sampleRate);
          })
          .then((audioBuffer) => {
            if (activeTurnIdRef.current !== turnId) return;

            pendingChunksRef.current.set(chunkIndex, audioBuffer);
            void drainPendingChunks();
          })
          .finally(() => {
            pendingDecodesRef.current -= 1;
            maybeFinishPlayback();
          });
      } catch (error) {
        console.error("[StreamingAudioPlayer] Invalid audio chunk:", error);
      }
    },
    [drainPendingChunks, getOrCreateAudioGraph, maybeFinishPlayback],
  );

  const playEncodedAudio = useCallback(
    (audioUrl: string) => {
      stop();

      const existingAudio = legacyAudioRef.current;
      if (existingAudio) {
        existingAudio.onplay = null;
        existingAudio.onended = null;
        existingAudio.onerror = null;
        existingAudio.pause();
        existingAudio.src = "";
      }

      const audio = new Audio(audioUrl);
      legacyAudioRef.current = audio;
      const generation = ++legacyPlaybackGenerationRef.current;

      audio.volume = volume;
      audio.onplay = () => {
        if (legacyPlaybackGenerationRef.current === generation) {
          setIsPlaying(true);
        }
      };
      audio.onended = () => {
        if (legacyPlaybackGenerationRef.current === generation) {
          setIsPlaying(false);
        }
      };
      audio.onerror = () => {
        if (legacyPlaybackGenerationRef.current !== generation) return;

        console.error("[StreamingAudioPlayer] Encoded playback error:", {
          code: audio.error?.code,
          message: audio.error?.message,
          audioUrl,
        });
        setIsPlaying(false);
      };

      void audio.play().catch((error: unknown) => {
        if (
          legacyPlaybackGenerationRef.current === generation &&
          (error as { name?: string })?.name !== "AbortError"
        ) {
          console.error("[StreamingAudioPlayer] Encoded play error:", error);
          setIsPlaying(false);
        }
      });
    },
    [stop, volume],
  );

  const setVolume = useCallback((nextVolume: number) => {
    setVolumeState(Math.min(1, Math.max(0, nextVolume)));
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
    if (legacyAudioRef.current) {
      legacyAudioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stop();
      const context = audioContextRef.current;
      if (context && context.state !== "closed") {
        void context.close();
      }
    };
  }, [stop]);

  return {
    isPlaying,
    volume,
    setVolume,
    prepare,
    startStreamingTurn,
    queueAudioChunk,
    markAudioComplete,
    playEncodedAudio,
    stop,
  };
};
