"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { CategoryScores } from "@/server/routers/interview/schemas";
import { InterviewReportPDF } from "./pdf-report";

const emptySubscribe = () => () => {};

interface PDFDownloadButtonProps {
  interview: {
    jobTitle: string;
    startedAt: Date;
  };
  report: {
    summary: string;
    overallScore: number;
    categoryScores: CategoryScores;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
}

export function PDFDownloadButton({
  interview,
  report,
}: PDFDownloadButtonProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!isClient) {
    return (
      <Button variant="outline" size="sm" className="shadow-sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Export
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={
        <InterviewReportPDF
          report={report}
          jobTitle={interview.jobTitle}
          interviewDate={interview.startedAt}
        />
      }
      fileName={`interview-report-${interview.jobTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          className="shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      )}
    </PDFDownloadLink>
  );
}
