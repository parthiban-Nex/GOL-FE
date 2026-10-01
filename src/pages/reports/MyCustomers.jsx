import { useCallback, useState } from "react";
import { Eye } from "lucide-react";
import ReportTableCard from "@/components/reports/ReportTableCard";
import RecordFormModal from "@/components/common/RecordFormModal";
import { useServerTable } from "@/hooks/useServerTable";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { customerApi } from "@/services";
import { extractList } from "@/utils/apiResponse";
import { downloadCsv } from "@/utils/exportCsv";
import { formatPhone, truncate } from "@/utils/formatters";
import { showToast } from "@/utils/toast";

const name = (row) =>
  row.customerName?.trim() ||
  [row.firstName, row.lastName].filter(Boolean).join(" ") ||
  "-";
const address = (row) =>
  [row.address1, row.address2].filter(Boolean).join(", ");

/** Export columns = what the grid shows. Make / Model / Fuel are vehicle
 * fields; listCustomers doesn't join them, so they export blank. */
const EXPORT_COLUMNS = [
  { key: "name", header: "Name", value: name },
  { key: "mobileNumber", header: "Mobile" },
  { key: "pinCode", header: "Pincode" },
  { key: "address", header: "Address", value: address },
  { key: "regNo", header: "Reg.No." },
  { key: "make", header: "Make" },
  { key: "model", header: "Model" },
  { key: "fuel", header: "Fuel" },
];

const VIEW_FIELDS = [
  { name: "customerCode", label: "Customer Code" },
  { name: "firstName", label: "First Name" },
  { name: "lastName", label: "Last Name" },
  { name: "mobileNumber", label: "Mobile" },
  { name: "pinCode", label: "Pincode" },
  { name: "address1", label: "Address" },
  { name: "regNo", label: "Reg.No." },
];


export default function MyCustomers() {
  const { canRead } = usePagePermissions();
  const [searchInput, setSearchInput] = useState("");
  const [viewTarget, setViewTarget] = useState(null);

  const list = useCallback((body) => customerApi.list(body), []);
  const {
    rows,
    totalItems,
    totalPages,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    searchKey,
  } = useServerTable(list, customerApi.listKey);

  async function handleDownload() {
    try {
      // Export everything matching the search, not just the visible page.
      const response = await customerApi.list({
        limit: Math.max(totalItems, 1),
        offset: 0,
        searchKey,
      });
      const all = extractList(response, customerApi.listKey);
      if (!all.length) {
        showToast.error("Nothing to download.");
        return;
      }
      downloadCsv("my_customers", all, EXPORT_COLUMNS);
    } catch (err) {
      showToast.error(err.message || "Couldn't download customers.");
    }
  }

  const columns = [
    { key: "name", header: "Name", render: name },
    {
      key: "mobileNumber",
      header: "Mobile",
      render: (row) => (row.mobileNumber ? row.mobileNumber : "-"),
    },
    { key: "pinCode", header: "Pincode", render: (row) => row.pinCode || "-" },
    {
      key: "address",
      header: "Address",
      render: (row) => (
        <span title={address(row)}>{truncate(address(row), 30) || "-"}</span>
      ),
    },
    { key: "regNo", header: "Reg.No.", render: (row) => row.regNo || "-" },
    { key: "make", header: "Make", render: (row) => row.make || "-" },
    { key: "model", header: "Model", render: (row) => row.model || "-" },
    { key: "fuel", header: "Fuel", render: (row) => row.fuel || "-" },
    ...(canRead
      ? [
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <button
                type="button"
                onClick={() => setViewTarget(row)}
                className="cursor-pointer text-brand-600 hover:text-brand-800"
                aria-label={`View ${name(row)}`}
              >
                <Eye className="h-4 w-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <ReportTableCard
        title="My Customer"
        searchPlaceholder="Search Mobile No or Vehicle Reg No"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearch={() => search(searchInput.trim())}
        onDownload={handleDownload}
        canDownload={canRead}
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyTitle="No customers found"
        emptyDescription="Try a different mobile number or registration."
        pagination={{
          page,
          totalPages,
          totalItems,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

      <RecordFormModal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        title="Customer Details"
        mode="view"
        fields={VIEW_FIELDS}
        record={viewTarget}
      />
    </>
  );
}
