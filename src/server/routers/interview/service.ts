import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import {
  DEFAULT_INTERVIEW_VOICE,
  type TTSVoice,
  textToSpeech,
} from "@/lib/deepgram";
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
  INTERVIEW_STATUS,
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
  turnId: true,
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

export const createUserInterviewMessageIfActive = async (input: {
  interviewId: string;
  turnId: string;
  content: string;
  codeSnippet?: string;
  language?: string;
}): Promise<InterviewMessageRecord | null> =>
  db.$transaction(async (tx) => {
    const existingMessage = await tx.message.findFirst({
      where: {
        interviewId: input.interviewId,
        turnId: input.turnId,
        role: MESSAGE_ROLES.USER,
      },
      select: interviewMessageSelect,
    });
    if (existingMessage) {
      return null;
    }

    const activeInterview = await tx.interview.updateMany({
      where: {
        id: input.interviewId,
        status: INTERVIEW_STATUS.IN_PROGRESS,
        activeTurnId: null,
      },
      data: { activeTurnId: input.turnId },
    });

    if (activeInterview.count === 0) {
      return null;
    }

    return tx.message.create({
      data: {
        interviewId: input.interviewId,
        turnId: input.turnId,
        role: MESSAGE_ROLES.USER,
        content: input.content,
        codeSnippet: input.codeSnippet,
        language: input.language,
      },
      select: interviewMessageSelect,
    });
  });

export const cancelInterviewTurn = async (input: {
  interviewId: string;
  userId: string;
  turnId: string;
}): Promise<{
  userMessage: InterviewMessageRecord | null;
  clearedActiveTurn: boolean;
}> =>
  db.$transaction(async (tx) => {
    const interview = await tx.interview.findFirst({
      where: { id: input.interviewId, userId: input.userId },
      select: { id: true },
    });
    if (!interview) return { userMessage: null, clearedActiveTurn: false };

    const cleared = await tx.interview.updateMany({
      where: {
        id: input.interviewId,
        userId: input.userId,
        activeTurnId: input.turnId,
      },
      data: { activeTurnId: null },
    });

    await tx.message.deleteMany({
      where: {
        interviewId: input.interviewId,
        turnId: input.turnId,
        role: MESSAGE_ROLES.ASSISTANT,
      },
    });

    const userMessage = await tx.message.findFirst({
      where: {
        interviewId: input.interviewId,
        turnId: input.turnId,
        role: MESSAGE_ROLES.USER,
      },
      select: interviewMessageSelect,
    });

    return {
      userMessage,
      clearedActiveTurn: cleared.count > 0,
    };
  });

export const deleteUserInterviewMessage = async (input: {
  interviewId: string;
  turnId: string;
}): Promise<void> => {
  await db.message.deleteMany({
    where: {
      interviewId: input.interviewId,
      turnId: input.turnId,
      role: MESSAGE_ROLES.USER,
    },
  });
};

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

export const createAssistantInterviewMessageIfActive = async (input: {
  interviewId: string;
  turnId: string;
  content: string;
}): Promise<InterviewMessageRecord | null> =>
  db.$transaction(async (tx) => {
    const existingMessage = await tx.message.findFirst({
      where: {
        interviewId: input.interviewId,
        turnId: input.turnId,
        role: MESSAGE_ROLES.ASSISTANT,
      },
      select: interviewMessageSelect,
    });
    if (existingMessage) {
      return existingMessage;
    }

    const activeInterview = await tx.interview.updateMany({
      where: {
        id: input.interviewId,
        status: INTERVIEW_STATUS.IN_PROGRESS,
        activeTurnId: input.turnId,
      },
      data: { activeTurnId: null },
    });

    if (activeInterview.count === 0) {
      return null;
    }

    return tx.message.create({
      data: {
        interviewId: input.interviewId,
        turnId: input.turnId,
        role: MESSAGE_ROLES.ASSISTANT,
        content: input.content,
      },
      select: interviewMessageSelect,
    });
  });

export class SentenceChunker {
  private buffer = "";
  private chunkCount = 0;

  processDelta(delta: string): string[] {
    this.buffer += delta;
    const chunks: string[] = [];

    while (this.buffer.length > 0) {
      const match = this.findBoundary(this.buffer, this.chunkCount === 0);
      if (!match) break;

      const chunkText = this.buffer.slice(0, match.index).trim();
      this.buffer = this.buffer.slice(match.index).trimStart();

      if (chunkText) {
        const cleaned = cleanTextForTTS(chunkText);
        if (cleaned) {
          chunks.push(cleaned);
          this.chunkCount++;
        }
      }
    }

    return chunks;
  }

