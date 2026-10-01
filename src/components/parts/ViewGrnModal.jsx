import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { partsApi } from "@/services";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { mapGrnDetail } from "@/utils/grn";
import { formatINR } from "@/utils/estimateMath";

/**
 * GRN Direct + Auto GRN "View Inward Note" - loads POST /parts/Grnpdf
 * { id } for the clicked list row.
 */
export default function ViewGrnModal({ isOpen, onClose, grn }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!grn?.id) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await partsApi.getGrnDetail(grn.id);
      const mapped = isSuccess(response) ? mapGrnDetail(response) : null;
      if (!mapped) {
        setDetail(null);
        setError(responseMessage(response, "Couldn't load the GRN."));
        return;
      }
      setDetail(mapped);
    } catch (err) {
      setDetail(null);
      setError(err.message || "Couldn't load the GRN.");
    } finally {
      setIsLoading(false);
    }
  }, [grn?.id]);

  useEffect(() => {
    if (isOpen) load();
    else setDetail(null);
  }, [isOpen, load]);

  if (!isOpen || !grn) return null;

  const d = detail;
  const charges = d ? d.freightCharges + d.miscCharges : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div>
          <div className="flex items-center gap-2">
            <span>Goods Receipt Note: {d?.grnNumber || grn.grnNumber}</span>
            {d?.documentType && <Badge tone="brand">{d.documentType}</Badge>}
          </div>
          {d && (
            <p className="mt-0.5 text-xs font-normal text-ink-500">
              PO Number:{" "}
              <span className="font-semibold text-brand-700">
                {d.poNumber || "-"}
              </span>{" "}
              | Vendor Code:{" "}
              <span className="font-semibold text-ink-800">
                {d.vendorCode || "-"}
              </span>
            </p>
          )}
        </div>
      }
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-500">Loading GRN...</p>
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
        <div className="space-y-5">
          {/* Vendor + outlet */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AddressBlock
              title="Vendor"
              lines={[
                d.vendorCode,
                d.vendorAddress,
                d.vendorMobile && `Mobile: ${d.vendorMobile}`,
              ]}
            />
            <AddressBlock
              title="Received At"
              lines={[
                [d.outlet.name, d.outlet.branch && `(${d.outlet.branch})`]
                  .filter(Boolean)
                  .join(" "),
                d.outlet.address,
                d.outlet.gstin && `GSTIN: ${d.outlet.gstin}`,
              ]}
            />
          </div>

          {/* Master details */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4 text-xs sm:grid-cols-4">
            <Detail label="Supplier Invoice No" value={d.invoiceNumber} />
            <Detail label="Invoice Date" value={d.invoiceDate} />
            <Detail label="E-Sugam No" value={d.eSugamNo} />
            <Detail label="Transport Name" value={d.transportName} />
            <Detail label="LR Number" value={d.lrNumber} />
            <Detail label="LR Date" value={d.lrDate} />
            <Detail label="Freight / Misc" value={formatINR(charges)} />
            <div>
              <span className="block text-ink-500">Grand Total</span>
              <span className="text-sm font-bold text-brand-700">
                {formatINR(d.totals.grandTotal)}
              </span>
            </div>
          </div>

          {/* Line items */}
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-700">
              Inward Line Items
            </h3>
            <div className="overflow-x-auto rounded-xl border border-ink-100">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="border-b border-ink-100 bg-ink-50/70 text-ink-600">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Part No</th>
                    <th className="px-4 py-2.5 font-semibold">Description</th>
                    <th className="px-4 py-2.5 font-semibold">Bin</th>
                    <th className="px-4 py-2.5 text-center font-semibold">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Cost
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Discount
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Tax
                    </th>
                    <th className="px-4 py-2.5 text-right font-semibold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {d.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-6 text-center text-ink-500"
                      >
                        No line items.
                      </td>
                    </tr>
                  ) : (
                    d.items.map((it) => (
                      <tr key={it.key} className="hover:bg-ink-50/40">
                        <td className="px-4 py-2.5 font-semibold text-brand-700">
                          {it.itemCode || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-ink-800">
                          {it.description || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-ink-700">
                          {it.binLocation || "-"}
                        </td>
                        <td className="px-4 py-2.5 text-center text-ink-700">
                          {it.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-right text-ink-700">
                          {formatINR(it.cost)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-ink-700">
                          {formatINR(it.discount)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-ink-700">
                          {formatINR(it.tax)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-ink-900">
                          {formatINR(it.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t border-ink-100 bg-ink-50/70 font-semibold text-ink-900">
                  <tr>
                    <td className="px-4 py-2.5" colSpan={3}>
                      Total
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {d.totals.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatINR(d.totals.cost)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatINR(d.totals.discount)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatINR(d.totals.tax)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {formatINR(d.totals.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="block text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{value || "-"}</span>
    </div>
  );
}

function AddressBlock({ title, lines }) {
  const shown = lines.filter(Boolean);
  return (
    <div className="rounded-xl border border-ink-100 p-4 text-xs">
      <p className="mb-1.5 font-bold uppercase tracking-wider text-ink-500">
        {title}
      </p>
      {shown.length === 0 ? (
        <p className="text-ink-400">-</p>
      ) : (
        shown.map((line, i) => (
          <p
            key={i}
            className={
              i === 0 ? "text-sm font-semibold text-ink-900" : "text-ink-700"
            }
          >
            {line}
          </p>
        ))
      )}
    </div>
  );
}
