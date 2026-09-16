import { cleanTextForTTS } from "@/lib/tts-text";

export class SentenceChunker {
  private buffer = "";
  private chunkCount = 0;
  private inThink = false;

  processDelta(delta: string): string[] {
    this.buffer += delta;
    this.stripThinkTags();
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
    this.stripThinkTags();
    const remaining = cleanTextForTTS(this.buffer.trim());
    this.buffer = "";
    if (remaining) {
      this.chunkCount++;
      return remaining;
    }
    return null;
  }

  private stripThinkTags(): void {
    while (this.buffer.length > 0) {
      if (this.inThink) {
        const closeMatch = /<\/think>/i.exec(this.buffer);
        if (closeMatch) {
          this.buffer = this.buffer.slice(
            closeMatch.index + closeMatch[0].length,
          );
          this.inThink = false;
        } else {
          this.buffer = "";
          break;
        }
      } else {
        const openMatch = /<think\b[^>]*>/i.exec(this.buffer);
        if (!openMatch) break;

        const openIndex = openMatch.index;
        const afterOpen = this.buffer.slice(openIndex + openMatch[0].length);
        const closeMatch = /<\/think>/i.exec(afterOpen);
        if (closeMatch) {
          this.buffer =
            this.buffer.slice(0, openIndex) +
            afterOpen.slice(closeMatch.index + closeMatch[0].length);
        } else {
          this.buffer = this.buffer.slice(0, openIndex);
          this.inThink = true;
          break;
        }
      }
    }
  }

  private countWords(str: string): number {
    let count = 0;
    let inWord = false;
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 32) {
        if (!inWord) {
          inWord = true;
          count++;
        }
      } else {
        inWord = false;
      }
    }
    return count;
  }

  private findBoundary(
    text: string,
    isFirstChunk: boolean,
  ): { index: number } | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const wordCount = this.countWords(trimmed);

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
