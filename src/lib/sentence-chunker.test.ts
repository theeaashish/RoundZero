import { describe, expect, it } from "bun:test";
import { SentenceChunker } from "./sentence-chunker";

describe("SentenceChunker", () => {
  it("chunks standard sentences with punctuation", () => {
    const chunker = new SentenceChunker();
    const deltas = [
      "Hello there! ",
      "How are you doing today? ",
      "I hope all is well.",
    ];
    const results: string[] = [];

    for (const delta of deltas) {
      results.push(...chunker.processDelta(delta));
    }
    const remaining = chunker.flush();
    if (remaining) results.push(remaining);

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.join(" ")).toContain("Hello there!");
  });

  it("completely strips <think> blocks within a single delta", () => {
    const chunker = new SentenceChunker();
    const input =
      "<think>Analyzing user question. Candidate is strong.</think>That sounds like a solid approach.";
    const chunks = chunker.processDelta(input);
    const flushed = chunker.flush();
    const all = [...chunks, ...(flushed ? [flushed] : [])];

    expect(all.join(" ")).not.toContain("Analyzing");
    expect(all.join(" ")).not.toContain("Candidate is strong");
    expect(all.join(" ")).toContain("That sounds like a solid approach.");
  });

  it("completely strips <think> blocks spanning across multiple delta chunks with internal punctuation", () => {
    const chunker = new SentenceChunker();
    const chunks: string[] = [];

    chunks.push(
      ...chunker.processDelta("<think>Let's consider the system scale. "),
    );
    chunks.push(
      ...chunker.processDelta("The candidate did not mention caching. "),
    );
    chunks.push(
      ...chunker.processDelta("I will prompt them about Redis.</think>"),
    );
    chunks.push(
      ...chunker.processDelta(
        "How would you handle cache invalidation under heavy write load?",
      ),
    );

    const flushed = chunker.flush();
    const all = [...chunks, ...(flushed ? [flushed] : [])];

    expect(all.join(" ")).not.toContain("system scale");
    expect(all.join(" ")).not.toContain("caching");
    expect(all.join(" ")).not.toContain("Redis");
    expect(all.join(" ")).toContain(
      "How would you handle cache invalidation under heavy write load?",
    );
  });

  it("does not emit unclosed <think> content on flush", () => {
    const chunker = new SentenceChunker();
    const chunks = chunker.processDelta(
      "<think>Unfinished thoughts that should not be spoken.",
    );
    const flushed = chunker.flush();
    const all = [...chunks, ...(flushed ? [flushed] : [])];

    expect(all.length).toBe(0);
  });
});
