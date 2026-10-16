import { useEffect, useRef, useState } from "react";
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
  Loader2,
  FileText,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Input, Card, Button, Pagination, Dropdown } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import AddExpenseModal from "@/components/finance/AddExpenseModal";
import EditExpenseModal from "@/components/finance/EditExpenseModal";
import AddVendorModal from "@/components/finance/AddVendorModal";
import RecordPaymentModal from "@/components/finance/RecordPaymentModal";
import {
  INITIAL_EXPENSES,
  INITIAL_VENDORS,
  computeExpenseTotals,
} from "@/pages/finance/mockexpense";
import { expenseApi } from "@/services";
import { showToast } from "@/utils/toast";
import { downloadCsv } from "@/utils/exportCsv";

const STATUS_PILL = {
  Paid: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle2,
  },
  "Partially Paid": {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertCircle,
  },
  Pending: { cls: "bg-red-50 text-red-700 border-red-100", icon: AlertCircle },
};

/** Detailed transaction history export columns for expenses (including partial payments & pending balances) */
const EXPENSE_DETAILED_EXPORT_COLUMNS = [
  { key: "expenseCode", header: "Expense ID" },
  { key: "head", header: "Expense Head" },
  { key: "type", header: "Expense Type" },
  { key: "vendor", header: "Vendor / Payee" },
  { key: "invoiceNo", header: "Invoice No" },
  { key: "date", header: "Invoice Date" },
  { key: "billStatus", header: "Status" },
  { key: "inclGst", header: "Total Incl. GST (₹)" },
  { key: "totalPaid", header: "Total Paid (₹)" },
  { key: "totalPending", header: "Remaining Due (₹)" },
  { key: "txnNumber", header: "Txn #" },
  { key: "txnType", header: "Transaction Type / Status" },
  { key: "txnDate", header: "Payment / Txn Date" },
  { key: "txnAmount", header: "Transaction Amount (₹)" },
  { key: "txnPaymentMode", header: "Payment Mode" },
  { key: "txnReferenceNo", header: "Ref / Cheque / UTR No" },
  { key: "txnNotes", header: "Transaction Notes" },
  { key: "txnRecordedBy", header: "Recorded By" },
  { key: "exclGst", header: "Excl. GST (₹)" },
  { key: "gst", header: "GST (₹)" },
  { key: "billNotes", header: "Expense Notes" },
  { key: "documentLink", header: "Document Link" },
];

/** Summary export columns for compact 1-row-per-expense export */
const EXPENSE_SUMMARY_EXPORT_COLUMNS = [
  { key: "expenseCode", header: "Expense ID", value: (r) => r.expenseCode || `EXP${String(r.id || "").padStart(3, "0")}` },
  { key: "head", header: "Expense Head" },
  { key: "type", header: "Expense Type" },
  { key: "vendor", header: "Vendor / Payee" },
  { key: "invoiceNo", header: "Invoice No" },
  { key: "date", header: "Date" },
  { key: "paymentMode", header: "Payment Mode", value: (r) => r.paymentMode || "—" },
  { key: "exclGst", header: "Excl. GST (₹)", value: (r) => Number(r.exclGst || 0).toFixed(2) },
  { key: "gst", header: "GST (₹)", value: (r) => Number(r.gst || 0).toFixed(2) },
  { key: "inclGst", header: "Incl. GST (₹)", value: (r) => Number(r.inclGst || 0).toFixed(2) },
  { key: "paid", header: "Paid (₹)", value: (r) => Number(r.paid || 0).toFixed(2) },
  { key: "pending", header: "Remaining (₹)", value: (r) => Number(r.pending || 0).toFixed(2) },
  { key: "status", header: "Status" },
  { key: "notes", header: "Notes", value: (r) => r.notes || "" },
  { key: "documentLink", header: "Document Link", value: (r) => r.documentLink || "" },
];

/**
 * Builds rows for the CSV report containing full transaction history,
 * including individual partial payment transactions and pending balances.
 */
