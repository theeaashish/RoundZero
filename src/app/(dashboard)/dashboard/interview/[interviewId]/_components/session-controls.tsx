"use client";

import { Loader2, Mic, MicOff, PhoneOff } from "lucide-react";
import { memo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SelfPresence } from "./self-presence";

interface SessionControlsProps {
  isMicOn: boolean;
  onToggleMic: () => void;
  onEndInterview: () => void;
  isEnding: boolean;
  /** Nudge shown when the interviewer has finished and the mic is still muted. */
  showMicReminder: boolean;
}

export const SessionControls = memo(function SessionControls({
  isMicOn,
  onToggleMic,
  onEndInterview,
  isEnding,
  showMicReminder,
}: SessionControlsProps) {
  const micLabel = isMicOn ? "Mute microphone" : "Unmute microphone";

  return (
    <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-border/60 bg-card/60 px-4 py-3.5 backdrop-blur-sm md:px-6">
      <div className="hidden justify-self-start sm:block">
        <SelfPresence isMicOn={isMicOn} />
      </div>

      <div className="flex items-center gap-4 justify-self-center">
        <div className="relative">
          {showMicReminder && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/80 bg-background/95 px-3 py-1 font-mono text-[11px] font-medium text-foreground shadow-xs animate-in fade-in slide-in-from-bottom-1"
            >
              Click or press{" "}
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
                Space
              </kbd>{" "}
              to answer
            </span>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleMic}
                aria-label={micLabel}
                className={cn(
                  "flex size-13 items-center justify-center rounded-full border transition-all duration-150 active:scale-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isMicOn
                    ? "border-primary bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/15 hover:bg-primary/90"
                    : "border-border/80 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {isMicOn ? (
                  <Mic className="size-5" />
                ) : (
                  <MicOff className="size-5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-1.5 text-xs">
              <span>{micLabel}</span>
              <kbd className="rounded border border-border/60 bg-background/80 px-1 py-0.2 font-mono text-[10px] text-muted-foreground">
                Space
              </kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-full border-border/70 px-3.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive active:scale-95"
            >
              <PhoneOff className="size-3.5" />
              End session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End interview?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to end this interview? Your progress will
                be saved and a report will be generated.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isEnding}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onEndInterview}
                disabled={isEnding}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95"
              >
                {isEnding ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Ending...
                  </>
                ) : (
                  "End interview"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});
