import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, IndianRupee, FileText, CheckCircle2, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  BANK_ACCOUNT_OPTIONS,
  DEPOSIT_MODE_OPTIONS,
  DEPOSIT_STATUS_OPTIONS,
} from "@/pages/finance/mockBankDeposit";
import { bankApi } from "@/services";
import { showToast } from "@/utils/toast";

const EMPTY = {
  dateTime: "",
  bankAccount: "",
  bankName: "",
  bankAccountNo: "",
  branch: "",
  depositMode: "Cash",
  reference: "",
  referenceNo: "",
  amount: "",
  status: "Deposited",
  depositedBy: "",
  notes: "",
};

export default function NewBankDepositDrawer({
  isOpen,
  onClose,
  onSubmit,
  initial,
  loading = false,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [bankOptions, setBankOptions] = useState(BANK_ACCOUNT_OPTIONS);
  const fileInputRef = useRef(null);

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
          // Merge with predefined options
          const merged = [
            ...liveOpts,
            ...BANK_ACCOUNT_OPTIONS.filter(
              (bo) => !liveOpts.some((lo) => lo.value.toLowerCase() === bo.value.toLowerCase())
            ),
          ];
          setBankOptions(merged);
        }
      } catch (err) {
        console.warn("Failed to fetch live banks for deposit drawer:", err);
      }
    }
    loadBanks();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initial) {
        const initialDateTime =
          initial.dateTime ||
          (initial.depositDate && initial.depositTime
            ? `${initial.depositDate}T${to24h(initial.depositTime)}`
            : initial.date && initial.time
            ? `${initial.date}T${to24h(initial.time)}`
            : new Date().toISOString().slice(0, 16));

        const bankVal =
          initial.bankName ||
          initial.bankAccount?.name ||
          initial.bankAccount ||
          "";

        setForm({
          dateTime: initialDateTime,
          bankAccount: bankVal,
          bankName: bankVal,
          bankAccountNo: initial.bankAccountNo || initial.bankAccount?.acNo || "",
          branch: initial.branch || initial.bankBranch || "",
          depositMode: initial.depositMode || "Cash",
          reference: initial.referenceNo || initial.reference || "",
          referenceNo: initial.referenceNo || initial.reference || "",
          amount: initial.amount ? String(initial.amount) : "",
          status: initial.status || "Deposited",
          depositedBy: initial.depositedBy || "",
          notes: initial.notes || "",
        });
      } else {
        const now = new Date();
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setForm({
          ...EMPTY,
          dateTime: localIso,
          depositMode: "Cash",
          status: "Deposited",
        });
      }
      setSelectedFile(null);
      setErrors({});
    }
  }, [isOpen, initial]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File size cannot exceed 10MB");
      return;
    }
    setSelectedFile(file);
  }

  function handleSubmit() {
    const nextErrors = {};
    if (!form.dateTime) nextErrors.dateTime = "Deposit date & time is required";
    if (!form.bankAccount && !form.bankName) nextErrors.bankAccount = "Bank name is required";
    if (!form.bankAccountNo?.trim()) nextErrors.bankAccountNo = "Bank account number is required";
    if (!form.depositMode) nextErrors.depositMode = "Deposit mode is required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      nextErrors.amount = "Enter a valid amount greater than ₹0";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // Parse bank details
    let resolvedBankName = form.bankName || form.bankAccount;
    let resolvedAcNo = form.bankAccountNo?.trim();
    if (form.bankAccount && form.bankAccount.includes(" · ")) {
      const parts = form.bankAccount.split(" · ");
      resolvedBankName = parts[0].trim();
      if (!resolvedAcNo && parts[1]) {
        resolvedAcNo = parts[1].replace(/A\/c\s*/i, "").trim();
      }
    }

    const rawDate = form.dateTime ? form.dateTime.split("T")[0] : new Date().toISOString().split("T")[0];
    const rawTime = form.dateTime && form.dateTime.includes("T") ? form.dateTime.split("T")[1].slice(0, 5) : "";

    const payload = {
      depositDate: rawDate,
      depositTime: rawTime ? formatTime12h(rawTime) : "12:00 PM",
      dateTime: form.dateTime,
      bankName: resolvedBankName,
      bankAccountNo: resolvedAcNo || null,
      branch: form.branch?.trim() || null,
      depositMode: form.depositMode,
      referenceNo: form.reference || form.referenceNo || null,
      amount: Number(form.amount),
      status: form.status || "Deposited",
      depositedBy: form.depositedBy || "You",
      notes: form.notes || null,
      file: selectedFile,
    };

    onSubmit(payload);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink-900/50" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="New Bank Deposit"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink-800">
              {initial ? "Edit Bank Deposit" : "New Bank Deposit"}
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              {initial ? "Update deposit details and slip" : "Record deposit to company bank account"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 cursor-pointer text-ink-400 hover:bg-ink-100 hover:text-ink-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <Input
            type="datetime-local"
            label="Deposit Date & Time"
            required
            value={form.dateTime}
            onChange={(e) => update("dateTime", e.target.value)}
            error={errors.dateTime}
          />

          <Select
            label="Bank Name"
            required
            value={form.bankAccount}
            onChange={(e) => {
              const val = e.target.value;
              update("bankAccount", val);
              let bName = val;
              let ac = "";
              if (val.includes(" · ")) {
                const parts = val.split(" · ");
                bName = parts[0].trim();
                if (parts[1]) {
                  ac = parts[1].replace(/A\/c\s*/i, "").trim();
                }
              }
              update("bankName", bName);
              if (ac && !form.bankAccountNo) {
                update("bankAccountNo", ac);
              }
            }}
            options={bankOptions}
            placeholder="Select Bank"
            error={errors.bankAccount}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bank Account Number"
              required
              value={form.bankAccountNo}
              onChange={(e) => update("bankAccountNo", e.target.value)}
              placeholder="e.g. 50200012345678"
              error={errors.bankAccountNo}
            />

            <Input
              label="Branch (Optional)"
              value={form.branch}
              onChange={(e) => update("branch", e.target.value)}
              placeholder="e.g. Anna Nagar / Central"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Deposit Mode"
              required
              value={form.depositMode}
              onChange={(e) => update("depositMode", e.target.value)}
              options={DEPOSIT_MODE_OPTIONS}
              placeholder="Select Mode"
              error={errors.depositMode}
            />

            <Select
              label="Deposit Status"
              required
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              options={DEPOSIT_STATUS_OPTIONS}
            />
          </div>

          <Input
            label="Reference No. / UTR / Cheque ID"
            value={form.reference}
            onChange={(e) => {
              update("reference", e.target.value);
              update("referenceNo", e.target.value);
            }}
            placeholder="e.g. UTR638291 / CHQ0045"
            error={errors.reference}
          />

          <Input
            label="Amount Deposited (₹)"
            required
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            placeholder="0.00"
            icon={IndianRupee}
            error={errors.amount}
          />

          <Input
            label="Deposited By (Optional)"
            value={form.depositedBy}
            onChange={(e) => update("depositedBy", e.target.value)}
            placeholder="e.g. Staff name or Account team"
          />

          <div>
            <Textarea
              label="Remarks / Notes (Optional)"
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Add details, customer collection batch, or bank counter remarks..."
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-700">
              Deposit Slip / Counterfoil Attachment{" "}
              <span className="text-xs font-normal text-ink-500">(Optional)</span>
            </p>

            {selectedFile ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 overflow-hidden text-xs text-emerald-800">
                  <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate font-medium">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="cursor-pointer text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : initial?.slipUrl ? (
              <div className="flex items-center justify-between rounded-lg border border-ink-200 bg-ink-50/50 p-3">
                <div className="flex items-center gap-2 overflow-hidden text-xs text-ink-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="truncate">Slip currently attached</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer text-xs font-semibold text-brand-600 hover:underline"
                >
                  Replace Slip
                </button>
              </div>
            ) : (
              <label
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-300 bg-ink-50/40 px-4 py-5 text-center hover:bg-ink-50 transition-colors"
              >
                <UploadCloud className="h-6 w-6 text-brand-500" />
                <span className="text-sm font-semibold text-brand-700">
                  Upload Slip / Screenshot
                </span>
                <span className="text-[11px] text-ink-500">PNG, JPG, PDF up to 10MB</span>
              </label>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
            />
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} loading={loading}>
            {loading ? "Saving..." : initial ? "Update Deposit" : "Save Deposit"}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body
  );
}

function to24h(time12) {
  if (!time12) return "10:00";
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return time12.slice(0, 5);
  let [, h, m, meridiem] = match;
  let hours = parseInt(h, 10);
  if (meridiem) {
    if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, "0")}:${m}`;
}

function formatTime12h(time24) {
  if (!time24) return "10:00 AM";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}
