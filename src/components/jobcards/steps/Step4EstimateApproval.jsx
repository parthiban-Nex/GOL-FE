import { useState } from "react";
import clsx from "clsx";
import {
  Calendar,
  MessageCircle,
  Mail,
  Download,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { NOT_CONNECTED_TITLE } from "@/utils/notConnected";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { lineTotals, estimateTotals, formatINR } from "@/utils/estimateMath";

const APPROVAL_STATUSES = ["Approved", "Pending", "Rejected"];

const APPROVAL_STYLE = {
  Approved: "bg-emerald-100 text-emerald-700 before:bg-emerald-500",
  Pending: "bg-amber-100 text-amber-700 before:bg-amber-500",
  Rejected: "bg-red-100 text-red-700 before:bg-red-500",
};

/** Step 4 - Estimate Approval. Row-level Approve/Pending + right sidebar. */
export default function Step4EstimateApproval({
  jobcard,
  onChange,
  onShareWhatsApp,
  onDownloadPdf,
  busyAction = null, // "whatsapp" | "pdf" while that request runs
}) {
  const [remarks, setRemarks] = useState("");

  function setPartApproval(id, value) {
    onChange({
      ...jobcard,
      parts: jobcard.parts.map((p) =>
        p.id === id ? { ...p, approval: value } : p,
      ),
    });
  }
  function setLabourApproval(id, value) {
    onChange({
      ...jobcard,
      labour: jobcard.labour.map((l) =>
        l.id === id ? { ...l, approval: value } : l,
      ),
    });
  }
  function setMode(mode) {
    onChange({
      ...jobcard,
      estimateApproval: { ...jobcard.estimateApproval, mode },
    });
  }

  const t = estimateTotals(jobcard);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="tertiary" icon={Calendar}>
            Estimate Date/Time of Delivery
          </Button>
          <Button variant="tertiary">Self Approve</Button>
          <Button variant="tertiary">Edit Estimate</Button>
        </div>

        <ApprovalTable
          variant="parts"
          rows={jobcard.parts}
          onStatus={setPartApproval}
          includeGST={jobcard.includeGST}
        />
        <ApprovalTable
          variant="labour"
          rows={jobcard.labour}
          onStatus={setLabourApproval}
          includeGST={jobcard.includeGST}
        />

        <div className="flex flex-wrap items-start gap-4 lg:flex-nowrap">
          <div className="w-full lg:w-3/5">
            <ShareCard
              onShareWhatsApp={onShareWhatsApp}
              onDownloadPdf={onDownloadPdf}
              busyAction={busyAction}
            />
          </div>
          <div className="w-full lg:w-2/5">
            <SelfApproveCard />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SummarySidebar totals={t} jobcard={jobcard} />
        <StatusSidebar approval={jobcard.estimateApproval} />
        <ApprovalModeCard
          mode={jobcard.estimateApproval.mode}
          onChange={setMode}
          remarks={remarks}
          setRemarks={setRemarks}
        />
      </div>
    </div>
  );
}

