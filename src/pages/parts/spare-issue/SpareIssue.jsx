import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  CircleCheck,
  Pencil,
  Eye,
  SquareUserRound,
  PackageCheck,
} from "lucide-react";
import clsx from "clsx";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import { useServerTable } from "@/hooks/useServerTable";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { partsApi } from "@/services";
import SpareIssueModal from "./SpareIssueModal";
import PartsFilterModal from "@/components/parts/PartsFilterModal";

const SEARCH_DEBOUNCE_MS = 400;

const trimText = (v) => (v == null ? "" : String(v).trim());

/** getAllJobCardsForOutlets row -> grid row. */
function mapSpareIssueRow(r) {
  return {
    id: r.id ?? null,
    jobcardNo: trimText(r.job_card_number),
    regNo: trimText(r.vehicle_reg_no),
    make: trimText(r.vechicle_make ?? r.vehicle_make), // backend key is spelt "vechicle"
    model: trimText(r.vehicle_model),
    status: trimText(r.status),
    partsApprove: r.part_approve === 1 || r.part_approve === true,
    customerName: trimText(r.customer_name).replace(/\s*\bundefined\b/gi, ""),
    customerState: trimText(r.customer_state),
    source: trimText(r.source),
    enquiryNo: trimText(r.enquiry_no),
    enquiryId: r.enquiry_id ?? null,
    chassisNumber: trimText(r.chassisNumber),
    fuelType: trimText(r.fuelType),
    engineNumber: trimText(r.engineNumber),
  };
}

export default function SpareIssue() {
  const { canRead, canUpdate } = usePagePermissions();

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ make: "ALL", approvedOnly: false });

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // POST /jobCard/getAllJobCardsForOutlets { limit, offset, searchKey }
  const fetchRows = useCallback(
    (body) => partsApi.getSpareIssueJobCards(body),
    [],
  );
  const {
    rows: rawRows,
    totalItems,
    totalPages,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
  } = useServerTable(fetchRows, partsApi.spareIssueListKey);

  // Search goes to the server once typing pauses.
  useEffect(() => {
    const timer = setTimeout(
      () => search(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // The list API only takes limit/offset/searchKey, so Make and Parts
  // Approved are applied to the loaded page.
  const pageItems = useMemo(
    () =>
      rawRows.map(mapSpareIssueRow).filter((row) => {
        if (
          filters.make &&
          filters.make !== "ALL" &&
          row.make !== filters.make
        ) {
          return false;
        }
        if (filters.approvedOnly && !row.partsApprove) return false;
        return true;
      }),
    [rawRows, filters.make, filters.approvedOnly],
  );

  function openModal(item, mode) {
    setSelectedIssue(item);
    setModalMode(mode);
    setIsIssueModalOpen(true);
  }

  const activeFilterCount =
    (filters.make !== "ALL" ? 1 : 0) +
    (filters.approvedOnly ? 1 : 0) +
    (filters.fromDate ? 1 : 0);

  const columns = [
    {
      key: "jobcardNo",
      header: "Jobcard Number",
      render: (row) => (
        <span className="font-semibold text-brand-900">{row.jobcardNo}</span>
      ),
    },
    { key: "regNo", header: "Vehicle Reg No" },
    { key: "make", header: "Vehicle Make" },
    { key: "model", header: "Vehicle Model" },
    { key: "customerName", header: "Customer" },
    { key: "status", header: "Status" },
    {
      key: "partsApprove",
      header: "Parts Approve",
      render: (row) =>
        row.partsApprove ? (
          <CircleCheck className="h-5 w-5 fill-success-500 text-white" />
        ) : (
          <span className="font-bold text-ink-400">-</span>
        ),
    },
    // The whole column disappears when the role holds neither Read nor
    // Update, rather than rendering an empty header over blank cells.
    ...(canRead || canUpdate
      ? [
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <div className="flex items-center gap-1">
                {canUpdate && (
                  // No update API for these rows yet.
                  <IconAction
                    icon={Pencil}
                    label="Edit (not available yet)"
                    tone="edit"
                    disabled
                  />
                )}
                {canRead && (
                  <IconAction
                    icon={Eye}
                    label="View Details"
                    tone="brand"
                    onClick={() => openModal(row, "view")}
                  />
                )}
                {canUpdate && (
                  <>
                    {/* Display only for now - no handler behind them yet. */}
                    <IconAction
                      icon={SquareUserRound}
                      label="Technician & Bay"
                      tone="assign"
                      disabled
                    />
                    <IconAction
                      icon={PackageCheck}
                      label="Issue Parts"
                      tone="assign"
                      disabled
                    />
                  </>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink-800">
        Spare Issue &amp; Return
      </h1>

      <Card padded={false}>
        <div className="flex items-center gap-2 px-5 py-3">
          <div className="max-w-sm flex-1">
            <Input
              icon={Search}
              placeholder="Search Jobcard, Reg No, Customer"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFilterModalOpen(true)}
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
          getRowId={(row) => row.id ?? row.jobcardNo}
          emptyTitle="No spare issue records found"
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

      <SpareIssueModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        issueRecord={selectedIssue}
        mode={modalMode}
      />

      <PartsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        type="spare-issue"
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

/** Small square icon button for the Action column, following the same
 * tone-based idiom used in BankDeposit.jsx / SalaryTab.jsx: a neutral
 * base color with a per-action hover tone, so each action reads
 * distinctly without introducing a new visual pattern. */
function IconAction({ icon: Icon, label, onClick, disabled, tone }) {
  const toneCls =
    tone === "edit"
      ? "hover:text-blue-600"
      : tone === "brand"
        ? "hover:text-brand-700"
        : tone === "assign"
          ? "hover:text-violet-600"
          : "hover:text-ink-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ink-500 transition-colors",
        toneCls,
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
