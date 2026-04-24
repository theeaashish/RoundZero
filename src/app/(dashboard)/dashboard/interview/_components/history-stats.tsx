import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HistoryStatsProps {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  averageScore: number | null;
}

export function HistoryStats({
  totalSessions,
  completedSessions,
  inProgressSessions,
  averageScore,
}: HistoryStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <HistoryStatCard label="Total Sessions" value={String(totalSessions)} />
      <HistoryStatCard label="Completed" value={String(completedSessions)} />
      <HistoryStatCard label="In Progress" value={String(inProgressSessions)} />
      <HistoryStatCard
        label="Average Score"
        value={averageScore === null ? "N/A" : `${averageScore}%`}
      />
    </div>
  );
}

function HistoryStatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
