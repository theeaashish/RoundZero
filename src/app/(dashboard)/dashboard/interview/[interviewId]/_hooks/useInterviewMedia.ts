import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { type ConnectionState, useLiveSTT } from "@/hooks/useLiveSTT";

export type { ConnectionState };

export interface InterviewMediaState {
  isPlaying: boolean;
  /** Ref-stable: safe to call from callbacks without stale closure concerns */
  playAudio: (audioUrl: string) => void;
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
  const prevIsAssistantBusyRef = useRef(false);
  const transcriptRef = useRef("");

  const { playEncodedAudio, isPlaying, stop: stopAudio } = useAudioPlayer();

  // Ref-stable play function — safe to call from stale closures (e.g. onFinish)
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
      }
    },
    onSpeechStarted: () => setInterimTranscript(""),
  });

  // Auto pause/resume mic when assistant is busy (playing audio or responding)
  useEffect(() => {
    const isAssistantBusy = isPlaying || !!options?.isAssistantResponding;

    if (isAssistantBusy && !prevIsAssistantBusyRef.current) {
      pauseMic();
    } else if (!isAssistantBusy && prevIsAssistantBusyRef.current) {
      if (micEnabledRef.current) {
        resumeMic();
      }
    }
    prevIsAssistantBusyRef.current = isAssistantBusy;
  }, [isPlaying, options?.isAssistantResponding, pauseMic, resumeMic]);

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
