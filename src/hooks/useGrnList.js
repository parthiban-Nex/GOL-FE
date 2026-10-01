import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerTable } from "@/hooks/useServerTable";
import { partsApi } from "@/services";
import { filterGrnRows, mapGrnRow } from "@/utils/grn";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * POST /parts/GRN list for GRN Direct and Auto GRN: server paging + search
 * (searchKey), and the Filter popup's vendor / date range applied to the
 * loaded page.
 */
export function useGrnList() {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFiltersState] = useState({ vendorCode: "ALL" });

  const fetchRows = useCallback((body) => partsApi.getGrnList(body), []);
  const table = useServerTable(fetchRows, partsApi.grnListKey);
  const { search, setPage, rows } = table;

  useEffect(() => {
    const timer = setTimeout(
      () => search(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  const pageItems = useMemo(
    () => filterGrnRows(rows.map(mapGrnRow), filters),
    [rows, filters],
  );

  const setFilters = useCallback(
    (next) => {
      setFiltersState(next);
      setPage(1);
    },
    [setPage],
  );

  const activeFilterCount =
    (filters.vendorCode && filters.vendorCode !== "ALL" ? 1 : 0) +
    (filters.fromDate || filters.toDate ? 1 : 0);

  return {
    ...table,
    pageItems,
    searchInput,
    setSearchInput,
    filters,
    setFilters,
    activeFilterCount,
  };
}
