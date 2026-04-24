"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
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
import { z } from "zod";
import { orpc } from "@/lib/orpc-client";
import type { INTERVIEW_STATUS } from "@/server/routers/interview/schemas";
import { useInterviewMedia } from "../_hooks/useInterviewMedia";
import type { InterviewData, Message } from "./types";

type InterviewStatus = keyof typeof INTERVIEW_STATUS;

const VALID_ROLES = ["user", "assistant", "system"] as const;
const AUTO_SUBMIT_IDLE_MS = 2200;
const interviewMessageMetadataSchema = z.object({
  persistedId: z.string().optional(),
  audioUrl: z.string().nullable().optional(),
  codeSnippet: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

type InterviewMessageMetadata = z.infer<typeof interviewMessageMetadataSchema>;
type InterviewUIMessage = UIMessage<InterviewMessageMetadata>;

const isValidRole = (role: string): role is Message["role"] => {
  return VALID_ROLES.includes(role as Message["role"]);
};

const getMessageText = (message: Pick<InterviewUIMessage, "parts">): string => {
  let text = "";

  for (const part of message.parts) {
    if (part.type === "text") {
      text += part.text;
    }
  }

  return text;
};

const getStableMessageId = (message: InterviewUIMessage): string => {
  return message.metadata?.persistedId ?? message.id;
};

const toMessageDate = (createdAt?: string): Date => {
  if (!createdAt) {
    return new Date();
  }

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
};

const toClientMessage = (message: InterviewUIMessage): Message | null => {
  if (!isValidRole(message.role)) {
    return null;
  }

  return {
    id: getStableMessageId(message),
    role: message.role,
    content: getMessageText(message),
    audioUrl: message.metadata?.audioUrl ?? null,
    codeSnippet: message.metadata?.codeSnippet ?? null,
    language: message.metadata?.language ?? null,
    createdAt: toMessageDate(message.metadata?.createdAt),
  };
};

const toUIMessage = (message: {
  id: string;
  role: string;
  content: string;
  audioUrl: string | null;
  codeSnippet?: string | null;
  language?: string | null;
  createdAt: Date;
}): InterviewUIMessage | null => {
  if (!isValidRole(message.role)) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    metadata: {
      persistedId: message.id,
      audioUrl: message.audioUrl,
      codeSnippet: message.codeSnippet ?? null,
      language: message.language ?? null,
      createdAt: message.createdAt.toISOString(),
    },
    parts: [
      {
        type: "text",
        text: message.content,
      },
    ],
  };
};

const mergeMessage = (
  messages: InterviewUIMessage[],
  nextMessage: InterviewUIMessage,
): InterviewUIMessage[] => {
  const stableId = getStableMessageId(nextMessage);
  const existingIndex = messages.findIndex((message) => {
    return (
      getStableMessageId(message) === stableId || message.id === nextMessage.id
    );
  });

  if (existingIndex === -1) {
    return [...messages, nextMessage];
  }

  return messages.map((message, index) =>
    index === existingIndex ? nextMessage : message,
  );
};

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
  const [isHydrated, setIsHydrated] = useState(false);
  const isStartingRef = useRef(false);
  const isSendingRef = useRef(false);
  const lastAutoSubmittedRef = useRef({ content: "", at: 0 });

  // Chat transport
  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport<InterviewUIMessage>({
        api: "/api/interview/chat/stream",
        credentials: "include",
        prepareSendMessagesRequest: ({ messages }) => {
          const latestMessage = messages.at(-1);

          return {
            credentials: "include",
            body: {
              interviewId,
              message: latestMessage
                ? getMessageText(latestMessage).trim()
                : "",
              codeSnippet: latestMessage?.metadata?.codeSnippet ?? undefined,
              language: latestMessage?.metadata?.language ?? undefined,
            },
          };
        },
      }),
    [interviewId],
  );

  // useChat
  const {
    messages: chatMessages,
    setMessages: setChatMessages,
    sendMessage: sendChatMessage,
    status: chatStatus,
    stop: stopStreamingReply,
  } = useChat<InterviewUIMessage>({
    messages: [],
    transport: chatTransport,
    messageMetadataSchema: interviewMessageMetadataSchema,
    onError: (error) => {
      console.error("[Interview Context] Chat stream error:", error);
    },
    onFinish: ({ isError, message }) => {
      if (isError) {
        toast.error("Your answer was saved, but the AI response failed.");
        return;
      }

      // playAudio is ref-stable — no stale closure risk here
      const audioUrl = message.metadata?.audioUrl;
      if (audioUrl) {
        playAudio(audioUrl);
      }
    },
  });

  const isResponding = chatStatus === "submitted" || chatStatus === "streaming";

  // Media hook
  const {
    isPlaying,
    playAudio,
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
  });

  // Derived state
  const messages = useMemo(
    () =>
      chatMessages
        .map(toClientMessage)
        .filter((message): message is Message => message !== null),
    [chatMessages],
  );

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

  // Hydrate messages from server
  useEffect(() => {
    if (isLoading || isHydrated || !interviewDataResult) {
      return;
    }

    const interview = interviewDataResult.interview;
    if (!interview) {
      setChatMessages([]);
      setIsHydrated(true);
      return;
    }

    const hydratedMessages = interview.messages
      .map(toUIMessage)
      .filter((message): message is InterviewUIMessage => message !== null);

    setStatus(interview.status as InterviewStatus);
    setChatMessages(hydratedMessages);
    setIsHydrated(true);
  }, [interviewDataResult, isHydrated, isLoading, setChatMessages]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      stopStreamingReply();
      stopAllMedia();
    };
  }, [stopAllMedia, stopStreamingReply]);

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

  // Actions
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

    try {
      const response = await startInterviewMutation({ interviewId });
      const assistantMessage = toUIMessage(response.assistantMessage);

      if (assistantMessage) {
        setChatMessages((prev) => mergeMessage(prev, assistantMessage));
      }

      setStatus(response.status as InterviewStatus);

      if (response.status === "IN_PROGRESS") {
        try {
          await connectSTT();
        } catch (sttError) {
          console.error("[Interview Context] STT connection failed:", sttError);
        }
      }

      if (assistantMessage?.metadata?.audioUrl) {
        playAudio(assistantMessage.metadata.audioUrl);
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
    setChatMessages,
  ]);

  const sendMessage = useCallback(
    async (content: string, options?: SendMessageOptions) => {
      if (!interviewId || isResponding) {
        return false;
      }

      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return false;
      }

      const previousTranscript = transcript.trim();
      clearTranscript();

      try {
        await sendChatMessage({
          text: trimmedContent,
          metadata: {
            codeSnippet: options?.codeSnippet ?? null,
            language: options?.language ?? null,
            createdAt: new Date().toISOString(),
          },
        });
        return true;
      } catch (error) {
        console.error("[Interview Context] Chat error:", error);
        restoreTranscript(previousTranscript);
        toast.error("Failed to send message");
        return false;
      }
    },
    [
      interviewId,
      isResponding,
      transcript,
      sendChatMessage,
      clearTranscript,
      restoreTranscript,
    ],
  );

  useEffect(() => {
    if (status !== "IN_PROGRESS" || isPlaying || isResponding) {
      return;
    }

    const draftTranscript = transcript.trim();
    if (!draftTranscript || interimTranscript.trim()) {
      return;
    }

    const isDuplicateAutoSend =
      lastAutoSubmittedRef.current.content === draftTranscript &&
      Date.now() - lastAutoSubmittedRef.current.at < 4000;

    if (isDuplicateAutoSend) {
      return;
    }

    const autoSubmitTimeout = window.setTimeout(() => {
      if (isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;

      void (async () => {
        try {
          const didSend = await sendMessage(draftTranscript);
          if (didSend) {
            lastAutoSubmittedRef.current = {
              content: draftTranscript,
              at: Date.now(),
            };
          }
        } finally {
          isSendingRef.current = false;
        }
      })();
    }, AUTO_SUBMIT_IDLE_MS);

    return () => {
      window.clearTimeout(autoSubmitTimeout);
    };
  }, [
    status,
    isPlaying,
    isResponding,
    transcript,
    interimTranscript,
    sendMessage,
  ]);

  const endInterview = useCallback(
    async (durationSec: number) => {
      if (!interviewId) {
        return;
      }

      try {
        stopStreamingReply();
        await endInterviewMutation({ interviewId, durationSec });

        stopAllMedia();
        setStatus("COMPLETED");

        router.push(`/dashboard/interview/${interviewId}/report`);
        toast.success("Interview completed! Generating report...");
      } catch (error) {
        console.error("[Interview Context] End error:", error);
        toast.error("Failed to end interview");
      }
    },
    [
      interviewId,
      endInterviewMutation,
      router,
      stopAllMedia,
      stopStreamingReply,
    ],
  );

  // Context value
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
