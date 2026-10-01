import { useMemo, useState } from "react";
import clsx from "clsx";
import { Download, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  PL_TIME_RANGES, PL_DATA_BY_RANGE, GARAGE_NAME,
} from "@/pages/finance/mockProfitLoss";
import { showToast } from "@/utils/toast";

/**
 * Finance > P&L. Two side-by-side statement cards (Profit & Loss +
 * Cash Flow) driven by a shared time-range toggle in the header.
 * Each card has its own Export button.
 *
 * Totals render in parentheses when negative (accounting convention).
 *
 * TODO: BACKEND INTEGRATION - swap PL_DATA_BY_RANGE[range] for
 * profitLossApi.getStatements({ from, to }) once the backend is live.
 */
export default function ProfitLoss() {
  const [range, setRange] = useState("month");
  const data = PL_DATA_BY_RANGE[range];

  function handleExport(kind) {
    // TODO: BACKEND INTEGRATION - profitLossApi.exportCsv(kind, { from, to })
    showToast.success(`${kind === "pnl" ? "P&L" : "Cash Flow"} export started.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">Garage Profitability &amp; Cash Flow</h1>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
            <span>Financial statements · {GARAGE_NAME}</span>
            <span className="font-semibold text-brand-700">{data.range.from}</span>
            <ArrowRight className="h-3.5 w-3.5 text-brand-700" />
            <span className="font-semibold text-brand-700">{data.range.to}</span>
          </p>
        </div>

        <div className="inline-flex flex-wrap gap-1   p-1">
          {PL_TIME_RANGES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setRange(t.key)}
              className={clsx(
                "rounded-4xl px-3.5 cursor-pointer py-1.5 text-sm font-semibold transition-colors",
                range === t.key ? "bg-brand-600 text-white" : "text-ink-600 bg-ink-200"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StatementCard
          title="Profit & Loss"
          columnLabel="Garage P&L"
          rows={data.pnl.rows}
          total={data.pnl.total}
          onExport={() => handleExport("pnl")}
        />
        <StatementCard
          title="Cash Flow"
          columnLabel="Garage Cash Flow"
          rows={data.cashFlow.rows}
          total={data.cashFlow.total}
          onExport={() => handleExport("cashFlow")}
        />
      </div>
    </div>
  );
}

/** Header + right-aligned Export button + Particulars/Amount table + total row. */
function StatementCard({ title, columnLabel, rows, total, onExport }) {
  const negative = total.amount < 0;
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-lg font-semibold text-ink-800">{title}</h2>
        <Button variant="secondary" size="sm" icon={Download} onClick={onExport}>Export</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-ink-100 bg-ink-50/60 text-left text-xs font-medium text-ink-500">
              <th className="px-5 py-3">Particulars</th>
              <th className="px-5 py-3 text-right">{columnLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-ink-100">
                <td className="px-5 py-3.5 text-ink-700">{r.label}</td>
                <td className="px-5 py-3.5 text-right font-medium text-ink-800">₹{r.amount.toLocaleString("en-IN")}</td>
              </tr>
            ))}
            <tr className="bg-ink-50/40">
              <td className="px-5 py-4 text-base font-bold text-ink-800">{total.label}</td>
              <td className={clsx("px-5 py-4 text-right text-base font-bold", negative ? "text-red-600" : "text-emerald-600")}>
                {negative
                  ? `(₹${Math.abs(total.amount).toLocaleString("en-IN")})`
                  : `₹${total.amount.toLocaleString("en-IN")}`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}