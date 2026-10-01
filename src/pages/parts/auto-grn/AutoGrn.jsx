import { useState } from "react";
import { Search, Filter, Plus, Eye } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import IconAction from "@/components/ui/IconAction";
import { useGrnList } from "@/hooks/useGrnList";
import { formatINR } from "@/utils/estimateMath";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { partsApi } from "@/services";
import { showToast } from "@/utils/toast";
import AddAutoGrnModal from "./AddAutoGrnModal";
import ViewGrnModal from "@/components/parts/ViewGrnModal";
import PartsFilterModal from "@/components/parts/PartsFilterModal";

const SEARCH_DEBOUNCE_MS = 400;

export default function AutoGrn() {
  const { canCreate, canRead } = usePagePermissions();

  const [isAddAutoGrnOpen, setIsAddAutoGrnOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewingGrn, setViewingGrn] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // POST /parts/GRN - server paging + search; vendor / date filters on
  // the loaded page.
  const {
    pageItems,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    refetch,
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    activeFilterCount,
  } = useGrnList();

  async function handleCreateGrn(formData) {
    setIsSubmitting(true);
    try {
      const newRec = await partsApi.createAutoGrn(formData);
      showToast.success(`Auto GRN ${newRec.grnNumber} created successfully`);
      setIsAddAutoGrnOpen(false);
      refetch();
    } catch (err) {
      showToast.error(err.message || "Failed to create Auto GRN");
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns = [
    {
      key: "grnNumber",
      header: "GRN Number",
      render: (row) => (
        <span className="font-semibold text-brand-900">{row.grnNumber}</span>
      ),
    },
    { key: "vendorCode", header: "Vendor Code" },
    { key: "invoiceDate", header: "Invoice Date" },
    { key: "supplierInvoiceNumber", header: "Supplier Invoice Number" },
    {
      key: "grandTotal",
      header: "Grand Total",
      render: (row) => (
        <span className="font-bold text-ink-900">
          {formatINR(row.grandTotal)}
        </span>
      ),
    },
    // The column disappears entirely for a role with no Read access,
    // rather than rendering an empty header over blank cells.
    ...(canRead
      ? [
          {
            key: "action",
            header: "Action",
            align: "center",
            render: (row) => (
              <div className="flex ">
                <IconAction
                  icon={Eye}
                  label="View Inward Note"
                  tone="brand"
                  onClick={() => setViewingGrn(row)}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink-800">Auto GRN</h1>
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsAddAutoGrnOpen(true)}>
            Add Auto GRN
          </Button>
        )}
      </div>

      <Card padded={false}>
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="max-w-sm flex-1">
            <Input
              icon={Search}
              placeholder="Search GRN, Invoice No, Vendor"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`rounded-md border p-2 transition-colors cursor-pointer ${
              activeFilterCount > 0
                ? "border-accent-500 bg-accent-50 text-accent-600"
                : "border-ink-200 text-ink-600 hover:bg-ink-50"
            }`}
            title="Filter"
            aria-label="Filter"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <Table
          columns={columns}
          data={pageItems}
          isLoading={isLoading}
          getRowId={(row) => row.id ?? row.grnNumber}
          emptyTitle="No Auto GRN records found"
          emptyDescription="Try a different search or clear the filters."
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <AddAutoGrnModal
        isOpen={isAddAutoGrnOpen}
        onClose={() => setIsAddAutoGrnOpen(false)}
        onSubmit={handleCreateGrn}
        isSubmitting={isSubmitting}
      />

      <ViewGrnModal
        isOpen={Boolean(viewingGrn)}
        onClose={() => setViewingGrn(null)}
        grn={viewingGrn}
      />

      <PartsFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        type="auto-grn"
        filters={filters}
        onApply={(f) => setFilters({ ...filters, ...f })}
        onReset={(f) => setFilters(f)}
      />
    </div>
  );
}
