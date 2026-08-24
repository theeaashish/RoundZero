"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useInterview } from "../_context/interview-context";
import type { Message } from "./chat-message";
import { CodeEditor } from "./code-editor";
import { ControlBar } from "./control-bar";
import { InterviewChat } from "./interview-chat";
import { InterviewHeader } from "./interview-header";
import { InterviewStats } from "./interview-stats";
import { VideoFeed } from "./video-feed";

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

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showMicReminder, setShowMicReminder] = useState(false);
  const messageCacheRef = useRef<Map<string, Message>>(new Map());

  // Auto-start interview if in SETUP
  useEffect(() => {
    if (isHydrated && status === "SETUP" && !isLoading && interview) {
      startInterview();
    }
  }, [isHydrated, status, startInterview, isLoading, interview]);

  useEffect(() => {
    if (!interview) {
      return;
    }

    setElapsedTime(interview.durationSec);
  }, [interview]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "IN_PROGRESS") {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

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

  // Preserve referential identity for unchanging past messages so React skips reconciliation
  const chatMessages = useMemo(() => {
    const cache = messageCacheRef.current;
    const nextMap = new Map<string, Message>();

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
        nextMap.set(message.id, cached);
        return cached;
      }

      const nextObj: Message = {
        id: message.id,
        role: message.role,
        content: message.content,
        codeSnippet: message.codeSnippet,
        language: message.language,
        timestamp: formattedTimestamp,
        isTyping,
      };
      nextMap.set(message.id, nextObj);
      return nextObj;
    });
  }, [messages]);

  useEffect(() => {
    messageCacheRef.current = new Map(chatMessages.map((m) => [m.id, m]));
  }, [chatMessages]);

  const handleCodeSubmit = useCallback(
    async (code: string, language: string) => {
      await sendMessage("Shared a code submission for review.", {
        codeSnippet: code,
        language,
      });
    },
    [sendMessage],
  );

  const handleEndInterview = useCallback(() => {
    endInterview(elapsedTime);
  }, [endInterview, elapsedTime]);

  const handleToggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsEditorExpanded((prev) => !prev);
  }, []);

  const techStackArray = useMemo(
    () => (interview?.techStack ? interview.techStack.split(",") : []),
    [interview?.techStack],
  );

  if (isLoading || !interview || !isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading Interview...
      </div>
    );
  }

  const isTechnical = interview.type === "TECHNICAL";
  const questionsAnswered = messages.filter(
    (message) => message.role === "user",
  ).length;
  const targetQuestionCount =
    interview.type === "TECHNICAL"
      ? 5
      : interview.type === "SYSTEM_DESIGN"
        ? 4
        : 4;
  const currentPhase =
    questionsAnswered === 0
      ? "Opening"
      : questionsAnswered < 2
        ? "Discovery"
        : questionsAnswered < targetQuestionCount
          ? "Deep Dive"
          : "Wrap Up";

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* Header */}
      <InterviewHeader
        jobTitle={interview.jobTitle}
        interviewType={interview.type}
        duration={formatTime(elapsedTime)}
        status={status === "IN_PROGRESS" ? "live" : "connecting"}
      />

      {/* Stats bar */}
      <div className="flex justify-center py-1.5 border-b bg-muted/30">
        <InterviewStats
          questionsAnswered={questionsAnswered}
          totalQuestions={targetQuestionCount}
          currentTopic={interview.techStack || "General"}
          techStack={techStackArray}
          currentPhase={currentPhase}
          connectionState={connectionState}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {isTechnical ? (
          <>
            {/* Left side - Chat Interface */}
            <div
              className={cn(
                "flex flex-col h-full overflow-hidden transition-all duration-300 border-r border-border/40 relative",
                isEditorExpanded ? "w-[40%]" : "w-1/2",
              )}
            >
              <InterviewChat
                messages={chatMessages}
                isRecording={isRecording}
                isPlaying={isPlaying}
                isResponding={isResponding}
                onToggleMic={toggleMic}
                showMicReminder={showMicReminder}
                draftTranscript={transcript}
                interimTranscript={interimTranscript}
                connectionState={connectionState}
                onReconnect={() => connectSTT()}
                className="h-full w-full"
              />

              {/* User video floating at bottom left */}
              <div className="absolute bottom-4 left-4 w-32 h-24 rounded-xl overflow-hidden shadow-xl border-2 border-background z-20 bg-black">
                <VideoFeed
                  userName="You"
                  isVideoOn={true}
                  isMicOn={isRecording}
                  compact
                />
              </div>
            </div>

            {/* Right side - Code Editor */}
            <div
              className={cn(
                "flex flex-col h-full overflow-hidden transition-all duration-300 bg-[#1e1e1e]",
                isEditorExpanded ? "w-[60%]" : "w-1/2",
              )}
            >
              <CodeEditor
                className="h-full border-0 rounded-none"
                isExpanded={isEditorExpanded}
                onToggleExpand={handleToggleExpand}
                onSubmit={handleCodeSubmit}
              />
            </div>
          </>
        ) : (
          // Behavioral Layout - Full Chat Interface
          <div className="flex-1 flex flex-col relative h-full">
            <InterviewChat
              messages={chatMessages}
              isRecording={isRecording}
              isPlaying={isPlaying}
              isResponding={isResponding}
              onToggleMic={toggleMic}
              showMicReminder={showMicReminder}
              draftTranscript={transcript}
              interimTranscript={interimTranscript}
              connectionState={connectionState}
              onReconnect={() => connectSTT()}
              className="h-full"
            />

            {/* User video floating at bottom right */}
            <div className="absolute bottom-6 right-6 w-48 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-background bg-black z-20">
              <VideoFeed
                userName="You"
                isVideoOn={true}
                isMicOn={isRecording}
                compact
              />
            </div>
          </div>
        )}
      </div>

      <ControlBar
        onToggleChat={handleToggleChat}
        isChatOpen={isChatOpen}
        isMicOn={isRecording}
        onToggleMic={toggleMic}
        onEndInterview={handleEndInterview}
        isEnding={isEnding}
      />
    </div>
  );
}
