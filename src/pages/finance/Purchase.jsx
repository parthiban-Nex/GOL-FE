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
  Clock,
  Loader2,
  FileText,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Input, Card, Button, Pagination, Dropdown } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import AddPurchaseModal from "@/components/finance/AddPurchaseModal";
import EditPurchaseModal from "@/components/finance/EditPurchaseModal";
import RecordPurchasePaymentModal from "@/components/finance/RecordPurchasePaymentModal";
import AddVendorModal from "@/components/finance/AddVendorModal";
import { computePurchaseTotals } from "@/pages/finance/mockPurchase";
import { purchaseApi } from "@/services/api/purchaseApi";
import { showToast } from "@/utils/toast";
import { downloadCsv } from "@/utils/exportCsv";

const STATUS_PILL = {
  Paid: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle2,
  },
  Partial: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  Pending: {
    cls: "bg-red-50 text-red-700 border-red-100",
    icon: AlertCircle,
  },
};

/** Columns for detailed transaction history report (including partial payments & pending balances) */
const PURCHASE_DETAILED_EXPORT_COLUMNS = [
  { key: "purchaseCode", header: "Purchase ID" },
  { key: "vendor", header: "Vendor / Supplier" },
  { key: "invoiceNo", header: "Invoice No" },
  { key: "invoiceDate", header: "Invoice Date" },
  { key: "billStatus", header: "Bill Status" },
  { key: "inclGst", header: "Bill Total Incl. GST (₹)" },
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
  { key: "billNotes", header: "Purchase Notes" },
  { key: "documentLink", header: "Document Link" },
];