function buildExpenseTransactionRows(expenses = []) {
  const rows = [];

  expenses.forEach((expense) => {
    const expenseCode =
      expense.expenseCode || `EXP${String(expense.id || "").padStart(3, "0")}`;
    const head = expense.head || "—";
    const type = expense.type || "—";
    const vendor = expense.vendor || "—";
    const invoiceNo = expense.invoiceNo || "—";
    const date = expense.date || "—";
    const exclGst = Number(expense.exclGst || 0).toFixed(2);
    const gst = Number(expense.gst || 0).toFixed(2);
    const inclGst = Number(expense.inclGst || 0).toFixed(2);
    const totalPaid = Number(expense.paid || 0).toFixed(2);
    const totalPending = Number(expense.pending || 0).toFixed(2);
    const billStatus =
      expense.status ||
      (Number(expense.pending || 0) <= 0
        ? "Paid"
        : Number(expense.paid || 0) > 0
        ? "Partially Paid"
        : "Pending");
    const billNotes = expense.notes || "";
    const documentLink = expense.documentLink || "";

    const payments = Array.isArray(expense.payments) ? [...expense.payments] : [];
    payments.sort((a, b) => {
      const dateA = a.paymentDate || a.createdAt || "";
      const dateB = b.paymentDate || b.createdAt || "";
      if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.id || 0) - (b.id || 0);
    });

    if (payments.length > 0) {
      payments.forEach((pmt, idx) => {
        const isLast = idx === payments.length - 1;
        const isPaidOff = Number(expense.pending) <= 0 && isLast;
        let txnType = "Partial Payment";
        if (payments.length === 1 && isPaidOff) {
          txnType = "Full Payment";
        } else if (idx === 0 && payments.length > 1) {
          txnType = "Initial Payment";
        } else if (isPaidOff) {
          txnType = "Final Payment";
        }

        rows.push({
          expenseCode,
          head,
          type,
          vendor,
          invoiceNo,
          date,
          billStatus,
          inclGst,
          totalPaid,
          totalPending,
          txnNumber: idx + 1,
          txnType,
          txnDate: pmt.paymentDate ? pmt.paymentDate.split("T")[0] : (expense.date || "—"),
          txnAmount: Number(pmt.amount || 0).toFixed(2),
          txnPaymentMode: pmt.paymentMode || expense.paymentMode || "—",
          txnReferenceNo: pmt.referenceNo || "—",
          txnNotes: pmt.notes || "—",
          txnRecordedBy: pmt.createdByName || pmt.createdBy || "—",
          exclGst,
          gst,
          billNotes,
          documentLink,
        });
      });

      // If balance remains, record the Pending Balance transaction row
      if (Number(expense.pending) > 0) {
        rows.push({
          expenseCode,
          head,
          type,
          vendor,
          invoiceNo,
          date,
          billStatus,
          inclGst,
          totalPaid,
          totalPending,
          txnNumber: "Pending",
          txnType: "Pending Balance",
          txnDate: "Pending",
          txnAmount: Number(expense.pending || 0).toFixed(2),
          txnPaymentMode: "Unpaid",
          txnReferenceNo: "Pending",
          txnNotes: `Remaining balance due for ${vendor}`,
          txnRecordedBy: "Pending",
          exclGst,
          gst,
          billNotes,
          documentLink,
        });
      }
    } else if (Number(expense.paid) > 0) {
      // Legacy or recorded upfront payment without separate payments row
      const isPaidOff = Number(expense.pending) <= 0;
      rows.push({
        expenseCode,
        head,
        type,
        vendor,
        invoiceNo,
        date,
        billStatus,
        inclGst,
        totalPaid,
        totalPending,
        txnNumber: 1,
        txnType: isPaidOff ? "Full Payment" : "Initial Payment",
        txnDate: expense.date || "—",
        txnAmount: Number(expense.paid || 0).toFixed(2),
        txnPaymentMode: expense.paymentMode || "—",
        txnReferenceNo: "—",
        txnNotes: expense.notes || "Initial recorded payment",
        txnRecordedBy: "—",
        exclGst,
        gst,
        billNotes,
        documentLink,
      });

      if (Number(expense.pending) > 0) {
        rows.push({
          expenseCode,
          head,
          type,
          vendor,
          invoiceNo,
          date,
          billStatus,
          inclGst,
          totalPaid,
          totalPending,
          txnNumber: "Pending",
          txnType: "Pending Balance",
          txnDate: "Pending",
          txnAmount: Number(expense.pending || 0).toFixed(2),
          txnPaymentMode: "Unpaid",
          txnReferenceNo: "Pending",
          txnNotes: `Remaining balance due for ${vendor}`,
          txnRecordedBy: "Pending",
          exclGst,
          gst,
          billNotes,
          documentLink,
        });
      }
    } else {
      // 100% Pending (No payments recorded)
      rows.push({
        expenseCode,
        head,
        type,
        vendor,
        invoiceNo,
        date,
        billStatus,
        inclGst,
        totalPaid: "0.00",
        totalPending: Number(expense.pending || expense.inclGst || 0).toFixed(2),
        txnNumber: "Pending",
        txnType: "Pending (Unpaid)",
        txnDate: "Pending",
        txnAmount: Number(expense.pending || expense.inclGst || 0).toFixed(2),
        txnPaymentMode: "Unpaid / Pending",
        txnReferenceNo: "Pending",
        txnNotes: `Expense fully pending payment for ${vendor}`,
        txnRecordedBy: "Pending",
        exclGst,
        gst,
        billNotes,
        documentLink,
      });
    }
  });

  return rows;
}

