import { z } from "zod";

import { protectedProcedure } from "@/server/orpc";
import { chat, chatInput } from "./chat";
import { createInterview, createInterviewInput } from "./create";
import { deleteInterview, deleteInterviewInput } from "./delete";
import { endSession, endSessionInput } from "./end";
import { getInterviewById, getInterviewByIdInput } from "./get-by-id";
import { listInterviews, listInterviewsInput } from "./list";
import {
  interviewItemSchema,
  interviewStatusSchema,
  interviewTypeSchema,
  messageSchema,
  reportSchema,
} from "./schemas";
import { getSkillProgress } from "./skill-progress";
import { startSession, startSessionInput } from "./start";
import { getStats } from "./stats";

export const interviewRouter = {
  // Session Handlers
  start: protectedProcedure
    .route({
      description: "Start the interview and get the first question",
      method: "POST",
      path: "/interview/start",
      summary: "Start Interview",
      tags: ["Interview", "Session"],
    })
    .input(startSessionInput)
    .output(
      z.object({
        assistantMessage: messageSchema.nullable(),
        status: interviewStatusSchema,
      }),
    )
    .handler(startSession),

  chat: protectedProcedure
    .route({
      description: "Send a message and get an AI response",
      method: "POST",
      path: "/interview/chat",
      summary: "Chat",
      tags: ["Interview", "Session"],
    })
    .input(chatInput)
    .output(
      z.object({
        userMessage: messageSchema,
        assistantMessage: messageSchema.nullable(),
      }),
    )
    .handler(chat),

  end: protectedProcedure
    .route({
      description: "End the interview and generate a report",
      method: "POST",
      path: "/interview/end",
      summary: "End Interview",
      tags: ["Interview", "Session"],
    })
    .input(endSessionInput)
    .output(
      z.object({
        report: reportSchema,
      }),
    )
    .handler(endSession),

  // Management Handlers
  create: protectedProcedure
    .route({
      description: "Create a new interview session",
      method: "POST",
      path: "/interview/create",
      summary: "Create Interview",
      tags: ["Interview", "Management"],
    })
    .input(createInterviewInput)
    .output(
      z.object({
        interviewId: z.string(),
      }),
    )
    .handler(createInterview),

  list: protectedProcedure
    .route({
      description: "Get user's interviews with pagination",
      method: "GET",
      path: "/interview/list",
      summary: "List Interviews",
      tags: ["Interview", "Management"],
    })
    .input(listInterviewsInput)
    .output(
      z.object({
        interviews: z.array(interviewItemSchema),
        total: z.number(),
      }),
    )
    .handler(listInterviews),

  getById: protectedProcedure
    .route({
      description: "Get interview by ID",
      method: "GET",
      path: "/interview/{id}",
      summary: "Get Interview",
      tags: ["Interview", "Management"],
    })
    .input(getInterviewByIdInput)
    .output(
      z.object({
        interview: z
          .object({
            id: z.string(),
            jobTitle: z.string(),
            type: interviewTypeSchema,
            status: interviewStatusSchema,
            startedAt: z.date(),
            endedAt: z.date().nullable(),
            durationSec: z.number(),
            resumeText: z.string().nullable(),
            techStack: z.string().nullable(),
            experienceLevel: z.string(),
            includeDSA: z.boolean(),
            companyName: z.string().nullable(),
            jobDescription: z.string().nullable(),
            messages: z.array(messageSchema),
            report: reportSchema.nullable(),
          })
          .nullable(),
      }),
    )
    .handler(getInterviewById),

  stats: protectedProcedure
    .route({
      description: "Get user's interview statistics",
      method: "GET",
      path: "/interview/stats",
      summary: "Get Stats",
      tags: ["Interview", "Management"],
    })
    .input(z.object({}))
    .output(
      z.object({
        totalSessions: z.number(),
        completedCount: z.number(),
        averageScore: z.number().nullable(),
        totalDurationSec: z.number(),
      }),
    )
    .handler(getStats),

  delete: protectedProcedure
    .route({
      description: "Delete an interview",
      method: "DELETE",
      path: "/interview/{id}",
      summary: "Delete Interview",
      tags: ["Interview", "Management"],
    })
    .input(deleteInterviewInput)
    .output(
      z.object({
        success: z.boolean(),
      }),
    )
    .handler(deleteInterview),

  skillProgress: protectedProcedure
    .route({
      description: "Get aggregated skill progress from completed interviews",
      method: "GET",
      path: "/interview/skill-progress",
      summary: "Get Skill Progress",
      tags: ["Interview", "Management"],
    })
    .input(z.object({}))
    .output(
      z.object({
        skills: z.array(
          z.object({
            name: z.string(),
            value: z.number(),
          }),
        ),
      }),
    )
    .handler(getSkillProgress),
};
