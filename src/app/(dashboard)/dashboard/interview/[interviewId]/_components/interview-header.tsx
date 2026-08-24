"use client";

import { ChevronLeft, Clock, MoreVertical, Wifi } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InterviewHeaderProps {
  jobTitle: string;
  interviewType: string;
  duration: string;
  status: "live" | "paused" | "ended" | "connecting";
  onExit?: () => void;
}

// Status text mapping
const STATUS_TEXT: Record<InterviewHeaderProps["status"], string> = {
  connecting: "Connecting...",
  live: "Interview in progress",
  paused: "Interview paused",
  ended: "Interview ended",
};

export const InterviewHeader = memo(function InterviewHeader({
  jobTitle,
  interviewType,
  duration,
  status,
  onExit,
}: InterviewHeaderProps) {
  const router = useRouter();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      router.back();
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleExit}
                aria-label="Exit interview"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Exit Interview</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm">{jobTitle}</h1>
              {status === "live" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {STATUS_TEXT[status]}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {interviewType}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Timer */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">{duration}</span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <Wifi
            className={cn(
              "h-4 w-4",
              status === "live" ? "text-green-500" : "text-muted-foreground",
            )}
          />
        </div>

        {/* More options */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
});
