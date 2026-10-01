import { useState } from "react";
import clsx from "clsx";
import {
  AlertCircle,
  CreditCard,
  Calendar,
  Wrench,
  Star,
  MessageCircle,
  Mail,
  MessageSquare,
  Download,
  Printer,
  ShieldCheck,
  ChevronRight,
  Plus,
  CheckCircle2,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { estimateTotals, lineTotals, formatINR } from "@/utils/estimateMath";

export default function Step7Bill({ jobcard, onChange }) {
  const totals = estimateTotals(jobcard);
  const grand = totals.subTotal;
  const rounded = Math.round(grand);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink-800">
            Billing Details
          </h2>

          <BillTable
            title="Parts"
            total={formatINR(totals.parts)}
            headers={[
              "#",
              "Part No",
              "Parts Name",
              "HSN",
              "Qty",
              "Rate (₹)",
              "Disc (%)",
              "Tax (%)",
              "Amount (₹)",
            ]}
            rows={jobcard.parts.map((r, i) => ({
              key: r.id,
              cells: [
                i + 1,
                r.partNo,
                r.name,
                r.hsn,
                r.qty,
                r.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
                r.disc,
                r.sgst + r.cgst + r.igst,
                lineTotals(r, jobcard.includeGST).total.toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 },
                ),
              ],
            }))}
          />

          <BillTable
            title="Labour"
            total={formatINR(totals.labour)}
            headers={[
              "#",
              "Code",
              "Labour Name",
              "Type",
              "Hrs",
              "Rate (₹)",
              "Disc (%)",
              "Tax (%)",
              "Amount (₹)",
            ]}
            rows={jobcard.labour.map((r, i) => ({
              key: r.id,
              cells: [
                i + 1,
                r.code,
                r.description,
                r.type,
                r.hrs,
                r.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
                r.disc,
                r.sgst + r.cgst + r.igst,
                lineTotals(r, jobcard.includeGST).total.toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 },
                ),
              ],
            }))}
          />

          <BillTable
            title="OSL / Others"
            total={formatINR(totals.osl)}
            headers={[
              "#",
              "Description",
              "HSN",
              "Qty",
              "Rate (₹)",
              "Disc (%)",
              "Tax (%)",
              "Amount (₹)",
            ]}
            rows={jobcard.osl.map((r, i) => ({
              key: r.id,
              cells: [
                i + 1,
                r.description,
                "998729",
                1,
                r.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
                r.disc,
                r.sgst + r.cgst + r.igst,
                lineTotals(r, jobcard.includeGST).total.toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 },
                ),
              ],
            }))}
          />

          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="font-medium text-amber-800">
              This is a final bill. All services are completed.
            </p>
          </div>

          <PaymentSummary payment={jobcard.payment} total={grand} />
        </div>

        <div className="space-y-6">
          <BillSummary totals={totals} grand={grand} rounded={rounded} />
          {/* <PaymentCompleteBanner /> */}
          <ShareSendCard />
          <SidebarButton label="Bill Preview" />
          <SidebarButton label="Generate Gate Pass" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr_1fr]">
        <NextServiceCard
          nextService={jobcard.nextService}
          onChange={(next) => onChange({ ...jobcard, nextService: next })}
        />
        <MaintenanceCard maintenance={jobcard.maintenance} />
        <FeedbackCard
          feedback={jobcard.feedback}
          onChange={(next) => onChange({ ...jobcard, feedback: next })}
        />
      </div>
    </div>
  );
}

