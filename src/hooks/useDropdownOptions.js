import { useEffect, useRef, useState } from "react";
import { extractList } from "@/utils/apiResponse";


export function useDropdownOptions(
  fetcher,
  mapOption,
  listKey,
  refreshKey = 0,
) {
  const [options, setOptions] = useState([]);


  const fetcherRef = useRef(fetcher);
  const mapRef = useRef(mapOption);
  fetcherRef.current = fetcher;
  mapRef.current = mapOption;

  useEffect(() => {
    let isMounted = true;

    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((response) => {
        if (!isMounted) return;
        const rows = extractList(response, listKey);
        setOptions(
          rows
            .map((row) => mapRef.current(row))
            .filter((o) => o?.value != null),
        );
      })
      .catch(() => {
        if (isMounted) setOptions([]);
      });

    return () => {
      isMounted = false;
    };

  }, [listKey, refreshKey]);

  return options;
}
