import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Plus,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Clock,
  Search,
  Eye,
  Pencil,
  Printer,
  Trash2,
  Download,
  Loader2,
  ChevronDown,
  CreditCard,
  FileText,
  History,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import Dropdown from "@/components/ui/Dropdown";
import { ConfirmModal } from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import NewBankDepositDrawer from "@/components/finance/NewBankDepositDrawer";
import ViewBankDepositModal from "@/components/finance/ViewBankDepositModal";
import {
  BANK_ACCOUNT_OPTIONS,
  DEPOSIT_MODE_OPTIONS,
  DEPOSIT_STATUS_OPTIONS,
} from "@/pages/finance/mockBankDeposit";
import { bankDepositApi } from "@/services/api/bankDepositApi";
import { bankApi } from "@/services";
import { showToast } from "@/utils/toast";
import { downloadCsv } from "@/utils/exportCsv";

const STATUS_PILL = {
  Deposited: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Cancelled: "bg-red-50 text-red-700 border-red-100",
};

const BANK_DEPOSIT_EXPORT_COLUMNS = [
  { key: "depositCode", header: "Deposit ID" },
  { key: "depositDate", header: "Deposit Date" },
  { key: "depositTime", header: "Deposit Time" },
  { key: "bankName", header: "Bank Name" },
  { key: "bankAccountNo", header: "Account No." },
  { key: "branch", header: "Branch" },
  { key: "depositMode", header: "Deposit Mode" },
  { key: "referenceNo", header: "Ref / UTR / Cheque No" },
  { key: "amount", header: "Amount Deposited (₹)" },
  { key: "depositedBy", header: "Deposited By" },
  { key: "status", header: "Status" },
  { key: "editCount", header: "Revision Count" },
  { key: "lastEditedAt", header: "Last Edited Date & Time" },
  { key: "lastEditedBy", header: "Last Edited By" },
  { key: "revisionHistory", header: "Revision History Log" },
  { key: "notes", header: "Notes" },
  { key: "slipUrl", header: "Slip Document Link" },
];

const BANK_DEPOSIT_SUMMARY_COLUMNS = [
  { key: "depositCode", header: "Deposit ID" },
  { key: "depositDate", header: "Date" },
  { key: "bankName", header: "Bank Name" },
  { key: "branch", header: "Branch" },
  { key: "depositMode", header: "Mode" },
  { key: "amount", header: "Amount (₹)" },
  { key: "status", header: "Status" },
  { key: "referenceNo", header: "Reference" },
];

const BANK_DEPOSIT_AUDIT_COLUMNS = [
  { key: "depositCode", header: "Deposit ID" },
  { key: "editedAt", header: "Edited Date & Time" },
  { key: "editorName", header: "Edited By" },
  { key: "changeSummary", header: "Changes Description" },
  { key: "oldAmount", header: "Old Amount (₹)" },
  { key: "newAmount", header: "New Amount (₹)" },
  { key: "oldBankName", header: "Old Bank Name" },
  { key: "newBankName", header: "New Bank Name" },
  { key: "oldAccountNo", header: "Old Account No" },
  { key: "newAccountNo", header: "New Account No" },
  { key: "oldBranch", header: "Old Branch" },
  { key: "newBranch", header: "New Branch" },
  { key: "oldDepositDate", header: "Old Date" },
  { key: "newDepositDate", header: "New Date" },
  { key: "oldDepositMode", header: "Old Mode" },
  { key: "newDepositMode", header: "New Mode" },
  { key: "oldStatus", header: "Old Status" },
  { key: "newStatus", header: "New Status" },
  { key: "oldReferenceNo", header: "Old Ref / UTR No" },
  { key: "newReferenceNo", header: "New Ref / UTR No" },
];

