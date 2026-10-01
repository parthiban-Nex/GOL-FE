import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { estimateApi } from "@/services";
import { isSuccess } from "@/utils/apiResponse";

const SEARCH_DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

/** results.parts -> P, results.labour -> L, results.osl -> O. */
const KINDS = [
  {
    key: "parts",
    kind: "Part",
    badge: "P",
    className: "bg-blue-50 text-blue-700",
  },
  {
    key: "labour",
    kind: "Labour",
    badge: "L",
    className: "bg-amber-50 text-amber-700",
  },
  {
    key: "osl",
    kind: "OSL",
    badge: "O",
    className: "bg-violet-50 text-violet-700",
  },
];
const KIND_STYLE = Object.fromEntries(KINDS.map((k) => [k.kind, k]));

const TYPE_FILTERS = [
  { value: "All", label: "All" },
  { value: "Part", label: "Parts" },
  { value: "Labour", label: "Labour" },
  { value: "OSL", label: "OSL" },
];

/** searchEstimateLineItems response -> one flat list. `rowKey` is unique
 * across types (a part and a labour can share the same id). */
function mapSearchResults(response) {
  const results = response?.results ?? {};
  return KINDS.flatMap(({ key, kind }) =>
    (results[key] ?? []).map((r) => ({
      rowKey: `${kind}-${r.id}`,
      sourceId: r.id,
      kind,
      code: r.itemCode ?? r.laborCode ?? r.oslCode ?? "",
      name:
        r.itemName ??
        r.laborDescription ??
        r.oslDescription ??
        r.displayText ??
        "",
    })),
  );
}

