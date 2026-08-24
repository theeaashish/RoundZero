// Interview types
export const INTERVIEW_TYPES = {
  TECHNICAL: "TECHNICAL",
  BEHAVIORAL: "BEHAVIORAL",
  SYSTEM_DESIGN: "SYSTEM_DESIGN",
} as const;

export type InterviewType =
  (typeof INTERVIEW_TYPES)[keyof typeof INTERVIEW_TYPES];

// Experience levels
export const EXPERIENCE_LEVELS = {
  JUNIOR: "junior",
  MID: "mid",
  SENIOR: "senior",
} as const;

export type ExperienceLevel =
  (typeof EXPERIENCE_LEVELS)[keyof typeof EXPERIENCE_LEVELS];

// Prompt configuration limits
const RESUME_MAX_LENGTH = 2000;
const RESPONSE_MAX_WORDS = 200;

export interface BasePromptParams {
  jobTitle: string;
  resumeText: string;
  experienceLevel: ExperienceLevel;
  type: InterviewType;
  companyName?: string;
  jobDescription?: string;
}

export interface TechnicalPromptParams extends BasePromptParams {
  techStack?: string;
  includeDSA?: boolean;
}

// Prompt section builders for better maintainability
const buildPersonaSection = (
  experienceLevel: ExperienceLevel,
  type: InterviewType,
  jobTitle: string,
  companyName?: string,
): string =>
  `
You are Alex, a Lead Engineer and rigorous interviewer${companyName ? ` at ${companyName}` : ""}. 
You are conducting a ${experienceLevel.toUpperCase()} level ${type} interview for a ${jobTitle} role${companyName ? ` at ${companyName}` : ""}.
Your goal is to evaluate the candidate's depth of knowledge, problem-solving skills, and cultural fit.
`.trim();

const buildTechnicalInstructions = (
  techStack?: string,
  includeDSA?: boolean,
): string =>
  `
[TECHNICAL INTERVIEW GUIDELINES]
1. Stack Focus: ${techStack || "General Software Engineering"}.
2. ${
    includeDSA
      ? "DSA Requirement: You MUST ask at least one Data Structure & Algorithm question."
      : "Focus on practical application over theoretical DSA."
  }
3. Code Quality: Evaluate modularity, error handling, and variable naming.
4. Process: 
   - Ask the candidate to explain their approach *before* coding.
   - If they struggle, give *incremental* hints (do not solve it for them).
   - For Senior candidates, ask about Time/Space complexity (Big O) and optimization.
`.trim();

const buildBehavioralInstructions = (): string =>
  `
[BEHAVIORAL INTERVIEW GUIDELINES]
1. Framework: Strictly enforce the STAR method (Situation, Task, Action, Result).
2. Deep Dive: If an answer is vague, interrupt politely and ask for specific details ("What exactly was YOUR contribution?").
3. Focus Areas: Conflict resolution, ownership, and handling failure.
`.trim();

const buildSystemDesignInstructions = (): string =>
  `
[SYSTEM DESIGN GUIDELINES]
1. Methodology: Follow a structured approach (Requirements -> API -> DB Schema -> High Level Design -> Scaling).
2. Scope: 
   - Junior/Mid: Focus on functional requirements and basic API design.
   - Senior: Focus on bottlenecks, trade-offs (CAP theorem), concurrency, and failure modes.
3. Interaction: Challenge their design choices. Ask "Why did you choose X over Y?"
`.trim();

const buildInteractionRules = (): string =>
  `
### INTERACTION RULES (CRITICAL)
- ONE QUESTION AT A TIME: Never ask multiple questions in one message. Wait for the user's response.
- TONE: Professional but conversational. Do not be a robot. Be encouraging but firm.
- TIME MANAGEMENT: Keep the interview moving. If a topic is exhausted, move to the next.
- NO ASSISTANCE: Do not write code for the candidate. Do not give the answer away.
- RESPONSE FORMAT: Keep your responses concise (under ${RESPONSE_MAX_WORDS} words) unless explaining a complex concept. Do NOT use Markdown formatting (like **bolding** or *italics*) in your responses. Output only plain text, as your responses will be spoken aloud.
`.trim();

/**
 * Build the system prompt for an interview session
 */
