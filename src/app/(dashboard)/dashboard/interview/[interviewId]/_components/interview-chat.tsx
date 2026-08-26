"use client";

import { memo, useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ChatViewMessage } from "../_hooks/use-chat-view-messages";
import { ChatMessage } from "./chat-message";

interface InterviewChatProps {
  messages: ChatViewMessage[];
  draftTranscript?: string;
  interimTranscript?: string;
  className?: string;
}

export const InterviewChat = memo(function InterviewChat({
  messages,
  draftTranscript,
  interimTranscript,
  className,
}: InterviewChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);

  const visibleDraftTranscript =
    interimTranscript?.trim() || draftTranscript?.trim() || "";
  const isLiveTranscriptVisible = Boolean(interimTranscript?.trim());

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Consider near bottom if within 100px
    isNearBottomRef.current = scrollHeight - (scrollTop + clientHeight) < 100;
  }, []);

  // Fast direct pinning during streaming to prevent smooth scroll layout reflow
  // thrashing. `visibleDraftTranscript` is a deliberate extra dependency: the
  // live transcript grows the scroll height without changing `messages`, so
  // without it the view stops following your own speech mid-answer.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-pin as the draft transcript grows
  useLayoutEffect(() => {
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (isNewMessage) {
      isNearBottomRef.current = true;
    }

    if (isNearBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, visibleDraftTranscript]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-4 md:px-6 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]",
        className,
      )}
    >
      <section
        aria-label="Interview transcript"
        aria-live="polite"
        className="mx-auto flex max-w-3xl flex-col gap-5 py-6"
      >
        {messages.length === 0 && !visibleDraftTranscript && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground duration-300 animate-in fade-in">
            <span className="mb-3 flex size-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <span className="size-2 rounded-full bg-primary opacity-75 animate-ping" />
            </span>
            <p className="font-mono text-xs text-muted-foreground/80">
              Connecting session... The interviewer will introduce the problem.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            showLabel={message.role !== messages[index - 1]?.role}
          />
        ))}

        {/* Live transcript of what you're saying, before it becomes a turn */}
        {visibleDraftTranscript && (
          <div className="flex flex-col items-end duration-200 animate-in fade-in slide-in-from-bottom-1">
            <span className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              You (Speaking)
            </span>
            <div className="max-w-[85%] rounded-xl border border-primary/40 bg-primary/5 px-4 py-2.5 md:max-w-[75%]">
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  isLiveTranscriptVisible
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {visibleDraftTranscript}
                {isLiveTranscriptVisible && (
                  <span className="ml-1 inline-block h-3.5 w-1.5 rounded-xs bg-primary align-middle animate-pulse motion-reduce:animate-none" />
                )}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
});
