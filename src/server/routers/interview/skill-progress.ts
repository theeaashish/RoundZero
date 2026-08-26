import { ORPCError } from "@orpc/client";

import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";

interface SkillProgressResult {
  communication: number | null;
  problemSolving: number | null;
  technicalKnowledge: number | null;
  codeQuality: number | null;
  timeManagement: number | null;
  count: number;
}

export async function getSkillProgress({ context }: { context: Context }) {
  const { user } = context;
  if (!user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const rows = await db.$queryRaw<SkillProgressResult[]>`
    SELECT 
      ROUND(AVG((r."categoryScores"->>'communication')::numeric))::int AS "communication",
      ROUND(AVG((r."categoryScores"->>'problemSolving')::numeric))::int AS "problemSolving",
      ROUND(AVG((r."categoryScores"->>'technicalKnowledge')::numeric))::int AS "technicalKnowledge",
      ROUND(AVG((r."categoryScores"->>'codeQuality')::numeric))::int AS "codeQuality",
      ROUND(AVG((r."categoryScores"->>'timeManagement')::numeric))::int AS "timeManagement",
      COUNT(*)::int AS "count"
    FROM "report" r
    JOIN "interview" i ON r."interviewId" = i."id"
    WHERE i."userId" = ${user.id}
      AND i."status" = 'COMPLETED'
      AND r."categoryScores" IS NOT NULL;
  `;

  const data = rows[0];
  if (!data || !data.count || Number(data.count) === 0) {
    return { skills: [] };
  }

  return {
    skills: [
      {
        name: "Communication",
        value: Number(data.communication ?? 0),
      },
      {
        name: "Problem Solving",
        value: Number(data.problemSolving ?? 0),
      },
      {
        name: "Technical Knowledge",
        value: Number(data.technicalKnowledge ?? 0),
      },
      {
        name: "Code Quality",
        value: Number(data.codeQuality ?? 0),
      },
      {
        name: "Time Management",
        value: Number(data.timeManagement ?? 0),
      },
    ],
  };
}
