import clsx from "clsx";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const STATUS_PILL = {
  "Delivered":  "bg-emerald-50 text-emerald-700",
  "Completed":  "bg-emerald-50 text-emerald-700",
  "In Process": "bg-blue-50 text-blue-700",
  "Packing":    "bg-amber-50 text-amber-700",
  "Cancelled":  "bg-red-50 text-red-700",
  "Pending":    "bg-ink-100 text-ink-600",
};

/** Modal opened from OrdersTable's eye icon - shows meta + parts list. */
export default function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details — ${order.enquiry_no}`}
      size="lg"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-ink-100 bg-ink-50/40 p-4 text-sm sm:grid-cols-4">
          <Field label="Source" value={order.source} />
          <Field label="Status" value={
            <span className={clsx("inline-block rounded-md px-2 py-0.5 text-[11px] font-medium", STATUS_PILL[order.status] ?? "bg-ink-100 text-ink-600")}>
              {order.status}
            </span>
          } />
          <Field label="Reference No" value={order.reference_no || "—"} />
          <Field label="Order Nos" value={(order.order_nos || []).join(", ") || "—"} />
        </div>

        {order.message && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-800">
            {order.message}
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-800">Parts in this order</p>
          <div className="overflow-x-auto rounded-lg border border-ink-100">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="px-3 py-2">Part No</th>
                  <th className="px-3 py-2">Part Name</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Order No</th>
                </tr>
              </thead>
              <tbody>
                {(order.parts || []).map((p, i) => (
                  <tr key={`${p.part_no}-${i}`} className="border-b border-ink-100 last:border-b-0">
                    <td className="px-3 py-2 font-medium text-ink-700">{p.part_no}</td>
                    <td className="px-3 py-2 text-ink-800">{p.part_name}</td>
                    <td className="px-3 py-2 text-right text-ink-600">{p.qty}</td>
                    <td className="px-3 py-2">
                      <span className={clsx("inline-block rounded-md px-2 py-0.5 text-[11px] font-medium", STATUS_PILL[p.status] ?? "bg-ink-100 text-ink-600")}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-ink-600">{p.order_no || "—"}</td>
                  </tr>
                ))}
                {(!order.parts || order.parts.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-ink-500">
                      No parts in this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-ink-800">{value ?? "—"}</p>
    </div>
  );
}