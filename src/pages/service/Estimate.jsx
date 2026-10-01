import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pencil, FileText, Eye } from "lucide-react";
import clsx from "clsx";
import IconAction from "@/components/ui/IconAction";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import CustomerSearchBar from "@/components/customers/CustomerSearchBar";
import CustomerQuickAddForm, {
  emptyQuickAddForm,
} from "@/components/customers/CustomerQuickAddForm";
import { useServerTable } from "@/hooks/useServerTable";
import { estimateApi } from "@/services";
import { STATUS_BADGE } from "@/pages/service/mockEstimates";
import { showToast } from "@/utils/toast";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import EstimateWizard from "@/pages/service/EstimateWizard";
import EstimateViewModal from "@/components/estimates/EstimateViewModal";
import { openPdfResponse } from "@/utils/pdf";

/** listServiceEstimate status code -> label. Unknown codes show as-is. */
const ESTIMATE_STATUS = { 1: "Open" };

/** Backend sometimes stores the literal text "undefined" / "null". */
const clean = (v) =>
  v == null || v === "undefined" || v === "null" ? "" : String(v);

/** listServiceEstimate row (ServiceEstimateData.data[]) -> grid row.
 * `_raw` keeps the full backend row for the wizard. */
function mapEstimateRow(r) {
  return {
    id: clean(r.serviceEstimateNumber),
    estimateId: r.id ?? null,
    regNo: clean(r.registrationNumber),
    make: clean(r.vehicle?.make?.makeName),
    model: clean(r.vehicle?.model?.modelName),
    customer: clean(r.customerName),
    mobile: clean(r.customerMobileNumber),
    pincode: clean(r.customerPincode),
    address: clean(r.customerAddress),
    status: ESTIMATE_STATUS[r.status] ?? clean(r.status),
    includeGST: Boolean(r.gstStatus),
    customerId: r.customerId ?? null,
    vehicleId: r.vehicleId ?? null,
    makeId: r.vehicleMakeId ?? null,
    modelId: r.vehicleModelId ?? null,
    _raw: r,
  };
}

