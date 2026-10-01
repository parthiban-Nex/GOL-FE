import { useState } from "react";
import ReportFilterCard from "@/components/reports/ReportFilterCard";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { reportsApi } from "@/services";
import { extractList } from "@/utils/apiResponse";
import { downloadCsv, filterByDateRange } from "@/utils/exportCsv";
import { showToast } from "@/utils/toast";

/** Report types with a real endpoint behind them. Add a row here to add
 * a report - the page needs no other change. */
const REPORT_TYPES = [
  {
    value: "stock-adjustment",
    label: "Stock Adjustment",
    fetch: reportsApi.stockAdjustment,
  },
  {
    value: "stock-position",
    label: "Stock Position",
    fetch: reportsApi.stockPosition,
  },
];

const today = () => new Date().toISOString().slice(0, 10);


export default function OtherReports() {
  const { canRead } = usePagePermissions();
  const [values, setValues] = useState({
    reportType: REPORT_TYPES[0].value,
    fromDate: today(),
    toDate: today(),
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const fields = [
    {
      name: "reportType",
      label: "Select Report Type",
      type: "select",
      options: REPORT_TYPES.map(({ value, label }) => ({ value, label })),
    },
    { name: "fromDate", label: "From Date", type: "date" },
    { name: "toDate", label: "To Date", type: "date" },
  ];

  async function handleDownload() {
    const report = REPORT_TYPES.find((r) => r.value === values.reportType);
    if (!report) {
      showToast.error("Select a report type.");
      return;
    }
    if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
      showToast.error("From Date can't be after To Date.");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await report.fetch({
        fromDate: values.fromDate,
        toDate: values.toDate,
      });
      const rows = filterByDateRange(
        extractList(response, "data"),
        values.fromDate,
        values.toDate,
      );
      if (!rows.length) {
        showToast.error("No records found for the selected range.");
        return;
      }
      downloadCsv(`${report.value}_${values.fromDate}_${values.toDate}`, rows);
    } catch (err) {
      showToast.error(err.message || "Couldn't download the report.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <ReportFilterCard
      title="Reports"
      fields={fields}
      values={values}
      onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
      onDownload={handleDownload}
      isDownloading={isDownloading}
      canDownload={canRead}
    />
  );
}
