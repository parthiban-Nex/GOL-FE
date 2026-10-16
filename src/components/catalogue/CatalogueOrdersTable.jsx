import { Eye, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CatalogueOrdersTable({ orders, onView, onRefresh }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-800">My Orders</h2>
        <Button onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {/* ─── Mobile Orders View (< 768px) ─── */}
      <div className="space-y-3 md:hidden">
        {orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center text-sm text-ink-500">
            No orders yet — placed orders will appear here.
          </div>
        ) : (
          orders.map((o) => {
            const enqNo = o.enquiryNo || o.enquiry_no || o.id;
            const isCompleted =
              String(o.status || "").toUpperCase() === "COMPLETED" ||
              String(o.status || "").toUpperCase() === "DELIVERED";

            return (
              <div
                key={`m-order-${enqNo}`}
                className="rounded-xl border border-ink-200 bg-white p-4 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => onView?.(o)}
                      className="font-bold text-sm text-brand-700 hover:text-brand-900 cursor-pointer"
                    >
                      {enqNo}
                    </button>
                    <p className="text-[11px] text-ink-400 mt-0.5">
                      {formatDate(
                        o.orderCreationDate ||
                          o.createdOn ||
                          o.createdAt ||
                          o.order_creation_date
                      )}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-orange-50 text-accent-700 border border-orange-200"
                    }`}
                  >
                    {o.status || "PROCESSING"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-600 pt-2 border-t border-ink-100">
                  <div>
                    <span className="text-ink-400">Customer: </span>
                    <span className="font-medium text-ink-800">
                      {o.customerCode || o.customer_code || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-400">Source: </span>
                    <span className="font-medium text-ink-800">{o.source || "GOL"}</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onView?.(o)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-accent-500 py-2 text-xs font-semibold text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Order Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Desktop / Tablet Table View (>= 768px) ─── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-ink-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-500 bg-ink-50/50">
              <th className="px-3 py-3">Enquiry No</th>
              <th className="px-3 py-3">Customer Code</th>
              <th className="px-3 py-3">Source</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Created On</th>
              <th className="px-3 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-10 text-center text-sm text-ink-500"
                >
                  No orders yet — placed orders will appear here.
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const enqNo = o.enquiryNo || o.enquiry_no || o.id;
              const isCompleted =
                String(o.status || "").toUpperCase() === "COMPLETED" ||
                String(o.status || "").toUpperCase() === "DELIVERED";

              return (
                <tr
                  key={enqNo}
                  className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/40"
                >
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => onView?.(o)}
                      className="font-semibold text-brand-700 hover:text-brand-900 cursor-pointer"
                    >
                      {enqNo}
                    </button>
                  </td>
                  <td className="px-3 py-4 text-ink-700">
                    {o.customerCode || o.customer_code || "—"}
                  </td>
                  <td className="px-3 py-4 text-ink-700">{o.source || "GOL"}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`text-sm font-bold uppercase tracking-wide ${
                        isCompleted ? "text-emerald-600" : "text-accent-600"
                      }`}
                    >
                      {o.status || "PROCESSING"}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-ink-600">
                    {formatDate(
                      o.orderCreationDate ||
                        o.createdOn ||
                        o.createdAt ||
                        o.order_creation_date
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => onView?.(o)}
                        className="flex h-8 cursor-pointer w-10 items-center justify-center rounded-md border border-accent-500 text-accent-600 hover:bg-accent-50 transition-colors"
                        aria-label={`View ${enqNo}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dd}-${mm}-${yyyy}, ${time}`;
  } catch {
    return iso;
  }
}
