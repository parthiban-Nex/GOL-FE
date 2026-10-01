import { useEffect, useState } from "react";
import SingleSelect from "@/components/ui/SingleSelect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { technicianApi } from "@/services";
import { outletApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  outletId: [[isRequired, "Select an outlet."]],
  employeeCode: [[isRequired, "Employee code is required."]],
  employeeName: [[isRequired, "Employee name is required."]],
  mobileNumber: [[isRequired, "Mobile number is required."]],
};


export default function AddTechnicianForm({ technician, onCreated, onCancel }) {
  const isEditing = Boolean(technician);

  const outletOptions = useDropdownOptions(
    () => outletApi.getAll(),
    (o) => ({
      value: String(o.id),
      label: o.outletCode,
    }),
    "OutletData",
  );

  const [form, setForm] = useState({
    outletId: "",
    employeeCode: "",
    employeeName: "",
    mobileNumber: "",
    email: "",
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!technician) return;
    setForm({
      outletId: String(technician.outlet?.id ?? technician.outletId ?? ""),
      employeeCode: technician.employeeCode ?? "",
      employeeName: technician.employeeName ?? "",
      mobileNumber: technician.mobileNumber ?? "",
      email: technician.email ?? "",
      status: technician.status ? 1 : 0,
    });
  }, [technician]);

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
      const payload = {
        ...form,
        outletId: Number(form.outletId) || form.outletId,
      };
      if (isEditing) payload.id = technician.id;

      const response = isEditing
        ? await technicianApi.update(payload)
        : await technicianApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing
              ? "Couldn't update technician."
              : "Couldn't create technician.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.employeeName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing
            ? "Couldn't update technician."
            : "Couldn't create technician."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SingleSelect
        label="Outlet"
        required
        value={form.outletId}
        onChange={(value) => update("outletId", value)}
        error={errors.outletId}
        options={outletOptions}
        placeholder="Select an outlet"
      />
      <Input
        label="Employee Code"
        required
        variant="underline"
        value={form.employeeCode}
        onChange={(e) => update("employeeCode", e.target.value)}
        error={errors.employeeCode}
      />
      <Input
        label="Employee Name"
        required
        variant="underline"
        value={form.employeeName}
        onChange={(e) => update("employeeName", e.target.value)}
        error={errors.employeeName}
      />
      <Input
        label="Mobile Number"
        required
        maxLength={10}
        variant="underline"
        value={form.mobileNumber}
        onChange={(e) => update("mobileNumber", e.target.value)}
        error={errors.mobileNumber}
      />
      <Input
        label="Email"
        type="email"
        variant="underline"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        error={errors.email}
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
          {isEditing ? "Save changes" : "Create technician"}
        </Button>
      </div>
    </form>
  );
}
