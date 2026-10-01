import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SingleSelect from "@/components/ui/SingleSelect";
import Multiselect from "@/components/ui/Multiselect";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { sourceApi, sourceTypeApi } from "@/services";
import { companyApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  sourceId: [[isRequired, "Select a source."]],
  sourceTypeName: [[isRequired, "SourceType name is required."]],
};

export default function AddSourceTypeForm({ sourceType, onCreated, onCancel }) {
  const isEditing = Boolean(sourceType);

  const sourceOptions = useDropdownOptions(
    () => sourceApi.getAll({ limit: 1000, offset: 0 }),
    (s) => ({ value: String(s.id), label: s.sourceName }),
    sourceApi.listKey,
  );
  const companyOptions = useDropdownOptions(
    () => companyApi.getAll(),
    (c) => ({ value: String(c.id), label: c.name }),
    companyApi.listKey,
  );

  const [form, setForm] = useState({
    sourceId: "",
    sourceTypeName: "",
    companyId: [],
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!sourceType) return;
    setForm({
      sourceId: String(
        sourceType.sourceId ??
          sourceOptions.find((o) => o.label === sourceType.sourceName)?.value ??
          "",
      ),
      sourceTypeName: sourceType.sourceTypeName ?? "",
      companyId: String(sourceType.companies ?? "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => companyOptions.find((c) => c.label === name)?.value)
        .filter(Boolean),
      status: sourceType.status ? 1 : 0,
    });
  }, [sourceType, sourceOptions, companyOptions]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(form, rules);
    if (!form.companyId.length) {
      nextErrors.companyId = "Select at least one company.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        sourceId: Number(form.sourceId) || form.sourceId,
        sourceTypeName: form.sourceTypeName,
        companyId: form.companyId.map(Number),
        status: form.status,
      };
      if (isEditing) payload.id = sourceType.id;

      const response = isEditing
        ? await sourceTypeApi.update(payload)
        : await sourceTypeApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing
              ? "Couldn't update source type."
              : "Couldn't create source type.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.sourceTypeName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing
            ? "Couldn't update source type."
            : "Couldn't create source type."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SingleSelect
        label="Source Name"
        required
        placeholder="Select a source"
        value={form.sourceId}
        onChange={(value) => update("sourceId", value)}
        error={errors.sourceId}
        options={sourceOptions}
      />

      <Input
        label="SourceType Name"
        required
        variant="underline"
        value={form.sourceTypeName}
        onChange={(e) => update("sourceTypeName", e.target.value)}
        error={errors.sourceTypeName}
      />

      <Multiselect
        label="Company"
        required
        options={companyOptions}
        value={form.companyId}
        onChange={(value) => update("companyId", value)}
        placeholder="Select companies"
        error={errors.companyId}
        closeOnSelect={false}
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
          {isEditing ? "Save changes" : "Create source type"}
        </Button>
      </div>
    </form>
  );
}
