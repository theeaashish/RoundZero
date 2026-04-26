"use client";

import {
  ArrowRight,
  Clock,
  Layers,
  Server,
  Share2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ShareDrawer } from "@/components/share-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SystemDesignCardProps {
  problem: {
    id: string;
    title: string;
    description: string;
    complexity: string;
    functionalReqs: string[];
    nonFunctionalReqs: string[];
    domain: string;
    interviewRole: string;
    estimatedDurationMinutes: number;
    tags: string[];
  };
}

function labelize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function SystemDesignCard({ problem }: SystemDesignCardProps) {
  const totalSpecs =
    problem.functionalReqs.length + problem.nonFunctionalReqs.length;

  const complexityConfig = {
    EASY: {
      label: "Easy",
      dot: "bg-emerald-500",
      badge:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
    },
    MEDIUM: {
      label: "Medium",
      dot: "bg-amber-500",
      badge:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
    },
    HARD: {
      label: "Hard",
      dot: "bg-red-500",
      badge: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
    },
  };

  const currentComplexity =
    complexityConfig[problem.complexity as keyof typeof complexityConfig] ||
    complexityConfig.MEDIUM;

  return (
    <Card className="group flex h-full flex-col overflow-hidden bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "border-transparent font-medium transition-colors",
                currentComplexity.badge,
              )}
            >
              <span
                className={cn(
                  "mr-1.5 h-1.5 w-1.5 rounded-full",
                  currentComplexity.dot,
                )}
              />
              {currentComplexity.label}
            </Badge>
            <Badge variant="outline">{labelize(problem.domain)}</Badge>
            <Badge variant="outline">{labelize(problem.interviewRole)}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <ShareDrawer
              config={{
                title: problem.title,
                slug: problem.id,
                type: "system-design",
              }}
            >
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/50 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Share challenge"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
            </ShareDrawer>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/50 text-muted-foreground">
              <Server className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        <CardTitle className="line-clamp-2 text-xl leading-tight transition-colors group-hover:text-primary">
          {problem.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-5 pb-6">
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">
          {problem.description}
        </CardDescription>

        <div className="flex flex-wrap gap-2">
          {problem.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {problem.tags.length > 3 ? (
            <Badge variant="outline" className="text-xs">
              +{problem.tags.length - 3} more
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>{totalSpecs} Specs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{problem.estimatedDurationMinutes}m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>{labelize(problem.interviewRole)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          asChild
          variant="outline"
          className="w-full border-border/50 transition-all hover:border-primary/50 hover:bg-primary/5"
        >
          <Link href={`/dashboard/practice/design/${problem.id}`}>
            Review Challenge
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
