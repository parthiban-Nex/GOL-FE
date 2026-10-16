import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import {
  Modal,
  Button,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { PURCHASE_PAYMENT_MODE_OPTIONS } from "@/pages/finance/mockPurchase";
import { purchaseApi } from "@/services/api/purchaseApi";
import { showToast } from "@/utils/toast";

export default function RecordPurchasePaymentModal({
  isOpen,
  onClose,
  onSubmit,
  purchase,
}) {
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [referenceNo, setReferenceNo] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const pendingAmount = Number(purchase?.pending ?? 0);
  const totalAmount = Number(purchase?.inclGst ?? 0);
  const paidAmount = Number(purchase?.paid ?? 0);

  useEffect(() => {
    if (isOpen && purchase) {
      const today = new Date().toISOString().split("T")[0];
      setAmount(pendingAmount > 0 ? String(pendingAmount) : "");
      setPaymentMode("NEFT");
      setReferenceNo("");
      setPaymentDate(today);
      setNotes("");
      setErrors({});
      setLoading(false);
    }
  }, [isOpen, purchase, pendingAmount]);

  const handlePayFull = () => {
    setAmount(String(pendingAmount));
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const getRefPlaceholder = () => {
    switch (paymentMode) {
      case "UPI":
        return "UPI Ref ID / UTR (e.g. 428901238491)";
      case "Cheque":
        return "Cheque No (e.g. CHQ-004521)";
      case "NEFT":
      case "RTGS":
      case "Bank Transfer":
        return "Bank Transaction / UTR No";
      default:
        return "Reference / Receipt No (Optional)";
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const newErrors = {};
    const parsedAmount = Number(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Please enter a valid payment amount greater than ₹0";
    } else if (parsedAmount > pendingAmount + 0.01) {
      newErrors.amount = `Amount cannot exceed balance due of ₹${pendingAmount.toLocaleString("en-IN")}`;
    }

    if (!paymentMode) {
      newErrors.paymentMode = "Please select a payment mode";
    }

    if (
      (paymentMode === "UPI" ||
        paymentMode === "Cheque" ||
        paymentMode === "NEFT" ||
        paymentMode === "RTGS" ||
        paymentMode === "Bank Transfer") &&
      !referenceNo.trim()
    ) {
      newErrors.referenceNo = `${paymentMode} reference / UTR / Cheque number is required`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        purchaseId: purchase.id,
        amount: parsedAmount,
        paymentMode,
        referenceNo: referenceNo.trim() || null,
        paymentDate: paymentDate || new Date().toISOString().split("T")[0],
        notes: notes.trim() || null,
      };

      const res = await purchaseApi.addPayment(payload);
      showToast.success(res?.message || "Payment recorded successfully!");

      if (onSubmit) {
        onSubmit(res?.data || payload);
      }
      onClose();
    } catch (err) {
      showToast.error(
        err?.response?.data?.message || err?.message || "Failed to record payment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-900 leading-tight">
              Record Purchase Payment
            </h3>
            <p className="text-xs text-ink-500">
              {purchase?.purchaseCode || `PUR#${purchase?.id}`} &bull;{" "}
              {purchase?.vendor || "Vendor"}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || pendingAmount <= 0}
          >
            Submit Payment
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Bill Summary Banner */}
        <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="border-r border-ink-200 pr-2">
              <span className="block text-xs text-ink-500 font-medium">Bill Total</span>
              <span className="text-sm font-semibold text-ink-800">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="border-r border-ink-200 px-2">
              <span className="block text-xs text-ink-500 font-medium">Already Paid</span>
              <span className="text-sm font-semibold text-emerald-600">
                ₹{paidAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="pl-2">
              <span className="block text-xs text-ink-500 font-medium">Balance Due</span>
              <span className="text-sm font-bold text-red-600">
                ₹{pendingAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {pendingAmount > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-ink-200/60 pt-2 text-xs">
              <span className="text-ink-600">Quick fill full balance:</span>
              <button
                type="button"
                onClick={handlePayFull}
                className="font-medium text-brand-600 hover:text-brand-700 underline cursor-pointer"
              >
                Pay Full (₹{pendingAmount.toLocaleString("en-IN")})
              </button>
            </div>
          )}
        </div>

        {/* Payment Input Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Input
              type="number"
              label="Amount to Pay (₹)"
              required
              min={0.01}
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              placeholder="0.00"
              error={errors.amount}
            />
          </div>

          <div>
            <Select
              label="Payment Mode"
              required
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                if (errors.paymentMode)
                  setErrors((prev) => ({ ...prev, paymentMode: undefined }));
              }}
              options={PURCHASE_PAYMENT_MODE_OPTIONS}
              placeholder="Select mode"
              error={errors.paymentMode}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Reference / UTR / Cheque No"
              required={
                paymentMode === "UPI" ||
                paymentMode === "Cheque" ||
                paymentMode === "NEFT" ||
                paymentMode === "RTGS" ||
                paymentMode === "Bank Transfer"
              }
              value={referenceNo}
              onChange={(e) => {
                setReferenceNo(e.target.value);
                if (errors.referenceNo)
                  setErrors((prev) => ({ ...prev, referenceNo: undefined }));
              }}
              placeholder={getRefPlaceholder()}
              error={errors.referenceNo}
            />
          </div>

          <div>
            <Input
              type="date"
              label="Payment Date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Textarea
            label="Payment Notes / Remarks"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Advance paid, Part settlement tranche 1..."
            className="h-16"
          />
        </div>
      </div>
    </Modal>
  );
}
