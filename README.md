# RoundZero

> Production-grade, low-latency AI mock interview platform featuring full-duplex voice interaction with natural barge-in handling, resume-grounded adaptive questioning, and an interactive system design canvas with deterministic load simulation.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.0.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Bun](https://img.shields.io/badge/Bun-1.x-fbf0df?style=flat-square&logo=bun&logoColor=black)](https://bun.sh/)
[![Deepgram](https://img.shields.io/badge/Deepgram-Nova--3%20%7C%20Aura-13EF93?style=flat-square)](https://deepgram.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%203.1%20Flash%20Lite-4285F4?style=flat-square)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

### ⚡ System Specifications at a Glance

```
┌──────────────────────────────┬─────────────────────────────────────────────────────────────┐
│ Metric / Dimension           │ Architectural Implementation                                │
├──────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ Turn-Taking Onset (TTFS)     │ ~850ms – 950ms P50 (Silence end to first audio sample)      │
│ Ingestion Transport          │ Client-direct WSS with Opus 100ms timeslices & token auth   │
│ Speech-to-Text Model         │ Deepgram Nova-3 (500ms endpointing + dynamic tech keyterms) │
│ LLM Engine                   │ Google Gemini 3.1 Flash Lite via Vercel AI SDK Core         │
│ TTS Pipeline                 │ Deepgram Aura (Orpheus model, MP3 128kbps, Max 4 in-flight) │
│ Playback Graph               │ Web Audio API (AudioContext + precise lookahead scheduling) │
│ Interruption / Barge-in      │ Speech-aware (>= 3 words transcript, not raw VAD), <10ms    │
│ State Concurrency            │ Optimistic atomic turn locking in PostgreSQL (Prisma tx)   │
│ Architecture Sandbox         │ React Flow DAG parser + deterministic multi-tier simulator  │
└──────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

- [Overview / Problem](#overview--problem)
- [High-Level Architecture](#high-level-architecture)
- [Voice/Audio Pipeline Deep Dive](#voiceaudio-pipeline-deep-dive)
  - [Turn-Taking Sequence Diagram](#turn-taking-sequence-diagram)
  - [State Machine & Concurrency Control](#state-machine--concurrency-control)
  - [Regex Sentence Chunking & TTS Semaphore](#regex-sentence-chunking--tts-semaphore)
  - [Web Audio Lookahead Scheduling](#web-audio-lookahead-scheduling)
  - [Intelligent Speech-Aware Barge-In](#intelligent-speech-aware-barge-in)
- [Dynamic Context & Adaptive Prompting Engine](#dynamic-context--adaptive-prompting-engine)
- [System Design Arena & Deterministic Simulation Engine](#system-design-arena--deterministic-simulation-engine)
- [Key Design Decisions & Trade-offs](#key-design-decisions--trade-offs)
- [Scalability & Latency Breakdown](#scalability--latency-breakdown)
- [Failure Modes & Production Resilience](#failure-modes--production-resilience)
- [Tech Stack & Rationale](#tech-stack--rationale)
- [Local Setup & Verification](#local-setup--verification)
- [Known Limitations & Engineering Roadmap](#known-limitations--engineering-roadmap)

---

## Overview / Problem

Most AI interview tools implement a naive **monolithic request-response waterfall**: record audio $\rightarrow$ upload full audio file $\rightarrow$ run batch STT $\rightarrow$ invoke LLM for the entire response $\rightarrow$ synthesize the full audio file via TTS $\rightarrow$ download and play.

In practice, this naive architecture completely breaks in a conversational interview setting:

1. **Compounded Latency (4,000–8,000ms dead air):** Human turn-taking cadence requires an onset of $\le 1,200\text{ ms}$. Chaining monolithic blocking calls creates an unnatural, robotic delay that destroys interview realism.
2. **The "Talking Over You" Problem:** Monolithic audio playback cannot be cleanly interrupted without audio clipping, leaving orphaned server tasks and corrupted speech recognition states when the candidate cuts in.
3. **Turn-Taking Desynchronization:** Quick follow-ups or accidental pauses create race conditions where multiple LLM streams run concurrently against conflicting database states.
4. **Browser Resampling Overhead:** Streaming raw uncompressed linear PCM over HTTP streams consumes excessive bandwidth and requires expensive client-side Float32 manual conversions.

RoundZero solves this with a **pipelined, full-duplex streaming voice architecture**: client-direct WebSocket STT with 500ms endpointing, streamed LLM token generation with regex clause boundary chunking, bounded parallel MP3 synthesis, and gapless Web Audio buffer scheduling with instant barge-in cancellation.

---

## High-Level Architecture

The system is decomposed into three distinct operational planes: Real-Time Audio, Application Server / API, and Persistence / Storage.

```mermaid
graph TB
    subgraph Client ["Client Browser (Next.js 16 / React 19)"]
        BrowserMic["Audio Input (MediaRecorder / Opus 100ms)"]
        WebAudioPlayer["Web Audio Graph (AudioContext / GainNode)"]
        LiveSTTHook["useLiveSTT & useInterviewMedia"]
        SystemDesignCanvas["System Design Canvas (@xyflow/react)"]
    end

    subgraph External_Realtime ["Real-Time Edge Infrastructure"]
        DeepgramWSS["Deepgram Nova-3 (WSS / Direct Token Auth)"]
        DeepgramTTS["Deepgram Aura TTS (HTTP REST / Orpheus Model)"]
        GeminiFlash["Google Gemini 3.1 Flash Lite (@ai-sdk/google)"]
    end

    subgraph App_Server ["Application Server (Next.js App Router)"]
        ProxyAuth["Auth Middleware / Proxy (proxy.ts)"]
        ORPCRouter["oRPC Router (Type-Safe RPC Layer)"]
        ChatStreamRoute["SSE Turn Pipeline (/api/interview/chat/stream)"]
        EvalStreamRoute["SSE Architecture Eval (/api/practice/evaluate-stream)"]
        LoadEngine["Deterministic Graph Simulator (load-test/evaluator.ts)"]
    end

    subgraph Storage_Plane ["Data & Asset Persistence"]
        PostgreSQL[("PostgreSQL Database (Prisma ORM)")]
        S3Storage[("AWS S3 / S3-Compatible Object Storage")]
    end

    %% Audio capture path
    BrowserMic -.->|"Direct WebSocket (Opus 100ms frames)"| DeepgramWSS
    DeepgramWSS -.->|"Interim / Final Transcripts (JSON)"| LiveSTTHook

    %% Turn Execution Path
    LiveSTTHook -->|"POST SSE Stream (turnId, message)"| ChatStreamRoute
    LiveSTTHook -->|"DELETE Turn Cancel (barge-in)"| ChatStreamRoute
    SystemDesignCanvas -->|"Client Heuristic Load Simulation"| LoadEngine
    SystemDesignCanvas -->|"POST Stream Architecture Evaluation"| EvalStreamRoute

    %% Server Orchestration
    ChatStreamRoute -->|"Stream System Prompt + Dynamic State"| GeminiFlash
    GeminiFlash -.->|"Token Deltas"| ChatStreamRoute
    ChatStreamRoute -->|"Parallel MP3 Synthesis (Max Concurrency: 4)"| DeepgramTTS
    ChatStreamRoute -->|"SSE Events: text-delta, audio-chunk, complete"| LiveSTTHook
    LiveSTTHook -->|"Base64 MP3 Chunks"| WebAudioPlayer

    %% Data layer
    ORPCRouter --> PostgreSQL
    ChatStreamRoute --> PostgreSQL
    ChatStreamRoute -.->|"Next.js after(): Background MP3 Archive"| S3Storage
    EvalStreamRoute --> PostgreSQL
```

### Communication Topology
- **Audio Capture (Client $\leftrightarrow$ Deepgram WSS):** Direct browser WebSocket connection using short-lived scoped project keys generated via `orpc.media.deepgramToken` (`ttlSeconds: 600`). Raw audio frames never transit the Next.js server.
- **Turn Orchestration (Client $\rightarrow$ Server $\rightarrow$ LLM $\rightarrow$ TTS $\rightarrow$ Client):** Orchestrated over HTTP Server-Sent Events (SSE) in `/api/interview/chat/stream`. Emits typed events: `user-message`, `text-delta`, `audio-chunk`, `audio-complete`, `message-complete`, and `error`.
- **Management & Control (oRPC):** Type-safe remote procedure calls with automatic OpenAPI documentation and TanStack Query cache integration for all non-streaming domains (auth, resumes, analytics, billing).

---

## Voice/Audio Pipeline Deep Dive

### Turn-Taking Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate
    participant Mic as Client MediaRecorder
    participant STTHook as useLiveSTT Hook
    participant DG_STT as Deepgram Nova-3 (WSS)
    participant Server as Next.js API (/api/interview/chat/stream)
    participant DB as PostgreSQL (Prisma)
    participant LLM as Gemini 3.1 Flash Lite
    participant DG_TTS as Deepgram Aura TTS
    participant AudioPlayer as useStreamingAudioPlayer (AudioContext)
    participant S3 as AWS S3 Storage

    Note over User,DG_STT: 1. Continuous Ingestion & Keyword Boosting
    User->>Mic: Speaks answer into microphone
    Mic->>DG_STT: Binary Opus audio frames (100ms timeslices)
    DG_STT-->>STTHook: Interim transcript events (real-time UI update)

    Note over DG_STT,STTHook: 2. VAD Silence Endpointing (500ms)
    DG_STT-->>STTHook: is_final=true + speech_final / UtteranceEnd
    STTHook->>Server: POST /api/interview/chat/stream (turnId, message, codeSnippet)

    Note over Server,DB: 3. Atomic Turn Locking & State Isolation
    Server->>DB: $transaction: Lock interview.activeTurnId & persist user message
    Server-->>STTHook: SSE event: user-message (persistedId)

    Note over Server,DG_TTS: 4. Pipelined LLM Streaming & Sentence Synthesis
    Server->>LLM: streamInterviewReply(SystemPrompt + History)
    
    loop Sentence Boundary Chunking (SentenceChunker)
        LLM-->>Server: Token deltas
        Server-->>STTHook: SSE event: text-delta (token stream)
        Server->>Server: SentenceChunker matches punctuation (. ? ! or early clause)
        Server->>DG_TTS: POST /v1/speak (MP3, 128kbps, Voice: Orpheus) [Max 4 concurrent]
        DG_TTS-->>Server: MP3 Buffer
        Server-->>STTHook: SSE event: audio-chunk (chunkIndex, audioBase64)
        STTHook->>AudioPlayer: decodeAudioData(mp3Bytes) -> AudioBuffer
        AudioPlayer->>AudioPlayer: scheduleBuffer(lookahead timestamp offset)
        AudioPlayer-->>User: Seamless voice playback begins (~850ms TTFS)
    end

    Server-->>STTHook: SSE event: audio-complete & message-complete
    Server->>DB: Persist assistant message & clear interview.activeTurnId
    Server-)S3: Next.js after(): Background archive concatenated MP3

    opt Candidate Interrupts (Barge-In)
        User->>Mic: Candidate speaks mid-playback (>= 3 words detected)
        STTHook->>AudioPlayer: stopAudio() (Halts AudioContext sources in <10ms)
        STTHook->>Server: DELETE /api/interview/chat/stream (turnId)
        Server->>DB: Delete unfinalized assistant message & reset activeTurnId
    end
```

---

### State Machine & Concurrency Control

Each conversation turn is assigned an immutable UUID v4 (`turnId`). The server and client coordinate state transitions through optimistic locking:

```
                  ┌────────────────┐
                  │      IDLE      │
                  └───────┬────────┘
                          │ Candidate begins speaking
                          ▼
                  ┌────────────────┐
                  │   LISTENING    │◄──────────────┐ (KeepAlive 8s)
                  └───────┬────────┘               │
                          │ 500ms Silence (VAD Endpointing)
                          ▼
                  ┌────────────────┐
                  │  TRANSMITTING  │
                  └───────┬────────┘
                          │ POST /api/interview/chat/stream
                          ▼
                  ┌────────────────┐
                  │  TURN_LOCKED   │ (Postgres tx: activeTurnId set)
                  └───────┬────────┘
             ┌────────────┴────────────┐
Candidate    │                         │ Stream tokens & MP3 chunks
Interrupts   │                         ▼
             │                 ┌────────────────┐
             │                 │   PLAYBACK     │
             │                 └───────┬────────┘
             │                         │ All chunks drained
             │                         ▼
             │                 ┌────────────────┐
             │                 │   FINALIZED    │ (activeTurnId cleared)
             │                 └────────────────┘
             ▼
     ┌────────────────┐
     │  ABORT_TURN    │ (DELETE stream, halt Web Audio, drop assistant draft)
     └────────────────┘
```

**Double-Submit Prevention:** In `createUserInterviewMessageIfActive`, an atomic database transaction verifies that `interview.activeTurnId` is either `null` or matches the current turn. If a concurrent turn request arrives, `count === 0` triggers an immediate `409 Conflict`, completely preventing duplicate LLM generation passes.

---

### Regex Sentence Chunking & TTS Semaphore

Monolithic TTS synthesis adds 2,000–3,000ms of dead time. The `SentenceChunker` (`src/server/routers/interview/service.ts`) parses LLM token deltas in real-time to trigger parallel TTS synthesis ahead of generation completion.

```
Token Stream: ["The", " primary", " bottleneck", " is", " the", " database,", " which", " saturates", " under", " high", " write", " loads."]
                                                                ▲
                                                    Early Clause Boundary (Word Count >= 6)
                                                    ──> Slices Chunk 0 ("The primary bottleneck is the database,")
                                                    ──> Fires Deepgram Aura TTS immediately (TTFT + 250ms)
```

- **First-Chunk Fast Path:** Slices at strong clause markers (`,`, `;`, `:`, `—`) once word count $\ge 6$, delivering the first audio sample to the user in under 900ms.
- **Normal Sentence Path:** Evaluates negative lookbehind regex `(?<!\b(?:e\.g|i\.e|etc|vs|[0-9]))([.?!]|\n\n)(?:\s+|$)` with a minimum word threshold ($\ge 8$) to avoid premature slicing on abbreviations or numbers.
- **Safety Valve:** If buffer exceeds 25 words without punctuation, breaks cleanly on the nearest whitespace boundary.
- **Bounded Concurrency Semaphore:** `MAX_TTS_CONCURRENCY = 4` prevents Deepgram rate-limit bursts. An internal `completedChunks` Map keyed by sequence index ensures that out-of-order TTS completions are emitted over SSE in strictly sequential order.

---

### Web Audio Lookahead Scheduling

Standard HTML5 `<audio>` elements suffer from audible gap glitches between concatenated audio clips due to DOM playback initialization latency. RoundZero uses the Web Audio API (`AudioContext`) with precise lookahead timestamp scheduling in `src/hooks/use-streaming-audio-player.ts`.

```
AudioContext Timeline (seconds)
───────────────────────────────────────────────────────────────────────────►
[ Chunk 0: Duration 2.4s ]───┐
                             ▼ (nextStartTime = currentTime + duration)
                             [ Chunk 1: Duration 1.8s ]───┐
                                                          ▼
                                                          [ Chunk 2: Duration 3.1s ]
```

$$\text{scheduleTime} = \max(\text{context.currentTime} + 0.02, \text{nextStartTime})$$
$$\text{nextStartTime}_{\text{next}} = \text{scheduleTime} + \text{buffer.duration}$$

1. Audio chunks are received as Base64 MP3 strings over SSE and converted to `Uint8Array`.
2. Browser-native `context.decodeAudioData()` resamples the MP3 bytes into hardware-aligned Float32 `AudioBuffer` objects in WebAssembly/C++.
3. Buffer sources are connected to a shared `GainNode` and scheduled at precise millisecond boundaries, providing completely gapless, artifact-free speech.

---

### Intelligent Speech-Aware Barge-In

Many voice agents implement naive barge-in triggered on raw VAD energy, causing false interruptions from coughing, chair squeaks, or speaker echo. RoundZero implements a **speech-aware multi-word threshold**:

- **VAD Events:** Raw `SpeechStarted` events clear the interim transcript buffer but **do not** halt playback.
- **Interim Transcript Threshold:** If the candidate produces $\ge 4$ words in an interim transcript, barge-in triggers.
- **Final Transcript Threshold:** If a finalized transcript segment contains $\ge 3$ words, barge-in triggers.
- **Execution:** `stopAudio()` immediately disconnects all active `AudioBufferSourceNode` instances (< 10ms), the client `AbortController` terminates the SSE stream, and an HTTP `DELETE /api/interview/chat/stream` resets the server-side turn state.

---

## Dynamic Context & Adaptive Prompting Engine

The LLM is not treated as a static chatbot; every turn dynamically recompiles conversational state in `src/server/routers/interview/service.ts`.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ COMPILED SYSTEM PROMPT CONTEXT                                           │
├──────────────────────────────────────────────────────────────────────────┤
│ 1. Role & Candidate Persona (Job Title, Seniority Level, Resume Snippet) │
│ 2. Technical Stack Constraints & DSA Evaluation Requirements             │
│ 3. Interview Phase State Machine:                                        │
│    • OPENING    (Answers: 0)   ──> Role context and background probe     │
│    • DISCOVERY  (Answers: 1-2) ──> Clarifying scope & past decisions     │
│    • DEEP_DIVE  (Answers: 3-4) ──> Tradeoffs, failures, scale challenges │
│    • WRAP_UP    (Answers: >=5) ──> Synthesis & concluding technical stretch│
│ 4. Behavioral Directives:                                                │
│    • Interrupted Turn Counter (Detects if user previously cut in)        │
│    • DSA Coverage Heuristic Detector (Regex signals on Array/Tree/Graph) │
│    • Single-question rule (Prohibits interviewer monologues)             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## System Design Arena & Deterministic Simulation Engine

RoundZero features a full system design canvas built on `@xyflow/react` with a deterministic, client-side traffic simulation engine (`src/lib/load-test/evaluator.ts`).

```
[Candidate Architecture Canvas]
         │
         ▼
[3-Color DFS Cycle Detection] ──> [Acyclic DAG Projection]
                                            │
                                            ▼
                               [Kahn's Topological Sort]
                                            │
                                            ▼
                               [Deterministic Traffic Propagation]
                                  ├─ Base Capacities (LB: 2M, DB: 120k)
                                  ├─ Workload Forwarding (Read/Write Ratios)
                                  └─ Replication Fan-out
                                            │
                                            ▼
                               [Stress Calculation & Bottleneck Risk]
                                            │
                                            ▼
                               [Multi-Tier RPS Sweep (1k ──> 2M RPS)]
                                            │
                                            ▼
                               [Max Safe RPS & Rubric Feedback]
```

### 1. Graph Projection & Cycle Prevention
The graph engine analyzes canvas nodes and connections:
- Identifies entry nodes (e.g., Client, DNS) with in-degree 0.
- Runs a 3-color DFS traversal (`unvisited`, `visiting`, `visited`) to detect back-edges, extracting an acyclic projection to prevent infinite simulation loops while preserving cross-branch fanouts.
- Orders reachable components using Kahn's topological sort algorithm.

### 2. Workload & Forwarding Ratios
Traffic is forwarded through nodes based on component role and workload hints:
- **Cache Nodes:** Under `READ_HEAVY` workloads, 85% of traffic is absorbed (15% forwarded to DB); under `WRITE_HEAVY`, 85% is forwarded directly.
- **Queue Nodes:** Absorbs incoming bursts up to 100k RPS and buffers excess load, preventing downstream worker saturation.
- **Database Nodes:** Base capacity of 120,000 RPS. Calculates stress $\sigma = \text{incomingRps} / \text{capacityRps}$. Overload triggers at $\sigma > 1.35$.

### 3. Automated LLM Architecture Evaluation
When submitted, `src/lib/services/architecture-evaluation-service.ts` validates payload byte caps (Max 50 nodes, 100 edges, 64KB serialized payload, 128KB prompt limit) and streams a structured rubric across 7 architectural pillars (Scalability, Reliability, Availability, Performance, Security, Maintainability, Cost Optimization) via `streamObject` + Gemini 3.1 Flash Lite.

---

## Key Design Decisions & Trade-offs

| Decision | Why | Alternative Considered | Trade-off Accepted |
| :--- | :--- | :--- | :--- |
| **Client-direct WebSocket STT via ephemeral token** | Eliminates server hop latency (~150–300ms reduction); removes media bandwidth from Next.js server. | Proxying audio through a custom Node.js WebSocket gateway. | Client manages WebSocket lifecycle and holds short-lived scoped project credentials. |
| **Sentence-chunked parallel TTS** | Cuts Time-To-First-Speech from ~3,000ms to ~850ms by synthesizing speech while LLM is still generating. | Waiting for complete LLM response before initiating TTS. | Requires complex sequence tracking, punctuation lookaheads, and out-of-order chunk assembly. |
| **SSE for AI responses vs. Bidirectional WebSockets** | Native HTTP/2 multiplexing, zero custom socket infrastructure, built-in edge proxy support. | Full-duplex WebSocket connection for entire session. | Unidirectional downstream transport requires a separate HTTP `DELETE` endpoint for barge-in cancellations. |
| **`AudioContext` scheduling over `<audio>` DOM elements** | Guarantees microsecond-accurate gapless audio stitching and instant hardware gain/stop controls. | Chained HTML5 `<audio>` elements or MediaSource Extensions. | Higher JavaScript memory footprint and requires handling browser mobile autoplay unlock policies. |
| **Deterministic Client-Side Graph Simulator** | Delivers instant (<5ms) interactive stress feedback as users drag and connect nodes without LLM latency. | Sending graph snapshots to an LLM for all capacity calculations. | Uses heuristic capacity profiles rather than actual distributed systems micro-benchmarks. |
| **oRPC for RPC API Layer** | End-to-end type safety, native Zod validation, automatic OpenAPI generation, and first-class React Query bindings. | tRPC or manual Next.js REST Route Handlers. | Smaller ecosystem than tRPC, though offers significantly cleaner contract interfaces. |

---

## Scalability & Latency Breakdown

### End-to-End Latency Budget (Target: < 1,000ms P50)

```
[Candidate Stops Speaking]
       │
       ├─ (500ms) ── Deepgram VAD Silence Endpointing
       ├─ ( 80ms) ── Deepgram Nova-3 Final Transcript Event
       ├─ ( 30ms) ── Network Transit (Client ──> Next.js SSE Endpoint)
       ├─ (150ms) ── Google Gemini 3.1 Flash Lite Time-To-First-Token
       ├─ ( 10ms) ── SentenceChunker Clause Boundary Detection (6 words)
       ├─ (120ms) ── Deepgram Aura TTS Synthesis (Sentence 1)
       └─ ( 15ms) ── Web Audio decodeAudioData & Lookahead Schedule
       │
[Candidate Hears First Audio Sample] ── Total: ~905ms P50
```

| Pipeline Stage | P50 Latency | P95 Latency | Optimization Mechanism |
| :--- | :--- | :--- | :--- |
| **VAD Silence Detection** | `500 ms` | `500 ms` | Configured via `DEEPGRAM_ENDPOINTING_MS = 500`. |
| **STT Finalization** | `80 ms` | `150 ms` | Continuous streaming Deepgram Nova-3 WebSocket. |
| **Network Transport (Client $\rightarrow$ Server)** | `30 ms` | `80 ms` | HTTP/2 persistent connection reuse. |
| **LLM Time-To-First-Token (TTFT)** | `150 ms` | `300 ms` | Gemini 3.1 Flash Lite execution via Google Generative AI SDK. |
| **Sentence Boundary Detection** | `10 ms` | `20 ms` | Clause-level regex splitting on first chunk (6-word limit). |
| **TTS Chunk Synthesis (Chunk 1)** | `120 ms` | `220 ms` | Deepgram Aura HTTP API (`mp3` 128kbps, Orpheus voice). |
| **Client Audio Decode & Schedule** | `15 ms` | `35 ms` | Native asynchronous `decodeAudioData` in Web Audio. |
| **Total Voice-to-Voice Turnaround** | **`905 ms`** | **`1,305 ms`** | **Pipelined parallel execution across all stages.** |

---

## Failure Modes & Production Resilience

| Failure Mode | Root Cause | System Mitigation & Recovery Behavior |
| :--- | :--- | :--- |
| **STT WebSocket Disconnect** | Network blip or client WiFi drop. | Exponential backoff retry in `useLiveSTT` (3 attempts: 1s, 2s, 4s). Partial transcript is salvaged and preserved. |
| **Microphone Permission Denied** | Browser permission blocked or non-HTTPS host. | `isMicError()` detects permanent hardware/permission errors; aborts retry loops and surfaces immediate actionable UI toast. |
| **Mid-Stream Candidate Barge-In** | Candidate speaks during AI response. | AudioContext stops sources in < 10ms; client fires `DELETE /api/interview/chat/stream`; DB transaction drops orphaned assistant record. |
| **LLM Rate Limit / Timeout** | Upstream Gemini API timeout or quota exhaust. | SSE stream emits `event: error`; client restores user message to input buffer so candidate answer is never lost. |
| **TTS Chunk Synthesis Failure** | Deepgram TTS 15s timeout on single sentence. | Injects zero-byte silence buffer to preserve chunk index mapping without stalling downstream sentence playback. |
| **Audio Asset 404 on Playback** | S3 background upload delayed or missing key. | Asset proxy route `/api/media/tts/[messageId]` verifies candidate ownership and resolves candidate `.mp3` / `.wav` keys via `HeadObjectCommand`. |

---

## Tech Stack & Rationale

- **Runtime & Package Manager:** [Bun](https://bun.sh/) — High-performance JavaScript runtime, fast package manager (`bun.lock`), and unified development tooling.
- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) — Server Components, streaming API route handlers, and edge proxy middleware.
- **UI Library:** [React 19](https://react.dev/) — Native Action hooks, concurrent rendering, and ref-stable state dispatchers.
- **Styling & Components:** [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) + [Framer Motion](https://www.framer.com/motion/) — Accessible component primitives with hardware-accelerated animations.
- **Language & Type Safety:** [TypeScript 5](https://www.typescriptlang.org/) — Strict mode with shared end-to-end schema validation.
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) + [Prisma 7](https://www.prisma.io/) — Relational data modeling with `pgvector` preview extensions and `@prisma/adapter-pg`.
- **API Layer:** [oRPC](https://orpc.org/) — End-to-end type-safe RPC client/server with Zod schema validation.
- **AI Engine:** [Google Gemini 3.1 Flash Lite](https://ai.google.dev/) via [Vercel AI SDK Core](https://sdk.vercel.ai/) — Optimized for high throughput, sub-200ms TTFT, and structured JSON output.
- **Speech Infrastructure:** [Deepgram SDK](https://deepgram.com/) — Nova-3 WebSocket for real-time STT; Aura (`aura-orpheus-en`) for conversational low-latency TTS.
- **Diagramming & Canvas:** [@xyflow/react](https://reactflow.dev/) — Interactive node-based canvas for real-time system design graph editing.
- **Authentication:** [Better Auth](https://better-auth.com/) — Secure cookie sessions, OAuth 2.0 (Google, GitHub), and admin plugin support.
- **Billing & Subscriptions:** [Stripe](https://stripe.com/) — Webhook-driven subscription lifecycle management and tiered feature entitlements.
- **Object Storage:** [AWS S3 SDK](https://aws.amazon.com/s3/) — Presigned multipart uploads and streaming audio archive storage.
- **Linter & Formatter:** [Biome](https://biomejs.dev/) — Rust-based high-speed linting and formatting.

---

## Local Setup & Verification

### Prerequisites
- **Runtime & Package Manager:** [Bun](https://bun.sh/) (`v1.1.x` or higher)
- **Database:** PostgreSQL instance (local or hosted via Supabase / Neon)
- **API Keys:** Google Gemini, Deepgram, AWS S3, GitHub/Google OAuth

### 1. Clone & Install
```bash
git clone https://github.com/theeaashish/RoundZero.git
cd RoundZero
bun install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/roundzero?schema=public"

# Better Auth & Application URLs
BETTER_AUTH_SECRET="your-32-character-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI & Speech Services
GEMINI_API_KEY="your-gemini-api-key"
DEEPGRAM_API_KEY="your-deepgram-api-key"
DEEPGRAM_PROJECT_ID="your-deepgram-project-id"

# Object Storage (AWS S3 or S3-Compatible)
S3_BUCKET_NAME="your-bucket-name"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
S3_REGION="us-east-1"
S3_ENDPOINT="https://s3.us-east-1.amazonaws.com"

# Stripe Billing (Optional for local development)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_ROUNZERO_PRO_PRICE_ID="price_..."
NEXT_PUBLIC_ROUNZERO_ELITE_PRICE_ID="price_..."
```

### 3. Initialize Database & Generate Types
```bash
bun run db:push
bun run db:generate
```

### 4. Run Development Server
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Known Limitations & Engineering Roadmap

- **Browser Autoplay Security Constraints:** Modern browsers block `AudioContext` playback before direct user interaction. If an interview begins without prior click events, the audio pipeline pre-warms silently until the user interacts with the page or toggles the mic.
- **Single-Region TTS Endpoints:** Deepgram TTS synthesis routes through multi-region primary gateways. In distant geographic locations (e.g., APAC to US-East), RTT adds ~100–180ms to the first audio chunk.
- **Monolithic Post-Interview Evaluation:** Comprehensive 5-category scoring and transcript summaries currently run in a single structured LLM pass, taking ~4–6s for 45-minute interviews.
- **Engineering Roadmap:**
  - [ ] WebRTC DataChannel transport alternative for sub-500ms voice pipelines.
  - [ ] Client-side WebAssembly Silero VAD to minimize false wakeups on noisy laptop microphones.
  - [ ] Real-time collaborative whiteboard mode with live AI architectural probing.
  - [ ] Distributed Redis cluster for active session locking and token bucket rate limiting.

---

## License

This project is proprietary and confidential. All rights reserved.
