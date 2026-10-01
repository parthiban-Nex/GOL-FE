import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import Select from "@/components/ui/Select";
import { appConfig } from "@/config/appConfig";

/** Builds a compact [1, "...", 4, 5, 6, "...", 12] style page list. */
function getPageNumbers(current, total) {
  const delta = 1;
  const pages = [];

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      pages.push(i);
    }
  }

  const withDots = [];
  let previous;
  for (const page of pages) {
    if (previous !== undefined) {
      if (page - previous === 2) {
        withDots.push(previous + 1);
      } else if (page - previous > 1) {
        withDots.push("…");
      }
    }
    withDots.push(page);
    previous = page;
  }
  return withDots;
}

/** Page controls + rows-per-page selector, driven by hooks/usePagination.js. */
export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalItems === 0) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 px-5 py-3 sm:flex-row">
      <div className="grid grid-cols-[auto_80px_auto] items-center gap-2 text-sm text-ink-500">
        <span>Rows per page</span>

        <Select
          className="h-8 w-20 py-0 cursor-pointer"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          options={appConfig.pageSizeOptions.map((n) => ({
            value: n,
            label: String(n),
          }))}
        />

        <span className="hidden sm:inline whitespace-nowrap">
          {totalItems} total
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pageNumbers.map((n, i) =>
          n === "…" ? (
            <span key={`dots-${i}`} className="px-1.5 text-sm text-ink-400">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              disabled={n === page}
              aria-current={n === page ? "page" : undefined}
              className={clsx(
                "flex h-8 min-w-8 items-center justify-center cursor-pointer rounded-md px-2 text-sm font-medium transition-colors disabled:cursor-default",
                n === page
                  ? "bg-brand-600 text-white"
                  : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {n}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-md text-ink-500 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
