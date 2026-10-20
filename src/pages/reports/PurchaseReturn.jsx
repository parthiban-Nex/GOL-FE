import { useState } from "react";
import ReportFilterCard from "@/components/reports/ReportFilterCard";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { purchaseReturnApi } from "@/services";
import { showToast } from "@/utils/toast";

const MAX_RANGE_DAYS = 31; // same limit as the old report
const FILE_NAME = "PurchaseReturnReport.xlsx"; // same file name as the old report

const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const today = () => toISODate(new Date());
const startOfMonth = () => {
  const d = new Date();
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
};

// inclusive number of days between two YYYY-MM-DD strings
const daysInRange = (from, to) =>
  Math.round((new Date(to) - new Date(from)) / 86400000) + 1;

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

const fields = [
  { name: "fromDate", label: "From Date", type: "date" },
  { name: "toDate", label: "To Date", type: "date" },
];

export default function PurchaseReturn() {
  const { canRead } = usePagePermissions();
  const [values, setValues] = useState({
    fromDate: startOfMonth(),
    toDate: today(),
  });
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    const { fromDate, toDate } = values;

    if (!fromDate || !toDate) {
      showToast.error("Select a date range.");
      return;
    }
    if (fromDate > toDate) {
      showToast.error("From Date can't be after To Date.");
      return;
    }
    if (daysInRange(fromDate, toDate) > MAX_RANGE_DAYS) {
      showToast.error(`Max ${MAX_RANGE_DAYS} days allowed.`);
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await purchaseReturnApi.getPurchaseReturnReport({
        fromDate,
        toDate,
      });

      // If the server sent a JSON error body instead of a file, show its message
      if (blob.type?.includes("json")) {
        const err = JSON.parse(await blob.text());
        showToast.error(err.message || "An unexpected error occurred.");
        return;
      }

      downloadBlob(blob, FILE_NAME);
      showToast.success("Purchase return report downloaded successfully.");
    } catch (err) {
      showToast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <ReportFilterCard
      title="Purchase Return Statement"
      fields={fields}
      values={values}
      onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
      onDownload={handleDownload}
      isDownloading={isDownloading}
      canDownload={canRead}
    />
  );
}