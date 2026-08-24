"use client";

import {
  Camera,
  CameraOff,
  Hand,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  Settings,
  Volume2,
} from "lucide-react";
import { memo, useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ControlBarProps {
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  isMicOn?: boolean;
  onToggleMic?: () => void;
  onEndInterview?: () => void;
  isEnding?: boolean;
}

export const ControlBar = memo(function ControlBar({
  onToggleChat,
  isChatOpen,
  isMicOn = false,
  onToggleMic,
  onEndInterview,
  isEnding = false,
}: ControlBarProps) {
  const [isPaused, setIsPaused] = useState(false); // Local pause state for now
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [volume, setVolume] = useState([80]);

  return (
    <div className="flex items-center justify-between gap-2 p-4 bg-background/80 backdrop-blur-md border-t px-8">
      {/* Left placeholders or volume */}
      <div className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-2 w-fit">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={volume}
          onValueChange={setVolume}
          max={100}
          step={1}
          className="w-20"
        />
      </div>

      {/* Center Controls */}
      <TooltipProvider delayDuration={0}>
        <div className="flex items-center gap-2 bg-muted/50 rounded-full p-1.5 border border-muted-foreground/10">
          {/* Raise Hand */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full",
                  isHandRaised &&
                    "bg-yellow-500/20 text-yellow-600 hover:bg-yellow-500/30",
                )}
                onClick={() => setIsHandRaised(!isHandRaised)}
              >
                <Hand className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isHandRaised ? "Lower hand" : "Raise hand"}
            </TooltipContent>
          </Tooltip>

          {/* Mic */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full",
                  isMicOn && "bg-primary/10 text-primary hover:bg-primary/20",
                  !isMicOn && "text-muted-foreground",
                )}
                onClick={onToggleMic}
              >
                {isMicOn ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isMicOn ? "Mute" : "Unmute"}</TooltipContent>
          </Tooltip>

          {/* Camera */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full",
                  isVideoOn && "bg-primary/10 text-primary hover:bg-primary/20",
                )}
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? (
                  <Camera className="h-5 w-5" />
                ) : (
                  <CameraOff className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isVideoOn ? "Turn off camera" : "Turn on camera"}
            </TooltipContent>
          </Tooltip>

          {/* Pause - Visual only for now */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <Play className="h-5 w-5" />
                ) : (
                  <Pause className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isPaused ? "Resume" : "Pause"}</TooltipContent>
          </Tooltip>

          {/* End Interview */}
          <div className="mx-1 h-8 w-px bg-border" />

          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>End Interview</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Interview?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to end this interview? Your progress
                  will be saved and a report will be generated.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isEnding}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onEndInterview}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isEnding}
                >
                  {isEnding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Ending...
                    </>
                  ) : (
                    "End Interview"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TooltipProvider>

      {/* Right side controls */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full",
                  isChatOpen && "bg-primary/10 text-primary",
                )}
                onClick={onToggleChat}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
});
