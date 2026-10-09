import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, UploadCloud } from "lucide-react";
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

export default function AddExpenseModal({ isOpen, onClose, onSubmit, vendors = [] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [vendorList, setVendorList] = useState(vendors);
  const [searchingVendors, setSearchingVendors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset form each time the modal opens so it doesn't remember state
  // from a previous cancelled attempt.
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setVendorList(vendors);
      setErrors({});
      setSearchingVendors(false);
      setLoading(false);
    }
  }, [isOpen, vendors]);

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
      const paid = Number(form.paid) || 0;
      const incl = Number(form.inclGst) || 0;
      const payload = {
        ...form,
        vendorId: form.vendorId || null,
        exclGst: Number(form.exclGst) || 0,
        gst: Number(form.gst) || 0,
        inclGst: incl,
        paid,
        pending: Math.max(0, incl - paid),
        status: form.status || (paid >= incl && incl > 0 ? "Paid" : "Pending"),
      };

      const res = await expenseApi.createExpense(payload);
      showToast.success(res?.message || "Expense added successfully.");

      if (onSubmit) {
        onSubmit(res?.data || payload);
      }
      onClose();
    } catch (err) {
      showToast.error(err?.message || "Failed to add expense");
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
            <ShoppingCart className="h-5 w-5" />
          </span>
          <span>Add New Expense</span>
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={loading}>
            Add Expense
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
          <Input
            type="number"
            min={0}
            label="Amount Paid (₹)"
            value={form.paid}
            onChange={(e) => update("paid", e.target.value)}
          />
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

        {/* Attach Documents hidden for now - will be enabled once cloud permissions are set */}
        {/*
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">
            Attach Documents
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-50/40 px-4 py-6 text-center hover:bg-ink-50">
            <UploadCloud className="h-6 w-6 text-ink-400" />
            <span className="text-sm text-ink-600">
              Click to upload or drag &amp; drop
            </span>
            <input type="file" className="hidden" multiple />
          </label>
        </div>
        */}
      </div>
    </Modal>
  );
}


