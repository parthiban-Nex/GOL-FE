import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Multiselect from "@/components/ui/Multiselect";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { sourceApi } from "@/services";
import { companyApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  sourceName: [[isRequired, "Source name is required."]],
};

export default function AddSourceForm({ source, onCreated, onCancel }) {
  const isEditing = Boolean(source);

  const companyOptions = useDropdownOptions(
    () => companyApi.getAll(),
    (c) => ({ value: String(c.id), label: c.name }),
    companyApi.listKey,
  );

  const [form, setForm] = useState({
    sourceName: "",
    companyId: [],
    bridgeStatus: 0,
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The grid returns company NAMES joined ("TVSFCCC,NMSA_FOFO"), not
  // ids, so they're matched back against the loaded options - which is
  // why companyOptions is in the dependency list: on the first pass it's
  // still empty and every lookup would miss.
  useEffect(() => {
    if (!source) return;
    setForm({
      sourceName: source.sourceName ?? "",
      companyId: String(source.companies ?? "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => companyOptions.find((c) => c.label === name)?.value)
        .filter(Boolean),
      bridgeStatus: source.bridge_status ? 1 : 0,
      status: source.status ? 1 : 0,
    });
  }, [source, companyOptions]);

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
        sourceName: form.sourceName,
        companyId: form.companyId.map(Number),
        bridgeStatus: form.bridgeStatus ? 1 : 0,
        status: form.status,
      };
      if (isEditing) payload.id = source.id;

      const response = isEditing
        ? await sourceApi.update(payload)
        : await sourceApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update source." : "Couldn't create source.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.sourceName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update source." : "Couldn't create source."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Source Name"
        required
        variant="underline"
        value={form.sourceName}
        onChange={(e) => update("sourceName", e.target.value)}
        error={errors.sourceName}
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
            checked={form.bridgeStatus === 1}
            onChange={(e) => update("bridgeStatus", e.target.checked ? 1 : 0)}
          />
          Bridge Status
        </label>

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
          {isEditing ? "Save changes" : "Create source"}
        </Button>
      </div>
    </form>
  );
}
