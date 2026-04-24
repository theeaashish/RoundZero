"use client";

import { Calendar, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WelcomeHeaderProps {
  userName?: string | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  const firstName = userName ? userName.split(" ")[0] : "there";
  const greeting = getGreeting();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {greeting}, {firstName}
          </h1>
          <span className="text-2xl">👋</span>
        </div>
        <p className="text-muted-foreground">
          Ready to crush your next interview? Let's practice.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2 hidden sm:flex" asChild>
          <Link href="/dashboard/interview">
            <Calendar className="h-4 w-4" />
            View History
          </Link>
        </Button>
        <Button
          className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
          asChild
        >
          <Link href="/dashboard/interview/create">
            <Play className="h-4 w-4 fill-current" />
            Start Interview
          </Link>
        </Button>
      </div>
    </div>
  );
}
