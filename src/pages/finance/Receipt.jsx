import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search, Filter } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { INITIAL_RECEIPTS } from "@/pages/finance/mockBillingReceipt";

const STATUS_PILL = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Failed: "bg-red-50 text-red-700 border-red-100",
};

export default function Receipt() {
  const [receipts] = useState(INITIAL_RECEIPTS);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.invoice.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.mode.toLowerCase().includes(q) ||
        r.date.includes(q),
    );
  }, [receipts, query]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(filtered);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-800">Receipt</h1>
        {/* <p className="mt-1 text-sm text-ink-500">
          Manage outstanding payments and automotive service invoices
        </p> */}
      </div>

      <Card padded={false}>
        <div className="flex items-center gap-2 border-b border-ink-100 p-4">
          <div className="relative flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Receipt"
              icon={Search}
              className="h-11"
            />
          </div>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            aria-label="Filter receipts"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-medium text-ink-500">
                <th className="px-4 py-3">Receipt ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No receipts match your search.
                  </td>
                </tr>
              )}
              {pageItems.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-ink-100 last:border-b-0"
                >
                  <td className="px-4 py-4 font-semibold text-ink-800">
                    {r.id}
                  </td>
                  <td className="px-4 py-4 text-ink-600">{r.date}</td>
                  <td className="px-4 py-4 text-ink-700">{r.invoice}</td>
                  <td className="px-4 py-4 text-right font-semibold text-ink-800">
                    ₹{r.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4 text-ink-700">{r.mode}</td>
                  <td className="px-4 py-4 text-ink-600">{r.reference}</td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={clsx(
                        "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium",
                        STATUS_PILL[r.status],
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
