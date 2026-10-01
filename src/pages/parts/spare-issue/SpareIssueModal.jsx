import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const FIELDS = [
  { name: "jobcardNo", label: "Jobcard Number", emphasize: true },
  { name: "customerName", label: "Customer Name" },
  { name: "regNo", label: "Vehicle Reg No" },
  { name: "make", label: "Vehicle Make" },
  { name: "model", label: "Vehicle Model" },
  { name: "fuelType", label: "Fuel Type" },
  { name: "chassisNumber", label: "Chassis Number" },
  { name: "engineNumber", label: "Engine Number" },
  { name: "status", label: "Status" },
  { name: "source", label: "Source" },
  { name: "enquiryNo", label: "Enquiry No" },
  { name: "customerState", label: "Customer State" },
];

const emptyForm = Object.fromEntries(FIELDS.map((f) => [f.name, ""]));

export default function SpareIssueModal({
  isOpen,
  onClose,
  issueRecord,
  mode = "view",
  onSave,
  isSaving = false,
}) {
  const [form, setForm] = useState(emptyForm);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (isOpen && issueRecord) {
      setForm({
        ...emptyForm,
        ...Object.fromEntries(
          FIELDS.filter((f) => issueRecord[f.name] !== undefined).map((f) => [
            f.name,
            issueRecord[f.name] ?? "",
          ]),
        ),
      });
    }
  }, [isOpen, issueRecord]);

  if (!isOpen || !issueRecord) return null;

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (isEdit) onSave?.(form);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Spare Issue" : "View Spare Issue"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {isEdit ? "Cancel" : "Close"}
          </Button>
          {isEdit && (
            <Button
              type="submit"
              form="spare-issue-form"
              icon={Save}
              isLoading={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </>
      }
    >
      <form
        id="spare-issue-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {FIELDS.map((field) => (
          <Input
            key={field.name}
            name={field.name}
            label={field.label}
            required={isEdit}
            readOnly={!isEdit}
            value={form[field.name]}
            onChange={(e) => update(field.name, e.target.value)}
            className={
              !isEdit
                ? `bg-ink-50 ${
                    field.emphasize
                      ? "font-semibold text-brand-900"
                      : "text-ink-800"
                  }`
                : undefined
            }
          />
        ))}
      </form>
    </Modal>
  );
}
