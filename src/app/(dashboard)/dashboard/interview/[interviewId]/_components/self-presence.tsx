"use client";

import { Mic, MicOff, User } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * An honest stand-in for the participant. This app never requests camera
 * access, so there is no video to show — the tile confirms who is in the room
 * and whether their microphone is actually open.
 */
export const SelfPresence = memo(function SelfPresence({
  isMicOn,
}: {
  isMicOn: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-colors duration-200",
        isMicOn
          ? "border-primary/30 bg-primary/5 text-foreground"
          : "border-border/60 bg-muted/40 text-muted-foreground",
      )}
    >
      <span className="flex size-5 items-center justify-center rounded-full bg-background/80 text-muted-foreground shadow-2xs">
        <User className="size-3" />
      </span>
      <span className="font-mono text-[11px] font-medium">You</span>
      {isMicOn ? (
        <span className="flex items-center gap-0.5 text-primary">
          <Mic className="size-3" aria-hidden="true" />
          <span className="inline-flex size-1 animate-pulse rounded-full bg-primary" />
        </span>
      ) : (
        <MicOff
          className="size-3 text-muted-foreground/70"
          aria-hidden="true"
        />
      )}
      <span className="sr-only">
        {isMicOn ? "microphone open" : "microphone muted"}
      </span>
    </div>
  );
});
