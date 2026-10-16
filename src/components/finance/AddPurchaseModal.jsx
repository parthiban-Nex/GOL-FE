import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Package, Plus, Trash2, UploadCloud, X, FileCheck } from "lucide-react";
import {
  Modal,
  Button,
  Input,
  Select,
  SearchableSelect,
  Textarea,
} from "@/components/ui";
import {
  PURCHASE_STATUS_OPTIONS,
  PURCHASE_PAYMENT_MODE_OPTIONS,
} from "@/pages/finance/mockPurchase";
import { purchaseApi } from "@/services/api/purchaseApi";
import { showToast } from "@/utils/toast";

const EMPTY_ROW = { name: "", qty: 1, rate: 0, amount: 0 };
const EMPTY_FORM = {
  vendor: "",
  vendorId: null,
  invoiceNo: "",
  date: "",
  paymentMode: "",
  referenceNo: "",
  lineItems: [{ ...EMPTY_ROW }],
  exclGst: 0,
  gst: 0,
  inclGst: 0,
  paid: 0,
  status: "",
  notes: "",
};

export default function AddPurchaseModal({
  isOpen,
  onClose,
  onSubmit,
  vendors = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [vendorList, setVendorList] = useState(vendors);
  const [searchingVendors, setSearchingVendors] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setVendorList(vendors);
      setSelectedFile(null);
      setErrors({});
      setLoading(false);
    }
  }, [isOpen, vendors]);

  const handleVendorSearch = async (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) {
      setVendorList(vendors);
      return;
    }
    try {
      setSearchingVendors(true);
      const res = await purchaseApi.listVendors({ query: searchTerm.trim() });
      if (res?.vendorData && Array.isArray(res.vendorData)) {
        setVendorList(res.vendorData);
      }
    } catch (err) {
      console.warn("Error fetching debounced purchase vendors:", err);
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

  // Excl GST derives from sum(qty × rate) across all line items
  const derivedExcl = useMemo(
    () =>
      form.lineItems.reduce(
        (s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0),
        0
      ),
    [form.lineItems]
  );

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === "gst") {
        next.inclGst = derivedExcl + (Number(value) || 0);
      }
      return next;
    });
  }

  function updateLineItem(i, field, value) {
    setForm((f) => {
      const next = [...f.lineItems];
      const updatedRow = { ...next[i], [field]: value };
      if (field === "qty" || field === "rate") {
        const qty = Number(field === "qty" ? value : updatedRow.qty) || 0;
        const rate = Number(field === "rate" ? value : updatedRow.rate) || 0;
        updatedRow.amount = qty * rate;
      }
      next[i] = updatedRow;

      // Auto update inclGst based on new sum
      const newDerivedExcl = next.reduce(
        (s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0),
        0
      );
      return {
        ...f,
        lineItems: next,
        inclGst: newDerivedExcl + (Number(f.gst) || 0),
      };
    });
  }

  function addLineItem() {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_ROW }] }));
  }

  function removeLineItem(i) {
    setForm((f) => {
      const next = f.lineItems.filter((_, idx) => idx !== i);
      const newDerivedExcl = next.reduce(
        (s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0),
        0
      );
      return {
        ...f,
        lineItems: next,
        inclGst: newDerivedExcl + (Number(f.gst) || 0),
      };
    });
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast.error("File size cannot exceed 10MB");
        return;
      }
      setSelectedFile(file);
    }
  }

  async function handleSubmit() {
    const nextErrors = {};
    if (!form.vendor.trim()) nextErrors.vendor = "Vendor is required";
    if (!form.invoiceNo.trim()) nextErrors.invoiceNo = "Invoice number is required";
    if (
      form.lineItems.length === 0 ||
      !form.lineItems.some((r) => r.name.trim())
    ) {
      nextErrors.lineItems = "Add at least one line item";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);
      const paid = Number(form.paid) || 0;
      const excl = derivedExcl;
      const gst = Number(form.gst) || 0;
      const incl = Number(form.inclGst) || excl + gst;
      const materialLines = form.lineItems
        .filter((r) => r.name && r.name.trim())
        .map((r) => ({
          name: r.name.trim(),
          qty: Number(r.qty) || 1,
          rate: Number(r.rate) || 0,
          amount: (Number(r.qty) || 1) * (Number(r.rate) || 0),
        }));

      const derivedStatus =
        form.status ||
        (paid >= incl && incl > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending");

      const formData = new FormData();
      formData.append("vendor", form.vendor.trim());
      if (form.vendorId) formData.append("vendorId", form.vendorId);
      formData.append("invoiceNo", form.invoiceNo.trim());
      if (form.date) formData.append("date", form.date);
      if (form.paymentMode) formData.append("paymentMode", form.paymentMode);
      if (form.referenceNo) formData.append("referenceNo", form.referenceNo);
      formData.append("exclGst", excl);
      formData.append("gst", gst);
      formData.append("inclGst", incl);
      formData.append("paid", paid);
      formData.append("pending", Math.max(0, incl - paid));
      formData.append("status", derivedStatus);
      if (form.notes) formData.append("notes", form.notes);
      formData.append("lineItems", JSON.stringify(materialLines));

      if (selectedFile) {
        formData.append("document", selectedFile);
      }

      const res = await purchaseApi.createPurchase(formData);
      showToast.success(res?.message || "Purchase bill added successfully.");

      if (onSubmit) {
        onSubmit(res?.data);
      }
      onClose();
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || "Failed to add purchase");
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
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Package className="h-5 w-5" />
          </span>
          <span>Add Parts Purchase</span>
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={loading}>
            Add Purchase
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SearchableSelect
            label="Vendor / Supplier"
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
            label="Invoice / Ref No"
            required
            value={form.invoiceNo}
            onChange={(e) => update("invoiceNo", e.target.value)}
            placeholder="VEND-XXXX"
            error={errors.invoiceNo}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="Invoice Date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            options={PURCHASE_STATUS_OPTIONS}
            placeholder="Auto (derived)"
          />
        </div>

        {/* Line items table */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-700">Line Items</p>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-ink-100">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-medium text-ink-500">
                  <th className="px-3 py-2">Item Name / Part Description</th>
                  <th className="w-20 px-3 py-2 text-center">Qty</th>
                  <th className="w-28 px-3 py-2 text-center">Rate (₹)</th>
                  <th className="w-28 px-3 py-2 text-center">Amt (₹)</th>
                  <th className="w-10 px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {form.lineItems.map((r, i) => (
                  <tr key={i} className="border-b border-ink-100 last:border-b-0">
                    <td className="px-2 py-2">
                      <Input
                        value={r.name}
                        onChange={(e) => updateLineItem(i, "name", e.target.value)}
                        placeholder="e.g. Brake Pad Set, Tyre 185/65R15..."
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={r.qty}
                        onChange={(e) => updateLineItem(i, "qty", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={r.rate}
                        onChange={(e) => updateLineItem(i, "rate", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-2 text-center text-sm font-semibold text-ink-800">
                      ₹
                      {(
                        (Number(r.qty) || 0) * (Number(r.rate) || 0)
                      ).toLocaleString("en-IN")}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {form.lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(i)}
                          className="text-ink-400 cursor-pointer hover:text-red-500"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.lineItems && (
            <p className="mt-1 text-xs text-red-500">{errors.lineItems}</p>
          )}
        </div>

        {/* GST & Totals */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Excl GST (₹)"
            type="number"
            value={derivedExcl}
            disabled
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
            value={form.inclGst || derivedExcl + (Number(form.gst) || 0)}
            onChange={(e) => update("inclGst", e.target.value)}
          />
        </div>

        {/* Initial Payment Section */}
        <div className="rounded-lg border border-ink-200/80 bg-ink-50/40 p-3 space-y-3">
          <p className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
            Initial Payment (Optional)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              type="number"
              min={0}
              label="Amount Paid (₹)"
              value={form.paid}
              onChange={(e) => update("paid", e.target.value)}
              placeholder="0.00"
            />
            <Select
              label="Payment Mode"
              value={form.paymentMode}
              onChange={(e) => update("paymentMode", e.target.value)}
              options={PURCHASE_PAYMENT_MODE_OPTIONS}
              placeholder="Select mode"
            />
            <Input
              label="Ref / UTR / Cheque No"
              value={form.referenceNo}
              onChange={(e) => update("referenceNo", e.target.value)}
              placeholder="e.g. UTR / CHQ / Txn ID"
            />
          </div>
        </div>

        <div>
          <Textarea
            label="Notes"
            rows={2}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Additional purchase notes..."
            className="h-16"
          />
        </div>

        {/* File Attachment */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">Attach Bill / Invoice</p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-50/40 px-4 py-5 text-center hover:bg-ink-50 transition-colors">
            {selectedFile ? (
              <div className="flex items-center gap-2 text-emerald-700 text-sm">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <span className="font-medium truncate max-w-xs">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedFile(null);
                  }}
                  className="p-1 hover:text-red-500 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-ink-400" />
                <span className="text-sm text-ink-600">
                  Click to upload invoice document (PDF, PNG, JPG up to 10MB)
                </span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}
