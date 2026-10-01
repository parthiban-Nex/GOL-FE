import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import {
  Car,
  Building2,
  UserRound,
  ShieldCheck,
  FileDown,
  Pencil,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { estimateApi } from "@/services";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { mapEstimateDetail } from "@/utils/estimateDetail";
import { formatINR } from "@/utils/estimateMath";

/**
 * Read-only estimate view (GET /serviceEstimate/getEstimate?id=).
 * Same layout language as CustomerVehiclesModal: summary card on top,
 * detail cards, line tables, totals.
 */
export default function EstimateViewModal({
  isOpen,
  onClose,
  estimate, // list row: { estimateId, id (number), status, ... }
  onDownloadPdf,
  isDownloading = false,
  onEdit,
}) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!estimate?.estimateId) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await estimateApi.get(estimate.estimateId);
      if (!isSuccess(response) || !response?.data) {
        setDetail(null);
        setError(responseMessage(response, "Couldn't load the estimate."));
        return;
      }
      setDetail(mapEstimateDetail(response.data));
    } catch (err) {
      setDetail(null);
      setError(err.message || "Couldn't load the estimate.");
    } finally {
      setIsLoading(false);
    }
  }, [estimate?.estimateId]);

  useEffect(() => {
    if (isOpen) load();
    else setDetail(null);
  }, [isOpen, load]);

  const b = detail?.booking;
  const hasInsurance =
    detail &&
    (detail.customer.insuranceCompany ||
      detail.customer.insuranceClaimNo ||
      detail.customer.insuranceExpiryDate);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Estimate Details"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button variant="border" icon={Pencil} onClick={onEdit}>
              Edit
            </Button>
          )}
          <Button
            icon={FileDown}
            onClick={onDownloadPdf}
            isLoading={isDownloading}
            disabled={!estimate?.estimateId}
          >
            Download PDF
          </Button>
        </>
      }
    >
      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-500">
          Loading estimate...
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
      ) : !detail ? null : (
        <div className="space-y-6">
          {/* ---------------- Summary ---------------- */}
          <div className="flex flex-wrap items-center gap-6 rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-100">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-50">
                <Car className="h-6 w-6 text-accent-500" />
              </div>
              <div>
                <p className="text-lg font-semibold text-ink-800">
                  {b.number || estimate?.id || "-"}
                </p>
                <p className="text-sm text-ink-500">
                  Estimate Date: {b.date || "-"}
                </p>
              </div>
            </div>
            <div className="ml-auto flex flex-wrap gap-x-10 gap-y-3">
              <SummaryField label="Reg. No" value={b.regNo} />
              <SummaryField
                label="Make / Model"
                value={[b.make, b.model].filter(Boolean).join(" ")}
              />
              <SummaryField label="KM Reading" value={b.kmReading} />
              <SummaryField label="Branch" value={b.branch} />
              {estimate?.status && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-400">
                    Status
                  </p>
                  <span className="mt-0.5 inline-flex rounded-full bg-success-50 px-3 py-0.5 text-sm font-medium text-success-500">
                    {estimate.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ---------------- Customer / Branch ---------------- */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard icon={UserRound} title="Customer">
              <InfoRow label="Name" value={detail.customer.name} strong />
              <InfoRow label="Address" value={detail.customer.address} />
              <InfoRow label="GSTIN" value={detail.customer.gstin} />
              <InfoRow label="Chassis No" value={detail.customer.chassisNo} />
              <InfoRow
                label="Service Type"
                value={detail.customer.serviceType}
              />
            </InfoCard>
            <InfoCard icon={Building2} title="Branch">
              <InfoRow label="Outlet" value={detail.branch.outletName} strong />
              <InfoRow label="Branch" value={detail.branch.name} />
              <InfoRow label="Address" value={detail.branch.address} />
              <InfoRow label="Phone" value={detail.branch.phone} />
              <InfoRow label="Email" value={detail.branch.email} />
              <InfoRow label="GSTIN" value={detail.branch.gstin} />
            </InfoCard>
          </div>

          {hasInsurance && (
            <InfoCard icon={ShieldCheck} title="Insurance">
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-3">
                <InfoRow
                  label="Company"
                  value={detail.customer.insuranceCompany}
                />
                <InfoRow
                  label="Claim No"
                  value={detail.customer.insuranceClaimNo}
                />
                <InfoRow
                  label="Expiry"
                  value={detail.customer.insuranceExpiryDate}
                />
              </div>
            </InfoCard>
          )}

          {detail.customerVoice && (
            <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-400">
                Customer Voice
              </p>
              <p className="mt-1 text-sm text-ink-700">
                {detail.customerVoice}
              </p>
            </div>
          )}

          {/* ---------------- Lines ---------------- */}
          <LinesTable
            title="Labour Details"
            qtyLabel="Hrs"
            lines={detail.labours}
            totals={detail.totals.labours}
            emptyText="No labour added to this estimate."
          />
          <LinesTable
            title="Parts Details"
            qtyLabel="Qty"
            lines={detail.items}
            totals={detail.totals.items}
            emptyText="No parts added to this estimate."
          />

          {/* ---------------- Totals ---------------- */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-4">
            <div className="space-y-1 text-sm text-ink-500">
              <p>
                Labour Total:
                <span className="ml-1 font-semibold text-ink-800">
                  {formatINR(detail.totals.labours.amount)}
                </span>
              </p>
              <p>
                Parts Total:
                <span className="ml-1 font-semibold text-ink-800">
                  {formatINR(detail.totals.items.amount)}
                </span>
              </p>
              {detail.amountInWords && (
                <p className="italic">Rupees {detail.amountInWords} Only</p>
              )}
            </div>
            <div className="rounded-lg bg-accent-50 px-6 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
                Grand Total
              </p>
              <p className="text-3xl font-bold text-accent-600">
                {formatINR(detail.totals.grandTotal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function SummaryField({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-800">
        {value || "-"}
      </p>
    </div>
  );
}

function InfoCard({ icon, title, children }) {
  const Icon = icon;
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-ink-100 pb-2">
        <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, strong }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-24 shrink-0 text-ink-400">{label}</span>
      <span
        className={clsx(
          "min-w-0 break-words",
          strong ? "font-semibold text-ink-800" : "text-ink-700",
        )}
      >
        {value || "-"}
      </span>
    </div>
  );
}

function LinesTable({ title, qtyLabel, lines, totals, emptyText }) {
  return (
    <div>
      <h3 className="mb-2 text-base font-semibold text-ink-800">{title}</h3>
      {lines.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-200 p-5 text-center text-sm text-ink-500">
          {emptyText}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-ink-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-ink-50 text-ink-500">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">#</th>
                <th className="px-3 py-2.5 text-left font-medium">
                  Description
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  {qtyLabel}
                </th>
                <th className="px-3 py-2.5 text-right font-medium">Rate</th>
                <th className="px-3 py-2.5 text-right font-medium">Discount</th>
                <th className="px-3 py-2.5 text-right font-medium">CGST</th>
                <th className="px-3 py-2.5 text-right font-medium">SGST</th>
                <th className="px-3 py-2.5 text-right font-medium">IGST</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {lines.map((l, i) => (
                <tr key={l.key}>
                  <td className="px-3 py-2.5 text-ink-500">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <p className="text-ink-800">{l.name || "-"}</p>
                    {(l.code || l.hsn) && (
                      <p className="text-xs text-ink-400">
                        {[l.code, l.hsn && `HSN: ${l.hsn}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-700">
                    {l.qty}
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-700">
                    {formatINR(l.rate)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-700">
                    {formatINR(l.discount)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-700">
                    {formatINR(l.cgst)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-700">
                    {formatINR(l.sgst)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-ink-700">
                    {formatINR(l.igst)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink-800">
                    {formatINR(l.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-ink-50 font-semibold text-ink-800">
              <tr>
                <td className="px-3 py-2.5" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-2.5 text-right">{totals.qty}</td>
                <td className="px-3 py-2.5 text-right">
                  {formatINR(totals.rate)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {formatINR(totals.discount)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {formatINR(totals.cgst)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {formatINR(totals.sgst)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {formatINR(totals.igst)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {formatINR(totals.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
