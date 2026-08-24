"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  isActive: boolean;
  className?: string;
  barCount?: number;
}

const DEFAULT_BAR_SLOTS = Array.from({ length: 64 }, (_, index) => ({
  id: `waveform-bar-${index}`,
  index,
}));

export const Waveform = memo(function Waveform({
  isActive,
  className,
  barCount = 32,
}: WaveformProps) {
  const bars = DEFAULT_BAR_SLOTS.slice(0, barCount);

  return (
    <div
      className={cn("flex items-center justify-center gap-[2px]", className)}
    >
      {bars.map((bar) => {
        const baseHeight = Math.sin((bar.index / barCount) * Math.PI) * 100;
        const height = isActive ? 20 + baseHeight * 0.6 : 4;

        return (
          <div
            key={bar.id}
            className={cn(
              "w-1 rounded-full transition-all",
              isActive ? "bg-primary" : "bg-primary/30",
            )}
            style={{
              height: `${height}%`,
              maxHeight: "80px",
              minHeight: "4px",
              transitionDuration: isActive ? "150ms" : "300ms",
              transitionDelay: isActive ? `${bar.index * 20}ms` : "0ms",
              opacity: isActive
                ? 0.4 + Math.sin((bar.index / barCount) * Math.PI) * 0.6
                : 0.3,
            }}
          />
        );
      })}
    </div>
  );
});
