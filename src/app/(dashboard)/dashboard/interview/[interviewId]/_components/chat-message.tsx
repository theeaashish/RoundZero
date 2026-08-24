"use client";

import { Bot, User } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { CodeSnippet } from "./code-snippet";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  codeSnippet?: string | null;
  language?: string | null;
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = memo(
  function ChatMessage({ message }: ChatMessageProps) {
    const isAssistant = message.role === "assistant";

    return (
      <div
        className={cn(
          "flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 w-full",
          isAssistant ? "flex-row" : "flex-row-reverse",
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "h-8 w-8 rounded-full shrink-0 flex items-center justify-center shadow-sm",
            isAssistant
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isAssistant ? (
            <Bot className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>

        {/* Message */}
        <div
          className={cn(
            "flex flex-col gap-1 max-w-[85%] md:max-w-[75%]",
            isAssistant ? "items-start" : "items-end",
          )}
        >
          <div
            className={cn(
              "rounded-2xl px-5 py-3 text-sm shadow-sm",
              isAssistant
                ? "bg-card border text-card-foreground rounded-tl-sm"
                : "bg-primary text-primary-foreground rounded-tr-sm",
            )}
          >
            {message.content ? (
              <p className="leading-relaxed whitespace-pre-wrap">
                {message.content}
                {message.isTyping && (
                  <span className="inline-block w-1.5 h-3.5 bg-current ml-1 animate-pulse align-middle opacity-70" />
                )}
              </p>
            ) : message.isTyping ? (
              <div className="flex items-center gap-1.5 py-1 px-1">
                <span
                  className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            ) : null}
          </div>
          {message.codeSnippet ? (
            <CodeSnippet
              code={message.codeSnippet}
              language={message.language || "text"}
              className="w-full overflow-hidden"
            />
          ) : null}
          <span className="text-[10px] text-muted-foreground px-2 opacity-70">
            {message.timestamp}
          </span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isTyping === nextProps.message.isTyping &&
    prevProps.message.codeSnippet === nextProps.message.codeSnippet &&
    prevProps.message.language === nextProps.message.language &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.role === nextProps.message.role,
);
