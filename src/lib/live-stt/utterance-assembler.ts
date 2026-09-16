export interface UtteranceHandlers {
  onSpeechStart?: () => void;
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onEnd?: (finalText: string) => void;
}

/**
 * Assembles Deepgram results into utterances. Pure state machine:
 * no sockets, no React, no I/O besides its deadman timer.
 */
export class UtteranceAssembler {
  private assembled = "";
  private preview = "";
  private speechStartNotified = false;
  private deadmanTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly utteranceTimeoutMs: number,
    private readonly handlers: UtteranceHandlers,
  ) {}

  handleSpeechStarted(): void {
    this.notifySpeechStart();
  }

  handleTranscript(
    transcript: string,
    isFinal: boolean,
    speechFinal: boolean,
  ): void {
    if (!transcript) return;
    this.notifySpeechStart();

    if (isFinal) {
      this.assembled = joinWords(this.assembled, transcript);
      this.preview = this.assembled;
      this.handlers.onFinal?.(this.preview);
      if (speechFinal) {
        this.finalize();
        return;
      }
    } else {
      this.preview = joinWords(this.assembled, transcript);
      this.handlers.onInterim?.(this.preview);
    }

    this.armDeadman();
  }

  handleUtteranceEnd(): void {
    if (this.assembled.trim()) {
      this.finalize();
    } else {
      this.reset();
    }
  }

  /** Salvages the current utterance and returns it ("" if nothing). */
  finalize(): string {
    this.clearDeadman();
    const text = (this.preview || this.assembled).trim();
    this.reset();
    if (text) this.handlers.onEnd?.(text);
    return text;
  }

  reset(): void {
    this.assembled = "";
    this.preview = "";
    this.speechStartNotified = false;
    this.clearDeadman();
  }

  dispose(): void {
    this.clearDeadman();
  }

  private notifySpeechStart(): void {
    if (this.speechStartNotified) return;
    this.speechStartNotified = true;
    this.handlers.onSpeechStart?.();
  }

  private armDeadman(): void {
    this.clearDeadman();
    this.deadmanTimer = setTimeout(() => {
      this.deadmanTimer = null;
      this.finalize();
    }, this.utteranceTimeoutMs);
  }

  private clearDeadman(): void {
    if (this.deadmanTimer) {
      clearTimeout(this.deadmanTimer);
      this.deadmanTimer = null;
    }
  }
}

function joinWords(left: string, right: string): string {
  return `${left} ${right}`.trim();
}
