export interface SseMessage {
  event: string;
  data: string;
}

function parseSseBlock(block: string): SseMessage | null {
  let event = "";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event: ")) {
      event = line.slice(7).trim();
    } else if (line.startsWith("data: ")) {
      data = line.slice(6).trim();
    }
  }
  if (!event || !data) return null;
  return { event, data };
}

export async function* readSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseMessage, void, undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const message = parseSseBlock(block);
        if (message) yield message;
      }
    }
  } finally {
    void reader.cancel().catch(() => {});
  }
}
