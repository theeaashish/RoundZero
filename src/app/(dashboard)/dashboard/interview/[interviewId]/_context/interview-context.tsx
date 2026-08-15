"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc-client";
import type { INTERVIEW_STATUS } from "@/server/routers/interview/schemas";
import { useInterviewMedia } from "../_hooks/useInterviewMedia";
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
  connectionState: "disconnected" | "connecting" | "connected" | "failed";
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
  } = useInterviewMedia({
    isAssistantResponding: isResponding,
    onBargeIn: handleBargeIn,
    onUtteranceDispatched: (finalizedText) => {
      if (status === "IN_PROGRESS" && !isEndingRef.current) {
        void sendMessage(finalizedText);
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

    void connectSTT();
  }, [isHydrated, status, connectionState, connectSTT]);

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

      if (assistantMessage) {
        setMessages((prev) => [
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
        ]);
      }

      setStatus(response.status as InterviewStatus);

      if (response.status === "IN_PROGRESS") {
        try {
          await connectSTT();
        } catch (sttError) {
          console.error("[Interview Context] STT connection failed:", sttError);
        }
      }

      if (assistantMessage?.audioUrl) {
        playAudio(assistantMessage.audioUrl);
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

      const trimmedContent = content.trim();
      if (!trimmedContent) {
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

      const userTempId = crypto.randomUUID();
      const assistantTempId = crypto.randomUUID();
      activeUserTempIdRef.current = userTempId;

      const userMsg: Message = {
        id: userTempId,
        role: "user",
        content: trimmedContent,
        codeSnippet: options?.codeSnippet ?? null,
        language: options?.language ?? null,
        audioUrl: null,
        createdAt: new Date(),
      };

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

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsResponding(true);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      let userMessagePersisted = false;
      let messageCompleted = false;
      let streamErrorMessage: string | null = null;

      try {
        const response = await fetch("/api/interview/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId,
            message: trimmedContent,
            codeSnippet: options?.codeSnippet ?? null,
            language: options?.language ?? null,
            turnId,
          }),
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        streamLoop: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split("\n\n");
          sseBuffer = events.pop() ?? "";

          for (const eventBlock of events) {
            if (!eventBlock.trim()) continue;

            const lines = eventBlock.split("\n");
            let eventName = "";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventName = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataStr = line.slice(6).trim();
              }
            }

            if (!eventName || !dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              // Ignore packets if turn was interrupted
              if (activeTurnIdRef.current !== turnId) break;

              if (eventName === "user-message") {
                userMessagePersisted = true;
                if (activeUserTempIdRef.current === userTempId) {
                  activeUserTempIdRef.current = null;
                }
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === userTempId
                      ? {
                          ...msg,
                          id: data.persistedId || msg.id,
                          createdAt: data.createdAt
                            ? new Date(data.createdAt)
                            : msg.createdAt,
                        }
                      : msg,
                  ),
                );
              } else if (
                eventName === "text-delta" &&
                typeof data.text === "string"
              ) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantTempId
                      ? {
                          ...msg,
                          content: msg.content + data.text,
                          isTyping: true,
                        }
                      : msg,
                  ),
                );
              } else if (eventName === "audio-chunk" && data.pcmBase64) {
                queuePcmChunk({
                  chunkIndex: data.chunkIndex,
                  pcmBase64: data.pcmBase64,
                  sampleRate: data.sampleRate ?? 24000,
                  turnId,
                });
              } else if (eventName === "message-complete") {
                messageCompleted = true;
                activeTurnIdRef.current = null;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantTempId
                      ? {
                          ...msg,
                          id: data.persistedId || msg.id,
                          content: data.content || msg.content,
                          isTyping: false,
                        }
                      : msg,
                  ),
                );
              } else if (eventName === "error") {
                streamErrorMessage = data.message || "AI response error";
                await reader.cancel().catch(() => {});
                break streamLoop;
              }
            } catch (parseError) {
              console.error("[SSE Parse Error]", parseError);
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
          abortController.signal.aborted;

        setMessages((prev) => prev.filter((msg) => msg.id !== assistantTempId));

        if (wasAborted) {
          return false;
        }

        console.error("[Interview Context] Send message error:", error);
        if (!userMessagePersisted) {
          restoreTranscript(recoverableTranscript);
          setMessages((prev) => prev.filter((msg) => msg.id !== userTempId));
          if (activeUserTempIdRef.current === userTempId) {
            activeUserTempIdRef.current = null;
          }
        }
        toast.error(
          userMessagePersisted
            ? "Your answer was saved, but the AI response failed."
            : "Failed to send message",
        );
        return false;
      } finally {
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
      status,
      clearTranscript,
      restoreTranscript,
      prepareAudio,
      startStreamingTurn,
      queuePcmChunk,
      interruptActiveTurn,
    ],
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
