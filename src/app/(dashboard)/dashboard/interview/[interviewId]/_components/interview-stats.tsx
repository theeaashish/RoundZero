"use client";

import { CheckCircle2, Circle, HelpCircle } from "lucide-react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InterviewStatsProps {
  questionsAnswered: number;
  totalQuestions?: number;
  currentTopic: string;
  techStack: string[];
  currentPhase: string;
  connectionState: "disconnected" | "connecting" | "connected" | "failed";
  className?: string;
}

export const InterviewStats = memo(function InterviewStats({
  questionsAnswered,
  totalQuestions,
  currentTopic,
  techStack,
  currentPhase,
  connectionState,
  className,
}: InterviewStatsProps) {
  const questionSlots = Array.from(
    { length: totalQuestions ?? 0 },
    (_, index) => `question-slot-${index + 1}`,
  );

  return (
    <div className={cn("flex items-center gap-6 text-sm", className)}>
      {/* Progress */}
      {totalQuestions ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {questionSlots.map((slotId, index) => (
              <div key={slotId}>
                {index < questionsAnswered ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : index === questionsAnswered ? (
                  <HelpCircle className="h-4 w-4 text-primary animate-pulse" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
          <span className="text-muted-foreground">
            {questionsAnswered}/{totalQuestions}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Questions Answered:</span>
          <Badge variant="secondary" className="font-normal">
            {questionsAnswered}
          </Badge>
        </div>
      )}

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Current topic */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Topic:</span>
        <Badge variant="secondary" className="font-normal">
          {currentTopic}
        </Badge>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Phase:</span>
        <Badge variant="secondary" className="font-normal">
          {currentPhase}
        </Badge>
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-border" />

      {/* Tech stack */}
      <div className="flex items-center gap-2">
        {techStack.slice(0, 3).map((tech) => (
          <Badge key={tech} variant="outline" className="text-xs font-normal">
            {tech}
          </Badge>
        ))}
        {techStack.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{techStack.length - 3}
          </span>
        )}
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Mic:</span>
        <Badge
          variant={connectionState === "connected" ? "secondary" : "outline"}
          className="font-normal"
        >
          {connectionState}
        </Badge>
      </div>
    </div>
  );
});
