"use client";

import { Code2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useInterview } from "../_context/interview-context";
import { useChatViewMessages } from "../_hooks/use-chat-view-messages";
import { formatDuration, useSessionTimer } from "../_hooks/use-session-timer";
import { CodeEditor } from "./code-editor";
import { InterviewChat } from "./interview-chat";
import { SessionControls } from "./session-controls";
import { ConnectionNotice, SessionTopBar } from "./session-top-bar";

type Pane = "chat" | "code";

export function InterviewSession() {
  const {
    interview,
    status,
    messages,
    isRecording,
    isPlaying,
    isResponding,
    isHydrated,
    toggleMic,
    sendMessage,
    startInterview,
    endInterview,
    isLoading,
    isEnding,
    transcript,
    interimTranscript,
    connectionState,
    connectSTT,
  } = useInterview();

  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [showMicReminder, setShowMicReminder] = useState(false);
  const [pane, setPane] = useState<Pane>("chat");

  const elapsedTime = useSessionTimer(interview, status === "IN_PROGRESS");
  const chatMessages = useChatViewMessages(messages);

  // Auto-start interview if in SETUP
  useEffect(() => {
    if (isHydrated && status === "SETUP" && !isLoading && interview) {
      startInterview();
    }
  }, [isHydrated, status, startInterview, isLoading, interview]);

  // Show mic reminder after AI finishes speaking and user hasn't started recording
  useEffect(() => {
    if (
      status === "IN_PROGRESS" &&
      connectionState === "connected" &&
      !isPlaying &&
      !isResponding &&
      !isRecording &&
      !transcript.trim() &&
      !interimTranscript.trim() &&
      messages.length > 0
    ) {
      const timer = setTimeout(() => {
        setShowMicReminder(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowMicReminder(false);
    }
  }, [
    status,
    connectionState,
    isPlaying,
    isResponding,
    isRecording,
    transcript,
    interimTranscript,
    messages.length,
  ]);

  // Hide mic reminder when user starts recording
  useEffect(() => {
    if (isRecording) {
      setShowMicReminder(false);
    }
  }, [isRecording]);

  // Spacebar hotkey to toggle mic hands-free (when not typing in an editor/input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      const isEditable =
        tagName === "input" ||
        tagName === "textarea" ||
        target.isContentEditable ||
        Boolean(target.closest(".monaco-editor"));

      if (isEditable) return;

      e.preventDefault();
      void toggleMic();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMic]);

  const handleCodeSubmit = useCallback(
    async (code: string, language: string) => {
      const success = await sendMessage(
        "Shared a code submission for review.",
        {
          codeSnippet: code,
          language,
        },
      );
      if (!success) {
        throw new Error("Failed to submit code. Please try again.");
      }
    },
    [sendMessage],
  );

  const handleEndInterview = useCallback(() => {
    endInterview(elapsedTime);
  }, [endInterview, elapsedTime]);

  const handleToggleExpand = useCallback(() => {
    setIsEditorExpanded((prev) => !prev);
  }, []);

  const handleReconnect = useCallback(() => {
    void connectSTT();
  }, [connectSTT]);

  const techStackArray = useMemo(
    () =>
      interview?.techStack
        ? interview.techStack
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
        : [],
    [interview?.techStack],
  );

  if (isLoading || !isHydrated) {
    return <SessionSkeleton />;
  }

  if (!interview) {
    return <InterviewNotFound />;
  }

  const isTechnical = interview.type === "TECHNICAL";
  const questionsAnswered = messages.filter(
    (message) => message.role === "user",
  ).length;
  const targetQuestionCount = isTechnical ? 5 : 4;
  const currentPhase =
    questionsAnswered === 0
      ? "Opening"
      : questionsAnswered < 2
        ? "Discovery"
        : questionsAnswered < targetQuestionCount
          ? "Deep Dive"
          : "Wrap Up";

  const transcriptPanel = (
    <InterviewChat
      messages={chatMessages}
      draftTranscript={transcript}
      interimTranscript={interimTranscript}
    />
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <SessionTopBar
          jobTitle={interview.jobTitle}
          interviewType={interview.type}
          techStack={techStackArray}
          phase={currentPhase}
          questionsAnswered={questionsAnswered}
          totalQuestions={targetQuestionCount}
          elapsed={formatDuration(elapsedTime)}
          connectionState={connectionState}
          isPlaying={isPlaying}
          isResponding={isResponding}
          isRecording={isRecording}
        />

        <ConnectionNotice
          connectionState={connectionState}
          onReconnect={handleReconnect}
        />

        {isTechnical ? (
          <>
            {/* Below lg there isn't room for both panels side by side, so they
                share the viewport. Both stay mounted — switching panes must not
                discard the editor's contents. */}
            <div className="flex shrink-0 items-center gap-1 border-b border-border/60 bg-card/40 px-4 py-2 lg:hidden">
              <PaneTab
                icon={MessageSquare}
                label="Conversation"
                isActive={pane === "chat"}
                onClick={() => setPane("chat")}
              />
              <PaneTab
                icon={Code2}
                label="Code"
                isActive={pane === "code"}
                onClick={() => setPane("code")}
              />
            </div>

            <div className="flex min-h-0 flex-1 lg:flex-row">
              <div
                className={cn(
                  "min-h-0 min-w-0 flex-1 flex-col transition-[width] duration-300 lg:flex lg:flex-none lg:border-r lg:border-border/60",
                  isEditorExpanded ? "lg:w-[40%]" : "lg:w-1/2",
                  pane === "chat" ? "flex" : "hidden",
                )}
              >
                {transcriptPanel}
              </div>

              <div
                className={cn(
                  "min-h-0 min-w-0 flex-1 flex-col transition-[width] duration-300 lg:flex lg:flex-none",
                  isEditorExpanded ? "lg:w-[60%]" : "lg:w-1/2",
                  pane === "code" ? "flex" : "hidden",
                )}
              >
                <CodeEditor
                  className="h-full rounded-none border-0"
                  isExpanded={isEditorExpanded}
                  onToggleExpand={handleToggleExpand}
                  onSubmit={handleCodeSubmit}
                  disabled={
                    status !== "IN_PROGRESS" || isResponding || isEnding
                  }
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">{transcriptPanel}</div>
        )}

        <SessionControls
          isMicOn={isRecording}
          onToggleMic={toggleMic}
          onEndInterview={handleEndInterview}
          isEnding={isEnding}
          showMicReminder={showMicReminder && !isRecording}
        />
      </div>
    </TooltipProvider>
  );
}

function PaneTab({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: typeof MessageSquare;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

const SKELETON_TURNS = ["a", "b", "c"];

function SessionSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/60 px-4 md:px-6">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-44" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-4 w-11" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="min-h-0 flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {SKELETON_TURNS.map((key) => (
            <div key={key} className="space-y-5">
              <div className="space-y-2">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-2.5 w-8" />
                <Skeleton className="h-10 w-1/2 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-4 border-t border-border/60 px-4 py-4 md:px-6">
        <Skeleton className="size-14 rounded-full" />
        <Skeleton className="h-11 w-36 rounded-md" />
      </div>
    </div>
  );
}

function InterviewNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold tracking-tight">
          Interview not found
        </h1>
        <p className="text-sm text-muted-foreground">
          This session doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/dashboard/interview">Back to history</Link>
      </Button>
    </div>
  );
}
