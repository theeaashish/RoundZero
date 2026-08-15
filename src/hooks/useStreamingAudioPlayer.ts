"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_VOLUME = 1;
const DEFAULT_SAMPLE_RATE = 24000;

interface PcmChunk {
  chunkIndex: number;
  pcmBase64: string;
  sampleRate?: number;
  turnId: string;
}

export interface StreamingAudioPlayerState {
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  prepare: () => Promise<void>;
  startStreamingTurn: (turnId: string) => void;
  queuePcmChunk: (chunk: PcmChunk) => void;
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
    },
    [stop],
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
        if (
          activeSourcesRef.current.size === 0 &&
          pendingChunksRef.current.size === 0
        ) {
          setIsPlaying(false);
        }
      };

      source.start(scheduleTime);
      setIsPlaying(true);
    },
    [],
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

  const queuePcmChunk = useCallback(
    ({
      chunkIndex,
      pcmBase64,
      sampleRate = DEFAULT_SAMPLE_RATE,
      turnId,
    }: PcmChunk) => {
      if (
        !pcmBase64 ||
        activeTurnIdRef.current !== turnId ||
        !Number.isInteger(chunkIndex) ||
        chunkIndex < expectedChunkIndexRef.current ||
        pendingChunksRef.current.has(chunkIndex)
      ) {
        return;
      }

      try {
        const { context } = getOrCreateAudioGraph();
        const binary = window.atob(pcmBase64);
        const sampleCount = Math.floor(binary.length / 2);
        if (sampleCount === 0) return;

        const bytes = new Uint8Array(sampleCount * 2);
        for (let index = 0; index < bytes.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }

        const dataView = new DataView(bytes.buffer);
        const audioBuffer = context.createBuffer(1, sampleCount, sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        for (let index = 0; index < sampleCount; index += 1) {
          channelData[index] = dataView.getInt16(index * 2, true) / 32768;
        }

        pendingChunksRef.current.set(chunkIndex, audioBuffer);
        void drainPendingChunks();
      } catch (error) {
        console.error("[StreamingAudioPlayer] Invalid PCM chunk:", error);
      }
    },
    [drainPendingChunks, getOrCreateAudioGraph],
  );

  const playEncodedAudio = useCallback(
    (audioUrl: string) => {
      stop();

      const audio = legacyAudioRef.current ?? new Audio();
      legacyAudioRef.current = audio;
      const generation = ++legacyPlaybackGenerationRef.current;

      audio.src = audioUrl;
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
    queuePcmChunk,
    playEncodedAudio,
    stop,
  };
};