export default function PartsSearchDropdown({
  query,
  onQueryChange,
  onAdd,
  isAdding = false,
}) {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [checked, setChecked] = useState(() => new Set());
  const [qtyOverride, setQtyOverride] = useState({});
  const [rateOverride, setRateOverride] = useState({});
  const [typeFilter, setTypeFilter] = useState("All");
  // Only the latest request may update the list.
  const requestIdRef = useRef(0);

  const trimmed = query.trim();
  const isTooShort = trimmed.length > 0 && trimmed.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      setSearchError("");
      return undefined;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const response = await estimateApi.searchLineItems(trimmed);
        if (requestId !== requestIdRef.current) return;
        if (!isSuccess(response)) {
          setResults([]);
          setSearchError(response?.message || "Search failed.");
          return;
        }
        setResults(mapSearchResults(response));
        setSearchError("");
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
        setSearchError(err.message || "Search failed.");
      } finally {
        if (requestId === requestIdRef.current) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmed]);

  function toggle(rowKey) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(rowKey) ? next.delete(rowKey) : next.add(rowKey);
      return next;
    });
  }

  async function handleAdd() {
    const items = results
      .filter((r) => checked.has(r.rowKey))
      .map((r) => ({
        catalog: r,
        qty: Number(qtyOverride[r.rowKey]) || 1,
        rate: Number(rateOverride[r.rowKey]) || 0,
      }));
    if (items.length === 0 || isAdding) return;
    await onAdd(items);
    setChecked(new Set());
    setQtyOverride({});
    setRateOverride({});
    onQueryChange("");
  }

  // UI-only: which result types are listed. Ticked items stay ticked
  // (and are added) even while filtered out of view.
  const visibleResults =
    typeFilter === "All"
      ? results
      : results.filter((r) => r.kind === typeFilter);

  const counts = KINDS.map(({ kind, badge }) => ({
    badge,
    count: results.filter((r) => r.kind === kind).length,
  })).filter((c) => c.count > 0);

  return (
    <div>
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by name or code to add Parts, Labour or OSL..."
          icon={Search}
          className="h-11 pr-28"
        />
        {isSearching && (
          <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-ink-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching
          </span>
        )}
      </div>

      {trimmed.length > 0 && (
        <div className="relative">
          <div className="absolute left-0 right-0 top-2 z-30 rounded-lg border border-ink-200 bg-white shadow-popover">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {isSearching ? "Searching..." : `${results.length} results`}
                </p>
                {!isSearching &&
                  counts.map(({ badge, count }) => (
                    <span key={badge} className="text-xs text-ink-500">
                      {badge}: {count}
                    </span>
                  ))}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-8 rounded-md border border-ink-200 bg-white px-2 text-xs font-medium text-ink-700 focus:border-brand-500 focus:outline-none cursor-pointer"
                  aria-label="Filter results by type"
                >
                  {TYPE_FILTERS.map((f) => {
                    const n =
                      f.value === "All"
                        ? results.length
                        : results.filter((r) => r.kind === f.value).length;
                    return (
                      <option key={f.value} value={f.value}>
                        {f.label} ({n})
                      </option>
                    );
                  })}
                </select>
                <Button
                  size="sm"
                  icon={Plus}
                  onClick={handleAdd}
                  disabled={checked.size === 0}
                  isLoading={isAdding}
                >
                  Add{checked.size > 0 ? ` (${checked.size})` : ""}
                </Button>
              </div>
            </div>

            {isTooShort ? (
              <p className="px-4 py-8 text-center text-sm text-ink-500">
                Type at least {MIN_QUERY_LENGTH} characters to search.
              </p>
            ) : searchError ? (
              <p className="px-4 py-8 text-center text-sm text-danger-500">
                {searchError}
              </p>
            ) : !isSearching &&
              results.length > 0 &&
              visibleResults.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-500">
                No {TYPE_FILTERS.find((f) => f.value === typeFilter)?.label}{" "}
                results - pick another type.
              </p>
            ) : !isSearching && results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-500">
                No parts, labour, or OSL match "{trimmed}".
              </p>
            ) : (
              <div className="max-h-[380px] overflow-y-auto">
                <div className="grid grid-cols-[24px_minmax(0,1fr)_96px_140px] items-center gap-3 border-b border-ink-100 bg-ink-50/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <span />
                  <span>Parts/Labour Name</span>
                  <span>Qty / Hrs</span>
                  <span>Rate</span>
                </div>
                {visibleResults.map((r) => (
                  <ResultRow
                    key={r.rowKey}
                    item={r}
                    isChecked={checked.has(r.rowKey)}
                    qty={qtyOverride[r.rowKey] ?? 1}
                    rate={rateOverride[r.rowKey] ?? ""}
                    onToggle={() => toggle(r.rowKey)}
                    onQty={(v) =>
                      setQtyOverride((s) => ({ ...s, [r.rowKey]: v }))
                    }
                    onRate={(v) =>
                      setRateOverride((s) => ({ ...s, [r.rowKey]: v }))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultRow({ item, isChecked, qty, rate, onToggle, onQty, onRate }) {
  const style = KIND_STYLE[item.kind];

  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)_96px_140px] items-center gap-3 border-b border-ink-100 px-4 py-3 last:border-b-0">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onToggle}
        className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600 focus:ring-brand-500"
        aria-label={`Select ${item.name}`}
      />
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${style.className}`}
          title={item.kind}
        >
          {style.badge}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-800">
            {item.name}
          </p>
          <p className="truncate text-xs text-ink-500">{item.code}</p>
        </div>
      </div>
      <input
        type="number"
        min={item.kind === "Part" ? 1 : 0.1}
        step={item.kind === "Part" ? 1 : 0.1}
        value={qty}
        onChange={(e) => onQty(e.target.value)}
        className="h-9 w-full rounded-md border border-ink-200 px-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none"
        aria-label={item.kind === "Part" ? "Quantity" : "Hours"}
      />
      <input
        type="number"
        min={0}
        step="0.01"
        placeholder="Enter rate"
        value={rate}
        onChange={(e) => onRate(e.target.value)}
        className="h-9 w-full rounded-md border border-ink-200 px-2 text-sm text-ink-800 focus:border-brand-500 focus:outline-none"
        aria-label="Rate"
      />
    </div>
  );
}
