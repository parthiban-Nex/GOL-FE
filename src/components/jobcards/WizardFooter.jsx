import { Tag, Trophy } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import { estimateTotals, formatINR } from "@/utils/estimateMath";

export default function WizardFooter({
  jobcard,
  showTotals = false,
  showSavings = false,
  savedAmount = 250,
  pointsEarned = 920,
  primaryLabel = "Continue",
  onSave,
  onPreview,
  onPrimary,
  isBusy = false,
}) {
  const t = showTotals ? estimateTotals(jobcard) : null;

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="flex flex-wrap justify-end gap-4">
        {t && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <TotalItem
              marker="P"
              markerClass="bg-blue-100 text-blue-700"
              label="Parts Total"
              value={formatINR(t.parts)}
            />
            <TotalItem
              marker="L"
              markerClass="bg-amber-100 text-amber-700"
              label="Labour Total"
              value={formatINR(t.labour)}
            />
            <TotalItem
              label="Sub Total"
              value={`₹${Math.round(t.subTotal - t.tax).toLocaleString("en-IN")}`}
            />
            <TotalItem
              label="Discount"
              value={`-${formatINR(t.discount)}`}
              valueClass="text-danger-500"
            />
            <TotalItem
              label="Grand Total"
              value={formatINR(t.grandTotal)}
              valueClass="text-brand-700"
            />
          </div>
        )}

        {showSavings && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
              <Tag className="h-3.5 w-3.5" />₹{savedAmount} Saved!
            </span>
            <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
              <Trophy className="h-3.5 w-3.5" />+{pointsEarned} Points Earned!
              <span
                className="h-1.5 w-16 overflow-hidden rounded-full bg-blue-200"
                aria-hidden="true"
              >
                <span className="block h-full w-2/3 bg-blue-600" />
              </span>
              <span>Level up</span>
            </div>
          </div>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="border" onClick={onSave} disabled={isBusy}>
            Save
          </Button>
          <Button variant="border" onClick={onPreview}>
            Preview
          </Button>
          <Button onClick={onPrimary} isLoading={isBusy} disabled={isBusy}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TotalItem({
  marker,
  markerClass,
  label,
  value,
  valueClass = "text-ink-500",
  emphasize = false,
}) {
  return (
    <div className="flex items-center gap-2">
      {marker && (
        <span
          className={clsx(
            "flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold",
            markerClass,
          )}
        >
          {marker}
        </span>
      )}
      <div className="leading-tight">
        <p className="text-[13px] font-medium  tracking-wide text-ink-900">
          {label}
        </p>
        <p
          className={clsx(
            "font-semibold",
            valueClass,
            emphasize ? "text-base text-brand-700" : "text-sm",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
