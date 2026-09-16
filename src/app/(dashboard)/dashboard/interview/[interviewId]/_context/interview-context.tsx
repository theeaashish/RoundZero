"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { ConnectionState } from "@/hooks/use-live-stt";
import {
  parseStreamEvent,
  STREAM_EVENT,
} from "@/lib/interview-stream-protocol";
import { orpc } from "@/lib/orpc-client";
import { readSseStream } from "@/lib/sse";
import type { INTERVIEW_STATUS } from "@/server/routers/interview/schemas";
import { useInterviewMedia } from "../_hooks/use-interview-media";
import type { InterviewData, Message } from "./types";

type InterviewStatus = keyof typeof INTERVIEW_STATUS;

interface SendMessageOptions {
  codeSnippet?: string;
  language?: string;
}

export interface InterviewContextType {
  messages: Message[];
  isRecording: boolean;
  isPlaying: boolean;
  isResponding: boolean;
  isConnecting: boolean;
  isHydrated: boolean;
  interviewId: string;
  status: InterviewStatus;
  interview: InterviewData | null | undefined;
  isLoading: boolean;
  isEnding: boolean;
  startInterview: () => Promise<void>;
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<boolean>;
  endInterview: (durationSec: number) => Promise<void>;
  connectSTT: () => Promise<void>;
  toggleMic: () => Promise<void>;
  stopAllMedia: () => void;
  transcript: string;
  interimTranscript: string;
  connectionState: ConnectionState;
}

const InterviewContext = createContext<InterviewContextType | null>(null);

export interface InterviewContextProviderProps {
  children: ReactNode;
  interviewId?: string;
}

