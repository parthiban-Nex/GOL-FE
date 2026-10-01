import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Package, Plus, Trash2, UploadCloud, IndianRupee } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  PURCHASE_STATUS_OPTIONS,
  PURCHASE_PAYMENT_MODE_OPTIONS,
} from "@/pages/finance/mockPurchase";
import { showToast } from "@/utils/toast";

const EMPTY_ROW = { name: "", qty: 1, rate: 0 };
const EMPTY_FORM = {
  vendor: "",
  invoiceNo: "",
  date: "",
  paymentMode: "",
  lineItems: [{ ...EMPTY_ROW }],
  exclGst: 0,
  gst: 0,
  inclGst: 0,
  paid: 0,
  status: "Pending",
  notes: "",
};

export default function AddPurchaseModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [isOpen]);

  // Excl GST derives from sum(qty × rate) across all line items.
  const derivedExcl = useMemo(
    () =>
      form.lineItems.reduce(
        (s, r) => s + (Number(r.qty) || 0) * (Number(r.rate) || 0),
        0,
      ),
    [form.lineItems],
  );

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Editing GST recomputes Incl; editing Incl leaves the split alone.
      if (field === "gst") next.inclGst = derivedExcl + (Number(value) || 0);
      return next;
    });
  }

  function updateLineItem(i, field, value) {
    setForm((f) => {
      const next = [...f.lineItems];
      next[i] = { ...next[i], [field]: value };
      return { ...f, lineItems: next };
    });
  }
  function addLineItem() {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_ROW }] }));
  }
  function removeLineItem(i) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.filter((_, idx) => idx !== i),
    }));
  }

  function handleSubmit() {
    const nextErrors = {};
    if (!form.vendor.trim()) nextErrors.vendor = "Vendor name is required";
    if (!form.invoiceNo.trim())
      nextErrors.invoiceNo = "Invoice no. is required";
    if (
      form.lineItems.length === 0 ||
      !form.lineItems.some((r) => r.name.trim())
    ) {
      nextErrors.lineItems = "Add at least one line item";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const paid = Number(form.paid) || 0;
    const excl = derivedExcl;
    const gst = Number(form.gst) || 0;
    const incl = Number(form.inclGst) || excl + gst;
    const materialLines = form.lineItems
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        qty: Number(r.qty) || 0,
        rate: Number(r.rate) || 0,
        amount: (Number(r.qty) || 0) * (Number(r.rate) || 0),
      }));

    onSubmit({
      vendor: form.vendor.trim(),
      invoiceNo: form.invoiceNo.trim(),
      date: form.date,
      paymentMode: form.paymentMode,
      lineItems: materialLines,
      exclGst: excl,
      gst,
      inclGst: incl,
      paid,
      pending: Math.max(0, incl - paid),
      status:
        form.status ||
        (paid >= incl && incl > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending"),
      notes: form.notes,
      documents: [],
    });
    showToast.success("Purchase added.");
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
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Purchase</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Vendor Name "
            required
            value={form.vendor}
            onChange={(e) => update("vendor", e.target.value)}
            placeholder="Vendor name"
            error={errors.vendor}
          />
          <Input
            label="Invoice No "
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
            label="Date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
          />
          <Select
            label="Payment Mode"
            value={form.paymentMode}
            onChange={(e) => update("paymentMode", e.target.value)}
            options={PURCHASE_PAYMENT_MODE_OPTIONS}
            placeholder="Select mode"
          />
        </div>

        {/* Line items */}
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
                  <th className="px-3 py-2">Item Name</th>
                  <th className="w-20 px-3 py-2 text-center">Qty</th>
                  <th className="w-28 px-3 py-2 text-center">Rate (₹)</th>
                  <th className="w-20 px-3 py-2 text-center">Amt (₹)</th>
                  <th className="w-10 px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {form.lineItems.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-ink-100 last:border-b-0"
                  >
                    <td className="px-2 py-2">
                      <Input
                        value={r.name}
                        onChange={(e) =>
                          updateLineItem(i, "name", e.target.value)
                        }
                        placeholder="Part name"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={r.qty}
                        onChange={(e) =>
                          updateLineItem(i, "qty", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={r.rate}
                        onChange={(e) =>
                          updateLineItem(i, "rate", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-2 text-center  text-sm font-semibold text-ink-800">
                      ₹
                      {(
                        (Number(r.qty) || 0) * (Number(r.rate) || 0)
                      ).toLocaleString("en-IN")}
                    </td>
                    <td className="px-2 py-2 text-left ">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Excl GST (₹)"
            type="number"
            value={derivedExcl}
            disabled
            // icon={IndianRupee}
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
            options={PURCHASE_STATUS_OPTIONS}
            placeholder="Pending"
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
      </div>
    </Modal>
  );
}
