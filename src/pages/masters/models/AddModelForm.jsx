import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SingleSelect from "@/components/ui/SingleSelect";
import Multiselect from "@/components/ui/Multiselect";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import {
  modelApi,
  makeApi,
  variantApi,
  MODEL_SEGMENTS,
  companyApi,
} from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const segmentOptions = MODEL_SEGMENTS.map((s) => ({ value: s, label: s }));

const rules = {
  makeId: [[isRequired, "Select a make."]],
  modelName: [[isRequired, "Model name is required."]],
  modelDescription: [[isRequired, "Model description is required."]],
  segment: [[isRequired, "Select a segment."]],
};

export default function AddModelForm({ model, onCreated, onCancel }) {
  const isEditing = Boolean(model);
  const [companies, setCompanies] = useState([]);
  const [variants, setVariants] = useState([]);

  const makeOptions = useDropdownOptions(
    () => makeApi.list(),
    (m) => ({ value: String(m.id), label: m.makeName }),
    makeApi.listKey,
  );
  const variantOptions = useDropdownOptions(
    () =>
      variantApi.getAll().then((res) => {
        if (isSuccess(res)) setVariants(res.data ?? res.result ?? []);
        return res;
      }),
    (v) => ({ value: String(v.id), label: v.varientName }),
    variantApi.listKey,
  );
  const companyOptions = useDropdownOptions(
    () =>
      companyApi.getAll().then((res) => {
        if (isSuccess(res)) setCompanies(res.data ?? res.result ?? []);
        return res;
      }),
    (c) => ({ value: String(c.id), label: c.name }),
    companyApi.listKey,
  );
  const [form, setForm] = useState({
    makeId: "",
    modelName: "",
    modelDescription: "",
    segment: "",
    varientName: [],
    companyId: [],
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!model) return;
    const idsFromNames = (joined, options) =>
      String(joined ?? "")
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name) => options.find((o) => o.label === name)?.value)
        .filter(Boolean);

    setForm({
      makeId: String(model.makeId ?? ""),
      modelName: model.modelName ?? "",
      modelDescription: model.modelDescription ?? "",
      segment: model.segment ?? "",
      varientName: idsFromNames(model.varientNames, variantOptions),
      companyId: idsFromNames(model.companies, companyOptions),
      status: model.status ? 1 : 0,
    });
  }, [model, variantOptions, companyOptions]);

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
    if (!form.varientName.length) {
      nextErrors.varientName = "Select at least one variant.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        makeId: Number(form.makeId) || form.makeId,
        modelName: form.modelName,
        modelDescription: form.modelDescription,
        segment: { segment: form.segment },
        varientId: form.varientName.map((id) => {
          const v = variants.find((item) => String(item.id) === id);
          return {
            id: Number(id),
            varientName: v?.varientName ?? "",
            varientDescription: v?.varientDescription ?? "",
            status: v?.status ?? true,
          };
        }),
        companyId: form.companyId.map((id) => {
          const c = companies.find((item) => String(item.id) === id);
          return {
            id: Number(id),
            code: c?.code ?? "",
            name: c?.name ?? "",
            image: c?.image ?? "",
            status: c?.status ?? true,
          };
        }),
        vehicletypeId: 1,
        status: form.status,
      };
      if (isEditing) payload.id = model.id;

      const response = isEditing
        ? await modelApi.update(payload)
        : await modelApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update model." : "Couldn't create model.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.modelName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update model." : "Couldn't create model."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
        <div className="-mt-2.5">
          <SingleSelect
            label="Make"
            required
            placeholder="Select a make"
            value={form.makeId}
            onChange={(value) => update("makeId", value)}
            error={errors.makeId}
            options={makeOptions}
          />
        </div>
        <Input
          label="Model Name"
          required
          variant="underline"
          value={form.modelName}
          onChange={(e) => update("modelName", e.target.value)}
          error={errors.modelName}
        />
        <Input
          label="Model Description"
          required
          variant="underline"
          value={form.modelDescription}
          onChange={(e) => update("modelDescription", e.target.value)}
          error={errors.modelDescription}
        />

        <div className="-mt-2.5">
          <SingleSelect
            label="Segment"
            required
            placeholder="Select a segment"
            value={form.segment}
            onChange={(value) => update("segment", value)}
            error={errors.segment}
            options={segmentOptions}
          />
        </div>
        <div className="-mt-1.5">
          <Multiselect
            label="Variant"
            required
            options={variantOptions}
            value={form.varientName}
            onChange={(value) => update("varientName", value)}
            placeholder="Select variants"
            error={errors.varientName}
          />
        </div>
        <div className="-mt-1.5">
          <Multiselect
            label="Company"
            required
            options={companyOptions}
            value={form.companyId}
            onChange={(value) => update("companyId", value)}
            placeholder="Select companies"
            error={errors.companyId}
          />
        </div>
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
          {isEditing ? "Save changes" : "Create model"}
        </Button>
      </div>
    </form>
  );
}
