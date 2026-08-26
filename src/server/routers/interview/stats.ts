import { ORPCError } from "@orpc/client";

import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";

interface StatsQueryResult {
  totalSessions: number;
  completedCount: number;
  totalDurationSec: number;
  averageScore: number | null;
}

export async function getStats({ context }: { context: Context }) {
  const { user } = context;
  if (!user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const userId = user.id;

  const stats = await db.$queryRaw<StatsQueryResult[]>`
    SELECT 
      COUNT(*)::int AS "totalSessions",
      COUNT(*) FILTER (WHERE i."status" = 'COMPLETED')::int AS "completedCount",
      COALESCE(SUM(i."durationSec"), 0)::int AS "totalDurationSec",
      (
        SELECT ROUND(AVG(r."overallScore")::numeric, 1)::float
        FROM "report" r
        JOIN "interview" inv ON r."interviewId" = inv."id"
        WHERE inv."userId" = ${userId} AND inv."status" = 'COMPLETED'
      ) AS "averageScore"
    FROM "interview" i
    WHERE i."userId" = ${userId};
  `;

  const result = stats[0] ?? {
    totalSessions: 0,
    completedCount: 0,
    totalDurationSec: 0,
    averageScore: null,
  };

  return {
    totalSessions: Number(result.totalSessions ?? 0),
    completedCount: Number(result.completedCount ?? 0),
    averageScore:
      result.averageScore !== null && result.averageScore !== undefined
        ? Number(result.averageScore)
        : null,
    totalDurationSec: Number(result.totalDurationSec ?? 0),
  };
}
