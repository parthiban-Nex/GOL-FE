import { useState } from "react";
import { Filter, RotateCcw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const MAKE_OPTIONS = [
  { value: "ALL", label: "All Makes" },
  { value: "TATA", label: "TATA" },
  { value: "FORD", label: "FORD" },
  { value: "HONDA", label: "HONDA" },
  { value: "BMW", label: "BMW" },
  { value: "Hyundai", label: "Hyundai" },
];

const VENDOR_OPTIONS = [
  { value: "ALL", label: "All Vendors" },
  { value: "8784", label: "8784 - TVS Automobile Spares" },
  { value: "RA-14", label: "RA-14 - Royal Auto Spares" },
  { value: "RA-15", label: "RA-15 - Apex Component Hub" },
  { value: "RA-16", label: "RA-16 - Vellore Brake Distributors" },
  { value: "RA-17", label: "RA-17 - TVS Mobility Spares" },
  { value: "RA-18", label: "RA-18 - Precision OEM Parts" },
  { value: "RA-19", label: "RA-19 - Bosch Authorized Partner" },
  { value: "X934-44", label: "X934-44 - HOOR AUTOPARTS" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "Completed", label: "Completed" },
  { value: "Open", label: "Open" },
];

const TITLES = {
  "spare-issue": "Filter Spare Issues",
  "purchase-order": "Filter Purchase Orders",
  "auto-grn": "Filter Auto GRN Records",
  "grn-direct": "Filter GRN Direct Records",
};

function emptyFiltersFor(type) {
  if (type === "spare-issue") {
    return { make: "ALL", approvedOnly: false, fromDate: "", toDate: "" };
  }
  if (type === "purchase-order") {
    return { vendorCode: "ALL", fromDate: "", toDate: "" };
  }
  if (type === "auto-grn") {
    return { vendorCode: "ALL", status: "ALL", fromDate: "", toDate: "" };
  }
  return {
    vendorCode: "ALL",
    fromDate: "",
    toDate: "",
    minTotal: "",
    maxTotal: "",
  };
}

export default function PartsFilterModal({
  isOpen,
  onClose,
  type = "spare-issue", // "spare-issue" | "grn-direct" | "auto-grn" | "purchase-order"
  filters,
  onApply,
  onReset,
}) {
  const [localFilters, setLocalFilters] = useState(filters || {});

  if (!isOpen) return null;

  function handleChange(key, value) {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    const empty = emptyFiltersFor(type);
    setLocalFilters(empty);
    onReset?.(empty);
  }

  function handleApply() {
    onApply?.(localFilters);
    onClose?.();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <span className="inline-flex items-center gap-2">
          <Filter className="h-4 w-4 text-brand-600" />
          {TITLES[type] ?? TITLES["grn-direct"]}
        </span>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          {/* <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-800 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button> */}
          <div className="flex gap-2">
            <Button variant="secondary"  onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {type === "spare-issue" ? (
          <>
            <Select
              label="Vehicle Make"
              value={localFilters.make || "ALL"}
              onChange={(e) => handleChange("make", e.target.value)}
              options={MAKE_OPTIONS}
            />

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="filter-approved"
                checked={Boolean(localFilters.approvedOnly)}
                onChange={(e) => handleChange("approvedOnly", e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
              />
              <label
                htmlFor="filter-approved"
                className="text-sm font-medium text-ink-700 cursor-pointer"
              >
                Show Only Approved Parts
              </label>
            </div>
          </>
        ) : (
          <>
            <Select
              label="Vendor Code"
              value={localFilters.vendorCode || "ALL"}
              onChange={(e) => handleChange("vendorCode", e.target.value)}
              options={VENDOR_OPTIONS}
            />

            {type === "auto-grn" && (
              <Select
                label="Status"
                value={localFilters.status || "ALL"}
                onChange={(e) => handleChange("status", e.target.value)}
                options={STATUS_OPTIONS}
              />
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="From Date"
            value={localFilters.fromDate || ""}
            onChange={(e) => handleChange("fromDate", e.target.value)}
          />
          <Input
            type="date"
            label="To Date"
            value={localFilters.toDate || ""}
            onChange={(e) => handleChange("toDate", e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
