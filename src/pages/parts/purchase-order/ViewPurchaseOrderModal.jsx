import { useCallback, useEffect, useState } from "react";
import { Printer, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { partsApi } from "@/services";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { formatINR } from "@/utils/estimateMath";
import { isoToDdmmyyyy, lineTotal, mapPoDetail } from "@/utils/purchaseOrder";

/** View Purchase Order - loads POST /purchaseOrder/GetPOForView { id }. */
export default function ViewPurchaseOrderModal({ isOpen, onClose, po }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!po?.id) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await partsApi.getPoForView(po.id);
      const mapped = isSuccess(res) ? mapPoDetail(res?.data?.[0]) : null;
      if (!mapped) {
        setDetail(null);
        setError(responseMessage(res, "Couldn't load the purchase order."));
        return;
      }
      setDetail(mapped);
    } catch (err) {
      setDetail(null);
      setError(err.message || "Couldn't load the purchase order.");
    } finally {
      setIsLoading(false);
    }
  }, [po?.id]);

  useEffect(() => {
    if (isOpen) load();
    else setDetail(null);
  }, [isOpen, load]);

  if (!isOpen || !po) return null;

  const d = detail;
  const grandTotal = d
    ? d.parts.reduce((sum, p) => sum + (p.savedTotal || lineTotal(p)), 0)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div>
          <div className="flex items-center gap-2">
            <span>Purchase Order: {d?.poNumber || po.poNumber || po.id}</span>
            {po.status && <Badge tone="brand">{po.status}</Badge>}
          </div>
          {d && (
            <p className="mt-0.5 text-xs font-normal text-ink-500">
              Created:{" "}
              <span className="font-semibold text-ink-800">
                {d.createdAt
                  ? isoToDdmmyyyy(String(d.createdAt).slice(0, 10))
                  : "-"}
              </span>{" "}
              | Valid Till:{" "}
              <span className="font-semibold text-brand-700">
                {d.validTillDate ? isoToDdmmyyyy(d.validTillDate) : "-"}
              </span>
            </p>
          )}
        </div>
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => window.print()}
            icon={Printer}
            disabled={!d}
          >
            Print Purchase Order
          </Button>
          <Button onClick={onClose}>Close</Button>
        </>
      }
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-500">
          Loading purchase order...
        </p>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-sm text-danger-500">{error}</p>
          <button
            type="button"
            onClick={load}
            className="mt-3 text-sm font-semibold text-brand-600 hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : !d ? null : (
        <>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-ink-100 bg-ink-50/60 p-4 text-xs sm:grid-cols-3">
            <Field label="Vendor Code" value={d.vendor.vendorCode} strong />
            <Field label="Vendor Name" value={d.vendor.vendorName} />
            <Field label="GSTIN" value={d.vendor.gstin} />
            <div className="col-span-2">
              <Field label="Vendor Address" value={d.vendor.vendorAddress} />
            </div>
            <div>
              <span className="block text-ink-500">Supplier Invoice PDF</span>
              {d.invoicePdfUrl ? (
                <a
                  href={d.invoicePdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-semibold text-brand-700 hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> Open invoice
                </a>
              ) : (
                <span className="font-semibold text-ink-900">
                  No file uploaded
                </span>
              )}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-700">
              Parts Details
            </h3>
            <div className="overflow-x-auto rounded-xl border border-ink-100">
              <table className="w-full min-w-[1100px] text-left text-xs">
                <thead className="border-b border-ink-100 bg-ink-50/70 text-ink-600">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Parts Code</th>
                    <th className="px-3 py-2.5 font-semibold">Description</th>
                    <th className="px-3 py-2.5 font-semibold">HSN</th>
                    <th className="px-3 py-2.5 font-semibold">Make / Model</th>
                    <th className="px-3 py-2.5 font-semibold">Category</th>
                    <th className="px-3 py-2.5 font-semibold">Reg No / VIN</th>
                    <th className="px-3 py-2.5 text-center font-semibold">
                      Qty
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Rate
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Cost
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      MRP
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Discount
                    </th>
                    <th className="px-3 py-2.5 text-center font-semibold">
                      GST %
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {d.parts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-3 py-6 text-center text-ink-500"
                      >
                        No parts.
                      </td>
                    </tr>
                  ) : (
                    d.parts.map((p) => (
                      <tr key={p.key} className="hover:bg-ink-50/40">
                        <td className="px-3 py-2.5 font-semibold text-brand-700">
                          {p.itemCode || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-ink-800">
                          {p.description || "-"}
                          {p.remarks && (
                            <span className="block text-[11px] text-ink-500">
                              {p.remarks}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-ink-700">
                          {p.hsnCode || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-ink-700">
                          {[p.makeName, p.modelName]
                            .filter(Boolean)
                            .join(" / ") || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-ink-700">
                          {p.categoryName || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-ink-700">
                          {p.regNo || "-"}
                          {p.vinNumber && (
                            <span className="block text-[11px] text-ink-500">
                              {p.vinNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center text-ink-700">
                          {p.quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right text-ink-700">
                          {formatINR(p.rate)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-ink-700">
                          {formatINR(p.cost)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-ink-700">
                          {formatINR(p.mrp)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-ink-700">
                          {formatINR(p.discount)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-ink-700">
                          {Number(p.cgst) + Number(p.sgst) + Number(p.igst)}%
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-ink-900">
                          {formatINR(p.savedTotal || lineTotal(p))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t border-ink-100 bg-ink-50/70 font-semibold text-ink-900">
                  <tr>
                    <td className="px-3 py-2.5" colSpan={12}>
                      Grand Total
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {formatINR(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

function Field({ label, value, strong }) {
  return (
    <div>
      <span className="block text-ink-500">{label}</span>
      <span
        className={
          strong ? "font-semibold text-brand-900" : "font-semibold text-ink-900"
        }
      >
        {value || "-"}
      </span>
    </div>
  );
}
