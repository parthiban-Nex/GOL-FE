import { FileText } from "lucide-react";
import { estimateTotals, formatINR } from "@/utils/estimateMath";
import Textarea from "@/components/ui/Textarea";
export default function EstimateSummaryCard({ estimate, onRemarksChange }) {
  const t = estimateTotals(estimate);

  return (
    <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
      <div className="flex items-center gap-2 bg-brand-700 px-4 py-3 text-white">
        <FileText className="h-4 w-4" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Estimate Summary</p>
          <p className="text-xs text-brand-100">{estimate.id}</p>
        </div>
      </div>

      <div className="space-y-2.5 px-4 py-4">
        <SummaryRow
          marker="P"
          markerColor="bg-blue-100 text-blue-700"
          label="Parts Total"
          value={formatINR(t.parts)}
        />
        <SummaryRow
          marker="L"
          markerColor="bg-amber-100 text-amber-700"
          label="Labour Total"
          value={formatINR(t.labour)}
        />
        <SummaryRow
          marker="O"
          markerColor="bg-violet-100 text-violet-700"
          label="OSL Total"
          value={formatINR(t.osl)}
        />

        <div className="my-3 border-t border-dashed border-ink-200" />

        <PlainRow label="Sub Total" value={formatINR(t.subTotal)} />
        <PlainRow
          label="Discount"
          value={`- ${formatINR(t.discount)}`}
          valueClassName="text-danger-500"
        />
        <PlainRow label="Tax" value={formatINR(t.tax)} />

        <div className="my-3 border-t border-dashed border-ink-200" />

        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-ink-800">Grand Total</p>
          <p className="text-lg font-bold text-brand-700">
            {formatINR(t.grandTotal)}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Pill className="bg-blue-50 text-blue-700">
            {t.counts.parts} Parts
          </Pill>
          <Pill className="bg-amber-50 text-amber-700">
            {t.counts.labour} Labour
          </Pill>
          <Pill className="bg-violet-50 text-violet-700">
            {t.counts.osl} OSL
          </Pill>
        </div>

        <div className="pt-4">
          <Textarea
            label="Remarks"
            value={estimate.remarks ?? ""}
            onChange={(e) => onRemarksChange?.(e.target.value)}
            placeholder="Add remarks..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ marker, markerColor, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${markerColor}`}
        >
          {marker}
        </span>
        <span className="text-sm text-ink-600">{label}</span>
      </div>
      <span className="text-sm font-semibold text-ink-800">{value}</span>
    </div>
  );
}

function PlainRow({ label, value, valueClassName = "text-ink-800" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-600">{label}</span>
      <span className={`text-sm font-semibold ${valueClassName}`}>{value}</span>
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
