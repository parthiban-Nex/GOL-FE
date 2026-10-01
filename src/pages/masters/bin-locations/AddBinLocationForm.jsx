import { useEffect, useState } from "react";
import SingleSelect from "@/components/ui/SingleSelect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { binLocationApi } from "@/services";
import { outletApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  binLocation: [[isRequired, "Bin location is required."]],
  binLocationDescription: [[isRequired, "Description is required."]],
  outletId: [[isRequired, "Select an outlet."]],
};

export default function AddBinLocationForm({
  binLocationRow,
  onCreated,
  onCancel,
}) {
  const isEditing = Boolean(binLocationRow);

  const outletOptions = useDropdownOptions(
    () => outletApi.getAll(),
    (o) => ({ value: String(o.id), label: o.outletCode }),
    "OutletData",
  );

  const [form, setForm] = useState({
    binLocation: "",
    binLocationDescription: "",
    outletId: "",
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!binLocationRow) return;
    if (!outletOptions.length) return;

    const outletCode =
      binLocationRow.outlet?.outletCode ?? binLocationRow.outletCode;
    const outletName =
      binLocationRow.outlet?.outletName ?? binLocationRow.outletName;
    const outletId = String(
      binLocationRow.outlet?.id ??
        binLocationRow.outletId ??
        outletOptions.find(
          (o) => o.label === outletCode || o.label === outletName,
        )?.value ??
        "",
    );

    setForm({
      binLocation: binLocationRow.binLocation ?? "",
      binLocationDescription: binLocationRow.binLocationDescription ?? "",
      outletId,
      status: binLocationRow.status ? 1 : 0,
    });
  }, [binLocationRow, outletOptions]);

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
      const outletCode = outletOptions.find(
        (o) => o.value === form.outletId,
      )?.label;

      const payload = {
        binLocation: form.binLocation,
        binLocationDescription: form.binLocationDescription,
        outletCode: outletCode,
        status: form.status,
      };
      if (isEditing) payload.id = binLocationRow.id;

      const response = isEditing
        ? await binLocationApi.update(payload)
        : await binLocationApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing
              ? "Couldn't update bin location."
              : "Couldn't create bin location.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.binLocation} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing
            ? "Couldn't update bin location."
            : "Couldn't create bin location."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Bin Location"
        required
        variant="underline"
        value={form.binLocation}
        onChange={(e) => update("binLocation", e.target.value)}
        error={errors.binLocation}
      />
      <Input
        label="Description"
        required
        variant="underline"
        value={form.binLocationDescription}
        onChange={(e) => update("binLocationDescription", e.target.value)}
        error={errors.binLocationDescription}
      />
      <SingleSelect
        label="Outlet"
        required
        placeholder="Select an outlet"
        value={form.outletId}
        onChange={(value) => update("outletId", value)}
        error={errors.outletId}
        options={outletOptions}
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
          {isEditing ? "Save changes" : "Create bin location"}
        </Button>
      </div>
    </form>
  );
}
