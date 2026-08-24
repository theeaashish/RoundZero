"use client";

import { InterviewSession } from "./_components/interview-session";
import { InterviewContextProvider } from "./_context/interview-context";

export default function InterviewPage() {
  return (
    <InterviewContextProvider>
      <InterviewSession />
    </InterviewContextProvider>
  );
}
