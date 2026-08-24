import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type ConnectionState, useLiveSTT } from "@/hooks/use-live-stt";
import { useStreamingAudioPlayer } from "@/hooks/use-streaming-audio-player";
import {
  countWords,
  describeSttError,
  joinTranscriptSegments,
} from "@/lib/interview-media-utils";

export type { ConnectionState };

export interface InterviewMediaState {
  isPlaying: boolean;
  /** Ref-stable: safe to call from callbacks without stale closure concerns */
  playAudio: (audioUrl: string) => void;
  prepareAudio: () => Promise<void>;
  startStreamingTurn: (turnId: string) => void;
  queueAudioChunk: (params: {
    chunkIndex: number;
    audioBase64: string;
    turnId: string;
  }) => void;
  markAudioComplete: (turnId: string) => void;
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
  /** Domain terms boosted for STT accuracy (e.g. tech stack keywords) */
  sttKeyterms?: string[];
}

// Finals are trustworthy at 3 words; interims stream continuously mid-speech,
// so they need a slightly higher threshold to stay immune to backchannel noise.
const FINAL_BARGE_IN_WORDS = 3;
const INTERIM_BARGE_IN_WORDS = 4;

export const useInterviewMedia = (
  options?: InterviewMediaOptions,
): InterviewMediaState => {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  const micEnabledRef = useRef(true);
  const transcriptRef = useRef("");

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const {
    playEncodedAudio,
    prepare: prepareAudio,
    startStreamingTurn,
    queueAudioChunk,
    markAudioComplete,
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

  // Shared barge-in check. Runs on interims (which arrive every ~100-200ms
  // while the user is talking) instead of only on finals — cuts interruption
  // latency by ~0.5-1s since is_final waits for a speech segment to end.
  const maybeBargeIn = useCallback(
    (text: string, minWords: number) => {
      if (!isPlaying || countWords(text) < minWords) return;

      stopAudio();
      optionsRef.current?.onBargeIn?.();
    },
    [isPlaying, stopAudio],
  );

  const {
    connectionState,
    isRecording,
    connect,
    disconnect,
    finalizeCurrentUtterance,
    pauseMic,
    resumeMic,
  } = useLiveSTT({
    keyterms: options?.sttKeyterms,
    onInterimTranscript: (text) => {
      setInterimTranscript(joinTranscriptSegments(transcriptRef.current, text));
      maybeBargeIn(text, INTERIM_BARGE_IN_WORDS);
    },
    onFinalTranscript: (text) => {
      setInterimTranscript(joinTranscriptSegments(transcriptRef.current, text));
      maybeBargeIn(text, FINAL_BARGE_IN_WORDS);
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
        // Do not auto-dispatch candidate turns while AI is actively speaking!
        if (!isPlaying) {
          optionsRef.current?.onUtteranceDispatched?.(nextTranscript);
        }
      }
    },
    onSpeechStarted: () => {
      setInterimTranscript("");
      // Note: Do NOT stopAudio on raw VAD trigger, as laptop speaker output or breaths trigger VAD
    },
  });

  // Shared connect helper to avoid duplicated logic
  const tryConnect = useCallback(async (): Promise<boolean> => {
    try {
      await connect();
      micEnabledRef.current = true;
      return true;
    } catch (error) {
      console.error("[Interview Media] STT connection failed:", error);
      toast.error(describeSttError(error));
      return false;
    }
  }, [connect]);

  const connectSTT = useCallback(
    () => tryConnect().then(() => {}),
    [tryConnect],
  );

  const toggleMic = useCallback(async () => {
    void prepareAudio().catch((error) => {
      console.warn("[Interview Media] Could not resume audio:", error);
    });

    if (connectionState !== "connected") {
      await tryConnect();
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
    queueAudioChunk,
    markAudioComplete,
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
