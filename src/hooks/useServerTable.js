import { useCallback, useEffect, useRef, useState } from "react";
import { appConfig } from "@/config/appConfig";
import { extractList, extractTotal } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

export function useServerTable(fetcher, listKey, { extraParams } = {}) {
  const [rows, setRows] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(appConfig.defaultPageSize);
  const [searchKey, setSearchKey] = useState("");

  const extraParamsKey = JSON.stringify(extraParams ?? {});


  const requestTicketRef = useRef(0);

  const fetchPage = useCallback(async () => {
    const ticket = ++requestTicketRef.current;
    const isCurrent = () => requestTicketRef.current === ticket;

    setIsLoading(true);
    try {
      const response = await fetcher({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        searchKey,
        ...JSON.parse(extraParamsKey),
      });
      if (!isCurrent()) return;
      const list = extractList(response, listKey);
      setRows(list);
      setTotalItems(extractTotal(response, listKey) ?? list.length);
    } catch (err) {
      if (!isCurrent()) return;
      showToast.error(err.message || "Couldn't load the list.");
      setRows([]);
      setTotalItems(0);
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [fetcher, listKey, page, pageSize, searchKey, extraParamsKey]);

  useEffect(() => {
    fetchPage();
    return () => {
      requestTicketRef.current++;
    };
  }, [fetchPage]);

  // Changing page size or the search term must reset to page 1 -
  // otherwise offset can land past the end of the result set and the
  // grid comes back empty.
  const setPageSize = useCallback((size) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const search = useCallback((term) => {
    setSearchKey(term);
    setPage(1);
  }, []);

  return {
    rows,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    searchKey,
    search,
    refetch: fetchPage,
  };
}
