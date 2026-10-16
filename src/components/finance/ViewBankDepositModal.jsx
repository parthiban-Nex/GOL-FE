import { useRef } from "react";
import clsx from "clsx";
import {
  Printer,
  FileText,
  ExternalLink,
  Building2,
  Calendar,
  Clock,
  User,
  CreditCard,
  Hash,
  History,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

const STATUS_PILL = {
  Deposited: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function ViewBankDepositModal({ isOpen, onClose, deposit, onPrint }) {
  const printRef = useRef(null);

  if (!deposit) return null;

  const bankName = deposit.bankAccount?.name || deposit.bankName || "—";
  const acNo = deposit.bankAccount?.acNo || deposit.bankAccountNo || "—";
  const dateStr = deposit.depositDate || deposit.date || "—";
  const timeStr = deposit.depositTime || deposit.time || "—";
  const modeStr = deposit.depositMode || "—";
  const refStr = deposit.referenceNo || deposit.reference || "—";
  const depositedByStr = deposit.depositedBy || "—";
  const amountVal = Number(deposit.amount || 0);
  const statusStr = deposit.status || "Deposited";
  const codeStr = deposit.depositCode || deposit.id || `DEP#${deposit.id}`;
  const slipUrl = deposit.slipUrl || null;

  function handlePrintReceipt() {
    if (onPrint) {
      onPrint(deposit);
      return;
    }
    window.print();
  }

  const isSlipImage =
    slipUrl &&
    /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(slipUrl.toLowerCase());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bank Deposit Receipt & Details"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="tertiary"
            icon={Printer}
            onClick={handlePrintReceipt}
            className="text-ink-700"
          >
            Print Receipt
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div ref={printRef} className="space-y-6 p-1">
        {/* Header Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-100 bg-ink-50/50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Deposit Reference
            </p>
            <p className="mt-0.5 text-lg font-bold text-brand-700">{codeStr}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Amount Deposited
            </p>
            <p className="mt-0.5 text-2xl font-black text-emerald-600">
              ₹{amountVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 bg-white">
            <Building2 className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-ink-400 font-medium">Bank Details</p>
              <p className="text-sm font-semibold text-ink-800">{bankName}</p>
              <p className="text-xs text-ink-500 font-mono">A/c No: {acNo}</p>
              {deposit.branch && (
                <p className="text-xs text-ink-600 font-medium">Branch: {deposit.branch}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 bg-white">
            <Calendar className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-ink-400 font-medium">Deposit Date & Time</p>
              <p className="text-sm font-semibold text-ink-800">{dateStr}</p>
              <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                <Clock className="h-3.5 w-3.5 text-ink-400" />
                {timeStr}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 bg-white">
            <CreditCard className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-ink-400 font-medium">Deposit Mode & Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-sm text-ink-800">{modeStr}</span>
                <span
                  className={clsx(
                    "inline-block rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                    STATUS_PILL[statusStr] || STATUS_PILL.Deposited
                  )}
                >
                  {statusStr}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 bg-white">
            <Hash className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-ink-400 font-medium">Transaction / UTR / Ref No.</p>
              <p className="text-sm font-mono font-semibold text-ink-800">
                {refStr !== "—" ? refStr : <span className="text-ink-400 font-sans font-normal">—</span>}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-ink-100 p-3 bg-white sm:col-span-2">
            <User className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-ink-400 font-medium">Deposited By</p>
              <p className="text-sm font-semibold text-ink-800">{depositedByStr}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {deposit.notes && (
          <div className="rounded-lg border border-ink-100 bg-ink-50/30 p-3.5">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">
              Remarks / Notes
            </p>
            <p className="text-sm text-ink-700 whitespace-pre-wrap">{deposit.notes}</p>
          </div>
        )}

        {/* Attached Slip / Proof */}
        {slipUrl && (
          <div className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-ink-800 font-semibold text-xs uppercase tracking-wide">
                <FileText className="h-4 w-4 text-brand-600" />
                Attached Deposit Slip / Counterfoil
              </div>
              <a
                href={slipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
              >
                View Full Size <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {isSlipImage ? (
              <div className="max-h-72 overflow-hidden rounded-lg border border-ink-100 bg-ink-50 flex items-center justify-center p-2">
                <img
                  src={slipUrl}
                  alt="Deposit slip"
                  className="max-h-64 object-contain rounded"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-50 p-3 text-sm">
                <span className="text-ink-700 font-medium truncate max-w-sm">
                  {slipUrl.split("/").pop() || "Deposit_Document"}
                </span>
                <a
                  href={slipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-white border border-ink-200 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-ink-50"
                >
                  Download / Open
                </a>
              </div>
            )}
          </div>
        )}
        {/* Revision & Audit History */}
        {deposit.history && deposit.history.length > 0 && (
          <div className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="flex items-center gap-2 text-ink-800 font-semibold text-xs uppercase tracking-wide mb-3">
              <History className="h-4 w-4 text-brand-600" />
              Edit Revision History ({deposit.history.length})
            </div>
            <div className="space-y-2.5">
              {deposit.history.map((h, i) => (
                <div key={h.id || i} className="rounded-lg border border-ink-100 bg-ink-50/60 p-2.5 text-xs">
                  <div className="flex items-center justify-between font-medium text-ink-700">
                    <span className="font-semibold text-ink-800">
                      Revision #{deposit.history.length - i} by {h.editorName || "Staff"}
                    </span>
                    <span className="text-ink-400">
                      {h.editedAt ? new Date(h.editedAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-ink-600 leading-relaxed">
                    {h.changeSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
