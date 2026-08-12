import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { textToSpeech } from "@/lib/deepgram";
import {
  type Report as GeneratedInterviewReport,
  generateInterviewResponse,
  generateReport,
  streamInterviewResponse,
} from "@/lib/gemini";
import db from "@/lib/prisma";
import {
  buildReportPrompt,
  buildSystemPrompt,
  type ExperienceLevel,
  type InterviewType,
} from "@/lib/prompts/interview-prompts";
import { CONTENT_TYPES, storageService } from "@/lib/storage";
import {
  type CategoryScores,
  type Report as InterviewReport,
  MESSAGE_ROLES,
} from "./schemas";
import {
  cleanTextForTTS,
  DEFAULT_GREETING,
  INITIAL_USER_PROMPT,
  toAIMessages,
} from "./utils";

export const interviewMessageSelect = {
  id: true,
  role: true,
  content: true,
  audioUrl: true,
  codeSnippet: true,
  language: true,
  createdAt: true,
} satisfies Prisma.MessageSelect;

export const interviewReportSelect = {
  overallScore: true,
  summary: true,
  categoryScores: true,
  strengths: true,
  weaknesses: true,
  suggestions: true,
} satisfies Prisma.ReportSelect;

export type InterviewMessageRecord = Prisma.MessageGetPayload<{
  select: typeof interviewMessageSelect;
}>;

export type InterviewReportRecord = Prisma.ReportGetPayload<{
  select: typeof interviewReportSelect;
}>;

const INTERVIEW_AUDIO_CONTENT_TYPE = CONTENT_TYPES.MP3;

type InterviewPromptContext = {
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

const SHORT_INTERVIEW_REPORT: InterviewReport = {
  overallScore: 0,
  categoryScores: {
    communication: 0,
    problemSolving: 0,
    technicalKnowledge: 0,
    codeQuality: 0,
    timeManagement: 0,
  },
  strengths: ["Interview was too short to evaluate"],
  weaknesses: ["Not enough conversation to assess"],
  suggestions: ["Complete a full interview session for detailed feedback"],
  summary:
    "The interview session was too brief to generate a comprehensive evaluation. Please complete a full interview with multiple questions and answers for detailed feedback.",
};

const FALLBACK_GENERATED_REPORT: InterviewReport = {
  overallScore: 50,
  categoryScores: {
    communication: 50,
    problemSolving: 50,
    technicalKnowledge: 50,
    codeQuality: 50,
    timeManagement: 50,
  },
  strengths: ["Participated in the interview"],
  weaknesses: ["Unable to fully analyze performance"],
  suggestions: ["Try another interview session for better feedback"],
  summary:
    "We encountered an issue generating your detailed report. Based on your participation, we've provided a baseline score. Please try another interview for more accurate feedback.",
};

export const buildPromptForInterview = (
  interview: InterviewPromptContext,
  messages: InterviewMessageRecord[] = [],
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

export const serializeInterviewMessage = (message: InterviewMessageRecord) => ({
  id: message.id,
  role: message.role as "system" | "user" | "assistant",
  content: message.content,
  audioUrl: message.audioUrl,
  codeSnippet: message.codeSnippet,
  language: message.language,
  createdAt: message.createdAt,
});

export function serializeInterviewReport(
  report: InterviewReportRecord,
): InterviewReport;
export function serializeInterviewReport(
  report: InterviewReportRecord | null,
): InterviewReport | null;
export function serializeInterviewReport(report: InterviewReportRecord | null) {
  if (!report) {
    return null;
  }

  return {
    overallScore: report.overallScore,
    categoryScores: report.categoryScores as CategoryScores,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    suggestions: report.suggestions,
    summary: report.summary,
  };
}

export const getLatestAssistantMessage = (
  messages: InterviewMessageRecord[],
): InterviewMessageRecord | null => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === MESSAGE_ROLES.ASSISTANT) {
      return messages[index];
    }
  }

  return null;
};

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

const buildLiveSessionGuidance = (
  interview: InterviewPromptContext,
  messages: InterviewMessageRecord[],
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
- Most recent interviewer prompt: ${normalizeSnippet(lastAssistantPrompt)}
- Most recent candidate answer: ${normalizeSnippet(lastUserAnswer)}
- Immediate objective: ${nextObjective}

### LIVE SESSION BEHAVIOR RULES
- Do not restart the interview or repeat earlier setup questions.
- Build on the most recent answer before moving to a new area.
- If the candidate is vague, ask one concise follow-up for specifics.
- Keep the interview realistic: one question at a time, natural transitions, no monologues.
- When relevant, reference the candidate's prior answer explicitly so the conversation feels continuous.`;
};

