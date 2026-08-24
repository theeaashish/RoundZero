"use client";

import { Volume2 } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

interface AIAvatarProps {
  isSpeaking: boolean;
  name: string;
  size?: "sm" | "md" | "lg";
  hideLabels?: boolean;
}

export const AIAvatar = memo(function AIAvatar({
  isSpeaking,
  name,
  size = "lg",
  hideLabels = false,
}: AIAvatarProps) {
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-36 w-36",
  };

  const innerSizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-28 w-28",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ... previous content ... */}
      <div className="relative">
        {/* Animated rings when speaking */}
        {isSpeaking && (
          <>
            <div
              className={cn(
                "absolute inset-0 rounded-full border-2 border-primary/40 animate-ping",
                sizeClasses[size],
              )}
              style={{ animationDuration: "1.5s" }}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-full border border-primary/20 animate-ping",
                sizeClasses[size],
              )}
              style={{ animationDuration: "2s", animationDelay: "0.5s" }}
            />
          </>
        )}

        {/* Glow effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-primary/20 blur-2xl transition-opacity duration-500",
            isSpeaking ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Main avatar circle */}
        <div
          className={cn(
            "relative rounded-full bg-linear-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-xl transition-transform duration-300",
            sizeClasses[size],
            isSpeaking && "scale-105",
          )}
        >
          {/* Inner circle with AI face */}
          <div
            className={cn(
              "rounded-full bg-linear-to-br from-primary-foreground/10 to-transparent flex items-center justify-center",
              innerSizeClasses[size],
            )}
          >
            {/* Stylized AI face */}
            <div className="flex flex-col items-center gap-2">
              {/* Eyes */}
              <div className="flex gap-4">
                <div
                  className={cn(
                    "rounded-full bg-primary-foreground",
                    size === "lg"
                      ? "h-3 w-3"
                      : size === "md"
                        ? "h-2.5 w-2.5"
                        : "h-2 w-2",
                    isSpeaking && "animate-pulse",
                  )}
                />
                <div
                  className={cn(
                    "rounded-full bg-primary-foreground",
                    size === "lg"
                      ? "h-3 w-3"
                      : size === "md"
                        ? "h-2.5 w-2.5"
                        : "h-2 w-2",
                    isSpeaking && "animate-pulse",
                  )}
                />
              </div>
              {/* Mouth - animated when speaking */}
              <div
                className={cn(
                  "rounded-full bg-primary-foreground/80 transition-all duration-200",
                  size === "lg" ? "w-6" : size === "md" ? "w-5" : "w-4",
                  isSpeaking ? "h-3 animate-pulse" : "h-1",
                )}
              />
            </div>
          </div>

          {/* Speaking indicator badge */}
          {isSpeaking && (
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-background">
              <Volume2 className="h-4 w-4 text-white animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {!hideLabels && (
        <div className="text-center">
          <h3 className="font-semibold text-lg">{name}</h3>
          <p
            className={cn(
              "text-sm transition-colors",
              isSpeaking ? "text-primary" : "text-muted-foreground",
            )}
          >
            {isSpeaking ? "Speaking..." : "AI Interviewer"}
          </p>
        </div>
      )}
    </div>
  );
});