export default function Expense() {
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totals, setTotals] = useState({ inclGst: 0, paid: 0, pending: 0 });

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payingExpense, setPayingExpense] = useState(null);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  // Fetch vendors for modal dropdown
  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      const res = await expenseApi.listVendors();
      if (res?.vendorData && Array.isArray(res.vendorData)) {
        setVendors(res.vendorData);
      }
    } catch (err) {
      console.warn("Failed to load live expense vendors:", err);
    }
  }

  // Fetch expenses with debounced search, date filters, and pagination
  useEffect(() => {
    fetchExpenses();
  }, [debouncedQuery, dateFrom, dateTo, page, pageSize]);

  async function fetchExpenses() {
    try {
      setLoading(true);
      const res = await expenseApi.listExpenses({
        query: debouncedQuery,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize,
      });

      if (res?.expenseData && Array.isArray(res.expenseData)) {
        setExpenses(res.expenseData);
        setTotalItems(res.totalItems ?? res.expenseData.length);
        setTotalPages(res.totalPages ?? 1);
        if (res.totals) {
          setTotals(res.totals);
        } else {
          setTotals(computeExpenseTotals(res.expenseData));
        }
      } else {
        setExpenses([]);
        setTotalItems(0);
        setTotalPages(1);
        setTotals({ inclGst: 0, paid: 0, pending: 0 });
      }
    } catch (err) {
      console.warn("Failed to fetch live expenses:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id) {
    setExpanded((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAddExpense(newExpense) {
    fetchExpenses();
  }
  function handleOpenPayment(expense) {
    setPayingExpense(expense);
    setPaymentModalOpen(true);
  }
  function handlePaymentSuccess() {
    fetchExpenses();
    setPaymentModalOpen(false);
    setPayingExpense(null);
  }
  function handleAddVendor(payload) {
    setVendors((cur) => [payload, ...cur]);
    setVendorModalOpen(false);
  }
  async function handleUploadDocument(id, file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File size cannot exceed 10MB");
      return;
    }
    try {
      const res = await expenseApi.uploadExpenseDocument(id, file);
      if (res?.requestSuccessful || res?.data) {
        showToast.success("Document uploaded successfully");
        fetchExpenses();
      } else {
        showToast.error(res?.message || "Failed to upload document");
      }
    } catch (err) {
      console.error("Document upload error:", err);
      showToast.error(
        err?.response?.data?.message || "Failed to upload document",
      );
    }
  }
  async function handleExportCsv(mode = "detailed") {
    try {
      setExporting(true);

      const res = await expenseApi.listExpenses({
        query: debouncedQuery,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      const list = res?.expenseData || [];
      if (!list.length) {
        showToast.error("No expenses found to export.");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      if (mode === "summary") {
        downloadCsv(`expenses_summary_${today}`, list, EXPENSE_SUMMARY_EXPORT_COLUMNS);
        showToast.success(`Exported ${list.length} expenses successfully`);
        return;
      }

      // Detailed transaction history report (all transactions including partial & pending)
      const transactionRows = buildExpenseTransactionRows(list);
      downloadCsv(`expense_transactions_${today}`, transactionRows, EXPENSE_DETAILED_EXPORT_COLUMNS);
      showToast.success(`Exported ${transactionRows.length} transaction records successfully`);
    } catch (err) {
      console.error("Export CSV error:", err);
      showToast.error("Failed to export expenses CSV");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-800">Expense</h1>

      {/* 3 header stat pills */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Incl GST" amount={totals.inclGst} tone="blue" />
        <StatPill label="Total Paid" amount={totals.paid} tone="emerald" />
        <StatPill label="Total Remaining" amount={totals.pending} tone="red" />
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
            <div className="relative inline-flex items-center rounded-lg border border-ink-200 bg-white shadow-xs">
              <Button
                variant="ghost"
                icon={exporting ? Loader2 : Download}
                onClick={() => handleExportCsv("detailed")}
                disabled={exporting}
                loading={exporting}
                className="rounded-r-none border-0 text-ink-700 hover:bg-ink-50 px-3 py-2 text-sm"
                title="Export CSV with full transaction history (partial & pending)"
              >
                Export CSV
              </Button>
              <div className="h-5 w-px bg-ink-200" />
              <Dropdown
                align="right"
                trigger={
                  <button
                    type="button"
                    disabled={exporting}
                    className="flex h-9 w-7 items-center justify-center rounded-r-lg text-ink-500 hover:bg-ink-50 hover:text-ink-700 disabled:opacity-50 cursor-pointer"
                    aria-label="Export options"
                    title="More export options"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                }
              >
                <Dropdown.Item
                  icon={CreditCard}
                  onClick={() => handleExportCsv("detailed")}
                >
                  <div className="py-0.5 text-left">
                    <div className="font-medium text-ink-800">
                      Transaction History Report (CSV)
                    </div>
                    <div className="text-[11px] text-ink-500">
                      Detailed transactions, partial payments & pending balances
                    </div>
                  </div>
                </Dropdown.Item>
                <Dropdown.Item
                  icon={FileText}
                  onClick={() => handleExportCsv("summary")}
                >
                  <div className="py-0.5 text-left">
                    <div className="font-medium text-ink-800">
                      Expense Summary Report (CSV)
                    </div>
                    <div className="text-[11px] text-ink-500">
                      Compact summary (1 row per expense)
                    </div>
                  </div>
                </Dropdown.Item>
              </Dropdown>
            </div>
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
                <th className="px-4 py-3 text-center">Remaining</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No expenses match your filters.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    isExpanded={expanded.has(e.id)}
                    onToggle={() => toggleExpand(e.id)}
                    onEdit={() => {
                      setEditingExpense(e);
                      setEditModalOpen(true);
                    }}
                    onRecordPayment={() => handleOpenPayment(e)}
                    onUpload={(file) => handleUploadDocument(e.id, file)}
                  />
                ))
              )}
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
        vendors={vendors}
      />
      <EditExpenseModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={() => fetchExpenses()}
        expense={editingExpense}
        vendors={vendors}
      />
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPayingExpense(null);
        }}
        onSubmit={handlePaymentSuccess}
        expense={payingExpense}
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

function ExpenseRow({ expense, isExpanded, onToggle, onEdit, onRecordPayment, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const statusMeta = STATUS_PILL[expense.status] ?? STATUS_PILL.Pending;
  const StatusIcon = statusMeta.icon;

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      await onUpload(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

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
            {expense.pending > 0 && (
              <button
                type="button"
                onClick={onRecordPayment}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                aria-label="Record payment"
                title="Record payment"
              >
                <CreditCard className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ink-500 hover:text-blue-600 transition-colors"
              aria-label="Edit"
              title="Edit expense"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={clsx(
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors",
                expense.documentLink
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-ink-500 hover:text-emerald-600 hover:bg-ink-50",
                uploading && "opacity-60 cursor-not-allowed",
              )}
              aria-label="Upload document"
              title={
                expense.documentLink
                  ? "Replace attached document"
                  : "Upload document"
              }
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-ink-50/30">
          <td colSpan={11} className="p-0">
            <div className="flex">
              <div className="w-1 bg-brand-500" aria-hidden />
              <div className="flex-1 p-5 space-y-6">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
                      label="Remaining"
                      value={`₹${expense.pending.toLocaleString("en-IN")}`}
                      valueClass={
                        expense.pending > 0 ? "text-red-600 font-semibold" : ""
                      }
                    />
                  </DetailBlock>

                  <DetailBlock title="Documents">
                    {expense.documentLink ? (
                      <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden text-xs text-emerald-800">
                            <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="truncate font-medium">
                              {expense.documentLink.split("/").pop() ||
                                "Attached Document"}
                            </span>
                          </div>
                          {expense.documentLink.startsWith("http") && (
                            <a
                              href={expense.documentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-emerald-700 hover:bg-emerald-100"
                              title="View document"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline cursor-pointer"
                        >
                          <Upload className="h-3 w-3" />
                          Replace document
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-300 bg-white px-3 py-6 text-center hover:bg-ink-50 transition-colors"
                      >
                        {uploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                        ) : (
                          <Upload className="h-5 w-5 text-ink-400" />
                        )}
                        <span className="text-xs text-ink-600">
                          {uploading
                            ? "Uploading..."
                            : "Upload invoice / document"}
                        </span>
                        <span className="text-[10px] text-ink-400">
                          PDF, PNG, JPG up to 10MB
                        </span>
                      </button>
                    )}
                  </DetailBlock>
                </div>

                {/* Payment History & Partial Transactions Table */}
                <div className="border-t border-ink-200/80 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-brand-600" />
                      <h4 className="text-xs font-semibold text-ink-800 uppercase tracking-wide">
                        Payment Transactions History ({expense.payments?.length || 0})
                      </h4>
                    </div>

                    {expense.pending > 0 && (
                      <button
                        type="button"
                        onClick={onRecordPayment}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 shadow-xs cursor-pointer transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Record Payment
                      </button>
                    )}
                  </div>

                  {expense.payments && expense.payments.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-ink-200 bg-white shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-ink-200 bg-ink-50/70 text-ink-600 font-semibold">
                          <tr>
                            <th className="px-3.5 py-2.5">#</th>
                            <th className="px-3.5 py-2.5">Payment Date</th>
                            <th className="px-3.5 py-2.5">Amount Paid</th>
                            <th className="px-3.5 py-2.5">Payment Mode</th>
                            <th className="px-3.5 py-2.5">Ref / Cheque / UTR No</th>
                            <th className="px-3.5 py-2.5">Notes</th>
                            <th className="px-3.5 py-2.5">Recorded By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                          {expense.payments.map((p, idx) => (
                            <tr key={p.id || idx} className="hover:bg-ink-50/40">
                              <td className="px-3.5 py-2.5 text-ink-500 font-medium">{idx + 1}</td>
                              <td className="px-3.5 py-2.5 text-ink-700 font-medium">
                                {p.paymentDate ? p.paymentDate.split("T")[0] : "—"}
                              </td>
                              <td className="px-3.5 py-2.5 font-bold text-emerald-700">
                                ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className="inline-block rounded border border-ink-200 bg-ink-50 px-2 py-0.5 text-[11px] font-medium text-ink-700">
                                  {p.paymentMode || "—"}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-[11px] text-ink-800">
                                {p.referenceNo ? (
                                  <span className="bg-ink-100/70 px-1.5 py-0.5 rounded text-ink-900 font-medium">
                                    {p.referenceNo}
                                  </span>
                                ) : (
                                  <span className="text-ink-400 font-sans">—</span>
                                )}
                              </td>
                              <td className="px-3.5 py-2.5 text-ink-600 max-w-xs truncate" title={p.notes || ""}>
                                {p.notes || <span className="text-ink-400">—</span>}
                              </td>
                              <td className="px-3.5 py-2.5 text-ink-500 text-[11px]">
                                {p.createdByName || p.createdBy || "User"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-ink-200 bg-white p-4 text-center">
                      <p className="text-xs text-ink-500">
                        {expense.paid > 0
                          ? `Initial recorded payment of ₹${expense.paid.toLocaleString("en-IN")}. Detailed transaction installments will appear here.`
                          : "No payment transactions recorded yet."}
                      </p>
                      {expense.pending > 0 && (
                        <button
                          type="button"
                          onClick={onRecordPayment}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Record First Payment
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
