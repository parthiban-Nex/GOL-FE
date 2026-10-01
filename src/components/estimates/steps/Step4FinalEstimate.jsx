import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Mail,
  MessageCircle,
  Pencil,
  Printer,
  Share2,
  ShieldCheck,
  Upload,
  Loader2,
} from "lucide-react";
import { NOT_CONNECTED_TITLE } from "@/utils/notConnected";
import { estimateTotals, lineTotals, formatINR } from "@/utils/estimateMath";

export default function Step4FinalEstimate({
  estimate,
  onEdit,
  onShareWhatsApp,
  onDownloadPdf,
  busyAction = null, // "whatsapp" | "pdf" while that request runs
}) {
  const t = estimateTotals(estimate);
  const items = [
    ...(estimate.parts ?? []).map((r) => ({
      id: r.id,
      label: r.name,
      type: "Part",
      qty: `${r.qty} Nos`,
      rate: r.rate,
      amount: lineTotals(r, estimate.includeGST).afterDisc,
    })),
    ...(estimate.labour ?? []).map((r) => ({
      id: r.id,
      label: r.description,
      type: "Labour",
      qty: `${r.hrs} Hrs`,
      rate: r.rate,
      amount: lineTotals(r, estimate.includeGST).afterDisc,
    })),
    ...(estimate.osl ?? []).map((r) => ({
      id: r.id,
      label: r.description,
      type: "OS",
      qty: `${r.hrs} Nos`,
      rate: r.rate,
      amount: lineTotals(r, estimate.includeGST).afterDisc,
    })),
  ];
  const subTotalPreDisc =
    items.reduce((acc, i) => acc + i.amount, 0) + t.discount;
  const totalDiscount = t.discount;
  const totalAfterDisc = subTotalPreDisc - totalDiscount;
  const gst = t.tax;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_300px]">
      <ItemsCard
        items={items}
        subTotal={subTotalPreDisc}
        gst={gst}
        total={subTotalPreDisc + gst}
        onEdit={() => onEdit?.("items")}
      />

      <div className="space-y-4">
        <InsuranceCard
          insurance={estimate.insurance}
          onEdit={() => onEdit?.("insurance")}
        />
        <DiscountCard
          subTotal={subTotalPreDisc + gst}
          discount={totalDiscount}
          afterDisc={totalAfterDisc + gst}
          onEdit={() => onEdit?.("items")}
        />
      </div>

      <div className="space-y-4">
        <SummaryCard
          estimate={estimate}
          totals={t}
          discount={totalDiscount}
          gst={gst}
        />
        <ShareCard
          onShareWhatsApp={onShareWhatsApp}
          onDownloadPdf={onDownloadPdf}
          busyAction={busyAction}
        />
      </div>
    </div>
  );
}

