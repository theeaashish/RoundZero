import type { z } from "zod";
import type {
  evaluationRubricSchema,
  scaleProfileSchema,
  storedSystemDesignSpecSchema,
} from "@/lib/validations/practice";

type StoredSystemDesignSpec = z.infer<typeof storedSystemDesignSpecSchema>;
type EvaluationRubric = z.infer<typeof evaluationRubricSchema>;
type ScaleProfile = z.infer<typeof scaleProfileSchema>;

/**
 * Sanitizes user input text to prevent prompt injection or markdown corruption.
 */
function sanitizeInput(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/[\r\n]+/g, " ")
    .replace(/[`$]/g, "")
    .trim();
}

function formatList(title: string, values?: string[]) {
  if (!values?.length) return "";
  const sanitizedValues = values
    .map((val) => sanitizeInput(val))
    .filter(Boolean);
  if (!sanitizedValues.length) return "";

  return `## ${title}
${sanitizedValues.map((value, index) => `${index + 1}. ${value}`).join("\n")}
`;
}

function formatScaleProfile(scaleProfile?: ScaleProfile) {
  if (!scaleProfile) return "";

  return `## Scale Profile
- Daily Active Users: ${sanitizeInput(scaleProfile.dailyActiveUsers)}
- Peak Requests Per Second: ${sanitizeInput(scaleProfile.peakRequestsPerSecond)}
- Read/Write Ratio: ${sanitizeInput(scaleProfile.readWriteRatio)}
- Average Payload Size: ${sanitizeInput(scaleProfile.averagePayloadSize)}
- Latency SLO: ${sanitizeInput(scaleProfile.latencySlo)}
- Availability SLO: ${sanitizeInput(scaleProfile.availabilitySlo)}
- Data Retention: ${sanitizeInput(scaleProfile.dataRetention)}
- Primary Regions: ${scaleProfile.primaryRegions.map((r) => sanitizeInput(r)).join(", ")}
- Consistency Model: ${sanitizeInput(scaleProfile.consistencyModel)}
- Growth Expectation: ${sanitizeInput(scaleProfile.growthExpectation)}
- Budget: ${sanitizeInput(scaleProfile.budget)}
- Compliance: ${scaleProfile.compliance?.map((c) => sanitizeInput(c)).join(", ") || "None"}
`;
}

function formatEvaluationRubric(evaluationRubric?: EvaluationRubric) {
  if (!evaluationRubric) return "";

  return `## Evaluation Rubric
- Must Have Components: ${evaluationRubric.mustHaveComponents.map((c) => sanitizeInput(c)).join("; ")}
- Bonus Points: ${evaluationRubric.bonusPoints.map((b) => sanitizeInput(b)).join("; ")}
- Red Flags: ${evaluationRubric.redFlags.map((r) => sanitizeInput(r)).join("; ")}
`;
}

export interface SystemDesignProblemSpec {
  title: string;
  description: string;
  functionalReqs: string[];
  nonFunctionalReqs: string[];
  complexity: string;
  domain?: string | null;
  interviewRole?: string | null;
}

export function buildArchitectureEvaluationPrompts(params: {
  problem: SystemDesignProblemSpec;
  specData?: StoredSystemDesignSpec;
  evaluationRubricData?: EvaluationRubric;
  heuristicWarnings: string[];
  architectureText: string;
}): { systemPrompt: string; userPrompt: string } {
  const {
    problem,
    specData,
    evaluationRubricData,
    heuristicWarnings,
    architectureText,
  } = params;

  const systemPrompt = `You are a Principal Architect at a top tech company reviewing system design solutions.
Your goal is to evaluate the candidate's architecture against problem requirements and provide constructive feedback.

Be strict, objective, and fair:
1. Evaluate whether the architecture addresses functional and non-functional requirements.
2. Consider scalability, reliability, performance, availability, security, maintainability, and cost optimization.
3. Identify single points of failure, missing components, or obvious bottlenecks.
4. Output category scores between 0 and 100 for all 7 metrics. Provide actionable strengths, bottlenecks, suggestions, and a concise summary.`;

  const userPrompt = `
# Problem: ${sanitizeInput(problem.title)}

## Description
${sanitizeInput(problem.description)}

${problem.domain ? `## Domain\n${sanitizeInput(problem.domain)}\n` : ""}
${problem.interviewRole ? `## Target Role\n${sanitizeInput(problem.interviewRole)}\n` : ""}
${specData?.companyContext ? `## Company Context\n${sanitizeInput(specData.companyContext)}\n` : ""}
${specData?.scenario ? `## Scenario\n${sanitizeInput(specData.scenario)}\n` : ""}

## Functional Requirements
${problem.functionalReqs.map((r, i) => `${i + 1}. ${sanitizeInput(r)}`).join("\n")}

## Non-Functional Requirements
${problem.nonFunctionalReqs.map((r, i) => `${i + 1}. ${sanitizeInput(r)}`).join("\n")}

## Complexity Level
${problem.complexity}

${formatList("In Scope", specData?.inScope)}
${formatList("Out of Scope", specData?.outOfScope)}
${formatList("Architecture Considerations", specData?.architectureConsiderations)}
${formatList("Follow-Up Scenarios", specData?.followUps)}
${formatScaleProfile(specData?.scaleProfile)}
${formatEvaluationRubric(evaluationRubricData)}
${formatList("Heuristic Warnings", heuristicWarnings)}

# Candidate's Architecture Design
${architectureText}
`;

  return { systemPrompt, userPrompt };
}