  flush(): string | null {
    const remaining = cleanTextForTTS(this.buffer.trim());
    this.buffer = "";
    if (remaining) {
      this.chunkCount++;
      return remaining;
    }
    return null;
  }

  private findBoundary(
    text: string,
    isFirstChunk: boolean,
  ): { index: number } | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const words = trimmed.split(/\s+/);
    const wordCount = words.length;

    // Sentence terminator (.?! or double newline) not preceded by common abbreviations
    const sentenceRegex =
      /(?<!\b(?:e\.g|i\.e|etc|vs|dr|mr|ms|v|\d))([.?!]|\n\n)(?:\s+|$)/i;
    const sentenceMatch = sentenceRegex.exec(text);

    if (sentenceMatch && wordCount >= (isFirstChunk ? 4 : 8)) {
      return { index: sentenceMatch.index + sentenceMatch[1].length };
    }

    // For the first chunk, allow splitting at strong clause markers after 6 words for low TTFB
    if (isFirstChunk && wordCount >= 6) {
      const clauseRegex = /(?<!\b(?:e\.g|i\.e|etc|vs))\s*([,;:\n—])\s+/i;
      const clauseMatch = clauseRegex.exec(text);
      if (clauseMatch) {
        return { index: clauseMatch.index + clauseMatch[1].length };
      }
    }

    // Safety fallback: If buffer grows beyond 25 words without punctuation, break at the next word boundary
    if (wordCount >= 25) {
      const lastSpaceIndex = text.lastIndexOf(" ");
      if (lastSpaceIndex > 0) {
        return { index: lastSpaceIndex };
      }
    }

    return null;
  }
}

export function createWavBuffer(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16,
): Buffer {
  const header = Buffer.alloc(44);
  const dataLength = pcmBuffer.length;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  // RIFF chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);

  // fmt sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmBuffer]);
}

export const synthesizePcmChunk = async (
  text: string,
  options?: {
    voice?: TTSVoice;
    signal?: AbortSignal;
  },
): Promise<Buffer> => {
  const cleanedText = cleanTextForTTS(text);
  if (!cleanedText || options?.signal?.aborted) return Buffer.alloc(0);

  return textToSpeech(` ${cleanedText}`, {
    voice: options?.voice ?? DEFAULT_INTERVIEW_VOICE,
    encoding: "linear16",
    container: "none",
    signal: options?.signal,
  });
};

export const persistWavArchiveAsync = async (
  pcmChunks: Buffer[],
  interviewId: string,
  messageId: string,
): Promise<string | undefined> => {
  try {
    const rawPcm = Buffer.concat(pcmChunks);
    if (rawPcm.length === 0) return undefined;

    const wavBuffer = createWavBuffer(rawPcm, 24000, 1, 16);

    await storageService.uploadInterviewAudio(
      wavBuffer,
      interviewId,
      messageId,
      CONTENT_TYPES.WAV,
    );

    const audioUrl = getInterviewAudioUrl(messageId);
    await db.message.update({
      where: { id: messageId },
      data: { audioUrl },
    });

    return audioUrl;
  } catch (error) {
    console.error("[WAV Archive Error]", { error, interviewId, messageId });
    return undefined;
  }
};

const getInterviewAudioUrl = (messageId: string) =>
  `/api/media/tts/${encodeURIComponent(messageId)}`;

export const generateAndUploadInterviewAudio = async (
  text: string,
  interviewId: string,
  messageId: string,
): Promise<string | undefined> => {
  try {
    const cleanedText = cleanTextForTTS(text);
    const pcmBuffer = await synthesizePcmChunk(cleanedText);
    if (pcmBuffer.length === 0) return undefined;

    const wavBuffer = createWavBuffer(pcmBuffer, 24000, 1, 16);

    await storageService.uploadInterviewAudio(
      wavBuffer,
      interviewId,
      messageId,
      CONTENT_TYPES.WAV,
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

export const streamOpeningInterviewReply = (
  interview: InterviewPromptContext,
) =>
  streamInterviewResponse(buildPromptForInterview(interview), [
    { role: "user", content: INITIAL_USER_PROMPT },
  ]);

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
