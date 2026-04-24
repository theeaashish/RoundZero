"use client";

import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PracticeItem {
  id: string | number;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedTime: string;
  href?: string;
}

interface RecommendedPracticeProps {
  items?: PracticeItem[];
  isLoading?: boolean;
}

const difficultyConfig = {
  Easy: "text-emerald-500 bg-emerald-500/10",
  Medium: "text-amber-500 bg-amber-500/10",
  Hard: "text-red-500 bg-red-500/10",
};

function PracticeItemCard({ item }: { item: PracticeItem }) {
  const content = (
    <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-border transition-all cursor-pointer group">
      <div className="space-y-1">
        <p className="font-medium text-sm group-hover:text-primary transition-colors">
          {item.title}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{item.category}</span>
          <Badge
            variant="secondary"
            className={`text-[10px] px-1.5 py-0 h-5 ${difficultyConfig[item.difficulty]} border-0`}
          >
            {item.difficulty}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {item.estimatedTime}
      </div>
    </div>
  );

  if (item.href) {
    return <Link href={item.href}>{content}</Link>;
  }

  return content;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-xl border border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecommendedPractice({
  items = [],
  isLoading,
}: RecommendedPracticeProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Recommended for You</CardTitle>
          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
            <Link href="/dashboard/practice/design">
              View More
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <LoadingSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 p-3 text-sm text-muted-foreground">
            No system design recommendations yet.
          </div>
        ) : (
          items.map((item) => <PracticeItemCard key={item.id} item={item} />)
        )}
      </CardContent>
    </Card>
  );
}
