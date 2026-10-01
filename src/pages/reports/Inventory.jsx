import { useCallback, useEffect, useMemo, useState } from "react";
import ReportTableCard from "@/components/reports/ReportTableCard";
import { usePagination } from "@/hooks/usePagination";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { reportsApi } from "@/services";
import { extractList } from "@/utils/apiResponse";
import { downloadCsv } from "@/utils/exportCsv";
import { showToast } from "@/utils/toast";

const COLUMNS = [
  { key: "partNumber", header: "Part Number" },
  { key: "partDescription", header: "Part Description" },
  { key: "partName", header: "Part Name" },
  { key: "totalStock", header: "Total Stock" },
  { key: "inStock", header: "In Stock" },
  { key: "reserved", header: "Reserved" },
  { key: "uom", header: "UOM" },
  { key: "mrp", header: "MRP" },
  { key: "map", header: "MAP" },
];

/**
 * GetStockPositionReport returns one row per GRN line, so the same part
 * appears once per receipt. This folds them into one row per part number
 * with the quantities summed - which is what "Total Stock" means.
 *
 * The endpoint carries no reservation data and no moving average price,
 * so In Stock mirrors Total Stock and Reserved / MAP show "-". Part Name
 * uses the description, as the row has no separate name.
 */
function aggregateByPart(rows) {
  const byPart = new Map();
  for (const row of rows) {
    const partNumber = row.item_code ?? row.itemCode ?? row.partNumber;
    if (!partNumber) continue;
    const quantity = Number(row.quantity ?? 0);
    const existing = byPart.get(partNumber);
    if (existing) {
      existing.totalStock += quantity;
      existing.inStock += quantity;
      continue;
    }
    byPart.set(partNumber, {
      partNumber,
      partDescription: row.item_description ?? row.partDescription ?? "-",
      partName: row.item_description ?? row.partName ?? "-",
      totalStock: quantity,
      inStock: quantity,
      reserved: "-",
      uom: row.uomType ?? row.uom ?? "-",
      mrp: row.mrp ?? "-",
      map: "-",
    });
  }
  return Array.from(byPart.values());
}

/** Reports > Inventory - current stock per part, from
 * POST /parts/GetStockPositionReport. The endpoint returns the whole set
 * (no paging or search params), so search and paging are client-side. */
export default function Inventory() {
  const { canRead } = usePagePermissions();
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await reportsApi.stockPosition({});
      setParts(aggregateByPart(extractList(response, "data")));
    } catch (err) {
      // The controller answers 500 "No records found" for an empty outlet.
      setParts([]);
      showToast.error(err.message || "Couldn't load inventory.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = appliedSearch.toLowerCase();
    if (!q) return parts;
    return parts.filter(
      (p) =>
        String(p.partNumber).toLowerCase().includes(q) ||
        String(p.partDescription).toLowerCase().includes(q),
    );
  }, [parts, appliedSearch]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(filtered);

  function handleDownload() {
    if (!filtered.length) {
      showToast.error("Nothing to download.");
      return;
    }
    downloadCsv("inventory", filtered, COLUMNS);
  }

  return (
    <ReportTableCard
      title="Inventory"
      searchPlaceholder="Search Part Number or Description"
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      onSearch={() => {
        setAppliedSearch(searchInput.trim());
        setPage(1);
      }}
      onDownload={handleDownload}
      canDownload={canRead}
      columns={COLUMNS}
      rows={pageItems}
      isLoading={isLoading}
      getRowId={(row) => row.partNumber}
      emptyTitle="No stock found"
      emptyDescription="There is no stock on hand for this outlet, or nothing matches the search."
      pagination={{
        page,
        totalPages,
        totalItems,
        pageSize,
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
      }}
    />
  );
}
