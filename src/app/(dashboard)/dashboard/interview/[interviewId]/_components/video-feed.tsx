"use client";

import { Camera, CameraOff, Mic, MicOff, User } from "lucide-react";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VideoFeedProps {
  userName: string;
  isVideoOn?: boolean;
  isMicOn?: boolean;
  compact?: boolean;
}

export const VideoFeed = memo(function VideoFeed({
  userName,
  isVideoOn: initialVideoOn = true,
  isMicOn: initialMicOn = true,
  compact = false,
}: VideoFeedProps) {
  const [isVideoOn, setIsVideoOn] = useState(initialVideoOn);
  const [isMicOn, setIsMicOn] = useState(initialMicOn);

  return (
    <div
      className={cn(
        "relative group rounded-2xl overflow-hidden",
        compact ? "h-full" : "",
      )}
    >
      {/* Video Container */}
      <div
        className={cn(
          "relative w-full h-full bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden",
          compact ? "aspect-auto" : "aspect-video",
        )}
      >
        {isVideoOn ? (
          <>
            {/* Simulated video feed */}
            <div className="absolute inset-0 bg-linear-to-br from-slate-800 via-slate-900 to-slate-950">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(100,100,120,0.15),transparent_60%)]" />
            </div>

            {/* User silhouette */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-slate-700/50 flex items-center justify-center backdrop-blur-sm">
                <User className="h-10 w-10 text-slate-400" />
              </div>
            </div>

            {/* Live indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-white font-medium uppercase tracking-wide">
                Live
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
              <CameraOff className="h-8 w-8 text-slate-500" />
            </div>
            <p className="text-xs text-slate-500">Camera off</p>
          </div>
        )}

        {/* User name */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
          <span className="text-xs font-medium text-white">{userName}</span>
        </div>

        {/* Mic status */}
        <div
          className={cn(
            "absolute bottom-3 right-3 h-7 w-7 rounded-full flex items-center justify-center",
            isMicOn ? "bg-slate-800/80" : "bg-red-500/90",
          )}
        >
          {isMicOn ? (
            <Mic className="h-3.5 w-3.5 text-white" />
          ) : (
            <MicOff className="h-3.5 w-3.5 text-white" />
          )}
        </div>

        {/* Hover controls */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
                  onClick={() => setIsMicOn(!isMicOn)}
                >
                  {isMicOn ? (
                    <Mic className="h-5 w-5 text-white" />
                  ) : (
                    <MicOff className="h-5 w-5 text-white" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMicOn ? "Mute" : "Unmute"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0"
                  onClick={() => setIsVideoOn(!isVideoOn)}
                >
                  {isVideoOn ? (
                    <Camera className="h-5 w-5 text-white" />
                  ) : (
                    <CameraOff className="h-5 w-5 text-white" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isVideoOn ? "Turn off camera" : "Turn on camera"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
});
