"use client";

import { AlertTriangle, ChevronLeft, Clock, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ConnectionState } from "../_hooks/use-interview-media";

const TYPE_LABEL: Record<string, string> = {
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  SYSTEM_DESIGN: "System design",
};

type ActivityTone = "recording" | "live" | "thinking" | "warn" | "error";

interface Activity {
  /** Compact label — reads unambiguously in context, fits a phone. */
  label: string;
  /** Full sentence for the live region. */
  announcement: string;
  tone: ActivityTone;
}

/**
 * The single source of truth for "what is happening right now". Previously this
 * was rendered in four places at once (header wifi icon, stats badge, chat
 * header dot, banner) which could disagree with each other.
 */
function deriveActivity({
  connectionState,
  isPlaying,
  isResponding,
  isRecording,
}: {
  connectionState: ConnectionState;
  isPlaying: boolean;
  isResponding: boolean;
  isRecording: boolean;
}): Activity {
  if (connectionState === "failed") {
    return {
      label: "Mic offline",
      announcement: "Microphone is offline",
      tone: "error",
    };
  }

  if (connectionState === "connecting") {
    return {
      label: "Connecting",
      announcement: "Connecting the microphone",
      tone: "warn",
    };
  }

  if (connectionState === "disconnected") {
    return {
      label: "Mic off",
      announcement: "Microphone is not connected",
      tone: "warn",
    };
  }

  if (isPlaying) {
    return {
      label: "Speaking",
      announcement: "The interviewer is speaking",
      tone: "live",
    };
  }

  if (isResponding) {
    return {
      label: "Thinking",
      announcement: "The interviewer is thinking",
      tone: "thinking",
    };
  }

  if (isRecording) {
    return {
      label: "Listening",
      announcement: "Listening — your microphone is live",
      tone: "recording",
    };
  }

  return {
    label: "Muted",
    announcement: "Your microphone is muted",
    tone: "thinking",
  };
}

/** Stable keys for the progress segments — they have no identity beyond position. */
const SEGMENT_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];

const ACTIVITY_STYLES: Record<
  ActivityTone,
  { badge: string; dot: string; ping?: boolean }
> = {
  recording: {
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    dot: "bg-red-500",
    ping: true,
  },
  live: {
    badge:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  thinking: {
    badge: "bg-muted/70 text-muted-foreground border-border/60",
    dot: "bg-muted-foreground/60",
  },
  warn: {
    badge:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  error: {
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
};

interface SessionTopBarProps {
  jobTitle: string;
  interviewType: string;
  techStack: string[];
  phase: string;
  questionsAnswered: number;
  totalQuestions: number;
  elapsed: string;
  connectionState: ConnectionState;
  isPlaying: boolean;
  isResponding: boolean;
  isRecording: boolean;
}

export const SessionTopBar = memo(function SessionTopBar({
  jobTitle,
  interviewType,
  techStack,
  phase,
  questionsAnswered,
  totalQuestions,
  elapsed,
  connectionState,
  isPlaying,
  isResponding,
  isRecording,
}: SessionTopBarProps) {
  const router = useRouter();

  const activity = deriveActivity({
    connectionState,
    isPlaying,
    isResponding,
    isRecording,
  });

  const subtitle = [TYPE_LABEL[interviewType] ?? interviewType, ...techStack]
    .filter(Boolean)
    .join(" · ");

  const activityStyle = ACTIVITY_STYLES[activity.tone];

  return (
    <header className="flex h-13 shrink-0 items-center gap-3 border-b border-border/60 bg-card/60 px-4 backdrop-blur-sm md:gap-4 md:px-6">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="-ml-1 size-8 shrink-0 transition-transform active:scale-95"
            onClick={() => router.back()}
            aria-label="Exit interview"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Exit interview</TooltipContent>
      </Tooltip>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xs font-semibold leading-tight tracking-tight sm:text-sm">
          {jobTitle}
        </h1>
        <p className="truncate font-mono text-[11px] leading-tight text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="hidden items-center gap-2.5 sm:flex">
        <div
          className="flex items-center gap-1"
          role="progressbar"
          aria-label="Interview progress"
          aria-valuemin={0}
          aria-valuemax={totalQuestions}
          aria-valuenow={questionsAnswered}
          aria-valuetext={`${questionsAnswered} of ${totalQuestions} answers given`}
        >
          {SEGMENT_KEYS.slice(0, totalQuestions).map((key, index) => (
            <span
              key={key}
              className={cn(
                "h-1.5 w-4 rounded-xs transition-colors duration-200",
                index < questionsAnswered
                  ? "bg-foreground/80"
                  : index === questionsAnswered
                    ? "bg-primary/50"
                    : "bg-muted border border-border/40",
              )}
            />
          ))}
        </div>
        <span className="font-mono text-xs font-medium tabular-nums text-muted-foreground">
          {String(questionsAnswered).padStart(2, "0")}/
          {String(totalQuestions).padStart(2, "0")}
        </span>
        <span className="hidden rounded border border-border/50 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:inline">
          {phase}
        </span>
      </div>

      <div className="hidden h-5 w-px bg-border/60 sm:block" />

      <div className="flex shrink-0 items-center gap-1.5">
        <Clock className="size-3.5 text-muted-foreground" />
        <span className="font-mono text-xs font-medium tabular-nums text-foreground/90">
          {elapsed}
        </span>
      </div>

      <span className="sr-only" aria-live="polite">
        {activity.announcement}
      </span>

      <div
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          activityStyle.badge,
        )}
      >
        <span className="relative flex size-1.5">
          {activityStyle.ping && (
            <span className="absolute inline-flex size-1.5 animate-ping rounded-full bg-red-500 opacity-75 motion-reduce:animate-none" />
          )}
          <span
            className={cn(
              "relative inline-flex size-1.5 rounded-full",
              activityStyle.dot,
            )}
          />
        </span>
        <span className="text-[11px] font-medium tracking-tight">
          {activity.label}
        </span>
      </div>
    </header>
  );
});

/**
 * Sub-row of the top bar, shown only while live transcription is degraded. This
 * is the one place the connection problem is explained and the one place it can
 * be retried.
 */
export const ConnectionNotice = memo(function ConnectionNotice({
  connectionState,
  onReconnect,
}: {
  connectionState: ConnectionState;
  onReconnect: () => void;
}) {
  if (connectionState === "connected") {
    return null;
  }

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2 md:px-6">
      <AlertTriangle
        className="size-3.5 shrink-0 text-amber-500"
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {connectionState === "connecting"
          ? "Connecting live transcription..."
          : "Live transcription is unavailable."}
      </p>
      {connectionState !== "connecting" && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 shrink-0 gap-1.5 text-xs"
          onClick={onReconnect}
        >
          <RefreshCw className="size-3" />
          Retry
        </Button>
      )}
    </div>
  );
});
