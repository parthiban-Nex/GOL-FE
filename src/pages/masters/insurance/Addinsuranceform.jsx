import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { insuranceApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  insuranceName: [[isRequired, "Insurance name is required."]],
};

/** Create/edit insurer. The backend stores only a name and a status. */
export default function AddInsuranceForm({ insurance, onCreated, onCancel }) {
  const isEditing = Boolean(insurance);

  const [form, setForm] = useState({ insuranceName: "", status: 1 });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!insurance) return;
    setForm({
      insuranceName: insurance.insuranceName ?? "",
      status: insurance.status ? 1 : 0,
    });
  }, [insurance]);

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
      if (isEditing) payload.id = insurance.id;

      const response = isEditing
        ? await insuranceApi.update(payload)
        : await insuranceApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update insurer." : "Couldn't create insurer.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.insuranceName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update insurer." : "Couldn't create insurer."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Insurance Name"
        required
        variant="underline"
        value={form.insuranceName}
        onChange={(e) => update("insuranceName", e.target.value)}
        error={errors.insuranceName}
      />

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
          {isEditing ? "Save changes" : "Create insurer"}
        </Button>
      </div>
    </form>
  );
}
