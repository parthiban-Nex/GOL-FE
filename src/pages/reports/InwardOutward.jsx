import { useState } from "react";
import ReportFilterCard from "@/components/reports/ReportFilterCard";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { reportsApi, vendorApi } from "@/services";
import { extractList } from "@/utils/apiResponse";
import { downloadCsv, filterByDateRange } from "@/utils/exportCsv";
import { showToast } from "@/utils/toast";

const today = () => new Date().toISOString().slice(0, 10);
const contains = (value, needle) =>
  String(value ?? "")
    .toLowerCase()
    .includes(needle.toLowerCase());

/**
 * Reports > Inward/Outward.
 *
 * Inward = stock received by transfer, POST /parts/GetStockTransferInwardReport.
 * That service ignores the request body, so date, vendor, part name and
 * part number are all applied to the returned rows before export.
 *
 * Outward has NO endpoint under /api/parts - selecting it says so rather
 * than downloading an empty or invented file.
 */
export default function InwardOutward() {
  const { canRead } = usePagePermissions();
  const vendorOptions = useDropdownOptions(
    () => vendorApi.list({ limit: 1000, offset: 0 }),
    (v) => ({ value: v.vendorName, label: v.vendorName }),
    vendorApi.listKey,
  );

  const [values, setValues] = useState({
    reportType: "inward",
    fromDate: today(),
    toDate: today(),
    vendor: "",
    partName: "",
    partNumber: "",
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const fields = [
    {
      name: "reportType",
      label: "Select Report Type",
      type: "select",
      options: [
        { value: "inward", label: "Inward" },
        { value: "outward", label: "Outward" },
      ],
    },
    { name: "fromDate", label: "From Date", type: "date" },
    { name: "toDate", label: "To Date", type: "date" },
    {
      name: "vendor",
      label: "Select Vendor",
      type: "select",
      options: vendorOptions,
      placeholder: "All vendors",
    },
    { name: "partName", label: "Part Name", type: "text", placeholder: "Any" },
    {
      name: "partNumber",
      label: "Part Number",
      type: "text",
      placeholder: "Any",
    },
  ];

  async function handleDownload() {
    if (values.reportType === "outward") {
      showToast.error("The Outward report has no backend endpoint yet.");
      return;
    }
    if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
      showToast.error("From Date can't be after To Date.");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await reportsApi.stockTransferInward({});
      let rows = filterByDateRange(
        extractList(response, "data"),
        values.fromDate,
        values.toDate,
      );
      if (values.vendor) {
        rows = rows.filter((r) =>
          contains(r.vendorName ?? r.vendor_name, values.vendor),
        );
      }
      if (values.partName.trim()) {
        rows = rows.filter((r) =>
          contains(
            r.item_description ?? r.partName ?? r.itemName,
            values.partName.trim(),
          ),
        );
      }
      if (values.partNumber.trim()) {
        rows = rows.filter((r) =>
          contains(
            r.item_code ?? r.partNumber ?? r.itemCode,
            values.partNumber.trim(),
          ),
        );
      }

      if (!rows.length) {
        showToast.error("No records found for these filters.");
        return;
      }
      downloadCsv(`inward_${values.fromDate}_${values.toDate}`, rows);
    } catch (err) {
      showToast.error(err.message || "Couldn't download the report.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <ReportFilterCard
      title="Inward/Outward"
      fields={fields}
      values={values}
      onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
      onDownload={handleDownload}
      isDownloading={isDownloading}
      canDownload={canRead}
    />
  );
}
