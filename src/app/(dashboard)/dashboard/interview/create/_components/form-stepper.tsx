"use client";

import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description: string;
}

// Hoisted outside component to avoid re-creation on every render (rendering-hoist-jsx)
const STEPS: Step[] = [
  { number: 1, title: "Interview Type", description: "Choose format" },
  { number: 2, title: "Role Details", description: "Position & experience" },
  { number: 3, title: "Company & JD", description: "Custom context" },
  { number: 4, title: "Resume", description: "Upload context" },
];

interface FormStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function FormStepper({ currentStep, onStepClick }: FormStepperProps) {
  return (
    <nav aria-label="Form progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <li
              key={step.number}
              className="flex items-center gap-2 flex-1 last:flex-none"
            >
              <button
                type="button"
                onClick={() => onStepClick(step.number)}
                disabled={step.number > currentStep + 1}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 w-full min-w-0",
                  isCompleted &&
                    "bg-primary/10 hover:bg-primary/15 cursor-pointer",
                  isCurrent && "bg-primary/5 border-2 border-primary shadow-sm",
                  !isCompleted && !isCurrent && "bg-muted/40 opacity-60",
                  step.number <= currentStep + 1 &&
                    "cursor-pointer hover:bg-accent/60",
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.number}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isCompleted || isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 hidden sm:block",
                    isCompleted ? "text-primary" : "text-muted-foreground/40",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
