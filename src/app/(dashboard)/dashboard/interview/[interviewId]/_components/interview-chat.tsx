"use client";

import { AlertTriangle, Mic, RefreshCw } from "lucide-react";
import { memo, useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { AIAvatar } from "./ai-avatar";
import { ChatMessage, type Message } from "./chat-message";
import { Waveform } from "./waveform";

interface InterviewChatProps {
  messages: Message[];
  isRecording: boolean; // For showing recording state/waveform
  isPlaying: boolean; // For showing AI speaking state
  isResponding: boolean; // For showing streamed response state
  onToggleMic: () => void;
  showMicReminder: boolean;
  draftTranscript?: string;
  interimTranscript?: string;
  connectionState: "disconnected" | "connecting" | "connected" | "failed";
  onReconnect: () => Promise<void>;
  className?: string;
}

export const InterviewChat = memo(function InterviewChat({
  messages,
  isRecording,
  isPlaying,
  isResponding,
  onToggleMic,
  showMicReminder,
  draftTranscript,
  interimTranscript,
  connectionState,
  onReconnect,
  className,
}: InterviewChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
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

  // Fast direct pinning during streaming to prevent smooth scroll layout reflow thrashing
  useLayoutEffect(() => {
    const isNewMessage = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (isNewMessage) {
      isNearBottomRef.current = true;
    }

    if (isNearBottomRef.current && scrollRef.current) {
      void visibleDraftTranscript;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, visibleDraftTranscript]);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background/50 backdrop-blur-sm relative",
        className,
      )}
    >
      {/* Header / Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="scale-75 origin-left -mr-4">
            <AIAvatar
              isSpeaking={isPlaying || isResponding}
              name="Alex"
              size="sm"
              hideLabels
            />
          </div>
          <div>
            <h3 className="text-xs font-semibold leading-tight">
              AI Interviewer
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "w-1 h-1 rounded-full",
                  isPlaying
                    ? "bg-green-500 animate-pulse"
                    : isResponding
                      ? "bg-amber-500 animate-pulse"
                      : connectionState === "failed"
                        ? "bg-red-500"
                        : connectionState === "connecting"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-muted-foreground",
                )}
              />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {isPlaying
                  ? "Speaking..."
                  : isResponding
                    ? "Responding..."
                    : connectionState === "failed"
                      ? "Mic offline"
                      : connectionState === "connecting"
                        ? "Connecting..."
                        : "Listening..."}
              </span>
            </div>
          </div>
        </div>

        {/* Waveform Visualization (Active when AI speaks or User speaks) */}
        <div className="hidden md:block w-24 h-6 opacity-40">
          <Waveform
            isActive={isPlaying || isResponding || isRecording}
            className="h-full w-full"
            barCount={8}
          />
        </div>
      </div>

      {connectionState !== "connected" && (
        <div className="border-b bg-amber-500/5 px-4 py-2">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {connectionState === "connecting"
                  ? "Connecting live transcription..."
                  : "Live transcription is unavailable. You can retry the microphone connection."}
              </span>
            </div>

            {connectionState !== "connecting" && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => void onReconnect()}
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-32 pt-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* Draft transcript bubble */}
          {visibleDraftTranscript && (
            <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 bg-primary/10 border border-primary/20">
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    isLiveTranscriptVisible
                      ? "text-muted-foreground italic"
                      : "text-foreground",
                  )}
                >
                  {visibleDraftTranscript}
                  {isLiveTranscriptVisible && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-primary/50 animate-pulse rounded-sm align-middle" />
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Invisible div for scrolling */}
          <div ref={bottomRef} className="h-px w-full" />
        </div>
      </div>

      {/* Mic Reminder Overlay - Fixed at bottom center of the container */}
      {showMicReminder && !isRecording && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 w-full flex justify-center pointer-events-none">
          <button
            type="button"
            className="pointer-events-auto flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 group border border-white/10"
            onClick={onToggleMic}
          >
            <Mic className="h-4 w-4 animate-bounce" />
            <span className="text-sm font-medium">Click to answer</span>
          </button>
        </div>
      )}
    </div>
  );
});