function BillTable({ title, total, headers, rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-ink-100">
      <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/50 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          {title}
        </p>
        <p className="text-sm font-bold text-brand-700">{total}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={clsx(
                    "px-4 py-2.5 whitespace-nowrap",
                    i === headers.length - 1 && "text-right",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.key}
                className="border-b border-ink-100 last:border-b-0"
              >
                {r.cells.map((c, i) => (
                  <td
                    key={i}
                    className={clsx(
                      "px-4 py-2.5",
                      i === 0 && "text-ink-500",
                      i === 1 && "font-medium text-ink-700",
                      i === 2 && "font-semibold text-ink-800",
                      i === r.cells.length - 1 &&
                        "text-right font-semibold text-ink-800",
                    )}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentSummary({ payment, total }) {
  return (
    <section className="rounded-xl border border-ink-100 p-5">
      <p className="mb-4 flex items-center gap-2 font-semibold text-ink-800">
        <CreditCard className="h-4 w-4 text-brand-600" /> Payment Details
      </p>
      <div className="flex gap-6">
        <div className="flex flex-wrap justify-between w-1/2 ">
          <Stat
            label="Amount Received"
            value={formatINR(payment.received || total)}
          />
          <Stat label="Balance Due" value={formatINR(payment.balance || 0)} />
          <div>
            <p className="text-xs text-ink-500">Payment Status</p>
            <p className="mt-1 inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-700">
              Paid
            </p>
          </div>
        </div>

        <div className="h-10 w-px shrink-0 bg-ink-100" />

        <div className="w-1/2  ">
          <p className="mb-1.5 text-xs text-ink-500">Payments (1)</p>
          <div className="flex flex-wrap items-center justify-between text-sm">
            <span className="rounded bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-700">
              {payment.mode}
            </span>
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Paid
            </span>
            <span className="text-ink-500">{payment.date}</span>
            <span className="font-semibold text-ink-800">
              {formatINR(payment.received || total)}
            </span>
            <button
              type="button"
              className="text-brand-600 hover:text-brand-700 cursor-pointer"
              aria-label="Download payment receipt"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink-800">{value}</p>
    </div>
  );
}

function NextServiceCard({ nextService, onChange }) {
  return (
    <section className="rounded-xl border border-ink-100 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
        <Calendar className="h-4 w-4 text-brand-600" /> Next Service Reminder
      </p>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Current Odometer Reading"
            value={nextService.currentOdo}
            onChange={(e) =>
              onChange({ ...nextService, currentOdo: e.target.value })
            }
          />
          <Input
            label="Average KM Per Day"
            value={nextService.avgKm}
            onChange={(e) =>
              onChange({ ...nextService, avgKm: e.target.value })
            }
          />
        </div>
        <div className="my-1 flex items-center gap-2 text-xs text-ink-400">
          <div className="h-px flex-1 bg-ink-200" /> or{" "}
          <div className="h-px flex-1 bg-ink-200" />
        </div>
        <div className="mb-1 flex items-center gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              defaultChecked
              className="h-3.5 w-3.5 text-brand-600 cursor-pointer"
            />{" "}
            Next Service Due In
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              className="h-3.5 w-3.5 text-brand-600 cursor-pointer"
            />{" "}
            On Date
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={nextService.nextInKm}
            onChange={(e) =>
              onChange({ ...nextService, nextInKm: e.target.value })
            }
          />
          <Input
            type="date"
            value={nextService.nextOnDate}
            onChange={(e) =>
              onChange({ ...nextService, nextOnDate: e.target.value })
            }
            cla
          />
        </div>
        <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
          <p className="text-xs text-ink-500">Next Service Due</p>
          <p className="mt-0.5 text-sm font-semibold text-ink-800">
            {nextService.dueLabel}
          </p>
        </div>
      </div>
      <ShareRow />
    </section>
  );
}

function MaintenanceCard({ maintenance }) {
  const badge = {
    "Due Soon": "bg-amber-50 text-amber-700",
    Upcoming: "bg-emerald-50 text-emerald-700",
  };
  return (
    <section className="rounded-xl border border-ink-100 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-800">
        <Wrench className="h-4 w-4 text-brand-600" /> Preventive Maintenance
        Reminder
      </p>
      <p className="mb-3 text-xs text-ink-500">
        Recommended maintenance items for your vehicle
      </p>
      <div className="overflow-x-auto ">
        <table className="w-full min-w-[380px] text-xs ">
          <thead>
            <tr className="border-b border-ink-100 text-left text-[10px] font-semibold uppercase tracking-wide text-ink-500">
              <th className="py-3">Item</th>
              <th className="py-3 text-right">Recommended (KM)</th>
              <th className="py-3 text-right">Due In (KM)</th>
              <th className="py-3">Due Date</th>
              <th className="py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {maintenance.map((m) => (
              <tr
                key={m.item}
                className="border-b border-ink-100 last:border-b-0 "
              >
                <td className="py-2.5 pr-2 font-medium text-ink-700">
                  {m.item}
                </td>
                <td className="py-2.5 pr-2 text-right text-ink-600">
                  {m.recommended}
                </td>
                <td className="py-2.5 pr-2 text-right text-ink-600">
                  {m.dueIn}
                </td>
                <td className="py-2.5 pr-2 text-ink-600">{m.dueDate}</td>
                <td className="py-2.5 text-right">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${badge[m.status] ?? "bg-ink-100 text-ink-600"}`}
                  >
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800">
        <Plus className="h-3.5 w-3.5" /> Add Custom Item
      </button>
      <ShareRow label="Share Maintenance Plan" />
    </section>
  );
}

function FeedbackCard({ feedback, onChange }) {
  return (
    <section className="rounded-xl border border-ink-100 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-ink-800">
        <Star className="h-4 w-4 text-amber-500" /> Customer Feedback
      </p>
      <p className="mb-3 text-xs text-ink-500">Please rate your experience</p>
      <ul className="space-y-2 text-xs">
        {Object.entries(feedback.ratings).map(([label, value], idx) => (
          <li key={label} className="flex items-center justify-between">
            <span className="truncate text-ink-700">
              {idx + 1}. {label}
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    onChange({
                      ...feedback,
                      ratings: { ...feedback.ratings, [label]: n },
                    })
                  }
                  aria-label={`Rate ${label} ${n}`}
                >
                  <Star
                    className={clsx(
                      "h-3.5 w-3.5",
                      n <= value
                        ? "fill-amber-400 text-amber-400"
                        : "text-ink-200",
                    )}
                  />
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <Textarea
          label="Additional comments (Optional)"
          value={feedback.comments}
          onChange={(e) => onChange({ ...feedback, comments: e.target.value })}
          rows={2}
          maxLength={250}
          placeholder="Type your comments..."
          className="text-xs"
        />
        <p className="mt-1 text-right text-[10px] text-ink-400">0/250</p>
      </div>
      <ShareRow />
    </section>
  );
}

function ShareRow({ label = "Share Reminder" }) {
  return (
    <div className="mt-3 border-t border-ink-100 pt-3">
      <p className="text-xs font-semibold text-ink-700">{label}</p>
      <p className="mb-2 text-[11px] text-ink-500">Share via</p>
      <div className="grid grid-cols-3 gap-2">
        <ShareChip
          icon={MessageCircle}
          label="WhatsApp"
          className="bg-emerald-50 text-emerald-700 cursor-pointer"
        />
        <ShareChip
          icon={Mail}
          label="Email"
          className="bg-blue-50 text-blue-700 cursor-pointer"
        />
        <ShareChip
          icon={MessageSquare}
          label="SMS"
          className="bg-amber-50 text-amber-700 cursor-pointer"
        />
      </div>
    </div>
  );
}

function ShareChip({ icon: Icon, label, className }) {
  return (
    <button
      className={`flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium hover:brightness-95 ${className}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function BillSummary({ totals, grand, rounded }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold text-ink-800">Bill Summary</p>
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span className="flex items-center gap-2 text-ink-600">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-[10px] font-bold text-blue-700">
              P
            </span>
            Parts Total
          </span>
          <span className="font-semibold text-ink-800">
            {formatINR(totals.parts)}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="flex items-center gap-2 text-ink-600">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-[10px] font-bold text-amber-700">
              L
            </span>
            Labour Total
          </span>
          <span className="font-semibold text-ink-800">
            {formatINR(totals.labour)}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="flex items-center gap-2 text-ink-600">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-violet-100 text-[10px] font-bold text-violet-700">
              O
            </span>
            OSL / Others Total
          </span>
          <span className="font-semibold text-ink-800">
            {formatINR(totals.osl)}
          </span>
        </li>
      </ul>
      <div className="my-3 border-t border-dashed border-ink-200" />
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span className="text-ink-600">Sub Total</span>
          <span className="font-semibold text-ink-800">
            {formatINR(totals.subTotal)}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-ink-600">Discount</span>
          <span className="font-semibold text-danger-500">
            - {formatINR(totals.discount)}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-ink-600">Tax (18%)</span>
          <span className="font-semibold text-ink-800">
            {formatINR(totals.tax)}
          </span>
        </li>
      </ul>
      <div className="my-3 border-t border-dashed border-ink-200" />
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink-800">Grand Total</p>
        <p className="text-lg font-bold text-brand-700">{formatINR(grand)}</p>
      </div>
      <p className="mt-2 text-xs text-ink-500">
        Bill Amount (Rounded Off){" "}
        <span className="font-semibold text-ink-800">
          ₹{rounded.toLocaleString("en-IN")}
        </span>
      </p>
      <div className="my-3.5 border-t border-dashed border-ink-200" />
      <PaymentCompleteBanner />
    </div>
  );
}

function PaymentCompleteBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      <div>
        <p className="text-sm font-semibold text-emerald-700">
          Payment Completed
        </p>
        <p className="text-xs text-emerald-600">Thank you! Payment received.</p>
      </div>
    </div>
  );
}

function ShareSendCard() {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink-800">
        <MessageCircle className="h-4 w-4" /> Share / Send Bill
      </p>
      <p className="mb-3 text-xs text-ink-500">Share bill with customer via</p>
      <div className="grid grid-cols-3 gap-2">
        <ShareChip
          icon={MessageCircle}
          label="WhatsApp"
          className="bg-emerald-50 text-emerald-700 cursor-pointer"
        />
        <ShareChip
          icon={Mail}
          label="Email"
          className="bg-blue-50 text-blue-700 cursor-pointer"
        />
        <ShareChip
          icon={MessageSquare}
          label="SMS"
          className="bg-amber-50 text-amber-700 cursor-pointer"
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <ShareChip
          icon={Download}
          label="Download PDF"
          className="border border-ink-200 bg-white text-ink-700 cursor-pointer"
        />
        <ShareChip
          icon={Printer}
          label="Print Bill"
          className="border border-ink-200 bg-white text-ink-700 cursor-pointer"
        />
      </div>
    </div>
  );
}

function SidebarButton({ label }) {
  return (
    <button className="flex w-full items-center justify-between rounded-xl border border-ink-100 bg-white p-4 text-sm font-semibold text-ink-800 shadow-card hover:bg-ink-50">
      {label}
      <ChevronRight className="h-4 w-4 text-ink-400" />
    </button>
  );
}
