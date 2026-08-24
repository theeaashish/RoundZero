"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { UpgradePlanDialog } from "@/components/upgrade-plan-dialog";
import type { AnalyticsData, Period } from "../_hooks/use-analytics";
import { AnalyticsReportPDF } from "./analytics-pdf-report";

const emptySubscribe = () => () => {};

interface ExportButtonProps {
  data?: AnalyticsData;
  isLoading: boolean;
  period: Period;
  canExport: boolean;
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

export function ExportButton({
  data,
  isLoading,
  period,
  canExport,
}: ExportButtonProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  if (!isClient || isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Export
      </Button>
    );
  }

  if (!data || !canExport) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUpgradeDialog(true)}
        >
          <Download className="mr-2 h-4 w-4" />
          Upgrade to export
        </Button>

        <UpgradePlanDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          title="Unlock analytics export"
          description="PDF analytics export is available on Pro and Elite plans."
          detail="Upgrade your plan to download polished analytics reports for review, coaching, or interview prep tracking."
          ctaLabel="Open billing"
        />
      </>
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