function ApprovalTable({ variant, rows, onStatus, includeGST }) {
  const isParts = variant === "parts";
  const headers = isParts
    ? [
        "#",
        "PART NAME/PARTS NO",
        "HSN",
        "QTY",
        "RATE",
        "SGST%",
        "CGST%",
        "IGST%",
        "DISC%",
        "STATUS",
        "TOTAL (₹)",
        "",
      ]
    : [
        "#",
        "CODE",
        "DESCRIPTION",
        "HRS",
        "₹/HR",
        "SGST%",
        "CGST%",
        "IGST%",
        "DISC%",
        "STATUS",
        "TOTAL (₹)",
        "",
      ];

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-100">
      <table className="w-full min-w-[1000px] text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50/50 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            {headers.map((h, i) => (
              <th key={i} className="whitespace-nowrap px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const t = lineTotals(r, includeGST);
            return (
              <tr
                key={r.id}
                className="border-b border-ink-100 last:border-b-0"
              >
                <td className="px-3 py-2.5">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-emerald-50 px-1.5 text-xs font-semibold text-emerald-700">
                    {idx + 1}
                  </span>
                </td>
                {isParts ? (
                  <>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-ink-800">{r.name}</p>
                      <p className="text-xs text-ink-500">{r.partNo}</p>
                    </td>
                    <td className="px-3 py-2.5 text-ink-600">{r.hsn}</td>

                    <Cell value={r.qty} />

                    <Cell value={r.rate} />
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                        {r.code}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-ink-800">
                      {r.description}
                    </td>

                    <Cell value={r.hrs} />

                    <Cell value={r.rate} />
                  </>
                )}
                <td className="px-3 py-2.5 text-center text-ink-700">
                  {r.sgst}
                </td>
                <td className="px-3 py-2.5 text-center text-ink-700">
                  {r.cgst}
                </td>
                <td className="px-3 py-2.5 text-center text-ink-700">
                  {r.igst}
                </td>

                <Cell value={r.disc} />

                <td className="px-3 py-2.5">
                  <StatusSelect
                    value={r.approval}
                    onChange={(v) => onStatus(r.id, v)}
                  />
                </td>
                <td className="px-3 py-2.5 text-center font-semibold text-ink-800">
                  {t.total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td />
              </tr>
            );
          })}
          <tr className="bg-brand-50/40">
            <td
              colSpan={headers.length - 2}
              className="px-3 py-2.5 text-right text-sm font-semibold text-ink-700"
            >
              {isParts ? "Parts Total" : "Labour Total"}
            </td>
            <td className="px-3 py-2.5 text-right text-sm font-bold text-brand-700">
              {formatINR(
                rows.reduce(
                  (acc, r) => acc + lineTotals(r, includeGST).total,
                  0,
                ),
              )}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Cell({ value }) {
  return (
    <td className="px-3 py-2.5 w-24 text-center">
      <Input readOnly value={value ?? ""} />
    </td>
  );
}

function StatusSelect({ value, onChange }) {
  const style = APPROVAL_STYLE[value] ?? APPROVAL_STYLE.Pending;

  return (
    <div className="relative inline-flex">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          "py-1 pl-6 pr-8 text-xs font-medium border-none",
          style,
        )}
      >
        {APPROVAL_STATUSES.map((s) => (
          <option key={s} value={s} className={APPROVAL_STYLE[s]}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  );
}

function ShareCard({ onShareWhatsApp, onDownloadPdf, busyAction }) {
  // Both need the job card's estimate (id from createInitialPortalJobCard).
  const noEstimate = "Available once the job card is linked to an estimate";
  return (
    <div className=" rounded-xl border border-ink-100 p-5">
      <h3 className="mb-1 text-base font-semibold text-ink-800">
        Share Estimate with Customer
      </h3>
      <p className="mb-4 text-sm text-ink-500 whitespace-pre-line">
        {
          "Customer will receive the estimate details and can approve or request\nchanges."
        }
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={onShareWhatsApp}
          disabled={!onShareWhatsApp || busyAction === "whatsapp"}
          title={!onShareWhatsApp ? noEstimate : undefined}
          className="flex items-center cursor-pointer gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "whatsapp" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}{" "}
          Share via WhatsApp
        </button>
        {/* No Email API yet. */}
        <button
          type="button"
          disabled
          title={NOT_CONNECTED_TITLE}
          className="flex items-center cursor-not-allowed gap-1.5 rounded-md border border-blue-700  px-3 py-2 text-sm font-medium text-blue-700 opacity-60"
        >
          <Mail className="h-4 w-4" /> Share via Email
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={!onDownloadPdf || busyAction === "pdf"}
          title={!onDownloadPdf ? noEstimate : undefined}
          className="flex items-center cursor-pointer gap-1.5 rounded-md border border-blue-700  px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busyAction === "pdf" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}{" "}
          Download PDF
        </button>
      </div>
    </div>
  );
}

function SelfApproveCard() {
  return (
    <div className="rounded-xl border border-ink-100 p-5">
      <h3 className="mb-1 text-base font-semibold text-ink-800">
        Self Approval
      </h3>
      <p className="mb-4 text-sm text-ink-500">
        If customer is unavailable or in a hurry, you can approve the estimate
        manually.
      </p>
      <button className="flex  cursor-pointer items-center gap-1.5 rounded-md border border-accent-500 bg-white px-3 py-2 text-sm font-semibold text-accent-600 hover:bg-accent-50">
        <CheckCircle2 className="h-4 w-4" /> Approve Manually
      </button>
    </div>
  );
}

function SummarySidebar({ totals, jobcard }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
      <div className="flex items-center gap-2 bg-brand-700 px-4 py-3 text-white">
        <FileText className="h-4 w-4" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Estimate Summary</p>
          <p className="text-xs text-brand-100">EST-2405-0182</p>
        </div>
      </div>
      <div className="space-y-2.5 px-4 py-4 text-sm">
        <Row
          marker="P"
          markerClass="bg-blue-100 text-blue-700"
          label="Parts Total"
          value={formatINR(totals.parts)}
        />
        <Row
          marker="L"
          markerClass="bg-amber-100 text-amber-700"
          label="Labour Total"
          value={formatINR(totals.labour)}
        />
        <Row
          marker="O"
          markerClass="bg-violet-100 text-violet-700"
          label="OSL Total"
          value={formatINR(totals.osl)}
        />
        <div className="my-3 border-t border-dashed border-ink-200" />
        <Row label="Sub Total" value={formatINR(totals.subTotal)} />
        <Row
          label="Discount"
          value={`- ${formatINR(totals.discount)}`}
          valueClass="text-danger-500"
        />
        <Row label="Tax (18%)" value={formatINR(totals.tax)} />
        <div className="my-3 border-t border-dashed border-ink-200" />
        <div className="flex items-center justify-between">
          <p className="font-semibold text-ink-800">Grand Total</p>
          <p className="text-lg font-bold text-brand-700">
            {formatINR(totals.grandTotal)}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill className="bg-blue-50 text-blue-700">
            {totals.counts.parts} Parts
          </Pill>
          <Pill className="bg-amber-50 text-amber-700">
            {totals.counts.labour} Labour
          </Pill>
          <Pill className="bg-violet-50 text-violet-700">
            {totals.counts.osl} OSL
          </Pill>
        </div>
      </div>
    </div>
  );
}