export default function Estimate() {
  // Which estimate the wizard is showing, and on which step - held here
  // and passed down as props, like Users.jsx's editTarget, instead of
  // being encoded in a /service/estimate/:id URL.
  const [activeEstimate, setActiveEstimate] = useState(null);

  const [viewTarget, setViewTarget] = useState(null);
  // estimateId of the row whose Edit / PDF request is running.
  const [loadingPdfId, setLoadingPdfId] = useState(null);

  function openEstimate(row, step = "customer") {
    setActiveEstimate({ row, step });
  }

  // Edit: the wizard loads getEstimate itself for all four steps.
  function handleEdit(row) {
    setViewTarget(null);
    openEstimate(row);
  }

  async function handleDownloadPdf(row) {
    if (!row?.estimateId || loadingPdfId) return;
    setLoadingPdfId(row.estimateId);
    try {
      const blob = await estimateApi.generatePdf(row.estimateId);
      await openPdfResponse(
        blob,
        `${row.id || `estimate-${row.estimateId}`}.pdf`,
      );
    } catch (err) {
      showToast.error(err.message || "Couldn't generate the PDF.");
    } finally {
      setLoadingPdfId(null);
    }
  }

  const fetchEstimates = useCallback((body) => estimateApi.list(body), []);
  const {
    rows,
    totalItems,
    totalPages,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchKey,
    search,
    refetch,
  } = useServerTable(fetchEstimates, estimateApi.listKey);

  const estimates = useMemo(() => rows.map(mapEstimateRow), [rows]);

  const [searchQuery, setSearchQuery] = useState("");
  const [quickAddValue, setQuickAddValue] = useState(emptyQuickAddForm);
  const [isCreating, setIsCreating] = useState(false);

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  // Sorting is applied to the page the server returned.
  const sorted = useMemo(() => {
    if (!sortKey) return estimates;
    return [...estimates].sort((a, b) => {
      const r = String(a[sortKey] ?? "").localeCompare(
        String(b[sortKey] ?? ""),
      );
      return sortDir === "asc" ? r : -r;
    });
  }, [estimates, sortKey, sortDir]);

  function handleSortChange(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // After a search finishes with no rows, tell the user and prefill the
  // mobile in the quick-add row if that's what they typed.
  const pendingSearchRef = useRef(false);
  useEffect(() => {
    if (!pendingSearchRef.current || isLoading) return;
    pendingSearchRef.current = false;
    if (searchKey && estimates.length === 0) {
      showToast.success(
        "No estimate found - enter details manually to create one.",
      );
      if (/^\d+$/.test(searchKey)) {
        setQuickAddValue({ ...emptyQuickAddForm, mobile: searchKey });
      }
    }
  }, [isLoading, searchKey, estimates.length]);

  function handleSearch() {
    const q = searchQuery.trim();
    pendingSearchRef.current = Boolean(q);
    search(q);
  }

  // Quick-add row -> POST /serviceEstimate/createServiceEstimate, then the
  // list reloads so the new estimate shows up.
  async function handleQuickAddSubmit(values) {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const response = await estimateApi.create({
        name: values.name.trim(),
        mobileNumber: values.mobile.trim(),
        pinCode: values.pincode?.trim() ?? "",
        address1: values.address?.trim() ?? "",
        registrationNumber: values.regNo.trim(),
        makeId: values.makeId ?? null,
        modelId: values.modelId ?? null,
        fuelType: values.fuel,
      });
      if (!isSuccess(response)) {
        // Keep the typed values so the user can correct and retry.
        showToast.error(responseMessage(response, "Couldn't create estimate."));
        return;
      }
      showToast.success(responseMessage(response, "Estimate created."));
      // New object so the quick-add form always resets.
      setQuickAddValue({ ...emptyQuickAddForm });
      setSearchQuery("");
      if (searchKey) search("");
      else refetch();
    } catch (err) {
      showToast.error(err.message || "Couldn't create estimate.");
    } finally {
      setIsCreating(false);
    }
  }

  const columns = [
    { key: "id", header: "Service Estimate No", sortable: true },
    { key: "regNo", header: "Reg.No.", sortable: true },
    { key: "make", header: "Make", sortable: true },
    { key: "customer", header: "Customer Name", sortable: true },
    { key: "mobile", header: "Mobile No", sortable: true },
    { key: "pincode", header: "Pincode", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <span
          className={clsx(
            "inline-block rounded-md px-2 py-0.5 text-xs font-medium",
            STATUS_BADGE[row.status] ?? "bg-ink-100 text-ink-600",
          )}
        >
          {row.status || "-"}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <div className="flex items-center">
          <IconAction
            icon={Pencil}
            label={`Edit ${row.id || "estimate"}`}
            onClick={() => handleEdit(row)}
            tone="edit"
          />
          <IconAction
            icon={FileText}
            label={`Download PDF of ${row.id || "estimate"}`}
            onClick={() => handleDownloadPdf(row)}
            disabled={!row.estimateId || loadingPdfId === row.estimateId}
            tone="print"
          />
          <IconAction
            icon={Eye}
            label={`View ${row.id || "estimate"}`}
            onClick={() => setViewTarget(row)}
            disabled={!row.estimateId}
            tone="brand"
          />
        </div>
      ),
    },
  ];

  if (activeEstimate) {
    return (
      <EstimateWizard
        // Keyed by id so opening a different estimate starts a fresh wizard
        // rather than reusing the previous one's state.
        key={activeEstimate.row.id ?? "new"}
        estimateRow={activeEstimate.row}
        initialStep={activeEstimate.step}
        onClose={() => {
          setActiveEstimate(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink-800">Estimate</h1>

      <Card className="space-y-4">
        <CustomerSearchBar
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            // Clearing the box brings the full list back.
            if (!v.trim() && searchKey) search("");
          }}
          onSearch={handleSearch}
          isSearching={isLoading && Boolean(searchKey)}
        />
        <CustomerQuickAddForm
          value={quickAddValue}
          onSubmit={handleQuickAddSubmit}
          requireMakeModel
          isSubmitting={isCreating}
        />
      </Card>

      <Card padded={false}>
        <Table
          columns={columns}
          data={sorted}
          getRowId={(row) => row.estimateId ?? row.id}
          isLoading={isLoading}
          sortKey={sortKey}
          sortDirection={sortDir}
          onSortChange={handleSortChange}
          emptyTitle="No estimates yet"
          emptyDescription="Search by mobile or reg. no. above, or add customer + vehicle details to create one."
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

      <EstimateViewModal
        isOpen={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        estimate={viewTarget}
        onDownloadPdf={() => handleDownloadPdf(viewTarget)}
        isDownloading={
          Boolean(viewTarget) && loadingPdfId === viewTarget.estimateId
        }
        onEdit={() => handleEdit(viewTarget)}
      />
    </div>
  );
}
