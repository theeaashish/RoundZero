"use client";

import { useEffect, useState } from "react";

/** Formats a duration in seconds as `mm:ss`. Minutes are not capped at 60. */
export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Elapsed interview time in seconds. Seeded from the persisted `durationSec` so
 * a resumed session picks up where it left off, then ticks once a second only
 * while the interview is actually running.
 */
export function useSessionTimer(
  source: { durationSec: number } | null | undefined,
  isRunning: boolean,
) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!source) {
      return;
    }

    setElapsedSeconds(source.durationSec);
  }, [source]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return elapsedSeconds;
}
