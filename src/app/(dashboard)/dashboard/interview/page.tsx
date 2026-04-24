import { Plus } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { serverClient } from "@/lib/orpc-server";
import { os_context } from "@/server/orpc";
import { HistoryStats } from "./_components/history-stats";
import { InterviewList } from "./_components/interview-list";
import { SystemDesignHistoryList } from "./_components/system-design-history-list";

export const metadata = {
  title: "History",
  description: "Review interviews and system design attempts",
};

export default async function InterviewPage() {
  const context = await os_context({ headers: await headers() });

  if (!context.user) {
    redirect("/sign-in?error=session");
  }

  // Fetch initial data on server using the dedicated server client
  const [initialData, initialAttempts, interviewStats, inProgressData] =
    await Promise.all([
      serverClient.interview.list({
        limit: 12,
        offset: 0,
      }),
      serverClient.practice.listAttempts({
        limit: 12,
        offset: 0,
      }),
      serverClient.interview.stats({}),
      serverClient.interview.list({
        limit: 1,
        offset: 0,
        status: "IN_PROGRESS",
      }),
    ]);

  return (
    <div className="flex flex-col gap-8 p-8 w-full animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground">
            Track your interview and system design progress in one place.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold"
        >
          <Link href="/dashboard/interview/create">
            <Plus className="mr-2 h-5 w-5" />
            New Interview
          </Link>
        </Button>
      </div>

      <HistoryStats
        totalSessions={interviewStats.totalSessions}
        completedSessions={interviewStats.completedCount}
        inProgressSessions={inProgressData.total}
        averageScore={interviewStats.averageScore}
      />

      <Tabs defaultValue="interviews" className="space-y-5">
        <TabsList>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="system-design">System Design</TabsTrigger>
        </TabsList>
        <TabsContent value="interviews">
          <InterviewList initialData={initialData} />
        </TabsContent>
        <TabsContent value="system-design">
          <SystemDesignHistoryList initialData={initialAttempts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
