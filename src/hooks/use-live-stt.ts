"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DeepgramSession } from "@/lib/live-stt/deepgram-session";
import { UtteranceAssembler } from "@/lib/live-stt/utterance-assembler";
import { assertMicAvailable, sleep } from "@/lib/live-stt-utils";
import { isMicError } from "@/lib/mic-errors";

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

const DEFAULT_DEADMAN_TIMEOUT_MS = 1500;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 1000;
// Dev servers cold-start RPC routes and networks blip — one quiet retry on
// token/socket acquisition stops first-attempt flakiness from killing sessions.
const TRANSIENT_RETRY_DELAY_MS = 1200;

export const useLiveSTT = (options: LiveSTTOptions = {}): LiveSTTState => {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [isRecording, setIsRecording] = useState(false);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const sessionRef = useRef<DeepgramSession | null>(null);
  const assemblerRef = useRef<UtteranceAssembler | null>(null);
  const isRecordingRef = useRef(false);
  const hasEverConnectedRef = useRef(false);
  const userDisconnectRequestedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectAttemptRef = useRef<Promise<void> | null>(null);
  // Forward reference: scheduleReconnect must trigger connect() which is
  // declared later. This is the only intentional indirection left.
  const connectRef = useRef<() => Promise<void>>(async () => {});

  const finalizeCurrentUtterance = useCallback(
    () => assemblerRef.current?.finalize() ?? "",
    [],
  );

  const disposeActiveSession = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    sessionRef.current?.dispose();
    sessionRef.current = null;
    assemblerRef.current?.dispose();
    assemblerRef.current = null;
    isRecordingRef.current = false;
    setIsRecording(false);
  }, []);

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

  const handleUnexpectedClose = useCallback(() => {
    // Read intent BEFORE teardown clears isRecordingRef — ordering matters.
    const shouldReconnect =
      hasEverConnectedRef.current && isRecordingRef.current;
    finalizeCurrentUtterance();
    disposeActiveSession();
    if (shouldReconnect) {
      scheduleReconnect();
    } else {
      setConnectionState("disconnected");
    }
  }, [finalizeCurrentUtterance, disposeActiveSession, scheduleReconnect]);

  const establishSession = useCallback(async () => {
    userDisconnectRequestedRef.current = false;
    assertMicAvailable();
    setConnectionState("connecting");

    const assembler = new UtteranceAssembler(
      optionsRef.current.utteranceTimeoutMs ?? DEFAULT_DEADMAN_TIMEOUT_MS,
      {
        onSpeechStart: () => optionsRef.current.onSpeechStarted?.(),
        onInterim: (text) => optionsRef.current.onInterimTranscript?.(text),
        onFinal: (text) => optionsRef.current.onFinalTranscript?.(text),
        onEnd: (text) => optionsRef.current.onUtteranceEnd?.(text),
      },
    );

    let session: DeepgramSession;
    try {
      session = await DeepgramSession.connect({
        keyterms: optionsRef.current.keyterms,
        assembler,
        handlers: { onUnexpectedClose: handleUnexpectedClose },
      });
    } catch (error) {
      assembler.dispose();
      if (userDisconnectRequestedRef.current) {
        setConnectionState("disconnected");
      } else if (hasEverConnectedRef.current && !isMicError(error)) {
        scheduleReconnect();
      } else {
        setConnectionState("failed");
      }
      throw error;
    }

    // A disconnect raced the handshake — throw the fresh session away.
    if (userDisconnectRequestedRef.current) {
      session.dispose();
      setConnectionState("disconnected");
      return;
    }

    sessionRef.current = session;
    assemblerRef.current = assembler;
    isRecordingRef.current = true;
    hasEverConnectedRef.current = true;
    reconnectAttemptsRef.current = 0;
    setConnectionState("connected");
    setIsRecording(true);
  }, [handleUnexpectedClose, scheduleReconnect]);

  const connect = useCallback(async () => {
    if (connectAttemptRef.current) {
      return connectAttemptRef.current;
    }
    if (sessionRef.current) return;

    let attempt: Promise<void> | null = null;
    attempt = (async () => {
      try {
        await establishSession();
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
          sessionRef.current ||
          userDisconnectRequestedRef.current ||
          connectAttemptRef.current !== attempt
        ) {
          return;
        }

        await establishSession();
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
  }, [establishSession]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    userDisconnectRequestedRef.current = true;
    disposeActiveSession();
    setConnectionState("disconnected");
  }, [disposeActiveSession]);

  const pauseMic = useCallback(() => {
    sessionRef.current?.pause();
    isRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  const resumeMic = useCallback(() => {
    sessionRef.current?.resume();
    const hasSession = Boolean(sessionRef.current);
    assemblerRef.current?.reset();
    isRecordingRef.current = hasSession;
    setIsRecording(hasSession);
  }, []);

  useEffect(() => {
    return () => {
      // Flag any in-flight connect attempt so it discards its fresh session
      // instead of adopting it after unmount.
      userDisconnectRequestedRef.current = true;
      disposeActiveSession();
    };
  }, [disposeActiveSession]);

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