function ItemsCard({ items, subTotal, gst, total, onEdit }) {
  const typeStyles = {
    Part: "bg-emerald-50 text-emerald-700",
    Labour: "bg-blue-50 text-blue-700",
    OS: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink-800">Estimate Items</h3>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-500">
              <th className="py-2 pr-3">Item / Description</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Qty / Hrs</th>
              <th className="py-2 pr-3 text-right">Rate (₹)</th>
              <th className="py-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr
                key={it.id}
                className="border-b border-ink-100 last:border-b-0"
              >
                <td className="py-2.5 pr-3 font-medium text-ink-800">
                  {it.label}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${typeStyles[it.type]}`}
                  >
                    {it.type}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-ink-700">{it.qty}</td>
                <td className="py-2.5 pr-3 text-right text-ink-700">
                  {it.rate.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="py-2.5 text-right font-semibold text-ink-800">
                  {it.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-3 text-sm">
        <div className="flex justify-between text-ink-600">
          <span>Sub Total (Before Discount)</span>
          <span className="font-semibold text-ink-800">
            {formatINR(subTotal)}
          </span>
        </div>
        <div className="flex justify-between text-ink-600">
          <span>GST (18%)</span>
          <span className="font-semibold text-ink-800">{formatINR(gst)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink-800">
          <span>Total (Before Insurance &amp; Disc.)</span>
          <span>{formatINR(total)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
        <div>
          <p className="font-semibold">Estimated completion time: 1 Day</p>
          <p className="mt-0.5 text-xs text-brand-700">
            This is an estimated cost. Final bill may vary based on actual work.
          </p>
        </div>
      </div>
    </div>
  );
}

function InsuranceCard({ insurance = {}, onEdit }) {
  const isYes = insurance.claim === "Yes";
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          <h3 className="text-base font-semibold text-ink-800">
            Insurance Details
          </h3>
        </div>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      {isYes ? (
        <>
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {insurance.coverage ?? "Comprehensive"} |{" "}
            {insurance.settlementType ?? "Cashless"}
          </p>
          <dl className="space-y-2 text-sm">
            <Row label="Insurance Company" value={insurance.insurer} />
            <Row label="Policy Number" value={insurance.policyNo} />
            <Row label="Policy Period" value={insurance.policyPeriod ?? "-"} />
          </dl>
        </>
      ) : (
        <p className="text-sm text-ink-500">
          No insurance claim for this estimate.
        </p>
      )}
    </div>
  );
}

function DiscountCard({ subTotal, discount, afterDisc, onEdit }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink-800">
          Discount Details
        </h3>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      <dl className="space-y-2 text-sm">
        <Row label="Total (Before Ins & Disc)" value={formatINR(subTotal)} />
        <Row
          label="Less: Discount (B)"
          value={`- ${formatINR(discount)}`}
          valueClass="text-emerald-600 font-semibold"
        />
        <Row label="Total (After Discount)" value={formatINR(afterDisc)} />
      </dl>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
          Total Discount (B) <span className="text-xs opacity-60">ⓘ</span>
        </span>
        <span className="font-semibold text-emerald-700">
          - {formatINR(discount)}
        </span>
      </div>
    </div>
  );
}

function SummaryCard({ estimate, totals, discount, gst }) {
  const grand = totals.subTotal;
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 className="mb-3 text-base font-semibold text-ink-800">
        Estimate Summary
      </h3>
      <dl className="space-y-2 text-sm">
        <Row label="Parts Total" value={formatINR(totals.parts)} />
        <Row label="Labour Total" value={formatINR(totals.labour)} />
        <Row label="OS / Others" value={formatINR(totals.osl)} />
      </dl>
      <div className="my-3 border-t border-dashed border-ink-200" />
      <dl className="space-y-2 text-sm">
        <Row label="Sub Total" value={formatINR(totals.subTotal - gst)} />
        <Row label="Total Discount" value={formatINR(discount)} />
        <Row label="GST (18%)" value={formatINR(gst)} />
      </dl>

      <div className="mt-4 rounded-lg bg-brand-50 p-4">
        <p className="text-xs font-semibold text-brand-700">Customer Payable</p>
        <p className="mt-1 text-2xl font-bold text-brand-800">
          ₹
          {grand.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="text-[11px] text-brand-600">(Including GST)</p>
      </div>
    </div>
  );
}

function ShareCard({ onShareWhatsApp, onDownloadPdf, busyAction }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <Share2 className="h-4 w-4 text-ink-600" />
        <h3 className="text-base font-semibold text-ink-800">Share Estimate</h3>
      </div>
      <p className="mb-3 text-xs text-ink-500">Share bill with customer via</p>
      <div className="grid grid-cols-3 gap-2">
        <ShareButton
          icon={MessageCircle}
          label="WhatsApp"
          onClick={onShareWhatsApp}
          isBusy={busyAction === "whatsapp"}
          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        />
        {/* No backend API for Email / SMS yet. */}
        <ShareButton
          icon={Mail}
          label="Email"
          disabled
          title={NOT_CONNECTED_TITLE}
          className="bg-blue-50 text-blue-700 hover:bg-blue-100"
        />
        <ShareButton
          icon={Upload}
          label="SMS"
          disabled
          title={NOT_CONNECTED_TITLE}
          className="bg-amber-50 text-amber-700 hover:bg-amber-100"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ShareButton
          icon={Download}
          label="Download PDF"
          onClick={onDownloadPdf}
          isBusy={busyAction === "pdf"}
          className="bg-white text-ink-700 border border-ink-200 hover:bg-ink-50"
        />
        {/* Opens the same PDF - print it from the viewer. */}
        <ShareButton
          icon={Printer}
          label="Print Bill"
          onClick={onDownloadPdf}
          isBusy={busyAction === "pdf"}
          className="bg-white text-ink-700 border border-ink-200 hover:bg-ink-50"
        />
      </div>
    </div>
  );
}

function ShareButton({
  icon: Icon,
  label,
  className,
  onClick,
  disabled,
  isBusy,
  title,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isBusy || !onClick}
      title={title}
      className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {isBusy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}{" "}
      {label}
    </button>
  );
}

function Row({ label, value, valueClass = "text-ink-800" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-600">{label}</dt>
      <dd className={`font-medium ${valueClass}`}>{value ?? "-"}</dd>
    </div>
  );
}
