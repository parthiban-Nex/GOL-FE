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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-500">
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
