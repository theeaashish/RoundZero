import type { AIMessage } from "@/lib/gemini";

export const DEFAULT_GREETING =
  "Hello! I'm Alex. Let's start the interview. Can you please introduce yourself?";

export const INITIAL_USER_PROMPT =
  "I am ready to start the interview. Please introduce yourself and ask the first question.";

// Convert database messages to AI message format
export const toAIMessages = (
  messages: Array<{
    role: string;
    content: string;
    codeSnippet?: string | null;
    language?: string | null;
  }>,
): AIMessage[] => {
  return messages.map((m) => {
    let content = m.content;
    if (m.codeSnippet) {
      content += `\n\nCode Snippet:\n\`\`\`${m.language || ""}\n${
        m.codeSnippet
      }\n\`\`\``;
    }
    return {
      role: m.role as "user" | "assistant" | "system",
      content,
    };
  });
};
