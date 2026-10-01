import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Multiselect from "@/components/ui/Multiselect";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { makeApi, companyApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  makeName: [[isRequired, "Make name is required."]],
  makeDescription: [[isRequired, "Make description is required."]],
};

export default function AddMakeForm({ make, onCreated, onCancel }) {
  const isEditing = Boolean(make);

  const [editCompanyList, setEditCompanyList] = useState([]);
  const [companies, setCompanies] = useState([]);
  const companyOptions = useDropdownOptions(
    () =>
      companyApi.getAll().then((res) => {
        if (isSuccess(res)) {
          setCompanies(res.data ?? res.result ?? []);
        }
        return res;
      }),
    (c) => ({ value: String(c.id), label: c.name }),
    companyApi.listKey,
  );

  const [form, setForm] = useState({
    makeName: "",
    makeDescription: "",
    companyId: [],
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!make) return;
    const maps = make.companylist ?? [];
    setForm({
      makeName: make.makeName ?? "",
      makeDescription: make.makeDescription ?? "",
      companyId: maps.map((m) => String(m.companyId)).filter(Boolean),
      status: make.status ? 1 : 0,
    });
    setEditCompanyList(maps);
  }, [make]);

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
        makeName: form.makeName,
        makeDescription: form.makeDescription,
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
        status: form.status,
        editCompanyList: isEditing ? editCompanyList : [],
      };
      if (isEditing) payload.id = make.id;

      const response = isEditing
        ? await makeApi.update(payload)
        : await makeApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update make." : "Couldn't create make.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.makeName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update make." : "Couldn't create make."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <Input
          label="Make Name"
          required
          variant="underline"
          value={form.makeName}
          onChange={(e) => update("makeName", e.target.value)}
          error={errors.makeName}
        />
        <Input
          label="Make Description"
          required
          variant="underline"
          value={form.makeDescription}
          onChange={(e) => update("makeDescription", e.target.value)}
          error={errors.makeDescription}
        />
      </div>

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
          {isEditing ? "Save changes" : "Create make"}
        </Button>
      </div>
    </form>
  );
}