export default function BankDeposit() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [stats, setStats] = useState({
    today: { amount: 0, count: 0 },
    week: { amount: 0, count: 0 },
    month: { amount: 0, count: 0 },
    pending: { amount: 0, count: 0 },
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [depositToDelete, setDepositToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [bankOptions, setBankOptions] = useState(BANK_ACCOUNT_OPTIONS);

  useEffect(() => {
    async function loadBanks() {
      try {
        const res = await bankApi.getAll();
        const list = res?.BankData || res?.data || (Array.isArray(res) ? res : []);
        if (list && list.length > 0) {
          const liveOpts = list.map((b) => ({
            value: b.bankName || b.name,
            label: b.bankName || b.name,
          }));
          const merged = [
            { value: "", label: "All Accounts" },
            ...liveOpts,
            ...BANK_ACCOUNT_OPTIONS.map((o) => ({ value: o.label, label: o.label })),
          ];
          setBankOptions(merged);
        } else {
          setBankOptions([
            { value: "", label: "All Accounts" },
            ...BANK_ACCOUNT_OPTIONS.map((o) => ({ value: o.label, label: o.label })),
          ]);
        }
      } catch {
        setBankOptions([
          { value: "", label: "All Accounts" },
          ...BANK_ACCOUNT_OPTIONS.map((o) => ({ value: o.label, label: o.label })),
        ]);
      }
    }
    loadBanks();
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [debouncedQuery, fromDate, toDate, bankFilter, modeFilter, statusFilter, page, pageSize]);

  async function fetchDeposits() {
    try {
      setLoading(true);
      const res = await bankDepositApi.listDeposits({
        query: debouncedQuery,
        dateFrom: fromDate || undefined,
        dateTo: toDate || undefined,
        bankFilter: bankFilter || undefined,
        modeFilter: modeFilter || undefined,
        statusFilter: statusFilter || undefined,
        page,
        pageSize,
      });

      if (res?.depositData && Array.isArray(res.depositData)) {
        setDeposits(res.depositData);
        setTotalItems(res.totalItems ?? res.depositData.length);
        setTotalPages(res.totalPages ?? 1);
        if (res.stats) {
          setStats(res.stats);
        }
      } else {
        setDeposits([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.warn("Failed to fetch bank deposits:", err);
      showToast.error("Failed to load bank deposits");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(payload) {
    try {
      setSubmitting(true);
      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (key === "file" && value instanceof File) {
          formData.append("slip", value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      if (editing?.id) {
        formData.append("id", editing.id);
        const res = await bankDepositApi.updateDeposit(formData);
        if (res?.requestSuccessful || res?.status === "success") {
          showToast.success("Bank deposit updated successfully");
          setDrawerOpen(false);
          setEditing(null);
          fetchDeposits();
        } else {
          showToast.error(res?.message || "Failed to update deposit");
        }
      } else {
        const res = await bankDepositApi.createDeposit(formData);
        if (res?.requestSuccessful || res?.status === "success") {
          showToast.success("Bank deposit created successfully");
          setDrawerOpen(false);
          setEditing(null);
          fetchDeposits();
        } else {
          showToast.error(res?.message || "Failed to create deposit");
        }
      }
    } catch (err) {
      console.error("Save deposit error:", err);
      showToast.error(err?.response?.data?.message || err?.message || "Failed to save bank deposit");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenDelete(deposit) {
    setDepositToDelete(deposit);
    setDeleteConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!depositToDelete?.id) return;
    try {
      setDeleting(true);
      const res = await bankDepositApi.removeDeposit(depositToDelete.id);
      if (res?.requestSuccessful || res?.status === "success") {
        showToast.success(`Deposit ${depositToDelete.depositCode || depositToDelete.id} soft deleted.`);
        setDeleteConfirmOpen(false);
        setDepositToDelete(null);
        fetchDeposits();
      } else {
        showToast.error(res?.message || "Failed to delete deposit");
      }
    } catch (err) {
      showToast.error(err?.response?.data?.message || "Failed to delete deposit");
    } finally {
      setDeleting(false);
    }
  }

  function handleView(deposit) {
    setViewing(deposit);
    setViewModalOpen(true);
  }

  function handlePrintReceipt(deposit) {
    const item = deposit || viewing;
    if (!item) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast.error("Pop-up blocked. Please allow pop-ups to print receipt.");
      return;
    }
    const html = `
      <html>
        <head>
          <title>Bank Deposit Receipt - ${item.depositCode || item.id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .amount-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
            .amount-val { font-size: 26px; font-weight: 800; color: #059669; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 14px; margin-bottom: 20px; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 2px; }
            .val { font-weight: 600; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 12px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Bank Deposit Voucher & Receipt</h1>
            <div class="subtitle">Voucher ID: ${item.depositCode || item.id} | Generated on ${new Date().toLocaleString()}</div>
          </div>
          <div class="amount-box">
            <div class="label">Total Amount Deposited</div>
            <div class="amount-val">₹${Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="grid">
            <div>
              <div class="label">Bank Name</div>
              <div class="val">${item.bankName || item.bankAccount?.name || "—"}</div>
            </div>
            <div>
              <div class="label">Account Number</div>
              <div class="val">${item.bankAccountNo || item.bankAccount?.acNo || "—"}</div>
            </div>
            <div>
              <div class="label">Branch</div>
              <div class="val">${item.branch || "—"}</div>
            </div>
            <div>
              <div class="label">Deposit Date & Time</div>
              <div class="val">${item.depositDate || item.date || "—"} ${item.depositTime || item.time || ""}</div>
            </div>
            <div>
              <div class="label">Deposit Mode</div>
              <div class="val">${item.depositMode || "—"}</div>
            </div>
            <div>
              <div class="label">Reference / UTR / Cheque No</div>
              <div class="val">${item.referenceNo || item.reference || "—"}</div>
            </div>
            <div>
              <div class="label">Deposited By</div>
              <div class="val">${item.depositedBy || "Staff"}</div>
            </div>
            <div>
              <div class="label">Deposit Status</div>
              <div class="val">${item.status || "Deposited"}</div>
            </div>
          </div>
          ${item.notes ? `<div style="margin-bottom: 20px;"><div class="label">Notes / Remarks</div><div>${item.notes}</div></div>` : ""}
          <div class="footer">GarageOneLite Auto Services & ERP Finance System</div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  async function handleExportCsv(mode = "detailed") {
    try {
      setExporting(true);
      const today = new Date().toISOString().slice(0, 10);

      if (mode === "history") {
        const histRes = await bankDepositApi.listEditHistories({
          query: debouncedQuery,
          dateFrom: fromDate || undefined,
          dateTo: toDate || undefined,
        });

        const historyRows = histRes?.historyData || [];
        if (!historyRows.length) {
          showToast.error("No edit revision history records found.");
          return;
        }

        const formattedAuditRows = historyRows.map((h) => ({
          depositCode: h.depositCode || `BD-${h.depositId}`,
          editedAt: h.editedAt ? new Date(h.editedAt).toLocaleString() : "—",
          editorName: h.editorName || "Staff",
          changeSummary: h.changeSummary || "Record updated",
          oldAmount: h.oldAmount !== null ? Number(h.oldAmount).toFixed(2) : "—",
          newAmount: h.newAmount !== null ? Number(h.newAmount).toFixed(2) : "—",
          oldBankName: h.oldBankName || "—",
          newBankName: h.newBankName || "—",
          oldAccountNo: h.oldAccountNo || "—",
          newAccountNo: h.newAccountNo || "—",
          oldBranch: h.oldBranch || "—",
          newBranch: h.newBranch || "—",
          oldDepositDate: h.oldDepositDate || "—",
          newDepositDate: h.newDepositDate || "—",
          oldDepositMode: h.oldDepositMode || "—",
          newDepositMode: h.newDepositMode || "—",
          oldStatus: h.oldStatus || "—",
          newStatus: h.newStatus || "—",
          oldReferenceNo: h.oldReferenceNo || "—",
          newReferenceNo: h.newReferenceNo || "—",
        }));

        downloadCsv(`bank_deposits_edit_history_${today}`, formattedAuditRows, BANK_DEPOSIT_AUDIT_COLUMNS);
        showToast.success(`Exported ${historyRows.length} edit revision logs successfully`);
        return;
      }

      const res = await bankDepositApi.listDeposits({
        query: debouncedQuery,
        dateFrom: fromDate || undefined,
        dateTo: toDate || undefined,
        bankFilter: bankFilter || undefined,
        modeFilter: modeFilter || undefined,
        statusFilter: statusFilter || undefined,
      });

      const list = res?.depositData || [];
      if (!list.length) {
        showToast.error("No bank deposits found to export.");
        return;
      }

      const formattedRows = list.map((d) => {
        const histories = Array.isArray(d.history) ? d.history : [];
        const latestEdit = histories[0];
        const revisionHistoryStr = histories
          .map((h) => `[${h.editedAt ? new Date(h.editedAt).toLocaleString() : ""} by ${h.editorName || "Staff"}]: ${h.changeSummary}`)
          .join(" | ");

        return {
          depositCode: d.depositCode || d.id || `BD-${d.id}`,
          depositDate: d.depositDate || d.date || "—",
          depositTime: d.depositTime || d.time || "—",
          bankName: d.bankName || d.bankAccount?.name || "—",
          bankAccountNo: d.bankAccountNo || d.bankAccount?.acNo || "—",
          branch: d.branch || "—",
          depositMode: d.depositMode || "—",
          referenceNo: d.referenceNo || d.reference || "—",
          amount: Number(d.amount || 0).toFixed(2),
          depositedBy: d.depositedBy || "—",
          status: d.status || "Deposited",
          editCount: histories.length,
          lastEditedAt: latestEdit?.editedAt ? new Date(latestEdit.editedAt).toLocaleString() : "Never",
          lastEditedBy: latestEdit?.editorName || "—",
          revisionHistory: revisionHistoryStr || "None",
          notes: d.notes || "",
          slipUrl: d.slipUrl || "",
        };
      });

      if (mode === "summary") {
        downloadCsv(`bank_deposits_summary_${today}`, formattedRows, BANK_DEPOSIT_SUMMARY_COLUMNS);
        showToast.success(`Exported ${list.length} deposit summaries successfully`);
        return;
      }

      downloadCsv(`bank_deposits_detailed_${today}`, formattedRows, BANK_DEPOSIT_EXPORT_COLUMNS);
      showToast.success(`Exported ${list.length} bank deposit records with revision history successfully`);
    } catch (err) {
      console.error("Export CSV error:", err);
      showToast.error("Failed to export bank deposits CSV");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-800">Bank Deposit</h1>
        <div className="flex items-center gap-2">
          {/* Dual-mode Export CSV button */}
          <div className="relative inline-flex items-center rounded-lg border border-ink-200 bg-white shadow-xs">
            <Button
              variant="ghost"
              icon={exporting ? Loader2 : Download}
              // onClick={() => handleExportCsv("detailed")}
              onClick={() => handleExportCsv("summary")}
              disabled={exporting}
              loading={exporting}
              className="rounded-r-none border-0 text-ink-700 hover:bg-ink-50 px-3 py-2 text-sm"
              title="Export CSV with full deposit transaction details"
            >
              Export CSV
            </Button>
            <div className="h-5 w-px bg-ink-200" />
            {/* <Dropdown
              align="right"
              trigger={
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => handleExportCsv("summary")}
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
                    Detailed Deposits Report (CSV)
                  </div>
                  <div className="text-[11px] text-ink-500">
                    All transaction metadata, slips & references
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                icon={FileText}
                onClick={() => handleExportCsv("summary")}
              >
                <div className="py-0.5 text-left">
                  <div className="font-medium text-ink-800">
                    Deposits Summary (CSV)
                  </div>
                  <div className="text-[11px] text-ink-500">
                    Compact 1 row per deposit record
                  </div>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                icon={History}
                onClick={() => handleExportCsv("history")}
              >
                <div className="py-0.5 text-left">
                  <div className="font-medium text-ink-800">
                    Audit / Edit History Log (CSV)
                  </div>
                  <div className="text-[11px] text-ink-500">
                    Every edit revision, old vs new values & timestamps
                  </div>
                </div>
              </Dropdown.Item>
            </Dropdown> */}
          </div>

          <Button
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            New Bank Deposit
          </Button>
        </div>
      </div>

      {/* 4 header stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          tone="blue"
          label="Today's Deposit"
          amount={stats.today.amount}
          count={stats.today.count}
        />
        <StatCard
          icon={CalendarCheck}
          tone="emerald"
          label="This Week"
          amount={stats.week.amount}
          count={stats.week.count}
        />
        <StatCard
          icon={CalendarDays}
          tone="amber"
          label="This Month"
          amount={stats.month.amount}
          count={stats.month.count}
        />
        <StatCard
          icon={Clock}
          tone="violet"
          label="Pending Deposit"
          amount={stats.pending.amount}
          count={stats.pending.count}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1.4fr_1fr_1fr_1.6fr]">
          <FilterField label="Date Range">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                aria-label="From Date"
              />
              <span className="text-sm text-ink-400">to</span>
              <Input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                aria-label="To Date"
              />
            </div>
          </FilterField>
          <FilterField label="Bank Account">
            <Select
              value={bankFilter}
              onChange={(e) => {
                setBankFilter(e.target.value);
                setPage(1);
              }}
              options={bankOptions}
            />
          </FilterField>
          <FilterField label="Deposit Mode">
            <Select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              options={[{ value: "", label: "All Modes" }, ...DEPOSIT_MODE_OPTIONS]}
            />
          </FilterField>
          <FilterField label="Status">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[{ value: "", label: "All Statuses" }, ...DEPOSIT_STATUS_OPTIONS]}
            />
          </FilterField>
          <div className="self-end">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID, Bank, Ref..."
              icon={Search}
              className="h-10"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Deposit ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Bank Account</th>
                <th className="px-4 py-3">Deposit Mode</th>
                <th className="px-4 py-3">Reference No.</th>
                <th className="px-4 py-3 text-center">Amount (₹)</th>
                <th className="px-4 py-3 text-center">Deposited By</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-ink-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 mb-2" />
                    Loading bank deposits...
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-ink-500">
                    No deposits match your filters.
                  </td>
                </tr>
              ) : (
                deposits.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/30"
                  >
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <button
                          type="button"
                          onClick={() => handleView(d)}
                          className="cursor-pointer font-semibold text-brand-700 hover:text-brand-900"
                        >
                          {d.depositCode || d.id}
                        </button>
                        {d.history && d.history.length > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5 cursor-pointer hover:bg-amber-100"
                            onClick={() => handleView(d)}
                            title={`Edited ${d.history.length} time(s). Last change: ${d.history[0]?.changeSummary || ""}`}
                          >
                            <History className="h-2.5 w-2.5" /> Edited ({d.history.length})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-ink-800">
                        {d.depositDate || d.date || "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {d.depositTime || d.time || ""}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-ink-800">
                        {d.bankName || d.bankAccount?.name || "—"}
                      </p>
                      {(d.bankAccountNo || d.bankAccount?.acNo) && (
                        <p className="mt-0.5 text-xs text-ink-500 font-mono">
                          A/c: {d.bankAccountNo || d.bankAccount?.acNo}
                        </p>
                      )}
                      {d.branch && (
                        <p className="mt-0.5 text-xs text-ink-500 font-medium">
                          Branch: <span className="text-ink-700">{d.branch}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-ink-700">
                      <span className="inline-block rounded-md border border-ink-200 bg-white px-2 py-0.5 text-xs font-medium">
                        {d.depositMode}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-ink-700 font-mono text-xs">
                      {d.referenceNo || d.reference || "—"}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-ink-800">
                      ₹
                      {Number(d.amount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-4 text-ink-700 text-center text-xs">
                      {d.depositedBy || "—"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={clsx(
                          "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-semibold",
                          STATUS_PILL[d.status] || STATUS_PILL.Deposited
                        )}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-1">
                        <IconAction
                          icon={Eye}
                          label="View"
                          onClick={() => handleView(d)}
                          tone="brand"
                        />
                        <IconAction
                          icon={Pencil}
                          label="Edit"
                          tone="edit"
                          onClick={() => {
                            setEditing(d);
                            setDrawerOpen(true);
                          }}
                        />
                        {/* <IconAction
                          icon={Printer}
                          label="Print"
                          tone="print"
                          onClick={() => handlePrintReceipt(d)}
                        /> */}
                        <IconAction
                          icon={Trash2}
                          label="Delete"
                          tone="danger"
                          onClick={() => handleOpenDelete(d)}
                        />
                      </div>
                    </td>
                  </tr>
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

      <NewBankDepositDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initial={editing}
        loading={submitting}
      />

      <ViewBankDepositModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setViewing(null);
        }}
        deposit={viewing}
        onPrint={handlePrintReceipt}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          if (deleting) return;
          setDeleteConfirmOpen(false);
          setDepositToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Bank Deposit from list"
        description={`Are you sure you want to delete deposit "${depositToDelete?.depositCode || depositToDelete?.id}"? This record will be deleted and archived from reports.`}
        message={`Are you sure you want to delete deposit "${depositToDelete?.depositCode || depositToDelete?.id}"? This record will be deleted and archived from reports.`}
        confirmLabel="Delete Deposit"
        tone="danger"
        isLoading={deleting}
      />
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, amount, count }) {
  const tones = {
    blue: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
  }[tone];
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            tones
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-ink-500">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-ink-800">
            ₹{(Number(amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">{count || 0} Deposits</p>
        </div>
      </div>
    </Card>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-ink-500">{label}</p>
      {children}
    </div>
  );
}

function IconAction({ icon: Icon, label, onClick, disabled, tone }) {
  const toneCls =
    tone === "danger"
      ? "text-ink-500 hover:text-red-600"
      : tone === "brand"
        ? "text-ink-500 hover:text-brand-700"
        : tone === "edit"
          ? "text-ink-500 hover:text-blue-600"
          : "text-ink-500 hover:text-ink-700";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={clsx(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors",
        toneCls,
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
