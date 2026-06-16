# Interview Context Documentation

The `interview-context.tsx` file provides a centralized state management system for the interview experience. It handles real-time chat, audio recording (STT), media playback, and interview lifecycle management (start/end).

## Overview
This module uses React Context to expose interview-related state and actions to the component tree. It integrates with `@ai-sdk/react` for streaming chat responses and a custom `useInterviewMedia` hook for handling microphone input and audio output.

## Key Components

### `InterviewContextProvider`
The provider component that wraps the interview interface. It manages:
*   **Chat State:** Uses `useChat` with a custom `DefaultChatTransport` to stream messages to the backend.
*   **Interview Lifecycle:** Tracks status (`SETUP`, `IN_PROGRESS`, `COMPLETED`) and handles transitions.
*   **Media Integration:** Manages microphone toggling, STT (Speech-to-Text) connection, and audio playback.
*   **Auto-Submission:** Automatically sends the transcript to the AI if the user stops speaking for a defined idle period (`AUTO_SUBMIT_IDLE_MS`).

### `useInterview`
A custom hook used by child components to consume the `InterviewContext`. It throws an error if used outside of the `InterviewContextProvider`.

## Core Functionality

### 1. Chat Management
*   **Streaming:** Messages are streamed via `/api/interview/chat/stream`.
*   **Metadata:** Supports attaching `codeSnippet`, `language`, and `audioUrl` to messages via the `interviewMessageMetadataSchema`.
*   **Message Normalization:** Includes utility functions (`toClientMessage`, `toUIMessage`) to bridge the gap between the AI SDK's `UIMessage` format and the application's internal `Message` type.

### 2. Interview Lifecycle
*   **`startInterview`**: Initializes the interview session via an ORPC mutation and triggers the initial STT connection.
*   **`endInterview`**: Stops all media, finalizes the session on the server, and redirects the user to the report page.

### 3. Media & STT
*   **Auto-Connect:** Automatically attempts to connect to the STT service when the interview status changes to `IN_PROGRESS`.
*   **Transcript Handling:** Manages both `transcript` (finalized text) and `interimTranscript` (real-time partial text).
*   **Auto-Submit:** Monitors the transcript; if the user is silent for 2.2 seconds, the current transcript is automatically sent as a message to the AI.

## Usage Example

```tsx
"use client";

import { useInterview } from "./_context/interview-context";

const InterviewComponent = () => {
  const { messages, sendMessage, isResponding, status } = useInterview();

  return (
    <div>
      <p>Status: {status}</p>
      {/* Render messages and input controls */}
      <button 
        disabled={isResponding} 
        onClick={() => sendMessage("Hello!")}
      >
        Send
      </button>
    </div>
  );
};
```

## Dependencies
*   **`@ai-sdk/react`**: Handles the chat streaming logic.
*   **`@tanstack/react-query`**: Manages server state for interview data and mutations.
*   **`orpc`**: Used for type-safe API communication with the backend.
*   **`useInterviewMedia`**: Custom hook for browser media APIs (Web Audio/MediaRecorder).