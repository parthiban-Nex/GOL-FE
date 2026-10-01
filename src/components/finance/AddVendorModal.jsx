import { useEffect, useState } from "react";
import { Building2, UploadCloud } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  VENDOR_TYPE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
} from "@/pages/finance/mockexpense";
import { showToast } from "@/utils/toast";

const EMPTY_VENDOR = {
  name: "",
  type: "",
  paymentTerms: "",
  contactPerson: "",
  phone: "",
  email: "",
  gst: "",
  address: "",
};

/**
 * "Add New Vendor" modal (Image 1). Single-column form with a mix of
 * full-width and paired fields. Only Vendor Name is required for now
 * so light garages can add a payee quickly and enrich the record later.
 *
 * TODO: BACKEND INTEGRATION - onSubmit returns the vendor object to
 * the parent; wire it to expenseApi.createVendor() when the backend
 * is live. The supporting-document dropzone is UI-only right now;
 * hook it up to expenseApi.uploadVendorDocument() alongside.
 */
export default function AddVendorModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_VENDOR);
      setErrors({});
    }
  }, [isOpen]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Vendor name is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSubmit({
      id: `V${Math.floor(100 + Math.random() * 900)}`,
      ...form,
    });
    showToast.success(`Vendor "${form.name}" saved.`);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <Building2 className="h-5 w-5" />
          </span>
          <span>Add New Vendor</span>
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Vendor</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Vendor Name "
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. Bosch Auto Parts Pvt Ltd"
          error={errors.name}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Vendor Type"
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            options={VENDOR_TYPE_OPTIONS}
            placeholder="Select type"
          />
          <Select
            label="Payment Terms"
            value={form.paymentTerms}
            onChange={(e) => update("paymentTerms", e.target.value)}
            options={PAYMENT_TERMS_OPTIONS}
            placeholder="Select terms"
          />
        </div>

        <Input
          label="Contact Person"
          value={form.contactPerson}
          onChange={(e) => update("contactPerson", e.target.value)}
          placeholder="Full name"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
          <Input
            type="email"
            label="Email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="vendor@example.com"
          />
        </div>

        <Input
          label="GST Number"
          value={form.gst}
          onChange={(e) => update("gst", e.target.value)}
          placeholder="e.g. 29AABCU9603R1ZJ"
        />

        <div>
          <Textarea
            label="Address"
            rows={2}
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="Street, City, State, PIN"
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">
            Supporting Document{" "}
            <span className="text-xs font-normal text-ink-500">(optional)</span>
          </p>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-50/40 px-4 py-6 text-center hover:bg-ink-50">
            <UploadCloud className="h-6 w-6 text-ink-400" />
            <span className="text-sm text-ink-600">Click to upload</span>
            <span className="text-[11px] text-ink-500">
              GST Certificate, PAN, Business Registration · Max 10MB
            </span>
            <input type="file" className="hidden" />
          </label>
        </div>
      </div>
    </Modal>
  );
}
