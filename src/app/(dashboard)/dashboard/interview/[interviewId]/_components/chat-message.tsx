"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ChatViewMessage } from "../_hooks/use-chat-view-messages";
import { CodeSnippet } from "./code-snippet";

interface ChatMessageProps {
  message: ChatViewMessage;
  /** False when the previous message came from the same speaker — hides the repeated label. */
  showLabel: boolean;
}

export const ChatMessage = memo(
  function ChatMessage({ message, showLabel }: ChatMessageProps) {
    const isAssistant = message.role === "assistant";

    return (
      <div
        className={cn(
          "group flex w-full flex-col duration-200 animate-in fade-in-0 slide-in-from-bottom-1",
          isAssistant ? "items-start" : "items-end",
        )}
      >
        {showLabel && (
          <div className="mb-1.5 flex items-center gap-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {isAssistant ? "Interviewer" : "You"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
              {message.timestamp}
            </span>
          </div>
        )}

        <div
          className={cn(
            "flex w-full flex-col gap-2",
            isAssistant ? "items-start" : "items-end",
          )}
        >
          {(message.content || message.isTyping) && (
            <div
              className={cn(
                "max-w-full",
                isAssistant
                  ? "text-[14px] leading-relaxed text-foreground/95 md:max-w-[92%] sm:text-[15px] sm:leading-7"
                  : "max-w-[85%] rounded-xl border border-border/60 bg-muted/40 px-4 py-2.5 text-sm leading-relaxed text-foreground md:max-w-[75%]",
              )}
            >
              {message.content ? (
                <p className="whitespace-pre-wrap">
                  {message.content}
                  {message.isTyping && (
                    <span className="ml-1 inline-block h-3.5 w-1.5 rounded-xs bg-primary align-middle animate-pulse motion-reduce:animate-none" />
                  )}
                </p>
              ) : (
                <div className="flex items-center gap-1.5 py-1.5">
                  <span className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce motion-reduce:animate-none" />
                  <span
                    className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="size-1.5 rounded-full bg-muted-foreground/60 animate-bounce motion-reduce:animate-none"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              )}
            </div>
          )}

          {message.codeSnippet ? (
            <CodeSnippet
              code={message.codeSnippet}
              language={message.language || "text"}
              className="w-full"
            />
          ) : null}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.showLabel === nextProps.showLabel &&
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isTyping === nextProps.message.isTyping &&
    prevProps.message.codeSnippet === nextProps.message.codeSnippet &&
    prevProps.message.language === nextProps.message.language &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.message.role === nextProps.message.role,
);
