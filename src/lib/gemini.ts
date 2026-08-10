import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ORPCError } from "@orpc/client";
import {
  generateObject,
  generateText,
  type ModelMessage,
  streamText,
} from "ai";
import { z } from "zod";
import { env } from "@/config/env";
import {
  type ArchitectureEvaluation,
  architectureEvaluationSchema,
} from "./architecture-evaluation";

// Initialize Google AI client
const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

// Model configuration
const MODEL_ID = "gemini-3.1-flash-lite-preview";
export const model = google(MODEL_ID);

// Temperature settings for different use cases
export const TEMPERATURE = {
  CREATIVE: 0.9,
  CONVERSATIONAL: 0.7,
  BALANCED: 0.5,
  PRECISE: 0.3,
  DETERMINISTIC: 0.1,
} as const;

// Schema for the interview performance report
export const reportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categoryScores: z.object({
    communication: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    technicalKnowledge: z.number().min(0).max(100),
    codeQuality: z.number().min(0).max(100),
    timeManagement: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  suggestions: z.array(z.string()).min(1),
  summary: z.string().min(1),
});

export type Report = z.infer<typeof reportSchema>;

// Category scores type for type safety
export type CategoryScores = Report["categoryScores"];

// Message type for AI conversations
export type AIMessage = ModelMessage;

// Generate a single interview response
export const generateInterviewResponse = async (
  systemPrompt: string,
  messages: AIMessage[],
  temperature: number = TEMPERATURE.CONVERSATIONAL,
): Promise<string> => {
  const { text } = await generateText({
    model,
    system: systemPrompt,
    messages,
    temperature,
  });

  return text;
};

// Stream an interview response for lower perceived latency
export const streamInterviewResponse = (
  systemPrompt: string,
  messages: AIMessage[],
  temperature: number = TEMPERATURE.CONVERSATIONAL,
) => {
  return streamText({
    model,
    system: systemPrompt,
    messages,
    temperature,
  });
};

// Generate a structured interview report
export const generateReport = async (
  systemPrompt: string,
  messages: AIMessage[],
  temperature: number = TEMPERATURE.PRECISE,
): Promise<Report> => {
  const { object } = await generateObject({
    model,
    system: systemPrompt,
    messages,
    schema: reportSchema,
    temperature,
  });

  return object;
};

import {
  type EvaluationRubric,
  type GeneratedSystemDesignProblem,
  type ProblemGenerationInput,
  type ScaleProfile,
  systemDesignProblemSchema,
} from "./validations/practice";

function formatList(title: string, values?: string[]) {
  if (!values?.length) return "";
  return `## ${title}
${values.map((value, index) => `${index + 1}. ${value}`).join("\n")}
`;
}

function formatScaleProfile(scaleProfile?: ScaleProfile) {
  if (!scaleProfile) return "";

  return `## Scale Profile
- Daily Active Users: ${scaleProfile.dailyActiveUsers}
- Peak Requests Per Second: ${scaleProfile.peakRequestsPerSecond}
- Read/Write Ratio: ${scaleProfile.readWriteRatio}
- Average Payload Size: ${scaleProfile.averagePayloadSize}
- Latency SLO: ${scaleProfile.latencySlo}
- Availability SLO: ${scaleProfile.availabilitySlo}
- Data Retention: ${scaleProfile.dataRetention}
- Primary Regions: ${scaleProfile.primaryRegions.join(", ")}
- Consistency Model: ${scaleProfile.consistencyModel}
- Growth Expectation: ${scaleProfile.growthExpectation}
- Budget: ${scaleProfile.budget}
- Compliance: ${scaleProfile.compliance.join(", ") || "None"}
`;
}

function formatEvaluationRubric(evaluationRubric?: EvaluationRubric) {
  if (!evaluationRubric) return "";

  return `## Evaluation Rubric
- Must Have Components: ${evaluationRubric.mustHaveComponents.join("; ")}
- Bonus Points: ${evaluationRubric.bonusPoints.join("; ")}
- Red Flags: ${evaluationRubric.redFlags.join("; ")}
`;
}