export const buildSystemPrompt = (params: TechnicalPromptParams): string => {
  const {
    jobTitle,
    resumeText,
    experienceLevel,
    type,
    techStack,
    includeDSA,
    companyName,
    jobDescription,
  } = params;

  const persona = buildPersonaSection(
    experienceLevel,
    type,
    jobTitle,
    companyName,
  );

  // Truncate resume if too long
  const truncatedResume =
    resumeText.length > RESUME_MAX_LENGTH
      ? `${resumeText.slice(0, RESUME_MAX_LENGTH)}... (truncated for context)`
      : resumeText;

  // Get type-specific instructions
  let specificInstructions: string;
  switch (type) {
    case INTERVIEW_TYPES.TECHNICAL:
      specificInstructions = buildTechnicalInstructions(techStack, includeDSA);
      break;
    case INTERVIEW_TYPES.BEHAVIORAL:
      specificInstructions = buildBehavioralInstructions();
      break;
    case INTERVIEW_TYPES.SYSTEM_DESIGN:
      specificInstructions = buildSystemDesignInstructions();
      break;
    default:
      specificInstructions = buildTechnicalInstructions(techStack, includeDSA);
  }

  const promptParts = [
    `### SYSTEM ROLE`,
    persona,
    `### CANDIDATE CONTEXT`,
    `Resume Summary: ${truncatedResume}`,
  ];

  // Add company & JD context when available (custom interview)
  if (companyName || jobDescription) {
    const contextLines: string[] = [`### COMPANY & JOB CONTEXT`];
    if (companyName) {
      contextLines.push(`Company: ${companyName}`);
    }
    if (jobDescription) {
      contextLines.push(`Job Description:\n${jobDescription.slice(0, 3000)}`);
      contextLines.push(
        `IMPORTANT: Tailor your questions to match the specific requirements, responsibilities, and qualifications listed in this job description. Reference specific points from the JD when appropriate.`,
      );
    }
    promptParts.push(contextLines.join("\n"));
  }

  promptParts.push(
    `### INTERVIEW MODE: ${type}`,
    specificInstructions,
    buildInteractionRules(),
  );

  return promptParts.join("\n\n");
};

/**
 * Build the system prompt for report generation
 */
export const buildReportPrompt = (): string =>
  `
You are an expert Hiring Manager. Analyze the preceding interview transcript and generate a structured JSON performance report.

### SCORING RUBRIC
- 0-30: Reject (Major red flags, lack of basic knowledge)
- 31-60: Weak/Junior (Gaps in knowledge, needed significant help)
- 61-80: Hire (Solid performance, minor mistakes)
- 81-100: Strong Hire (Exceeded expectations, deep insights)

### OUTPUT FORMAT
You must output strictly raw JSON. Do not use Markdown code blocks (no \`\`\`json). 
Do not add conversational text before or after the JSON.

Required JSON Structure:
{
  "overallScore": number, // 0-100
  "categoryScores": {
    "communication": number,
    "problemSolving": number,
    "technicalKnowledge": number,
    "codeQuality": number, // If not applicable, use average of others
    "timeManagement": number
  },
  "strengths": ["string", "string", ...], // Top 3 strengths
  "weaknesses": ["string", "string", ...], // Top 3 areas for improvement
  "suggestions": ["string", "string", ...], // Actionable advice for the candidate
  "summary": "A concise executive summary (3-4 sentences) on whether to move forward."
}
`.trim();

/** 
 * 
 *  TODO:
 *   1. Parallelize Database Queries (Easy Win)
  In chat.ts, you are saving the user message and fetching the interview history sequentially. You can do both at the
  same time to shave off some milliseconds:


    1 // Instead of this:
    2 const userMessage = await createUserInterviewMessage({ ... });
    3 const history = await listInterviewMessages(interview.id);
    4
    5 // Do this:
    6 const [userMessage, history] = await Promise.all([
    7   createUserInterviewMessage({
    8     interviewId: interview.id,
    9     content: input.message,
   10     codeSnippet: input.codeSnippet,
   11     language: input.language,
   12   }),
   13   listInterviewMessages(interview.id)
   14 ]);


  2. The "Base64 Data URL" Bottleneck
  Right now, you are converting the audio buffer to a Base64 Data URL (toAudioDataUrl(audioBuffer)) and returning it
  inside the JSON response. While this avoids the S3 latency, audio files can be quite large. Base64 encoding adds
  ~33% to the file size, and parsing massive JSON strings on the client can cause UI stuttering.
   * Fix: Instead of returning a Data URL in a JSON payload, consider creating a dedicated REST endpoint for the AI
     response that returns the raw binary audio stream, while the text response is sent in the headers or over a
     WebSocket.


  3. Reduce the Speech-to-Text Silence Timeout
  In src/hooks/use-live-stt.ts, the default utteranceTimeoutMs is set to 1500ms (1.5 seconds). This means when the user
  finishes speaking, the app waits an entire 1.5 seconds of silence before even starting the request to the server.
   * Fix: Reduce this timeout to 800ms or 1000ms. It will make the interviewer feel much more snappy and responsive to
     the candidate.


  4. Implement Streaming Text (Advanced)
  Currently, the user still has to wait for Gemini to finish generating the entire text response, and then wait for
  Deepgram to generate the entire audio file before they see or hear anything.
   * Fix: Move away from a standard request/response model and implement Server-Sent Events (SSE) or WebSockets. You
     can use Vercel's AI SDK (streamText) to stream the text token-by-token to the UI as it's generated, providing
     immediate visual feedback while the audio generates in the background.
 * 
 */
