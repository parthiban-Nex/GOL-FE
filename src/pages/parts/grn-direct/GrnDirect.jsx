import { useState } from "react";
import {
  Search,
  Filter,
  Printer,
  Eye,
  ShoppingCart,
  ScanLine,
  Plus,
} from "lucide-react";
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
import AddGrnModal from "./AddGrnModal";
import AddBulkCsvModal from "./AddBulkCsvModal";
import ViewGrnModal from "@/components/parts/ViewGrnModal";
import PartsFilterModal from "@/components/parts/PartsFilterModal";

const SEARCH_DEBOUNCE_MS = 400;

export default function GrnDirect() {
  const { canCreate, canRead } = usePagePermissions();

  const [isAddGrnOpen, setIsAddGrnOpen] = useState(false);
  const [isBulkCsvOpen, setIsBulkCsvOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewingGrn, setViewingGrn] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      const newRec = await partsApi.createGrnDirect(formData);
      showToast.success(`GRN ${newRec.grnNumber} created successfully`);
      setIsAddGrnOpen(false);
      refetch();
    } catch (err) {
      showToast.error(err.message || "Failed to create GRN");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadCsv(file) {
    setIsUploading(true);
    try {
      const res = await partsApi.uploadGrnBulkCsv(file);
      showToast.success(res.message || "CSV processed successfully");
      setIsBulkCsvOpen(false);
      refetch();
    } catch (err) {
      showToast.error(err.message || "Failed to import CSV");
    } finally {
      setIsUploading(false);
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
    {
      key: "poNumber",
      header: "PO Number",
      // Not in the /parts/GRN list - shown in View.
      render: (row) => (
        <span className="font-semibold text-brand-900">
          {row.poNumber || "-"}
        </span>
      ),
    },
    { key: "vendorCode", header: "Vendor Code" },
    { key: "supplierInvoiceNumber", header: "Supplier Invoice Number" },
    { key: "invoiceDate", header: "Invoice Date" },
    {
      key: "grandTotal",
      header: "Grand Total",
      render: (row) => (
        <span className="font-bold text-ink-900">
          {formatINR(row.grandTotal)}
        </span>
      ),
    },
    ...(canRead
      ? [
          {
            key: "action",
            header: "Action",

            render: (row) => (
              <div className="flex">
                <IconAction
                  icon={Printer}
                  label="Print GRN Slip"
                  tone="print"
                  disabled
                />
                <IconAction
                  icon={Eye}
                  label="View Inward Note"
                  tone="brand"
                  onClick={() => setViewingGrn(row)}
                />
                <IconAction
                  icon={ScanLine}
                  label="Scan Barcode"
                  tone="assign"
                  disabled
                />
                {row.hasCart && (
                  <IconAction
                    icon={ShoppingCart}
                    label="Purchase Cart"
                    tone="cart"
                    disabled={!canCreate}
                    onClick={
                      canCreate
                        ? () =>
                            showToast.success(
                              `Cart opened for PO ${row.poNumber}`,
                            )
                        : undefined
                    }
                  />
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-ink-800">GRN Direct</h1>
        {canCreate && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => setIsBulkCsvOpen(true)}
            >
              Add Bulk CSV
            </Button>
            <Button icon={Plus} onClick={() => setIsAddGrnOpen(true)}>
              Add GRN
            </Button>
          </div>
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
          emptyTitle="No GRN direct records found"
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

      <AddGrnModal
        isOpen={isAddGrnOpen}
        onClose={() => setIsAddGrnOpen(false)}
        onSubmit={handleCreateGrn}
        isSubmitting={isSubmitting}
      />

      <AddBulkCsvModal
        isOpen={isBulkCsvOpen}
        onClose={() => setIsBulkCsvOpen(false)}
        onUpload={handleUploadCsv}
        isUploading={isUploading}
      />

      <ViewGrnModal
        isOpen={Boolean(viewingGrn)}
        onClose={() => setViewingGrn(null)}
        grn={viewingGrn}
      />

      <PartsFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        type="grn-direct"
        filters={filters}
        onApply={(f) => setFilters({ ...filters, ...f })}
        onReset={(f) => setFilters(f)}
      />
    </div>
  );
}
