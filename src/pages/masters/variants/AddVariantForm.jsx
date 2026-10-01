import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { variantApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  varientName: [[isRequired, "Variant name is required."]],
  varientDescription: [[isRequired, "Variant description is required."]],
};

export default function AddVariantForm({ variant, onCreated, onCancel }) {
  const isEditing = Boolean(variant);

  const [form, setForm] = useState({
    varientName: "",
    varientDescription: "",
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!variant) return;
    setForm({
      varientName: variant.varientName ?? "",
      varientDescription: variant.varientDescription ?? "",
      status: variant.status ? 1 : 0,
    });
  }, [variant]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(form, rules);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form };
      if (isEditing) payload.id = variant.id;

      const response = isEditing
        ? await variantApi.update(payload)
        : await variantApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update variant." : "Couldn't create variant.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.varientName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update variant." : "Couldn't create variant."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <Input
          label="Variant Name"
          required
          variant="underline"
          value={form.varientName}
          onChange={(e) => update("varientName", e.target.value)}
          error={errors.varientName}
        />
        <Input
          label="Variant Description"
          required
          variant="underline"
          value={form.varientDescription}
          onChange={(e) => update("varientDescription", e.target.value)}
          error={errors.varientDescription}
        />
      </div>

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
            checked={form.status === 1}
            onChange={(e) => update("status", e.target.checked ? 1 : 0)}
          />
          Active
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? "Save changes" : "Create variant"}
        </Button>
      </div>
    </form>
  );
}
