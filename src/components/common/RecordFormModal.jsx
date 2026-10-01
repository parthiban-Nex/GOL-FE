import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

/**
 * A view / edit modal driven entirely by a `fields` config.
 *
 * Several screens (Spare Issue, Reports > My Customers, and the other
 * Parts screens) show the same thing: a record's fields, read-only in
 * "view" mode and editable in "edit" mode. This builds that once on the
 * project's own Modal, Input and Button, so every screen gets the same
 * Escape-to-close, scroll lock, focus styling and layout.
 *
 * @param {"view"|"edit"} mode
 * @param {{ name: string, label: string, required?: boolean,
 *           type?: string, readOnlyInEdit?: boolean }[]} fields
 * @param {object} record     the row being shown
 * @param {(values) => void} onSave   only called in edit mode
 */
export default function RecordFormModal({
  isOpen,
  onClose,
  title,
  mode = "view",
  fields,
  record,
  onSave,
  isSaving = false,
  size = "md",
}) {
  const isEdit = mode === "edit";
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});

  // Re-seed from the record every time the modal opens, so edits that
  // were cancelled don't leak into the next open.
  useEffect(() => {
    if (!isOpen || !record) return;
    setValues(
      Object.fromEntries(fields.map((f) => [f.name, record[f.name] ?? ""])),
    );
    setErrors({});
  }, [isOpen, record, fields]);

  if (!isOpen || !record) return null;

  function update(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!isEdit) return;

    const missing = {};
    for (const field of fields) {
      if (field.required && !String(values[field.name] ?? "").trim()) {
        missing[field.name] = `${field.label} is required.`;
      }
    }
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }
    onSave?.(values);
  }

  const formId = "record-form-modal";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {isEdit ? "Cancel" : "Close"}
          </Button>
          {isEdit && (
            <Button
              type="submit"
              form={formId}
              icon={Save}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          )}
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <Input
            key={field.name}
            label={field.label}
            type={field.type ?? "text"}
            required={isEdit && field.required}
            variant="underline"
            value={values[field.name] ?? ""}
            onChange={(e) => update(field.name, e.target.value)}
            // View mode, or a field that must never be changed.
            readOnly={!isEdit || field.readOnlyInEdit}
            className={
              !isEdit || field.readOnlyInEdit
                ? "bg-ink-50 text-ink-700"
                : undefined
            }
            error={errors[field.name]}
          />
        ))}
      </form>
    </Modal>
  );
}