export const InterviewContextProvider = ({
  children,
  interviewId: propInterviewId,
}: InterviewContextProviderProps) => {
  const params = useParams();
  const router = useRouter();
  const paramInterviewId = params?.interviewId;
  const interviewId =
    propInterviewId ||
    (typeof paramInterviewId === "string" ? paramInterviewId : "");

  const [status, setStatus] = useState<InterviewStatus>("SETUP");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isResponding, setIsResponding] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const isStartingRef = useRef(false);
  const isEndingRef = useRef(false);
  const activeTurnIdRef = useRef<string | null>(null);
  const activeUserTempIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const turnCancellationRef = useRef<Promise<void> | null>(null);

  // Mutations & queries
  const { mutateAsync: startInterviewMutation } = useMutation(
    orpc.interview.start.mutationOptions(),
  );
  const { mutateAsync: endInterviewMutation, isPending: isEnding } =
    useMutation(orpc.interview.end.mutationOptions());

  const { data: interviewDataResult, isLoading } = useQuery(
    orpc.interview.getById.queryOptions({
      input: { id: interviewId },
      enabled: !!interviewId,
    }),
  );

  // Boost recognition of the role's tech vocabulary (nova-3 keyterm boosting)
  const sttKeyterms = useMemo(() => {
    const raw = interviewDataResult?.interview?.techStack;
    if (!raw) return [];
    return raw
      .split(/[,;|/]/)
      .map((term) => term.trim())
      .filter((term) => term.length > 1);
  }, [interviewDataResult]);

  const stopAudioRef = useRef<() => void>(() => {});

  const cancelTurn = useCallback(
    async (
      turnId: string,
    ): Promise<{ id: string; createdAt: string } | null | undefined> => {
      try {
        const response = await fetch("/api/interview/chat/stream", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, turnId }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        return data.userMessage ?? null;
      } catch (error) {
        console.error("[Interview Context] Failed to cancel turn:", error);
        return undefined;
      }
    },
    [interviewId],
  );

  const interruptActiveTurn = useCallback(() => {
    const interruptedTurnId = activeTurnIdRef.current;
    const interruptedUserTempId = activeUserTempIdRef.current;
    activeTurnIdRef.current = null;
    activeUserTempIdRef.current = null;

    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopAudioRef.current();

    if (!interruptedTurnId) {
      return turnCancellationRef.current;
    }

    const cancellation = cancelTurn(interruptedTurnId)
      .then((persistedUserMessage) => {
        if (!interruptedUserTempId || persistedUserMessage === undefined)
          return;

        setMessages((prev) =>
          persistedUserMessage
            ? prev.map((message) =>
                message.id === interruptedUserTempId
                  ? {
                      ...message,
                      id: persistedUserMessage.id,
                      createdAt: new Date(persistedUserMessage.createdAt),
                    }
                  : message,
              )
            : prev.filter((message) => message.id !== interruptedUserTempId),
        );
      })
      .finally(() => {
        if (turnCancellationRef.current === cancellation) {
          turnCancellationRef.current = null;
        }
      });
    turnCancellationRef.current = cancellation;
    return cancellation;
  }, [cancelTurn]);

  const handleBargeIn = useCallback(() => {
    void interruptActiveTurn();
    setIsResponding(false);
  }, [interruptActiveTurn]);

  const {
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
  } = useInterviewMedia({
    sttKeyterms,
    onBargeIn: handleBargeIn,
    onUtteranceDispatched: (finalizedText) => {
      const trimmed = finalizedText.trim();
      if (
        status === "IN_PROGRESS" &&
        !isEndingRef.current &&
        !isResponding &&
        !isPlaying &&
        trimmed.length > 2
      ) {
        void sendMessage(trimmed);
      }
    },
  });

  useEffect(() => {
    stopAudioRef.current = stopAudio;
  }, [stopAudio]);

  // Hydrate messages from server
  useEffect(() => {
    if (isLoading || isHydrated || !interviewDataResult) {
      return;
    }

    const interview = interviewDataResult.interview;
    if (!interview) {
      setMessages([]);
      setIsHydrated(true);
      return;
    }

    setStatus(interview.status as InterviewStatus);
    setMessages(
      interview.messages.map((m) => ({
        id: m.id,
        role: m.role as Message["role"],
        content: m.content,
        audioUrl: m.audioUrl,
        codeSnippet: m.codeSnippet,
        language: m.language,
        createdAt: new Date(m.createdAt),
      })),
    );
    setIsHydrated(true);
  }, [interviewDataResult, isHydrated, isLoading]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      void interruptActiveTurn();
      stopAllMedia();
    };
  }, [interruptActiveTurn, stopAllMedia]);

  // Auto-connect STT when interview is in progress
  useEffect(() => {
    if (
      !isHydrated ||
      status !== "IN_PROGRESS" ||
      connectionState !== "disconnected"
    ) {
      return;
    }

    void connectSTT().catch((sttError) => {
      console.error("[Interview Context] Auto-connect STT failed:", sttError);
    });
  }, [isHydrated, status, connectionState, connectSTT]);

  // Unified streaming turn execution for both opening and subsequent turns
  const runStreamTurn = useCallback(
    async (params: {
      isOpening?: boolean;
      content?: string;
      options?: SendMessageOptions;
    }): Promise<boolean> => {
      if (!interviewId || isEndingRef.current) {
        return false;
      }

      const { isOpening, content, options } = params;
      const trimmedContent = content?.trim() || "";

      if (!isOpening && !trimmedContent) {
        return false;
      }

      // Make cancellation durable before the next turn can claim ownership.
      await interruptActiveTurn();

      void prepareAudio().catch((error) => {
        console.warn("[Interview Context] Could not resume audio:", error);
      });

      const recoverableTranscript = trimmedContent;
      clearTranscript();

      const turnId = crypto.randomUUID();
      activeTurnIdRef.current = turnId;
      startStreamingTurn(turnId);

      const userTempId = isOpening ? null : crypto.randomUUID();
      const assistantTempId = crypto.randomUUID();
      if (userTempId) {
        activeUserTempIdRef.current = userTempId;
      }

      const newMessages: Message[] = [];
      if (userTempId && trimmedContent) {
        newMessages.push({
          id: userTempId,
          role: "user",
          content: trimmedContent,
          codeSnippet: options?.codeSnippet ?? null,
          language: options?.language ?? null,
          audioUrl: null,
          createdAt: new Date(),
        });
      }

      const assistantPlaceholder: Message = {
        id: assistantTempId,
        role: "assistant",
        content: "",
        codeSnippet: null,
        language: null,
        audioUrl: null,
        createdAt: new Date(),
        isTyping: true,
      };
      newMessages.push(assistantPlaceholder);

      setMessages((prev) => [...prev, ...newMessages]);
      setIsResponding(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      let userMessagePersisted = Boolean(isOpening);
      let messageCompleted = false;
      let streamErrorMessage: string | null = null;

      // Coalesce text deltas into display paint frames (via requestAnimationFrame)
      // instead of thrashing the message list on every token or random timer ticks.
      let pendingDelta = "";
      let deltaFlushRafId: number | null = null;
      const cancelDeltaFlush = () => {
        if (deltaFlushRafId !== null) {
          cancelAnimationFrame(deltaFlushRafId);
          deltaFlushRafId = null;
        }
        pendingDelta = "";
      };
      const flushPendingDelta = () => {
        deltaFlushRafId = null;
        if (!pendingDelta) return;
        const text = pendingDelta;
        pendingDelta = "";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantTempId
              ? { ...msg, content: msg.content + text, isTyping: true }
              : msg,
          ),
        );
      };

      try {
        const response = await fetch("/api/interview/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId,
            isOpening: isOpening ? true : undefined,
            message: trimmedContent || undefined,
            codeSnippet: options?.codeSnippet ?? null,
            language: options?.language ?? null,
            turnId,
          }),
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          const errorPayload = await response.json().catch(() => null);
          const errorMessage =
            typeof errorPayload?.error === "string"
              ? errorPayload.error
              : `HTTP error ${response.status}`;
          throw new Error(errorMessage);
        }

        streamLoop: for await (const sse of readSseStream(response.body)) {
          if (activeTurnIdRef.current !== turnId) break;

          const event = parseStreamEvent(sse.event, sse.data);
          if (!event) continue;

          // AudioError is intentionally unhandled here: the audio player already
          // substitutes silence for a failed chunk and the server logs the failure.
          switch (event.event) {
            case STREAM_EVENT.UserMessage: {
              if (!userTempId) break;
              userMessagePersisted = true;
              if (activeUserTempIdRef.current === userTempId) {
                activeUserTempIdRef.current = null;
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === userTempId
                    ? {
                        ...msg,
                        id: event.persistedId || msg.id,
                        createdAt: new Date(event.createdAt),
                      }
                    : msg,
                ),
              );
              break;
            }
            case STREAM_EVENT.TextDelta: {
              pendingDelta += event.text;
              if (deltaFlushRafId === null) {
                deltaFlushRafId = requestAnimationFrame(flushPendingDelta);
              }
              break;
            }
            case STREAM_EVENT.AudioChunk: {
              queueAudioChunk({
                chunkIndex: event.chunkIndex,
                audioBase64: event.audioBase64,
                turnId,
              });
              break;
            }
            case STREAM_EVENT.AudioComplete: {
              markAudioComplete(turnId);
              break;
            }
            case STREAM_EVENT.MessageComplete: {
              messageCompleted = true;
              activeTurnIdRef.current = null;
              // Server sends the authoritative full content; drop buffered deltas.
              cancelDeltaFlush();
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantTempId
                    ? {
                        ...msg,
                        id: event.persistedId || msg.id,
                        content: event.content || msg.content,
                        isTyping: false,
                      }
                    : msg,
                ),
              );
              break;
            }
            case STREAM_EVENT.Error: {
              streamErrorMessage = event.message || "AI response error";
              break streamLoop;
            }
          }
        }

        if (!messageCompleted) {
          throw new Error(streamErrorMessage || "Response stream ended early");
        }

        return true;
      } catch (error: unknown) {
        if (messageCompleted) {
          return true;
        }

        const wasAborted =
          (error as { name?: string })?.name === "AbortError" ||
          abortController.signal.aborted ||
          activeTurnIdRef.current !== turnId;

        setMessages((prev) => prev.filter((msg) => msg.id !== assistantTempId));

        if (wasAborted) {
          return false;
        }

        console.error("[Interview Context] Stream turn error:", error);
        if (!userMessagePersisted && userTempId) {
          restoreTranscript(recoverableTranscript);
          setMessages((prev) => prev.filter((msg) => msg.id !== userTempId));
          if (activeUserTempIdRef.current === userTempId) {
            activeUserTempIdRef.current = null;
          }
        }
        toast.error(
          userMessagePersisted
            ? "The AI response stream failed."
            : error instanceof Error
              ? error.message
              : "Failed to send message",
        );
        return false;
      } finally {
        cancelDeltaFlush();
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
          if (activeTurnIdRef.current === turnId) {
            activeTurnIdRef.current = null;
          }
          setIsResponding(false);
        }
      }
    },
    [
      interviewId,
      clearTranscript,
      restoreTranscript,
      prepareAudio,
      startStreamingTurn,
      queueAudioChunk,
      markAudioComplete,
      interruptActiveTurn,
    ],
  );

  // Start interview action
  const startInterview = useCallback(async () => {
    if (
      !interviewId ||
      !isHydrated ||
      isStartingRef.current ||
      status !== "SETUP"
    ) {
      return;
    }

    isStartingRef.current = true;
    void prepareAudio().catch((error) => {
      console.warn("[Interview Context] Could not prewarm audio:", error);
    });

    try {
      const response = await startInterviewMutation({ interviewId });
      const assistantMessage = response.assistantMessage;

      setStatus(response.status as InterviewStatus);

      if (assistantMessage) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === assistantMessage.id)) return prev;
          return [
            ...prev,
            {
              id: assistantMessage.id,
              role: "assistant",
              content: assistantMessage.content,
              audioUrl: assistantMessage.audioUrl,
              codeSnippet: assistantMessage.codeSnippet,
              language: assistantMessage.language,
              createdAt: new Date(assistantMessage.createdAt),
            },
          ];
        });

        if (assistantMessage.audioUrl) {
          playAudio(assistantMessage.audioUrl);
        }
      } else {
        // Fast streaming opening turn with TTFT < 500ms
        await runStreamTurn({ isOpening: true });
      }

      if (response.status === "IN_PROGRESS") {
        void connectSTT().catch((sttError) => {
          console.error("[Interview Context] STT connection failed:", sttError);
        });
      }
    } catch (error) {
      console.error("[Interview Context] Failed to start:", error);
      toast.error("Failed to start interview");
    } finally {
      isStartingRef.current = false;
    }
  }, [
    interviewId,
    isHydrated,
    status,
    startInterviewMutation,
    runStreamTurn,
    connectSTT,
    playAudio,
    prepareAudio,
  ]);

  // Send message action with streaming response
  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      if (!interviewId || status !== "IN_PROGRESS" || isEndingRef.current) {
        return false;
      }

      return runStreamTurn({ content, options });
    },
    [interviewId, status, runStreamTurn],
  );

  // End interview action
  const endInterview = useCallback(
    async (durationSec: number) => {
      if (!interviewId) {
        return;
      }

      if (isEndingRef.current) return;
      isEndingRef.current = true;
      const previousStatus = status;

      try {
        await interruptActiveTurn();
        stopAllMedia();
        setStatus("COMPLETED");
        await endInterviewMutation({ interviewId, durationSec });

        router.push(`/dashboard/interview/${interviewId}/report`);
        toast.success("Interview completed! Generating report...");
      } catch (error) {
        setStatus(previousStatus);
        console.error("[Interview Context] End error:", error);
        toast.error("Failed to end interview");
        if (previousStatus === "IN_PROGRESS") {
          void connectSTT();
        }
      } finally {
        isEndingRef.current = false;
      }
    },
    [
      interviewId,
      status,
      interruptActiveTurn,
      stopAllMedia,
      endInterviewMutation,
      router,
      connectSTT,
    ],
  );

  const value: InterviewContextType = {
    messages,
    isRecording,
    isPlaying,
    isResponding,
    isConnecting: connectionState === "connecting",
    isHydrated,
    interviewId,
    status,
    interview: interviewDataResult?.interview,
    isLoading: isLoading || !isHydrated,
    isEnding,
    startInterview,
    sendMessage,
    endInterview,
    connectSTT,
    toggleMic,
    stopAllMedia,
    transcript,
    interimTranscript,
    connectionState,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = (): InterviewContextType => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error(
      "useInterview must be used within InterviewContextProvider",
    );
  }
  return context;
};
