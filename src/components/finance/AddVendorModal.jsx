import { useEffect, useState } from "react";
import { Building2, UploadCloud, X, FileCheck } from "lucide-react";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import {
  VENDOR_TYPE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
} from "@/pages/finance/mockexpense";
import { expenseApi } from "@/services";
import { showToast } from "@/utils/toast";

const EMPTY_VENDOR = {
  vendorCode: "",
  name: "",
  type: "",
  paymentTerms: "",
  contactPerson: "",
  phone: "",
  email: "",
  gst: "",
  address: "",
};

export default function AddVendorModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_VENDOR);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_VENDOR);
      setSelectedFile(null);
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
    if (!form.name.trim()) nextErrors.name = "Vendor name is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setLoading(true);

      const formData = new FormData();
      if (form.vendorCode && form.vendorCode.trim()) {
        formData.append("vendorCode", form.vendorCode.trim());
      }
      formData.append("vendorName", form.name.trim());
      formData.append("vendorType", form.type || "");
      formData.append("paymentTerms", form.paymentTerms || "");
      formData.append("contactPerson", form.contactPerson || "");
      formData.append("phone", form.phone || "");
      formData.append("email", form.email || "");
      formData.append("gst", form.gst || "");
      formData.append("address", form.address || "");

      if (selectedFile) {
        formData.append("document", selectedFile);
      }

      const res = await expenseApi.createVendor(formData);
      showToast.success(res?.message || `Vendor "${form.name}" saved.`);

      if (onSubmit) {
        onSubmit(res?.data || { ...form, id: res?.data?.id });
      }
      onClose();
    } catch (err) {
      showToast.error(err?.message || "Failed to save vendor");
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
            <Building2 className="h-5 w-5" />
          </span>
          <span>Add New Vendor</span>
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={loading}>
            Save Vendor
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Vendor Code"

            value={form.vendorCode}
            onChange={(e) => update("vendorCode", e.target.value)}
            placeholder="e.g. EV001 (Optional)"
          />
          <Input
            label="Vendor Name "
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Bosch Auto Parts Pvt Ltd"
            error={errors.name}
          />
        </div>

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

        {/* Supporting Document upload hidden for now - will be enabled once cloud permissions are set */}
        {/*
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-700">
            Supporting Document{" "}
            <span className="text-xs font-normal text-ink-500">(optional)</span>
          </p>
          {selectedFile ? (
            <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50/40 p-3 text-sm">
              <div className="flex items-center gap-2 text-ink-800">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-xs text-ink-500">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="cursor-pointer rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-300 bg-ink-50/40 px-4 py-6 text-center hover:bg-ink-50">
              <UploadCloud className="h-6 w-6 text-ink-400" />
              <span className="text-sm text-ink-600">Click to upload</span>
              <span className="text-[11px] text-ink-500">
                GST Certificate, PAN, Business Registration · Max 10MB
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
        */}
      </div>
    </Modal>
  );
}
