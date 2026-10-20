import { useState } from "react";
import ReportFilterCard from "@/components/reports/ReportFilterCard";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { grnApi } from "@/services";
import { showToast } from "@/utils/toast";

const FILE_NAME = "StockPositionReport.xlsx"; // same file name as the old report

// same flow as the old page: object URL -> hidden link -> click -> cleanup
const downloadBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// old report had no filters (date fields were commented out)
const fields = [];

export default function StockPosition() {
  const { canRead } = usePagePermissions();
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const blob = await grnApi.getStockPositionReport();

      // If the server sent a JSON error body instead of a file, show its message
      if (blob.type?.includes("json")) {
        const err = JSON.parse(await blob.text());
        showToast.error(err.message || "An unexpected error occurred.");
        return;
      }

      downloadBlob(blob, FILE_NAME);
      showToast.success("Stock position report downloaded successfully.");
    } catch (err) {
      showToast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <ReportFilterCard
      title="Stock Position Report"
      fields={fields}
      values={{}}
      onChange={() => {}}
      onDownload={handleDownload}
      isDownloading={isDownloading}
      canDownload={canRead}
    />
  );
}