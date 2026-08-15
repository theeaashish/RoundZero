import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type ConnectionState, useLiveSTT } from "@/hooks/useLiveSTT";
import { useStreamingAudioPlayer } from "@/hooks/useStreamingAudioPlayer";

export type { ConnectionState };

export interface InterviewMediaState {
  isPlaying: boolean;
  /** Ref-stable: safe to call from callbacks without stale closure concerns */
  playAudio: (audioUrl: string) => void;
  prepareAudio: () => Promise<void>;
  startStreamingTurn: (turnId: string) => void;
  queuePcmChunk: (params: {
    chunkIndex: number;
    pcmBase64: string;
    sampleRate?: number;
    turnId: string;
  }) => void;
  stopAudio: () => void;
  isRecording: boolean;
  toggleMic: () => Promise<void>;
  transcript: string;
  interimTranscript: string;
  clearTranscript: () => void;
  restoreTranscript: (text: string) => void;
  connectionState: ConnectionState;
  connectSTT: () => Promise<void>;
  stopAllMedia: () => void;
}

export interface InterviewMediaOptions {
  isAssistantResponding?: boolean;
  onUtteranceDispatched?: (text: string) => void;
  onBargeIn?: () => void;
}

const joinTranscriptSegments = (...segments: string[]) =>
  segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(" ");

export const useInterviewMedia = (
  options?: InterviewMediaOptions,
): InterviewMediaState => {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const micEnabledRef = useRef(true);
  const transcriptRef = useRef("");

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const {
    playEncodedAudio,
    prepare: prepareAudio,
    startStreamingTurn,
    queuePcmChunk,
    isPlaying,
    stop: stopAudio,
  } = useStreamingAudioPlayer();

  // Ref-stable play function — safe to call from stale closures
  const playEncodedAudioRef = useRef(playEncodedAudio);
  useEffect(() => {
    playEncodedAudioRef.current = playEncodedAudio;
  }, [playEncodedAudio]);

  const playAudio = useCallback((audioUrl: string) => {
    playEncodedAudioRef.current(audioUrl);
  }, []);

  const {
    connectionState,
    isRecording,
    connect,
    disconnect,
    finalizeCurrentUtterance,
    pauseMic,
    resumeMic,
  } = useLiveSTT({
    onInterimTranscript: (text) =>
      setInterimTranscript(joinTranscriptSegments(transcriptRef.current, text)),
    onFinalTranscript: (text) => {
      setInterimTranscript(joinTranscriptSegments(transcriptRef.current, text));
    },
    onUtteranceEnd: (assembledTranscript) => {
      const trimmed = assembledTranscript.trim();
      if (trimmed) {
        const nextTranscript = joinTranscriptSegments(
          transcriptRef.current,
          trimmed,
        );
        transcriptRef.current = nextTranscript;
        setTranscript(nextTranscript);
        setInterimTranscript("");
        optionsRef.current?.onUtteranceDispatched?.(nextTranscript);
      }
    },
    onSpeechStarted: () => {
      setInterimTranscript("");
      // Barge-in: Only interrupt when assistant is actively speaking / playing audio
      if (isPlaying) {
        stopAudio();
        optionsRef.current?.onBargeIn?.();
      }
    },
  });

  // Shared connect helper to avoid duplicated logic
  const tryConnect = useCallback(
    async (errorMessage: string): Promise<boolean> => {
      try {
        await connect();
        micEnabledRef.current = true;
        return true;
      } catch {
        toast.error(errorMessage);
        return false;
      }
    },
    [connect],
  );

  const connectSTT = useCallback(
    () =>
      tryConnect("Failed to connect real-time transcription").then(() => {}),
    [tryConnect],
  );

  const toggleMic = useCallback(async () => {
    void prepareAudio().catch((error) => {
      console.warn("[Interview Media] Could not resume audio:", error);
    });

    if (connectionState !== "connected") {
      await tryConnect("Microphone access denied or unavailable");
      return;
    }

    if (isRecording) {
      finalizeCurrentUtterance();
      pauseMic();
      micEnabledRef.current = false;
    } else {
      resumeMic();
      micEnabledRef.current = true;
    }
  }, [
    connectionState,
    isRecording,
    prepareAudio,
    tryConnect,
    finalizeCurrentUtterance,
    pauseMic,
    resumeMic,
  ]);

  const stopAllMedia = useCallback(() => {
    stopAudio();
    disconnect();
    micEnabledRef.current = false;
  }, [stopAudio, disconnect]);

  const clearTranscript = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const restoreTranscript = useCallback((text: string) => {
    const restoredTranscript = text.trim();
    transcriptRef.current = restoredTranscript;
    setTranscript(restoredTranscript);
    setInterimTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      disconnect();
    };
  }, [stopAudio, disconnect]);

  return {
    isPlaying,
    playAudio,
    prepareAudio,
    startStreamingTurn,
    queuePcmChunk,
    stopAudio,
    isRecording,
    toggleMic,
    transcript,
    interimTranscript,
    clearTranscript,
    restoreTranscript,
    connectionState,
    connectSTT,
    stopAllMedia,
  };
};
