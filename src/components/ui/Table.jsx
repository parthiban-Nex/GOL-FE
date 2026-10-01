import clsx from "clsx";
import { ArrowUpDown } from "lucide-react";
import { TableSkeleton } from "@/components/common/Skeleton";
import EmptyState from "@/components/common/EmptyState";

export default function Table({
  columns,
  data = [],
  getRowId = (row) => row.id,
  isLoading,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters or add a new record.",
  sortKey,
  sortDirection,
  onSortChange,
}) {
  if (isLoading) {
    return (
      <div className="overflow-hidden">
        <TableHeaderRow columns={columns} />
        <TableSkeleton columns={columns.length} />
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[720px]  border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50/60">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="whitespace-nowrap px-5 py-3 font-semibold text-ink-700"
              >
                {col.sortable ? (
                  <button
                    onClick={() => onSortChange?.(col.key)}
                    className="inline-flex items-center gap-1.5 hover:text-brand-600 cursor-pointer"
                  >
                    {col.header}
                    <ArrowUpDown
                      className={clsx(
                        "h-3.5 w-3.5 transition-transform",
                        sortKey === col.key ? "text-brand-600" : "text-ink-300",
                        sortKey === col.key &&
                          sortDirection === "desc" &&
                          "rotate-180",
                      )}
                    />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {data.map((row) => (
            <tr key={getRowId(row)} className="hover:bg-ink-50/60">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    "whitespace-nowrap px-5 py-3.5 text-ink-700",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right",
                  )}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableHeaderRow({ columns }) {
  return (
    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-ink-100 bg-ink-50/60">
          {columns.map((col) => (
            <th
              key={col.key}
              className="whitespace-nowrap px-5 py-3 font-semibold text-ink-700"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
    </table>
  );
}