// Generate a structured system design problem based on a detailed brief
export const generateSystemDesignProblem = async (
  input: ProblemGenerationInput,
  temperature: number = TEMPERATURE.BALANCED,
): Promise<GeneratedSystemDesignProblem> => {
  const systemPrompt = `You are a Staff+ backend architect creating production-grade system design interview prompts.
Generate a realistic interview problem that is internally consistent, specific, and solvable in the requested interview duration.

Requirements:
- Respect the requested topic, domain, seniority, complexity, scale assumptions, and constraints.
- If specific scale numbers (DAU, RPS, latency SLOs), scenarios, or focus areas are omitted or empty, invent realistic, production-grade scale targets and context appropriate for a top-tier tech company system design interview.
- Use realistic product language and operational numbers.
- Keep the prompt interview-friendly: clear scope, explicit tradeoffs, and meaningful follow-up questions.
- Ensure the evaluation rubric aligns with the problem statement.
- Do not repeat the user's brief verbatim; transform it into a polished company-grade challenge.`;

  const promptDetails = [
    `- Topic: ${input.topic}`,
    input.prompt ? `- Additional Context/Prompt: ${input.prompt}` : null,
    `- Domain: ${input.domain}`,
    `- Complexity: ${input.complexity}`,
    `- Interview Role: ${input.interviewRole}`,
    `- Interview Duration: ${input.estimatedDurationMinutes} minutes`,
    `- Product Stage: ${input.productStage}`,
    input.scenario ? `- Scenario: ${input.scenario}` : null,
    input.functionalFocus?.length
      ? `- Functional Focus: ${input.functionalFocus.join("; ")}`
      : null,
    input.nonFunctionalFocus?.length
      ? `- Non-Functional Focus: ${input.nonFunctionalFocus.join("; ")}`
      : null,
    input.dailyActiveUsers
      ? `- Daily Active Users: ${input.dailyActiveUsers}`
      : null,
    input.peakRequestsPerSecond
      ? `- Peak Requests Per Second: ${input.peakRequestsPerSecond}`
      : null,
    input.readWriteRatio ? `- Read/Write Ratio: ${input.readWriteRatio}` : null,
    input.latencyTarget ? `- Latency Target: ${input.latencyTarget}` : null,
    input.availabilityTarget
      ? `- Availability Target: ${input.availabilityTarget}`
      : null,
    input.primaryRegions?.length
      ? `- Primary Regions: ${input.primaryRegions.join(", ")}`
      : null,
    `- Consistency Model: ${input.consistencyModel}`,
    `- Budget: ${input.budget}`,
    input.compliance?.length
      ? `- Compliance: ${input.compliance.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `# Challenge Configuration\n${promptDetails}\n\nReturn a structured output matching the schema exactly.`;

  const { object } = await generateObject({
    model,
    system: systemPrompt,
    prompt,
    schema: systemDesignProblemSchema,
    temperature,
  });

  return object;
};

interface ArchitectureEvaluationInput {
  problemTitle: string;
  problemDescription: string;
  functionalReqs: string[];
  nonFunctionalReqs: string[];
  complexity: string;
  domain?: string;
  interviewRole?: string;
  companyContext?: string;
  scenario?: string;
  inScope?: string[];
  outOfScope?: string[];
  architectureConsiderations?: string[];
  followUps?: string[];
  scaleProfile?: ScaleProfile;
  evaluationRubric?: EvaluationRubric;
  heuristicWarnings?: string[];
  architectureText: string;
}

export const generateArchitectureEvaluation = async (
  input: ArchitectureEvaluationInput,
  temperature: number = 0.2,
): Promise<ArchitectureEvaluation> => {
  const systemPrompt = `You are a Principal Architect at a top tech company reviewing system design solutions.
Your goal is to evaluate the architecture against the problem requirements and provide constructive feedback.

CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no explanations, no additional text.
The JSON must exactly match this schema:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "scalability": number (0-100),
    "reliability": number (0-100),
    "availability": number (0-100),
    "performance": number (0-100),
    "security": number (0-100),
    "maintainability": number (0-100),
    "costOptimization": number (0-100)
  },
  "strengths": array of 1-5 strings,
  "bottlenecks": array of 1-5 strings,
  "suggestions": array of 1-5 strings,
  "summary": string
}

Be strict but fair. Consider:
- Does the architecture address the functional requirements?
- Are the non-functional requirements (scale, latency, availability) met?
- Is the design appropriate for the complexity level?
- Are there obvious missing components or anti-patterns?
- Is the architecture cost-effective?

Provide specific, actionable feedback that helps the candidate improve.`;

  const userPrompt = `
# Problem: ${input.problemTitle}

## Description
${input.problemDescription}

${input.domain ? `## Domain\n${input.domain}\n` : ""}
${input.interviewRole ? `## Target Role\n${input.interviewRole}\n` : ""}
${input.companyContext ? `## Company Context\n${input.companyContext}\n` : ""}
${input.scenario ? `## Scenario\n${input.scenario}\n` : ""}
## Functional Requirements
${input.functionalReqs.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Non-Functional Requirements
${input.nonFunctionalReqs.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Complexity Level
${input.complexity}

${formatList("In Scope", input.inScope)}
${formatList("Out of Scope", input.outOfScope)}
${formatList("Architecture Considerations", input.architectureConsiderations)}
${formatList("Follow-Up Scenarios", input.followUps)}
${formatScaleProfile(input.scaleProfile)}
${formatEvaluationRubric(input.evaluationRubric)}
${formatList("Heuristic Warnings", input.heuristicWarnings)}
# Candidate's Architecture
${input.architectureText}

Respond with ONLY a valid JSON object matching the schema described in the system prompt.`;

  try {
    const { object } = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      schema: architectureEvaluationSchema,
      temperature,
    });

    return object;
  } catch (error) {
    console.error("Architecture evaluation failed:", error);
    throw new ORPCError("INTERNAL_ERROR", {
      message: "Failed to evaluate architecture. Please try again.",
    });
  }
};
