export const joinTranscriptSegments = (...segments: string[]) =>
  segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(" ");

export const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;
