import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Search,
  Filter,
  Download,
  Building2,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import AddExpenseModal from "@/components/finance/AddExpenseModal";
import AddVendorModal from "@/components/finance/AddVendorModal";
import {
  INITIAL_EXPENSES,
  INITIAL_VENDORS,
  computeExpenseTotals,
} from "@/pages/finance/mockexpense";
import { showToast } from "@/utils/toast";

const STATUS_PILL = {
  Paid: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle2,
  },
  Pending: { cls: "bg-red-50 text-red-700 border-red-100", icon: AlertCircle },
};

export default function Expense() {
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [vendors, setVendors] = useState(INITIAL_VENDORS);

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState(() => new Set(["EXP001"])); // first row open by default

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  const totals = useMemo(() => computeExpenseTotals(expenses), [expenses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return expenses.filter((e) => {
      if (
        q &&
        ![e.head, e.type, e.vendor, e.invoiceNo, e.paymentMode, e.notes].some(
          (f) => (f ?? "").toLowerCase().includes(q),
        )
      )
        return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      return true;
    });
  }, [expenses, query, dateFrom, dateTo]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(filtered);

  function toggleExpand(id) {
    setExpanded((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAddExpense(payload) {
    const id = `EXP${String(expenses.length + 1).padStart(3, "0")}`;
    setExpenses((cur) => [{ id, ...payload }, ...cur]);
    setExpenseModalOpen(false);
  }
  function handleAddVendor(payload) {
    setVendors((cur) => [payload, ...cur]);
    setVendorModalOpen(false);
  }
  function handleExportCsv() {
    // TODO: BACKEND INTEGRATION - expenseApi.exportCsv({ query, dateFrom, dateTo })
    showToast.success("Exporting CSV...");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-800">Expense</h1>

      {/* 3 header stat pills */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Incl GST" amount={totals.inclGst} tone="blue" />
        <StatPill label="Total Paid" amount={totals.paid} tone="emerald" />
        <StatPill label="Total Pending" amount={totals.pending} tone="red" />
      </div>

      <Card padded={false}>
        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              icon={Search}
              className="h-11"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-10"
                aria-label="From Date"
              />
            </div>
            <span className="text-ink-400">—</span>
            <div>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="h-10"
                aria-label="To Date"
              />
            </div>
            <button
              type="button"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
              aria-label="Filter"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="tertiary"
              icon={Download}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <Button
              variant="tertiary"
              icon={Building2}
              onClick={() => setVendorModalOpen(true)}
            >
              Add Vendor
            </Button>
            <Button icon={Plus} onClick={() => setExpenseModalOpen(true)}>
              Add New
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="w-8 px-2 py-3"></th>
                <th className="px-4 py-3">Head / Type</th>
                <th className="px-4 py-3">Vendor / Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Pay Mode</th>
                <th className="px-4 py-3 text-center">Excl GST</th>
                <th className="px-4 py-3 text-center">Incl GST</th>
                <th className="px-4 py-3 text-center">Paid</th>
                <th className="px-4 py-3 text-center">Pending</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No expenses match your filters.
                  </td>
                </tr>
              )}
              {pageItems.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  isExpanded={expanded.has(e.id)}
                  onToggle={() => toggleExpand(e.id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSubmit={handleAddExpense}
      />
      <AddVendorModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSubmit={handleAddVendor}
      />
    </div>
  );
}

/* rest of the file (StatPill, ExpenseRow, DetailBlock, DetailRow) unchanged */
/* ────────────────────────────────────────────────────────────────────
 * Header stat pill (3 across the top - Total Incl GST / Paid / Pending)
 * ──────────────────────────────────────────────────────────────────── */

function StatPill({ label, amount, tone }) {
  const toneClasses = {
    blue: "border-brand-100 bg-brand-50/60",
    emerald: "border-emerald-100 bg-emerald-50/60",
    red: "border-red-100 bg-red-50/60",
  }[tone];
  const amountClasses = {
    blue: "text-brand-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
  }[tone];
  return (
    <div
      className={clsx(
        "flex items-baseline gap-2 rounded-lg border px-4 py-2.5",
        toneClasses,
      )}
    >
      <span className={clsx("text-sm font-medium", amountClasses)}>
        {label}:
      </span>
      <span className={clsx("text-md font-bold", amountClasses)}>
        ₹{amount.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * ExpenseRow — one row + its expanded detail panel below
 * ──────────────────────────────────────────────────────────────────── */

function ExpenseRow({ expense, isExpanded, onToggle }) {
  const statusMeta = STATUS_PILL[expense.status] ?? STATUS_PILL.Pending;
  const StatusIcon = statusMeta.icon;

  return (
    <>
      <tr className="border-b border-ink-100 hover:bg-ink-50/30">
        <td className="px-2 py-4 align-top">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label={isExpanded ? "Collapse row" : "Expand row"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-4 py-4">
          <p className="font-semibold text-ink-800">{expense.head}</p>
          <p className="mt-0.5 text-xs text-ink-500">{expense.type}</p>
        </td>
        <td className="px-4 py-4">
          <p className="font-medium text-ink-800">{expense.vendor}</p>
          <p className="mt-0.5 text-xs text-ink-500">{expense.invoiceNo}</p>
        </td>
        <td className="px-4 py-4 text-ink-600">{expense.date}</td>
        <td className="px-4 py-4 text-center">
          {expense.paymentMode ? (
            <span className="inline-block rounded-md border border-ink-200 bg-white px-2 py-0.5 text-xs text-ink-700">
              {expense.paymentMode}
            </span>
          ) : (
            <span className="text-ink-400">—</span>
          )}
        </td>
        <td className="px-4 py-4 text-center text-ink-700">
          ₹{expense.exclGst.toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center font-semibold text-ink-800">
          ₹{expense.inclGst.toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center text-ink-700">
          ₹{expense.paid.toLocaleString("en-IN")}
        </td>
        <td
          className={clsx(
            "px-4 py-4 text-center font-semibold",
            expense.pending > 0 ? "text-red-600" : "text-ink-500",
          )}
        >
          ₹{expense.pending.toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center">
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
              statusMeta.cls,
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {expense.status}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex justify-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ink-500  hover:text-blue-600 transition-colors"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ink-500  hover:text-emerald-600 transition-colors"
              aria-label="Upload document"
            >
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-ink-50/30">
          <td colSpan={11} className="p-0">
            <div className="flex">
              <div className="w-1 bg-brand-500" aria-hidden />
              <div className="grid flex-1 gap-6 p-5 md:grid-cols-2 xl:grid-cols-4">
                <DetailBlock title="Expense Details">
                  <DetailRow label="Expense Head" value={expense.head} />
                  <DetailRow label="Type" value={expense.type} />
                  <DetailRow label="Vendor" value={expense.vendor} />
                  <DetailRow label="Invoice No" value={expense.invoiceNo} />
                  <DetailRow label="Date" value={expense.date} />
                  <DetailRow
                    label="Payment Mode"
                    value={expense.paymentMode || "—"}
                  />
                </DetailBlock>

                <DetailBlock title="Notes">
                  <p className="text-sm text-ink-700">
                    {expense.notes || (
                      <span className="text-ink-400">No notes</span>
                    )}
                  </p>
                </DetailBlock>

                <DetailBlock title="Amount Breakdown">
                  <DetailRow
                    label="Excl. GST"
                    value={`₹${expense.exclGst.toLocaleString("en-IN")}`}
                  />
                  <DetailRow
                    label="GST"
                    value={`₹${expense.gst.toLocaleString("en-IN")}`}
                  />
                  <DetailRow
                    label="Incl. GST"
                    value={`₹${expense.inclGst.toLocaleString("en-IN")}`}
                  />
                  <DetailRow
                    label="Paid"
                    value={`₹${expense.paid.toLocaleString("en-IN")}`}
                    valueClass="text-emerald-600 font-semibold"
                  />
                  <DetailRow
                    label="Pending"
                    value={`₹${expense.pending.toLocaleString("en-IN")}`}
                    valueClass={
                      expense.pending > 0 ? "text-red-600 font-semibold" : ""
                    }
                  />
                </DetailBlock>

                <DetailBlock title="Documents">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-300 bg-white px-3 py-6 text-center hover:bg-ink-50">
                    <Upload className="h-4 w-4 text-ink-400" />
                    <span className="text-xs text-ink-600">Upload file</span>
                    <input type="file" className="hidden" />
                  </label>
                </DetailBlock>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailBlock({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, valueClass }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-ink-600">{label}</span>
      <span className={clsx("text-right text-ink-800", valueClass)}>
        {value}
      </span>
    </div>
  );
}
