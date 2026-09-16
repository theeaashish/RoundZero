import {
  buildSystemPrompt,
  type ExperienceLevel,
  type InterviewType,
} from "@/lib/prompts/interview-prompts";
import { MESSAGE_ROLES } from "@/server/routers/interview/schemas";

export interface GuidanceMessage {
  role: string;
  content: string;
  codeSnippet?: string | null;
  turnId?: string | null;
}

export type InterviewPromptContext = {
  id: string;
  jobTitle: string;
  resumeText: string | null;
  experienceLevel: string;
  type: string;
  techStack: string | null;
  includeDSA: boolean;
  companyName?: string | null;
  jobDescription?: string | null;
};

const SESSION_SNIPPET_LIMIT = 280;
const DSA_SIGNAL_REGEX =
  /\b(array|hash ?map|binary search|two pointers|tree|graph|heap|stack|queue|dfs|bfs|dynamic programming|dp|time complexity|space complexity)\b/i;

const normalizeSnippet = (value: string | null | undefined): string => {
  if (!value) {
    return "None";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= SESSION_SNIPPET_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, SESSION_SNIPPET_LIMIT)}...`;
};

const getInterviewPhase = (
  answerCount: number,
): "OPENING" | "DISCOVERY" | "DEEP_DIVE" | "WRAP_UP" => {
  if (answerCount === 0) {
    return "OPENING";
  }

  if (answerCount < 2) {
    return "DISCOVERY";
  }

  if (answerCount < 5) {
    return "DEEP_DIVE";
  }

  return "WRAP_UP";
};

export const buildLiveSessionGuidance = (
  interview: InterviewPromptContext,
  messages: GuidanceMessage[],
): string => {
  const userMessages = messages.filter(
    (message) => message.role === MESSAGE_ROLES.USER,
  );
  const assistantMessages = messages.filter(
    (message) => message.role === MESSAGE_ROLES.ASSISTANT,
  );
  const lastUserAnswer = userMessages.at(-1)?.content;
  const lastAssistantPrompt = assistantMessages.at(-1)?.content;
  const answerCount = userMessages.length;

  const answeredTurnIds = new Set(
    assistantMessages
      .map((message) => message.turnId)
      .filter((turnId): turnId is string => Boolean(turnId)),
  );
  const interruptedAnswerCount = userMessages.filter(
    (message, index) =>
      index < userMessages.length - 1 &&
      Boolean(message.turnId) &&
      !answeredTurnIds.has(message.turnId as string),
  ).length;

  const phase = getInterviewPhase(answerCount);
  const hasCodeSubmission = messages.some((message) =>
    Boolean(message.codeSnippet),
  );
  const hasDSACoverage = messages.some((message) => {
    const combinedContent = `${message.content}\n${message.codeSnippet ?? ""}`;
    return DSA_SIGNAL_REGEX.test(combinedContent);
  });

  let nextObjective =
    "Continue the current topic with one focused follow-up before switching contexts.";

  if (phase === "OPENING") {
    nextObjective =
      "Ask a strong opening question tied to the role, resume, or job description.";
  } else if (phase === "DISCOVERY") {
    nextObjective =
      "Probe the candidate's first answers for specifics and depth instead of jumping too quickly.";
  } else if (phase === "DEEP_DIVE") {
    nextObjective =
      "Challenge tradeoffs, ask for reasoning, and test real-world decision making.";
  } else if (phase === "WRAP_UP") {
    nextObjective =
      "Ask one last synthesis question or targeted stretch question, then prepare to close cleanly.";
  }

  if (
    interview.type === "TECHNICAL" &&
    interview.includeDSA &&
    answerCount >= 2 &&
    !hasDSACoverage
  ) {
    nextObjective +=
      " A DSA-focused question is still required, so introduce it soon without making the transition feel abrupt.";
  }

  return `### LIVE SESSION STATE
- Candidate answers so far: ${answerCount}
- Current phase: ${phase}
- Code shared: ${hasCodeSubmission ? "Yes" : "No"}
- DSA covered: ${hasDSACoverage ? "Yes" : "No"}
- Interrupted answers: ${
    interruptedAnswerCount > 0
      ? `${interruptedAnswerCount} (the candidate cut off an earlier response mid-stream)`
      : "None"
  }
- Most recent interviewer prompt: ${normalizeSnippet(lastAssistantPrompt)}
- Most recent candidate answer: ${normalizeSnippet(lastUserAnswer)}
- Immediate objective: ${nextObjective}

### LIVE SESSION BEHAVIOR RULES
- Do not restart the interview or repeat earlier setup questions.
- Build on the most recent answer before moving to a new area.
- If the candidate is vague, ask one concise follow-up for specifics.
- If an earlier answer was interrupted, the candidate's latest message extends or replaces it — respond to the latest message and do not re-ask what was already covered.
- Keep the interview realistic: one question at a time, natural transitions, no monologues.
- When relevant, reference the candidate's prior answer explicitly so the conversation feels continuous.`;
};

export const buildPromptForInterview = (
  interview: InterviewPromptContext,
  messages: GuidanceMessage[] = [],
): string => {
  const basePrompt = buildSystemPrompt({
    jobTitle: interview.jobTitle,
    resumeText: interview.resumeText ?? "",
    experienceLevel: interview.experienceLevel as ExperienceLevel,
    type: interview.type as InterviewType,
    techStack: interview.techStack ?? undefined,
    includeDSA: interview.includeDSA,
    companyName: interview.companyName ?? undefined,
    jobDescription: interview.jobDescription ?? undefined,
  });

  const liveSessionGuidance = buildLiveSessionGuidance(interview, messages);
  return `${basePrompt}\n\n${liveSessionGuidance}`;
};