function StatusSidebar({ approval }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-800">Estimate Status</p>
        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
          {approval.status}
        </span>
      </div>
      <ol className="space-y-0">
        {approval.timeline.map((step, i) => {
          const isLast = i === approval.timeline.length - 1;
          return (
            <li key={step.key} className="relative flex items-start gap-3 pb-3">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    "absolute left-2.5 top-5 -ml-px h-[calc(100%-0.75rem)] w-0.5",
                    step.done ? "bg-emerald-500" : "bg-ink-200",
                  )}
                />
              )}
              <span
                className={clsx(
                  "relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  step.done
                    ? "bg-emerald-500 text-white"
                    : step.active
                      ? "border-2 border-brand-500 bg-white"
                      : "border-2 border-ink-200 bg-white",
                )}
              >
                {step.done && <CheckCircle2 className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={clsx(
                    "text-sm",
                    step.done
                      ? "font-semibold text-ink-800"
                      : step.active
                        ? "font-semibold text-brand-700"
                        : "text-ink-500",
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-ink-400">{step.at}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ApprovalModeCard({ mode, onChange, remarks, setRemarks }) {
  return (
    <div className="space-y-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-ink-800">Approval Mode</p>
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="radio"
          name="approval-mode"
          value="customer"
          checked={mode === "customer"}
          onChange={() => onChange("customer")}
          className="mt-1 h-4 w-4 border-ink-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-ink-700">
          <span className="font-semibold">Customer Approval</span>{" "}
          <span className="text-ink-500">(Pending)</span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="radio"
          name="approval-mode"
          value="manual"
          checked={mode === "manual"}
          onChange={() => onChange("manual")}
          className="mt-1 h-4 w-4 border-ink-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-ink-700">
          <span className="font-semibold">Manual Approval</span>{" "}
          <span className="text-ink-500">(You can approve if needed)</span>
        </span>
      </label>
      <Textarea
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
        placeholder="Add remarks..."
        rows={3}
        maxLength={250}
      />
      <p className="text-right text-[11px] text-ink-400">
        {remarks.length}/250
      </p>
    </div>
  );
}

function Row({
  marker,
  markerClass,
  label,
  value,
  valueClass = "text-ink-800",
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {marker && (
          <span
            className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${markerClass}`}
          >
            {marker}
          </span>
        )}
        <span className="text-ink-600">{label}</span>
      </div>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function Pill({ children, className }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}
