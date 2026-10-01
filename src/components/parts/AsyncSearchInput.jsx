import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import clsx from "clsx";

/**
 * Type-to-search single select. Calls `fetchOptions(query)` after typing
 * pauses and lists the results; picking one calls `onSelect(option)`.
 * Options: [{ key, label, sub?, data? }].
 *
 * The list is position:fixed under the input, so it isn't clipped by a
 * scrolling container (e.g. the PO parts table).
 */
export default function AsyncSearchInput({
  value,
  onInputChange,
  fetchOptions,
  onSelect,
  placeholder,
  minChars = 2,
  debounceMs = 350,
  error,
  disabled,
  className,
  inputClassName,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [rect, setRect] = useState(null);
  const inputRef = useRef(null);
  const requestRef = useRef(0);
  const typedRef = useRef(false); // search only after the user types

  const query = String(value ?? "").trim();

  useEffect(() => {
    if (!typedRef.current) return undefined;
    const id = ++requestRef.current;
    if (query.length < minChars) {
      setOptions([]);
      setIsLoading(false);
      return undefined;
    }
    setIsLoading(true);
    const t = setTimeout(async () => {
      try {
        const result = await fetchOptions(query);
        if (id !== requestRef.current) return;
        setOptions(result ?? []);
        setHighlight(0);
      } catch {
        if (id === requestRef.current) setOptions([]);
      } finally {
        if (id === requestRef.current) setIsLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, minChars, debounceMs]);

  // Keep the fixed list aligned with the input.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = () => {
      const r = inputRef.current?.getBoundingClientRect();
      if (r)
        setRect({
          left: r.left,
          top: r.bottom + 4,
          width: Math.max(r.width, 280),
        });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  function choose(option) {
    typedRef.current = false;
    setOpen(false);
    setOptions([]);
    onSelect(option);
  }

  function handleKeyDown(e) {
    if (!open || options.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(options[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && typedRef.current && query.length > 0;

  return (
    <div className={clsx("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
        <input
          ref={inputRef}
          type="text"
          value={value ?? ""}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          onChange={(e) => {
            typedRef.current = true;
            setOpen(true);
            onInputChange(e.target.value);
          }}
          onFocus={() => typedRef.current && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          className={clsx(
            "w-full rounded border px-2 py-1 pl-7 text-xs text-ink-800 focus:outline-none disabled:bg-ink-50",
            error
              ? "border-danger-500 focus:border-danger-500"
              : "border-ink-200 focus:border-brand-600",
            inputClassName,
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-ink-400" />
        )}
      </div>
      {error && <p className="mt-0.5 text-[10px] text-danger-500">{error}</p>}

      {showList && rect && (
        <div
          style={{
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: rect.width,
          }}
          className="z-[1000] max-h-64 overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 shadow-popover"
        >
          {query.length < minChars ? (
            <p className="px-3 py-2 text-xs text-ink-500">
              Type at least {minChars} characters
            </p>
          ) : isLoading && options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-ink-500">Searching...</p>
          ) : options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-ink-500">
              No matches for "{query}"
            </p>
          ) : (
            options.map((o, i) => (
              <button
                key={o.key}
                type="button"
                // mousedown so the pick happens before the input's blur
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={clsx(
                  "block w-full cursor-pointer px-3 py-1.5 text-left text-xs",
                  i === highlight
                    ? "bg-brand-50 text-brand-800"
                    : "text-ink-700",
                )}
              >
                <span className="font-semibold">{o.label}</span>
                {o.sub && (
                  <span className="block truncate text-[11px] text-ink-500">
                    {o.sub}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
