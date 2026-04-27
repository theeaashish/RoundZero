"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalyticsData, Period } from "../_hooks/useAnalytics";
import { AnalyticsReportPDF } from "./analytics-pdf-report";

interface ExportButtonProps {
  data?: AnalyticsData;
  isLoading: boolean;
  period: Period;
}

const getPeriodLabel = (period: Period) => {
  switch (period) {
    case "7d":
      return "Last 7 Days";
    case "30d":
      return "Last 30 Days";
    case "90d":
      return "Last 90 Days";
    case "all":
      return "All Time";
    default:
      return "Analytics Report";
  }
};

export function ExportButton({ data, isLoading, period }: ExportButtonProps) {
  const isClient = typeof window !== "undefined";

  if (!isClient || isLoading || !data || !data.canExport) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Export
      </Button>
    );
  }

  const periodLabel = getPeriodLabel(period);
  const fileName = `roundzero-analytics-${period}.pdf`;

  return (
    <PDFDownloadLink
      document={<AnalyticsReportPDF data={data} periodLabel={periodLabel} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button className="cursor-pointer" variant="outline" disabled={loading}>
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
