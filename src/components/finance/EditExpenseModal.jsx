import { useEffect, useMemo, useState } from "react";
import { Edit3 } from "lucide-react";
import {
  Modal,
  Button,
  Input,
  Select,
  SearchableSelect,
  Textarea,
} from "@/components/ui";
import {
  EXPENSE_HEAD_OPTIONS,
  EXPENSE_TYPE_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
} from "@/pages/finance/mockexpense";
import { expenseApi } from "@/services";
import { showToast } from "@/utils/toast";

const EMPTY_FORM = {
  id: null,
  head: "",
  type: "",
  vendor: "",
  vendorId: null,
  invoiceNo: "",
  date: "",
  paymentMode: "",
  exclGst: 0,
  gst: 0,
  inclGst: 0,
  paid: 0,
  status: "",
  notes: "",
};

export default function EditExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  expense,
  vendors = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [vendorList, setVendorList] = useState(vendors);
  const [searchingVendors, setSearchingVendors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [originalPaid, setOriginalPaid] = useState(0);

  useEffect(() => {
    if (isOpen && expense) {
      const formattedDate = expense.date
        ? typeof expense.date === "string"
          ? expense.date.split("T")[0]
          : expense.date
        : "";

      const prevPaid = Number(expense.paid ?? 0);
      const inclGstVal = Number(expense.inclGst ?? expense.incl_gst ?? 0);
      const remaining = Math.max(0, inclGstVal - prevPaid);
      setOriginalPaid(prevPaid);

      const initialPayNow = remaining;
      const initialTotalPaid = prevPaid + initialPayNow;
      const initialStatus =
        inclGstVal > 0 && initialTotalPaid >= inclGstVal
          ? "Paid"
          : expense.status || "Pending";

      setForm({
        id: expense.id || null,
        head: expense.head || "",
        type: expense.type || "",
        vendor: expense.vendor || "",
        vendorId: expense.vendorId || expense.vendor_id || null,
        invoiceNo: expense.invoiceNo || expense.invoice_no || "",
        date: formattedDate,
        paymentMode: expense.paymentMode || expense.payment_mode || "",
        exclGst: expense.exclGst ?? expense.excl_gst ?? 0,
        gst: expense.gst ?? 0,
        inclGst: inclGstVal,
        paid: remaining,
        status: initialStatus,
        notes: expense.notes || "",
      });
      setVendorList(vendors);
      setErrors({});
      setSearchingVendors(false);
      setLoading(false);
    } else if (isOpen) {
      setForm(EMPTY_FORM);
      setOriginalPaid(0);
      setVendorList(vendors);
      setErrors({});
      setSearchingVendors(false);
      setLoading(false);
    }
  }, [isOpen, expense, vendors]);

  // Debounced search handler called by SearchableSelect
  const handleVendorSearch = async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      setVendorList(vendors);
      return;
    }

    try {
      setSearchingVendors(true);
      const res = await expenseApi.listVendors({ query: searchTerm.trim() });
      if (res?.vendorData && Array.isArray(res.vendorData)) {
        setVendorList(res.vendorData);
      }
    } catch (err) {
      console.warn("Error fetching debounced vendors:", err);
    } finally {
      setSearchingVendors(false);
    }
  };

  const vendorOptions = useMemo(() => {
    return (vendorList || []).map((v) => {
      const name = v.vendorName || v.name || "";
      const code = v.vendorCode || "";
      const type = v.vendorType || v.type || "";
      return {
        id: v.id || null,
        value: name,
        label: name,
        code: code,
        subLabel: type,
      };
    });
  }, [vendorList]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Auto-derive Incl GST when the split fields change
      if (field === "exclGst" || field === "gst") {
        next.inclGst = (Number(next.exclGst) || 0) + (Number(next.gst) || 0);
      }
      // Auto-update status when payment or amount fields change
      if (
        field === "paid" ||
        field === "exclGst" ||
        field === "gst" ||
        field === "inclGst"
      ) {
        const payNow =
          field === "paid" ? Number(value) || 0 : Number(next.paid) || 0;
        const totalPaid = originalPaid + payNow;
        const incl = Number(next.inclGst) || 0;
        next.status = incl > 0 && totalPaid >= incl ? "Paid" : "Pending";
      }
      return next;
    });
  }

  async function handleSubmit() {
    const nextErrors = {};
    if (!form.head) nextErrors.head = "Expense head is required";
    if (!form.type) nextErrors.type = "Type is required";
    if (!form.vendor.trim()) nextErrors.vendor = "Vendor / payee is required";
    if (!form.invoiceNo.trim())
      nextErrors.invoiceNo = "Invoice / ref no. is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      const payNow = Number(form.paid) || 0;
      const paid = originalPaid + payNow;
      const incl = Number(form.inclGst) || 0;
      const pending = Math.max(0, incl - paid);
      const status =
        incl > 0 && paid >= incl
          ? "Paid"
          : form.status || "Pending";

      const payload = {
        ...form,
        vendorId: form.vendorId || null,
        exclGst: Number(form.exclGst) || 0,
        gst: Number(form.gst) || 0,
        inclGst: incl,
        paid,
        pending,
        status,
      };

      const res = await expenseApi.updateExpense(payload);
      showToast.success(res?.message || "Expense updated successfully.");

      if (onSubmit) {
        onSubmit(res?.data || payload);
      }
      onClose();
    } catch (err) {
      showToast.error(err?.message || "Failed to update expense");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <Edit3 className="h-5 w-5" />
          </span>
          <span>
            Edit Expense {expense?.expenseCode ? `(${expense.expenseCode})` : ""}
          </span>
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={loading}>
            Update Expense
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Expense Head "
            required
            value={form.head}
            onChange={(e) => update("head", e.target.value)}
            options={EXPENSE_HEAD_OPTIONS}
            placeholder="Select head"
            error={errors.head}
          />
          <Select
            label="Type "
            required
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            options={EXPENSE_TYPE_OPTIONS}
            placeholder="Select type"
            error={errors.type}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchableSelect
            label="Vendor / Payee"
            required
            value={form.vendor}
            onChange={(val, selectedOpt) => {
              setForm((f) => ({
                ...f,
                vendor: val,
                vendorId: selectedOpt?.id || null,
              }));
            }}
            onSearch={handleVendorSearch}
            loading={searchingVendors}
            options={vendorOptions}
            placeholder="Search by vendor name or code..."
            error={errors.vendor}
          />
          <Input
            label="Invoice / Ref No "
            required
            value={form.invoiceNo}
            onChange={(e) => update("invoiceNo", e.target.value)}
            placeholder="EXP-XXXX"
            error={errors.invoiceNo}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="Date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
          <Select
            label="Payment Mode"
            value={form.paymentMode}
            onChange={(e) => update("paymentMode", e.target.value)}
            options={PAYMENT_MODE_OPTIONS}
            placeholder="Select mode"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            type="number"
            min={0}
            label="Excl GST (₹)"
            value={form.exclGst}
            onChange={(e) => update("exclGst", e.target.value)}
          />
          <Input
            type="number"
            min={0}
            label="GST (₹)"
            value={form.gst}
            onChange={(e) => update("gst", e.target.value)}
          />
          <Input
            type="number"
            min={0}
            label="Incl GST (₹)"
            value={form.inclGst}
            onChange={(e) => update("inclGst", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {originalPaid > 0 && (
            <div className="sm:col-span-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink-600">Previously Paid</span>
                <span className="font-semibold text-ink-800">
                  ₹{originalPaid.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}

          <div>
            <Input
              type="number"
              min={0}
              label={originalPaid > 0 ? "Pay Now (₹)" : "Amount Paid (₹)"}
              value={form.paid}
              onChange={(e) => update("paid", e.target.value)}
            />
            {originalPaid > 0 && (
              <p className="mt-1 text-xs text-ink-500">
                Total paid: ₹{(originalPaid + (Number(form.paid) || 0)).toLocaleString("en-IN")}
                {" · "}
                Remaining: ₹{Math.max(0, (Number(form.inclGst) || 0) - originalPaid - (Number(form.paid) || 0)).toLocaleString("en-IN")}
              </p>
            )}
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            options={EXPENSE_STATUS_OPTIONS}
            placeholder="Auto (derived)"
          />
        </div>

        <div>
          <Textarea
            label="Notes"
            rows={2}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Additional notes..."
            className="h-16"
          />
        </div>
      </div>
    </Modal>
  );
}
