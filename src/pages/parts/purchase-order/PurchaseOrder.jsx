import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Filter, Pencil, Eye } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import IconAction from "@/components/ui/IconAction";
import { useServerTable } from "@/hooks/useServerTable";
import Badge from "@/components/ui/Badge";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { ddmmyyyyToIso, mapPoRow } from "@/utils/purchaseOrder";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { partsApi } from "@/services";
import { showToast } from "@/utils/toast";
import CreatePurchaseOrderModal from "./CreatePurchaseOrderModal";
import ViewPurchaseOrderModal from "./ViewPurchaseOrderModal";
import PartsFilterModal from "@/components/parts/PartsFilterModal";

const SEARCH_DEBOUNCE_MS = 400;

const STATUS_TONE = {
  Open: "brand",
  Approved: "success",
  "Partially Approved": "warning",
  "Grn Created": "neutral",
};

function TruncatedWithTooltip({ value, maxWidthClass }) {
  return (
    <div className={`group relative inline-block ${maxWidthClass}`}>
      <span className="block cursor-pointer truncate hover:text-brand-600">
        {value}
      </span>
      <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-xs font-medium text-white shadow-lg transition-opacity duration-150 group-hover:block">
        {value}
        <div className="absolute left-4 top-full -mt-1 border-4 border-transparent border-t-ink-900" />
      </div>
    </div>
  );
}

export default function PurchaseOrder() {
  const { canCreate, canRead, canUpdate } = usePagePermissions();

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ vendorCode: "ALL" });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState(null);
  const [viewingPo, setViewingPo] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // POST /purchaseOrder/getPO { limit, offset, searchKey }
  const fetchRows = useCallback((body) => partsApi.getPoList(body), []);
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
    refetch,
  } = useServerTable(fetchRows, partsApi.poListKey);

  useEffect(() => {
    const timer = setTimeout(
      () => search(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Vendor + Valid Till range are applied to the loaded page (getPO only
  // takes limit / offset / searchKey).
  const pageItems = useMemo(
    () =>
      rows.map(mapPoRow).filter((row) => {
        if (
          filters.vendorCode &&
          filters.vendorCode !== "ALL" &&
          row.vendorCode !== filters.vendorCode
        ) {
          return false;
        }
        const date = ddmmyyyyToIso(row.validTillDate);
        if (filters.fromDate && (!date || date < filters.fromDate))
          return false;
        if (filters.toDate && (!date || date > filters.toDate)) return false;
        return true;
      }),
    [rows, filters],
  );

  // POST /purchaseOrder/createPO (multipart podata / poparts / file) -
  // the same call creates and, with podata.id, updates.
  async function handleSavePo(payload) {
    setIsSubmitting(true);
    try {
      const response = await partsApi.savePo(payload);
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(response, "Failed to save Purchase Order"),
        );
        return;
      }
      showToast.success(
        responseMessage(
          response,
          editingPo
            ? `Purchase Order ${editingPo.poNumber || editingPo.id} updated`
            : "Purchase Order created successfully",
        ),
      );
      setIsCreateModalOpen(false);
      setEditingPo(null);
      refetch();
    } catch (err) {
      showToast.error(err.message || "Failed to save Purchase Order");
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeFilterCount =
    (filters.vendorCode !== "ALL" ? 1 : 0) +
    (filters.fromDate || filters.toDate ? 1 : 0);

  const columns = [
    {
      key: "poNumber",
      header: "PO Number",
      render: (row) => (
        <span className="font-semibold text-brand-900">
          {row.poNumber || "-"}
        </span>
      ),
    },
    { key: "branch", header: "Branch" },
    {
      key: "vendorCode",
      header: "Vendor Code",
      render: (row) => (
        <TruncatedWithTooltip
          value={row.vendorCode}
          maxWidthClass="max-w-[180px]"
        />
      ),
    },
    { key: "validTillDate", header: "Valid Till Date" },
    {
      key: "status",
      header: "Status",
      render: (row) =>
        row.status ? (
          <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
            {row.status}
          </Badge>
        ) : (
          "-"
        ),
    },
    // The whole column disappears when the role has neither Update
    // nor Read, rather than rendering an empty header over blank cells.
    ...(canUpdate || canRead
      ? [
          {
            key: "action",
            header: "Action",
            align: "center",
            render: (row) => (
              <div className="flex justify-center gap-1">
                {canUpdate && (
                  <IconAction
                    icon={Pencil}
                    label="Edit Purchase Order"
                    tone="edit"
                    onClick={() => {
                      setEditingPo(row);
                      setIsCreateModalOpen(true);
                    }}
                  />
                )}
                {canRead && (
                  <IconAction
                    icon={Eye}
                    label="View Purchase Order"
                    tone="brand"
                    onClick={() => setViewingPo(row)}
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
        <h1 className="text-lg font-semibold text-ink-800">Purchase Order</h1>
        {canCreate && (
          <Button
            onClick={() => {
              setEditingPo(null);
              setIsCreateModalOpen(true);
            }}
          >
            Create Purchase Order
          </Button>
        )}
      </div>

      <Card padded={false}>
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="max-w-sm flex-1">
            <Input
              icon={Search}
              placeholder="Search PO Number, Vendor"
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
          getRowId={(row) => row.id}
          emptyTitle="No Purchase Orders found"
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

      <CreatePurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPo(null);
        }}
        onSubmit={handleSavePo}
        isSubmitting={isSubmitting}
        editPo={editingPo}
      />

      <ViewPurchaseOrderModal
        isOpen={Boolean(viewingPo)}
        onClose={() => setViewingPo(null)}
        po={viewingPo}
      />

      <PartsFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        type="purchase-order"
        filters={filters}
        onApply={(f) => {
          setFilters((prev) => ({ ...prev, ...f }));
          setPage(1);
        }}
        onReset={(f) => {
          setFilters(f);
          setPage(1);
        }}
      />
    </div>
  );
}
