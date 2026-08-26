import { Plus } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { serverClient } from "@/lib/orpc-server";
import { os_context } from "@/server/orpc";
import { ProblemList } from "./_components/problem-list";

export const metadata = {
  title: "System Design Practice | RoundZero",
  description:
    "Master architecture interviews with FAANG-style mock challenges",
};

export default async function SystemDesignHubPage() {
  const context = await os_context({ headers: await headers() });

  if (!context.user) {
    redirect("/sign-in?error=session");
  }

  // Fetch initial page of problems on server
  const problemsData = await serverClient.practice.getProblems({ limit: 12 });

  return (
    <div className="flex flex-col gap-8 p-8 w-full animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">System Design</h1>
          <p className="text-muted-foreground">
            Master architecture interviews with high-quality, FAANG-level system
            design challenges.
          </p>
        </div>

        {context.user.role === "admin" && (
          <Button asChild size="lg">
            <Link href="/dashboard/interview/create">
              <Plus className="size-5" />
              Create Interview
            </Link>
          </Button>
        )}
      </div>

      <ProblemList initialData={problemsData} />
    </div>
  );
}
