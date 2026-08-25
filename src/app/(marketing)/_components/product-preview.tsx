import {
  ChevronLeft,
  Clock,
  Mic,
  PhoneOff,
  Video,
  Volume2,
} from "lucide-react";

const transcript = [
  {
    speaker: "Interviewer",
    time: "12:01",
    body: "Tell me about a time you optimized a slow system under pressure. What trade-offs did you make?",
  },
  {
    speaker: "You",
    time: "12:03",
    body: "The dashboard API was at 4.2s. Traces showed an N+1 query. I added Redis with a 30s TTL and got it to 120ms.",
  },
  {
    speaker: "Interviewer",
    time: "12:04",
    body: "How did you handle cache invalidation when the underlying records changed?",
  },
] as const;

export function ProductPreview() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative mx-auto w-full max-w-5xl select-none"
    >
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground">
              <ChevronLeft className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-medium text-foreground">
                  Senior Software Engineer
                </p>
                <span className="relative flex size-1.5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-red-500" />
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Behavioral · STAR
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
            <Clock className="size-3" />
            12:04
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-border bg-muted/30 px-4 py-1.5 text-[11px] text-muted-foreground">
          <span className="text-foreground">Deep dive</span>
          <span>Question 3 of 4</span>
          <span className="hidden sm:inline">Latency · caching</span>
        </div>

        <div className="grid min-h-88 grid-cols-1 md:grid-cols-[1fr_17rem]">
          <div className="relative flex flex-col px-5 py-6 sm:px-8 sm:py-8">
            <p className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground">
              Interviewer
            </p>
            <h3 className="max-w-xl text-xl font-medium leading-snug tracking-tight text-foreground sm:text-[26px] sm:leading-tight">
              How did you handle cache invalidation when the underlying records
              changed?
            </h3>
            <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
              Follow-up on your Redis TTL. The interviewer wants the invalidation
              path, not another latency number.
            </p>

            <div className="mt-auto hidden pt-10 sm:block">
              <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-foreground/70" />
                Listening
              </div>
            </div>

            <div className="absolute right-4 bottom-4 hidden h-24 w-36 overflow-hidden rounded-lg border border-border bg-zinc-900 sm:block">
              <div className="flex h-full items-center justify-center">
                <span className="size-9 rounded-full bg-zinc-800" />
              </div>
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-zinc-200">
                You
              </span>
            </div>
          </div>

          <aside className="hidden border-l border-border md:flex md:flex-col">
            <div className="border-b border-border px-4 py-2.5 text-[11px] font-medium text-muted-foreground">
              Transcript
            </div>
            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
              {transcript.map((entry) => (
                <div key={entry.time} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-medium text-foreground">
                      {entry.speaker}
                    </span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {entry.time}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    {entry.body}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Volume2 className="size-3.5" />
            <span className="h-0.5 w-12 rounded-full bg-border" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground">
              <Mic className="size-3.5" />
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground">
              <Video className="size-3.5" />
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-red-600 text-white">
              <PhoneOff className="size-3.5" />
            </span>
          </div>
          <span className="w-16" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-background mask-[linear-gradient(to_top,black,transparent)]" />
    </div>
  );
}
