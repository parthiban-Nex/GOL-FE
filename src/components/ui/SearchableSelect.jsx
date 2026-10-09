import { useState, useRef, useEffect, useMemo } from "react";
import clsx from "clsx";
import { ChevronDown, Search, X, Check, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function SearchableSelect({
  label,
  required,
  error,
  options = [],
  value,
  onChange,
  onSearch,
  loading = false,
  placeholder = "Select an option...",
  disabled = false,
  className,
  debounceMs = 350,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce the typed search term
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Trigger onSearch callback when debounced term changes
  useEffect(() => {
    if (isOpen && onSearch) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, isOpen, onSearch]);

  // Find the selected option object
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Options filtered by search term for instant feedback while debounced API search runs
  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return options;

    return options.filter((opt) => {
      const labelMatch = (opt.label || "").toLowerCase().includes(q);
      const codeMatch = (opt.code || "").toLowerCase().includes(q);
      const subLabelMatch = (opt.subLabel || "").toLowerCase().includes(q);
      const valueMatch = (opt.value || "").toLowerCase().includes(q);
      return labelMatch || codeMatch || subLabelMatch || valueMatch;
    });
  }, [options, searchTerm]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(option) {
    onChange(option.value, option);
    setIsOpen(false);
    setSearchTerm("");
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange("", null);
    setSearchTerm("");
  }

  function handleOpen() {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  return (
    <div className={clsx("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {/* Control Box */}
      <div
        onClick={handleOpen}
        className={clsx(
          "flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border bg-white px-3 text-sm transition-colors",
          disabled
            ? "cursor-not-allowed border-ink-100 bg-ink-50 text-ink-400"
            : error
            ? "border-red-500 focus-within:border-red-500"
            : isOpen
            ? "border-brand-500 ring-1 ring-brand-500"
            : "border-ink-200 text-ink-800 hover:border-ink-300"
        )}
      >
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-ink-800">
                {selectedOption.label}
              </span>
              {selectedOption.code && (
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700">
                  {selectedOption.code}
                </span>
              )}
            </div>
          ) : (
            <span className="text-ink-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="cursor-pointer rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={clsx(
              "h-4 w-4 text-ink-400 transition-transform duration-200",
              isOpen && "rotate-180 text-brand-600"
            )}
          />
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-lg">
          {/* Search Input Box */}
          <div className="border-b border-ink-100 p-2">
            <div className="relative flex items-center">
              {loading ? (
                <Loader2 className="absolute left-2.5 h-4 w-4 animate-spin text-brand-600" />
              ) : (
                <Search className="absolute left-2.5 h-4 w-4 text-ink-400" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search name or code..."
                className="h-9 w-full rounded-md border border-ink-200 bg-ink-50/50 pl-8 pr-8 text-xs text-ink-800 placeholder-ink-400 focus:border-brand-500 focus:bg-white focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 text-ink-400 hover:text-ink-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-ink-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600" />
                <span>Searching vendors...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-ink-400">
                No vendors match &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedOption?.value === option.value;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option)}
                    className={clsx(
                      "flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                      isSelected
                        ? "bg-brand-50 text-brand-800 font-medium"
                        : "text-ink-700 hover:bg-ink-50"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{option.label}</span>
                      {option.code && (
                        <span className="rounded border border-brand-200 bg-brand-50/60 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
                          {option.code}
                        </span>
                      )}
                      {option.subLabel && (
                        <span className="text-xs text-ink-400">
                          • {option.subLabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-brand-600" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
