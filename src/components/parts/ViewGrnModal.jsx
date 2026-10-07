import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { grnApi } from "@/services/api/grnApi";

const money = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Field({ label, children }) {
  return (
    <div>
      <span className="block text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{children}</span>
    </div>
  );
}

/**
 * Loads the full GRN via grnApi.getGrnPdf({ id }) when opened.
 * `grn` is the list row; only its `id` is needed (the rest is used as a
 * fallback for the header while loading).
 */
export default function ViewGrnModal({ isOpen, onClose, grn }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !grn?.id) return;

    let cancelled = false;
    setDetail(null);
    setError("");
    setIsLoading(true);

    (async () => {
      try {
        const res = await grnApi.getGrnPdf({ id: grn.id });
        if (cancelled) return;
        if (res?.requestSuccessful && res?.data?.[0]) {
          setDetail(res.data[0]);
        } else {
          setError(res?.message || "Failed to load GRN details");
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load GRN details");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, grn?.id]);

  if (!isOpen || !grn) return null;

  const d = detail;
  const vendor = d?.grnvendormap;
  const parts = d?.grnparts ?? [];
  const grnNo = d?.grn_no ?? grn.grn_no;
  const vendorCode = d?.vendor_code ?? grn.vendor_code;
  const poNumber = d?.pogrnmap?.po_number ?? "-";
  const freightMisc = Number(d?.frieght_charges || 0) + Number(d?.mis_charges || 0);
  const grandTotal =
    d?.grand_total ?? Number(d?.pdf_total || 0) + freightMisc;

  const vendorAddress = vendor
    ? [
        vendor.address1,
        vendor.address2,
        [vendor.city, vendor.pincode].filter(Boolean).join(" "),
        vendor.state,
      ]
        .filter(Boolean)
        .join(", ")
    : "-";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div>
          <div className="flex items-center gap-2">
            <span>Goods Receipt Note: {grnNo}</span>
            {d?.document_type && (
              <Badge tone="success" className="gap-1">
                {d.document_type}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs font-normal text-ink-500">
            PO Number:{" "}
            <span className="font-semibold text-brand-700">{poNumber}</span> |
            Vendor Code:{" "}
            <span className="font-semibold text-ink-800">{vendorCode}</span>
          </p>
        </div>
      }
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading GRN details...
        </div>
      )}

      {!isLoading && error && (
        <p className="py-12 text-center text-sm text-danger-500">{error}</p>
      )}

      {!isLoading && !error && d && (
        <>
          {/* Master Details Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4 text-xs sm:grid-cols-4">
            <Field label="Vendor Code">{d.vendor_code || "-"}</Field>
            <Field label="Supplier Invoice No">
              {d.invoice_number || "-"}
            </Field>
            <Field label="Invoice Date">{d.invoice_date || "-"}</Field>
            <Field label="Transport Name">{d.transport_name || "-"}</Field>
            <Field label="LR Number">{d.lr_number || "-"}</Field>
            <Field label="LR Date">{d.lr_date || "-"}</Field>
            <Field label="E-Sugam / Road Permit No">
              {d.e_sugam_no || "-"}
            </Field>
            <Field label="Mobile Number">{vendor?.mobileNumber || "-"}</Field>
            <div className="col-span-2 sm:col-span-4">
              <span className="block text-ink-500">Supplier Address</span>
              <span className="font-semibold text-ink-900">
                {vendorAddress}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-700">
              Inward Line Items
            </h3>
            <div className="overflow-x-auto rounded-xl border border-ink-100">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ink-100 bg-ink-50/70 text-ink-600">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Part No</th>
                    <th className="px-4 py-2.5 font-semibold">Description</th>
                    <th className="px-4 py-2.5 text-center font-semibold">
                      Bin
                    </th>
                    <th className="px-4 py-2.5 text-center font-semibold">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Cost (₹)
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Discount (₹)
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Tax (₹)
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Total Amount (₹)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {parts.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-6 text-center text-ink-500"
                      >
                        No line items
                      </td>
                    </tr>
                  )}
                  {parts.map((it, idx) => (
                    <tr key={`${it.item_code}-${idx}`} className="hover:bg-ink-50/40">
                      <td className="px-4 py-2.5 font-semibold text-brand-700">
                        {it.item_code}
                      </td>
                      <td className="px-4 py-2.5 text-ink-800">
                        {it.item_description}
                      </td>
                      <td className="px-4 py-2.5 text-center text-ink-700">
                        {it.binlocation || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-center font-medium text-success-700">
                        {it.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink-700">
                        {money(it.cost)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink-700">
                        {money(it.discount)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink-700">
                        {money(it.tax)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-ink-900">
                        {money(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-3 ml-auto max-w-xs space-y-1 text-xs">
              <div className="flex justify-between text-ink-600">
                <span>Total Qty</span>
                <span className="font-semibold text-ink-900">
                  {d.total_quantity ?? 0}
                </span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Total Cost</span>
                <span className="font-semibold text-ink-900">
                  ₹ {money(d.total_cost)}
                </span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Total Discount</span>
                <span className="font-semibold text-ink-900">
                  ₹ {money(d.total_discount)}
                </span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Total Tax</span>
                <span className="font-semibold text-ink-900">
                  ₹ {money(d.total_tax)}
                </span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Freight / Misc</span>
                <span className="font-semibold text-ink-900">
                  ₹ {money(freightMisc)}
                </span>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-1.5 text-sm">
                <span className="font-bold text-ink-700">Grand Total</span>
                <span className="font-bold text-brand-700">
                  ₹ {money(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}