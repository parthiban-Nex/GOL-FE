import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, IndianRupee } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  BANK_ACCOUNT_OPTIONS,
  DEPOSIT_MODE_OPTIONS,
} from "@/pages/finance/mockBankDeposit";
import { showToast } from "@/utils/toast";

const EMPTY = {
  dateTime: "",
  bankAccount: "",
  depositMode: "",
  reference: "",
  amount: 0,
  notes: "",
};

/**
 * Right-side slide-over drawer (Image 2) used for both New Bank
 * Deposit and Edit Bank Deposit. Renders in a portal so it can escape
 * the layout's overflow constraints; Escape closes it.
 *
 * TODO: BACKEND INTEGRATION - onSubmit returns the deposit object to
 * the parent; wire it to bankDepositApi.createDeposit /
 * updateDeposit when the backend is live.
 */
export default function NewBankDepositDrawer({
  isOpen,
  onClose,
  onSubmit,
  initial,
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(initial ?? EMPTY);
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

  function handleSubmit() {
    const nextErrors = {};
    if (!form.dateTime) nextErrors.dateTime = "Deposit date & time is required";
    if (!form.bankAccount) nextErrors.bankAccount = "Bank account is required";
    if (!form.depositMode) nextErrors.depositMode = "Deposit mode is required";
    if (!form.reference?.trim())
      nextErrors.reference = "Reference / transaction ID is required";
    if (!form.amount || Number(form.amount) <= 0)
      nextErrors.amount = "Enter a valid amount";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSubmit({ ...form, amount: Number(form.amount) });
    showToast.success("Bank deposit saved.");
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
            <p className="mt-0.5 text-xs text-ink-500">Enter deposit details</p>
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
            label="Deposit Date & Time "
            required
            value={form.dateTime}
            onChange={(e) => update("dateTime", e.target.value)}
            error={errors.dateTime}
          />
          <Select
            label="Bank Account "
            required
            value={form.bankAccount}
            onChange={(e) => update("bankAccount", e.target.value)}
            options={BANK_ACCOUNT_OPTIONS}
            placeholder="Select Bank Account"
            error={errors.bankAccount}
          />
          <Select
            label="Deposit Mode "
            required
            value={form.depositMode}
            onChange={(e) => update("depositMode", e.target.value)}
            options={DEPOSIT_MODE_OPTIONS}
            placeholder="Select Deposit Mode"
            error={errors.depositMode}
          />
          <Input
            label="Reference No. / Transaction ID "
            required
            value={form.reference}
            onChange={(e) => update("reference", e.target.value)}
            placeholder="Enter reference no."
            error={errors.reference}
          />
          <Input
            label="Amount Deposited (₹)"
            required
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => update("amount", e.target.value)}
            placeholder="Enter amount"
            icon={IndianRupee}
            error={errors.amount}
          />
          <div>
            <Textarea
              label=" Notes (Optional)"
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Add notes..."
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-700">
              Attachment{" "}
              <span className="text-xs font-normal text-ink-500">
                (Optional)
              </span>
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-300 bg-ink-50/40 px-4 py-6 text-center hover:bg-ink-50">
              <UploadCloud className="h-6 w-6 text-brand-500" />
              <span className="text-sm font-semibold text-brand-700">
                Upload Slip / Screenshot
              </span>
              <span className="text-[11px] text-ink-500">
                PNG, JPG, PDF up to 5MB
              </span>
              <input type="file" className="hidden" />
            </label>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Deposit</Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
