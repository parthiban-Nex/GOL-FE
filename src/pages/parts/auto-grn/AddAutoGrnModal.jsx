import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import SingleSelect from "@/components/ui/SingleSelect";
import Button from "@/components/ui/Button";
import {
  GRN_NAME_OPTIONS,
  VENDOR_CODE_OPTIONS,
  SAMPLE_CATALOGUE_PARTS,
} from "../mockPartsData";

const INITIAL_ITEM = {
  partNo: "54636",
  description: "AIR CLEANER FILTER ELEMENT",
  poNumber: "54636",
  supInvQty: 1,
  receivedQty: 1,
  cost: 2288.0,
  totalAmount: 2699.84,
};

const emptyFormData = {
  grandTotal: "0.00",
  grnName: GRN_NAME_OPTIONS[0]?.value ?? "",
  vendorCode: VENDOR_CODE_OPTIONS[0]?.value ?? "",
  supplierInvoiceNumber: "",
  invoiceDate: "",
  invoiceAmount: "",
  eSugamNumber: "",
  lrNumber: "",
  lrDate: "",
  transportName: "",
  freightCharges: "0.00",
  miscellaneousCharges: "0.00",
};

export default function AddAutoGrnModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [formData, setFormData] = useState(emptyFormData);
  const [items, setItems] = useState([INITIAL_ITEM]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(emptyFormData);
      setItems([INITIAL_ITEM]);
      setErrors({});
    }
  }, [isOpen]);

  // Auto-calculate grand total whenever items, freight, or misc charges
  // change. Typing directly into Grand Total still works in between -
  // this effect only re-fires on its own three dependencies.
  useEffect(() => {
    const itemsSum = items.reduce(
      (acc, it) => acc + (Number(it.totalAmount) || 0),
      0,
    );
    const freight = Number(formData.freightCharges) || 0;
    const misc = Number(formData.miscellaneousCharges) || 0;
    const total = (itemsSum + freight + misc).toFixed(2);
    setFormData((prev) => ({ ...prev, grandTotal: total }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, formData.freightCharges, formData.miscellaneousCharges]);

  if (!isOpen) return null;

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }

  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      // Recalculate line total if qty or cost changes.
      if (field === "receivedQty" || field === "cost") {
        const qty =
          Number(field === "receivedQty" ? value : target.receivedQty) || 0;
        const cost = Number(field === "cost" ? value : target.cost) || 0;
        const sub = qty * cost;
        // 18% GST default calculation.
        target.totalAmount = (sub * 1.18).toFixed(2);
      }

      copy[index] = target;
      return copy;
    });
  }

  function handleAddPartRow() {
    const nextSample =
      SAMPLE_CATALOGUE_PARTS[items.length % SAMPLE_CATALOGUE_PARTS.length];
    setItems((prev) => [
      ...prev,
      {
        partNo: nextSample.partNo,
        description: nextSample.description,
        poNumber: nextSample.partNo,
        supInvQty: 1,
        receivedQty: 1,
        cost: nextSample.cost,
        totalAmount:
          nextSample.totalAmount ?? (nextSample.cost * 1.18).toFixed(2),
      },
    ]);
  }

  function handleRemovePartRow(index) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!formData.grnName) newErrors.grnName = "GRN Name is required";
    if (!formData.vendorCode) newErrors.vendorCode = "Vendor Code is required";
    if (!formData.supplierInvoiceNumber) {
      newErrors.supplierInvoiceNumber = "Supplier Invoice Number is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit?.({ ...formData, items });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Auto GRN"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-auto-grn-form"
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </>
      }
    >
      <form
        id="add-auto-grn-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Grand Total */}
        <div className="max-w-xs">
          <Input
            label="Grand Total"
            required
            variant="underline"
            value={formData.grandTotal}
            onChange={(e) => handleChange("grandTotal", e.target.value)}
            className="text-base font-bold"
          />
        </div>

        {/* Form Fields - 3 column grid */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          <div className="-mt-2.5">
            <SingleSelect
              label="GRN Name"
              required
              value={formData.grnName}
              onChange={(value) => handleChange("grnName", value)}
              options={GRN_NAME_OPTIONS}
              error={errors.grnName}
            />
          </div>
          <div className="-mt-2.5">
            <SingleSelect
              label="Vendor Code"
              required
              value={formData.vendorCode}
              onChange={(value) => handleChange("vendorCode", value)}
              options={VENDOR_CODE_OPTIONS}
              error={errors.vendorCode}
            />
          </div>
          <Input
            label="Supplier Invoice Number"
            required
            variant="underline"
            value={formData.supplierInvoiceNumber}
            onChange={(e) =>
              handleChange("supplierInvoiceNumber", e.target.value)
            }
            placeholder="e.g. CSCR-VLR-0010"
            error={errors.supplierInvoiceNumber}
          />

          <Input
            type="date"
            label="Invoice Date"
            variant="underline"
            value={formData.invoiceDate}
            onChange={(e) => handleChange("invoiceDate", e.target.value)}
          />
          <Input
            type="number"
            step="0.01"
            label="Invoice Amount"
            variant="underline"
            value={formData.invoiceAmount}
            onChange={(e) => handleChange("invoiceAmount", e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="ESugam Road Permit Number"
            variant="underline"
            value={formData.eSugamNumber}
            onChange={(e) => handleChange("eSugamNumber", e.target.value)}
            placeholder="e.g. ESUGAM-99201"
          />

          <Input
            label="LR Number"
            variant="underline"
            value={formData.lrNumber}
            onChange={(e) => handleChange("lrNumber", e.target.value)}
            placeholder="e.g. LR-89201"
          />
          <Input
            type="date"
            label="LR Date"
            variant="underline"
            value={formData.lrDate}
            onChange={(e) => handleChange("lrDate", e.target.value)}
          />
          <Input
            label="Transport Name"
            variant="underline"
            value={formData.transportName}
            onChange={(e) => handleChange("transportName", e.target.value)}
            placeholder="e.g. SafeXpress Logistics"
          />

          <Input
            type="number"
            step="0.01"
            label="Freight Charges"
            variant="underline"
            value={formData.freightCharges}
            onChange={(e) => handleChange("freightCharges", e.target.value)}
            placeholder="0.00"
          />
          <Input
            type="number"
            step="0.01"
            label="Miscellaneous Charges"
            variant="underline"
            value={formData.miscellaneousCharges}
            onChange={(e) =>
              handleChange("miscellaneousCharges", e.target.value)
            }
            placeholder="0.00"
          />
        </div>

        {/* Parts Line Items - a free-form editable grid, which the
            shared Table component doesn't support, so this stays
            hand-built rather than forced into it. */}
        <div className="rounded-xl border border-ink-100 bg-white p-3 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 text-ink-500">
                  <th className="pb-2 font-semibold">Parts No</th>
                  <th className="pb-2 font-semibold">Description</th>
                  <th className="pb-2 font-semibold">PO Number</th>
                  <th className="pb-2 font-semibold">Sup Inv Qty</th>
                  <th className="pb-2 font-semibold">Received Qty</th>
                  <th className="pb-2 font-semibold">Cost</th>
                  <th className="pb-2 font-semibold text-brand-700">
                    Total Amount
                  </th>
                  <th className="w-8 pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {items.map((row, idx) => (
                  <tr key={idx} className="hover:bg-ink-50/50">
                    <td className="py-2.5 pr-2 font-semibold text-brand-700">
                      <input
                        type="text"
                        value={row.partNo}
                        onChange={(e) =>
                          handleItemChange(idx, "partNo", e.target.value)
                        }
                        className="w-20 border-b border-ink-200 bg-transparent pb-0.5 font-semibold text-brand-700 focus:border-brand-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) =>
                          handleItemChange(idx, "description", e.target.value)
                        }
                        className="w-44 truncate border-b border-ink-200 bg-transparent pb-0.5 font-medium text-ink-800 focus:border-brand-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="text"
                        value={row.poNumber}
                        onChange={(e) =>
                          handleItemChange(idx, "poNumber", e.target.value)
                        }
                        className="w-20 border-b border-ink-200 bg-transparent pb-0.5 font-semibold text-brand-700 focus:border-brand-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        min="1"
                        value={row.supInvQty}
                        onChange={(e) =>
                          handleItemChange(idx, "supInvQty", e.target.value)
                        }
                        className="w-14 border-b border-ink-200 bg-transparent pb-0.5 text-center text-ink-800 focus:border-brand-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        min="1"
                        value={row.receivedQty}
                        onChange={(e) =>
                          handleItemChange(idx, "receivedQty", e.target.value)
                        }
                        className="w-14 border-b border-ink-200 bg-transparent pb-0.5 text-center text-ink-800 focus:border-brand-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="number"
                        step="0.01"
                        value={row.cost}
                        onChange={(e) =>
                          handleItemChange(idx, "cost", e.target.value)
                        }
                        className="w-20 border-b border-ink-200 bg-transparent pb-0.5 font-semibold text-ink-900 focus:border-brand-600 focus:outline-none"
                      />
                    </td>
                    <td className="py-2.5 pr-2 font-bold text-ink-900">
                      ₹{" "}
                      {Number(row.totalAmount || 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2.5 text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePartRow(idx)}
                          className="text-ink-400 transition-colors hover:text-danger-500"
                          title="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end border-t border-ink-100 pt-3">
            <Button
              type="button"
              size="sm"
              icon={Plus}
              onClick={handleAddPartRow}
            >
              Add Part
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