export const listInterviewMessages = async (
  interviewId: string,
): Promise<InterviewMessageRecord[]> =>
  db.message.findMany({
    where: { interviewId },
    orderBy: { createdAt: "asc" },
    select: interviewMessageSelect,
  });

export const mergeInterviewHistory = (
  history: InterviewMessageRecord[],
  nextMessage: InterviewMessageRecord,
): InterviewMessageRecord[] => {
  const messageById = new Map(history.map((message) => [message.id, message]));
  messageById.set(nextMessage.id, nextMessage);

  return Array.from(messageById.values()).sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );
};

export const createUserInterviewMessage = async (input: {
  interviewId: string;
  content: string;
  codeSnippet?: string;
  language?: string;
}): Promise<InterviewMessageRecord> =>
  db.message.create({
    data: {
      interviewId: input.interviewId,
      role: MESSAGE_ROLES.USER,
      content: input.content,
      codeSnippet: input.codeSnippet,
      language: input.language,
    },
    select: interviewMessageSelect,
  });

export const createAssistantInterviewMessage = async (input: {
  interviewId: string;
  content: string;
  audioUrl?: string;
}): Promise<InterviewMessageRecord> =>
  db.message.create({
    data: {
      interviewId: input.interviewId,
      role: MESSAGE_ROLES.ASSISTANT,
      content: input.content,
      audioUrl: input.audioUrl,
    },
    select: interviewMessageSelect,
  });

const getInterviewAudioUrl = (messageId: string) =>
  `/api/media/tts/${encodeURIComponent(messageId)}`;

export const generateAndUploadInterviewAudio = async (
  text: string,
  interviewId: string,
  messageId: string,
): Promise<string | undefined> => {
  try {
    const cleanedText = cleanTextForTTS(text);
    const audioBuffer = await textToSpeech(` ${cleanedText}`, {
      encoding: "mp3",
    });

    await storageService.uploadInterviewAudio(
      audioBuffer,
      interviewId,
      messageId,
      INTERVIEW_AUDIO_CONTENT_TYPE,
    );

    const audioUrl = getInterviewAudioUrl(messageId);
    await db.message.update({
      where: { id: messageId },
      data: { audioUrl },
    });

    return audioUrl;
  } catch (error) {
    console.error("[TTS Error]", { error, interviewId, messageId });
    return undefined;
  }
};

export const generateOpeningInterviewMessage = async (
  interview: InterviewPromptContext,
): Promise<string> => {
  try {
    return await generateInterviewResponse(buildPromptForInterview(interview), [
      { role: "user", content: INITIAL_USER_PROMPT },
    ]);
  } catch (error) {
    console.error("[AI Generation Error]", error);
    return DEFAULT_GREETING;
  }
};

export const generateInterviewReply = async (
  interview: InterviewPromptContext,
  messages: InterviewMessageRecord[],
): Promise<string> =>
  generateInterviewResponse(
    buildPromptForInterview(interview, messages),
    toAIMessages(messages),
  );

export const streamInterviewReply = (
  interview: InterviewPromptContext,
  messages: InterviewMessageRecord[],
) =>
  streamInterviewResponse(
    buildPromptForInterview(interview, messages),
    toAIMessages(messages),
  );

export const generateInterviewReportData = async (
  messages: InterviewMessageRecord[],
): Promise<InterviewReport> => {
  if (messages.length < 2) {
    return SHORT_INTERVIEW_REPORT;
  }

  try {
    return await generateReport(buildReportPrompt(), toAIMessages(messages));
  } catch (error) {
    console.error("[Report Generation Error]", error);
    return FALLBACK_GENERATED_REPORT;
  }
};

export const isUniqueConstraintError = (error: unknown): boolean =>
  error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
  error.code === "P2002";

export const toPersistableReportData = (
  report: GeneratedInterviewReport | InterviewReport,
) => ({
  overallScore: report.overallScore,
  summary: report.summary,
  categoryScores: report.categoryScores as CategoryScores,
  strengths: report.strengths,
  weaknesses: report.weaknesses,
  suggestions: report.suggestions,
});