/** Summary columns for compact 1-row-per-purchase export */
const PURCHASE_SUMMARY_EXPORT_COLUMNS = [
  { key: "purchaseCode", header: "Purchase ID", value: (r) => r.purchaseCode || `PUR${String(r.id || "").padStart(3, "0")}` },
  { key: "vendor", header: "Vendor / Supplier" },
  { key: "invoiceNo", header: "Invoice No" },
  { key: "date", header: "Invoice Date" },
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
function buildPurchaseTransactionRows(purchases = []) {
  const rows = [];

  purchases.forEach((purchase) => {
    const purchaseCode =
      purchase.purchaseCode || `PUR${String(purchase.id || "").padStart(3, "0")}`;
    const vendor = purchase.vendor || "—";
    const invoiceNo = purchase.invoiceNo || "—";
    const invoiceDate = purchase.date || "—";
    const exclGst = Number(purchase.exclGst || 0).toFixed(2);
    const gst = Number(purchase.gst || 0).toFixed(2);
    const inclGst = Number(purchase.inclGst || 0).toFixed(2);
    const totalPaid = Number(purchase.paid || 0).toFixed(2);
    const totalPending = Number(purchase.pending || 0).toFixed(2);
    const billStatus =
      purchase.status ||
      (Number(purchase.pending || 0) <= 0
        ? "Paid"
        : Number(purchase.paid || 0) > 0
        ? "Partial"
        : "Pending");
    const billNotes = purchase.notes || "";
    const documentLink = purchase.documentLink || "";

    const payments = Array.isArray(purchase.payments) ? [...purchase.payments] : [];
    payments.sort((a, b) => {
      const dateA = a.paymentDate || a.createdAt || "";
      const dateB = b.paymentDate || b.createdAt || "";
      if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.id || 0) - (b.id || 0);
    });

    if (payments.length > 0) {
      payments.forEach((pmt, idx) => {
        const isLast = idx === payments.length - 1;
        const isPaidOff = Number(purchase.pending) <= 0 && isLast;
        let txnType = "Partial Payment";
        if (payments.length === 1 && isPaidOff) {
          txnType = "Full Payment";
        } else if (idx === 0 && payments.length > 1) {
          txnType = "Initial Payment";
        } else if (isPaidOff) {
          txnType = "Final Payment";
        }

        rows.push({
          purchaseCode,
          vendor,
          invoiceNo,
          invoiceDate,
          billStatus,
          inclGst,
          totalPaid,
          totalPending,
          txnNumber: idx + 1,
          txnType,
          txnDate: pmt.paymentDate ? pmt.paymentDate.split("T")[0] : (purchase.date || "—"),
          txnAmount: Number(pmt.amount || 0).toFixed(2),
          txnPaymentMode: pmt.paymentMode || purchase.paymentMode || "—",
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
      if (Number(purchase.pending) > 0) {
        rows.push({
          purchaseCode,
          vendor,
          invoiceNo,
          invoiceDate,
          billStatus,
          inclGst,
          totalPaid,
          totalPending,
          txnNumber: "Pending",
          txnType: "Pending Balance",
          txnDate: "Pending",
          txnAmount: Number(purchase.pending || 0).toFixed(2),
          txnPaymentMode: "Unpaid",
          txnReferenceNo: "Pending",
          txnNotes: `Remaining balance due to ${vendor}`,
          txnRecordedBy: "Pending",
          exclGst,
          gst,
          billNotes,
          documentLink,
        });
      }
    } else if (Number(purchase.paid) > 0) {
      // Legacy or recorded upfront payment without separate payments row
      const isPaidOff = Number(purchase.pending) <= 0;
      rows.push({
        purchaseCode,
        vendor,
        invoiceNo,
        invoiceDate,
        billStatus,
        inclGst,
        totalPaid,
        totalPending,
        txnNumber: 1,
        txnType: isPaidOff ? "Full Payment" : "Initial Payment",
        txnDate: purchase.date || "—",
        txnAmount: Number(purchase.paid || 0).toFixed(2),
        txnPaymentMode: purchase.paymentMode || "—",
        txnReferenceNo: "—",
        txnNotes: purchase.notes || "Initial recorded payment",
        txnRecordedBy: "—",
        exclGst,
        gst,
        billNotes,
        documentLink,
      });

      if (Number(purchase.pending) > 0) {
        rows.push({
          purchaseCode,
          vendor,
          invoiceNo,
          invoiceDate,
          billStatus,
          inclGst,
          totalPaid,
          totalPending,
          txnNumber: "Pending",
          txnType: "Pending Balance",
          txnDate: "Pending",
          txnAmount: Number(purchase.pending || 0).toFixed(2),
          txnPaymentMode: "Unpaid",
          txnReferenceNo: "Pending",
          txnNotes: `Remaining balance due to ${vendor}`,
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
        purchaseCode,
        vendor,
        invoiceNo,
        invoiceDate,
        billStatus,
        inclGst,
        totalPaid: "0.00",
        totalPending: Number(purchase.pending || purchase.inclGst || 0).toFixed(2),
        txnNumber: "Pending",
        txnType: "Pending (Unpaid)",
        txnDate: "Pending",
        txnAmount: Number(purchase.pending || purchase.inclGst || 0).toFixed(2),
        txnPaymentMode: "Unpaid / Pending",
        txnReferenceNo: "Pending",
        txnNotes: `Invoice fully pending payment to ${vendor}`,
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

export default function Purchase() {
  const [purchases, setPurchases] = useState([]);
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

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payingPurchase, setPayingPurchase] = useState(null);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    try {
      const res = await purchaseApi.listVendors();
      if (res?.vendorData && Array.isArray(res.vendorData)) {
        setVendors(res.vendorData);
      }
    } catch (err) {
      console.warn("Failed to load purchase vendors:", err);
    }
  }

  useEffect(() => {
    fetchPurchases();
  }, [debouncedQuery, dateFrom, dateTo, page, pageSize]);

  async function fetchPurchases() {
    try {
      setLoading(true);
      const res = await purchaseApi.listPurchases({
        query: debouncedQuery,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize,
      });

      if (res?.purchaseData && Array.isArray(res.purchaseData)) {
        setPurchases(res.purchaseData);
        setTotalItems(res.totalItems ?? res.purchaseData.length);
        setTotalPages(res.totalPages ?? 1);
        if (res.totals) {
          setTotals(res.totals);
        } else {
          setTotals(computePurchaseTotals(res.purchaseData));
        }
      } else {
        setPurchases([]);
        setTotalItems(0);
        setTotalPages(1);
        setTotals({ inclGst: 0, paid: 0, pending: 0 });
      }
    } catch (err) {
      console.warn("Failed to fetch live purchases:", err);
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

  function handleAddPurchase() {
    fetchPurchases();
  }

  function handleOpenPayment(purchase) {
    setPayingPurchase(purchase);
    setPaymentModalOpen(true);
  }

  function handlePaymentSuccess() {
    fetchPurchases();
    setPaymentModalOpen(false);
    setPayingPurchase(null);
  }

  function handleAddVendor(payload) {
    fetchVendors();
    setVendorModalOpen(false);
  }

  async function handleUploadDocument(id, file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File size cannot exceed 10MB");
      return;
    }
    try {
      const res = await purchaseApi.uploadPurchaseDocument(id, file);
      if (res?.requestSuccessful || res?.data) {
        showToast.success("Invoice document uploaded successfully");
        fetchPurchases();
      } else {
        showToast.error(res?.message || "Failed to upload document");
      }
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || "Failed to upload document");
    }
  }

  async function handleExportCsv(mode = "detailed") {
    try {
      setExporting(true);
      const res = await purchaseApi.listPurchases({
        query: debouncedQuery,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      const list = res?.purchaseData || [];
      if (!list.length) {
        showToast.error("No purchases found to export.");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      if (mode === "summary") {
        downloadCsv(`purchases_summary_${today}`, list, PURCHASE_SUMMARY_EXPORT_COLUMNS);
        showToast.success(`Exported ${list.length} purchase bills successfully`);
        return;
      }

      // Detailed transaction history report (all transactions including partial & pending)
      const transactionRows = buildPurchaseTransactionRows(list);
      downloadCsv(`purchase_transactions_${today}`, transactionRows, PURCHASE_DETAILED_EXPORT_COLUMNS);
      showToast.success(`Exported ${transactionRows.length} transaction records successfully`);
    } catch (err) {
      console.error("Export CSV error:", err);
      showToast.error("Failed to export purchases CSV");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-800">Purchase Bills & Invoices</h1>

      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Incl GST" amount={totals.inclGst} tone="blue" />
        <StatPill label="Total Paid" amount={totals.paid} tone="emerald" />
        <StatPill label="Total Pending" amount={totals.pending} tone="red" />
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by vendor, invoice no, notes..."
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
          </div>
          <div className="flex items-center gap-2">
            <div className="relative inline-flex items-center rounded-lg border border-ink-200 bg-white shadow-xs">
              <Button
                variant="ghost"
                icon={Download}
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
                      Purchase Bills Summary (CSV)
                    </div>
                    <div className="text-[11px] text-ink-500">
                      Compact summary (1 row per invoice)
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
            <Button icon={Plus} onClick={() => setPurchaseModalOpen(true)}>
              Add Purchase
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="w-8 px-2 py-3"></th>
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
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No purchases match your filters.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <PurchaseRow
                    key={p.id}
                    purchase={p}
                    isExpanded={expanded.has(p.id)}
                    onToggle={() => toggleExpand(p.id)}
                    onEdit={() => {
                      setEditingPurchase(p);
                      setEditModalOpen(true);
                    }}
                    onRecordPayment={() => handleOpenPayment(p)}
                    onUpload={(file) => handleUploadDocument(p.id, file)}
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

      <AddPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSubmit={handleAddPurchase}
        vendors={vendors}
      />
      <EditPurchaseModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingPurchase(null);
        }}
        onSubmit={() => fetchPurchases()}
        purchase={editingPurchase}
        vendors={vendors}
      />
      <RecordPurchasePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPayingPurchase(null);
        }}
        onSubmit={handlePaymentSuccess}
        purchase={payingPurchase}
      />
      <AddVendorModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSubmit={handleAddVendor}
        createVendorFn={purchaseApi.createVendor}
        title="Add Purchase Vendor"
      />
    </div>
  );
}

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
        toneClasses
      )}
    >
      <span className={clsx("text-sm font-medium", amountClasses)}>
        {label}:
      </span>
      <span className={clsx("text-md font-bold", amountClasses)}>
        ₹{(Number(amount) || 0).toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function PurchaseRow({
  purchase,
  isExpanded,
  onToggle,
  onEdit,
  onRecordPayment,
  onUpload,
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const statusMeta = STATUS_PILL[purchase.status] ?? STATUS_PILL.Pending;
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

  const lineItems = Array.isArray(purchase.lineItems) ? purchase.lineItems : [];
  const payments = Array.isArray(purchase.payments) ? purchase.payments : [];

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
          <p className="font-semibold text-ink-800">{purchase.vendor}</p>
          <p className="mt-0.5 text-xs text-ink-500">{purchase.invoiceNo}</p>
        </td>
        <td className="px-4 py-4 text-ink-600">{purchase.date}</td>
        <td className="px-4 py-4 text-center">
          {purchase.paymentMode ? (
            <span className="inline-block rounded-md border border-ink-200 bg-white px-2 py-0.5 text-xs text-ink-700">
              {purchase.paymentMode}
            </span>
          ) : (
            <span className="text-ink-400">—</span>
          )}
        </td>
        <td className="px-4 py-4 text-center text-ink-700">
          ₹{Number(purchase.exclGst || 0).toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center font-semibold text-ink-800">
          ₹{Number(purchase.inclGst || 0).toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center text-ink-700">
          ₹{Number(purchase.paid || 0).toLocaleString("en-IN")}
        </td>
        <td
          className={clsx(
            "px-4 py-4 text-center font-semibold",
            Number(purchase.pending) > 0 ? "text-red-600" : "text-ink-500"
          )}
        >
          ₹{Number(purchase.pending || 0).toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center">
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
              statusMeta.cls
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {purchase.status}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex justify-center gap-1">
            {Number(purchase.pending) > 0 && (
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
              title="Edit purchase bill"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={clsx(
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors",
                purchase.documentLink
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-ink-500 hover:text-emerald-600 hover:bg-ink-50",
                uploading && "opacity-60 cursor-not-allowed"
              )}
              aria-label="Upload document"
              title={
                purchase.documentLink
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
          <td colSpan={10} className="p-0">
            <div className="flex">
              <div className="w-1 bg-brand-500" aria-hidden />
              <div className="flex-1 p-5 space-y-6">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  <DetailBlock title="Purchase Details">
                    <DetailRow label="Purchase ID" value={purchase.purchaseCode || `PUR#${purchase.id}`} />
                    <DetailRow label="Vendor" value={purchase.vendor} />
                    <DetailRow label="Invoice No" value={purchase.invoiceNo} />
                    <DetailRow label="Date" value={purchase.date} />
                    <DetailRow
                      label="Payment Mode"
                      value={purchase.paymentMode || "—"}
                    />
                  </DetailBlock>

                  <DetailBlock title="Line Items Summary">
                    {lineItems.length === 0 ? (
                      <p className="text-sm text-ink-400">No line items recorded</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-[10px] font-medium text-ink-500 border-b border-ink-100">
                              <th className="pb-1.5">Item</th>
                              <th className="pb-1.5 text-right">Qty</th>
                              <th className="pb-1.5 text-right">Rate</th>
                              <th className="pb-1.5 text-right">Amt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lineItems.map((li, i) => (
                              <tr key={li.id || i} className="border-b border-ink-50">
                                <td className="py-1 text-ink-800 font-medium">{li.name}</td>
                                <td className="py-1 text-right text-ink-700">
                                  {Number(li.qty)}
                                </td>
                                <td className="py-1 text-right text-ink-700">
                                  ₹{Number(li.rate || 0).toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 text-right font-semibold text-ink-800">
                                  ₹{Number(li.amount || 0).toLocaleString("en-IN")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </DetailBlock>

                  <DetailBlock title="Amount Breakdown">
                    <DetailRow
                      label="Excl. GST"
                      value={`₹${Number(purchase.exclGst || 0).toLocaleString("en-IN")}`}
                    />
                    <DetailRow
                      label="GST"
                      value={`₹${Number(purchase.gst || 0).toLocaleString("en-IN")}`}
                    />
                    <DetailRow
                      label="Incl. GST"
                      value={`₹${Number(purchase.inclGst || 0).toLocaleString("en-IN")}`}
                    />
                    <DetailRow
                      label="Paid"
                      value={`₹${Number(purchase.paid || 0).toLocaleString("en-IN")}`}
                      valueClass="text-emerald-600 font-semibold"
                    />
                    <DetailRow
                      label="Remaining"
                      value={`₹${Number(purchase.pending || 0).toLocaleString("en-IN")}`}
                      valueClass={
                        Number(purchase.pending) > 0 ? "text-red-600 font-semibold" : ""
                      }
                    />
                  </DetailBlock>

                  <DetailBlock title="Documents">
                    {purchase.documentLink ? (
                      <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden text-xs text-emerald-800">
                            <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="truncate font-medium">
                              {purchase.documentLink.split("/").pop() ||
                                "Attached Invoice"}
                            </span>
                          </div>
                          {purchase.documentLink.startsWith("http") && (
                            <a
                              href={purchase.documentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-emerald-700 hover:bg-emerald-100"
                              title="View invoice"
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
                          Replace invoice document
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
                        Payment Transactions History ({payments.length})
                      </h4>
                    </div>

                    {Number(purchase.pending) > 0 && (
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

                  {payments.length > 0 ? (
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
                          {payments.map((p, idx) => (
                            <tr key={p.id || idx} className="hover:bg-ink-50/40">
                              <td className="px-3.5 py-2.5 text-ink-500 font-medium">
                                {idx + 1}
                              </td>
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
                              <td
                                className="px-3.5 py-2.5 text-ink-600 max-w-xs truncate"
                                title={p.notes || ""}
                              >
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
                        {Number(purchase.paid) > 0
                          ? `Initial recorded payment of ₹${Number(purchase.paid).toLocaleString("en-IN")}. Detailed installment transactions will appear here.`
                          : "No payment transactions recorded yet."}
                      </p>
                      {Number(purchase.pending) > 0 && (
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
