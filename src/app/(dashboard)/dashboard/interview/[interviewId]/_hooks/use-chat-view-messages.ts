"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Message, MessageRole } from "../_context/types";

/** A transcript entry shaped for rendering — timestamps pre-formatted, no Date objects. */
export interface ChatViewMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  codeSnippet?: string | null;
  language?: string | null;
  isTyping?: boolean;
}

/**
 * Maps context messages to view messages while preserving referential identity
 * for entries that haven't changed, so React can skip reconciling the whole
 * transcript on every streamed token.
 */
export function useChatViewMessages(messages: Message[]): ChatViewMessage[] {
  const cacheRef = useRef<Map<string, ChatViewMessage>>(new Map());

  const chatMessages = useMemo(() => {
    const cache = cacheRef.current;

    return messages.map((message) => {
      const formattedTimestamp = message.createdAt
        ? new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      const isTyping = message.isTyping ?? false;

      const cached = cache.get(message.id);
      if (
        cached &&
        cached.content === message.content &&
        cached.isTyping === isTyping &&
        cached.codeSnippet === message.codeSnippet &&
        cached.language === message.language &&
        cached.role === message.role &&
        cached.timestamp === formattedTimestamp
      ) {
        return cached;
      }

      return {
        id: message.id,
        role: message.role,
        content: message.content,
        codeSnippet: message.codeSnippet,
        language: message.language,
        timestamp: formattedTimestamp,
        isTyping,
      };
    });
  }, [messages]);

  useEffect(() => {
    cacheRef.current = new Map(chatMessages.map((m) => [m.id, m]));
  }, [chatMessages]);

  return chatMessages;
}
