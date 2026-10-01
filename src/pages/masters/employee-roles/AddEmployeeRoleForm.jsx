import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { employeeRoleApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const rules = {
  employeeRole: [[isRequired, "Role name is required."]],
};

/**
 * Create/edit employee role form, rendered inside a dialog from
 * EmployeeRoles.jsx. Pass a `role` row to open it in edit mode.
 */
export default function AddEmployeeRoleForm({ role, onCreated, onCancel }) {
  const isEditing = Boolean(role);

  const [form, setForm] = useState({
    employeeRole: "",
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!role) return;
    setForm({
      employeeRole: role.employeeRole ?? "",
      status: role.status ? 1 : 0,
    });
  }, [role]);

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
      if (isEditing) payload.id = role.id;

      const response = isEditing
        ? await employeeRoleApi.update(payload)
        : await employeeRoleApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update role." : "Couldn't create role.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.employeeRole} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update role." : "Couldn't create role."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Employee Role"
        required
        variant="underline"
        value={form.employeeRole}
        onChange={(e) => update("employeeRole", e.target.value)}
        error={errors.employeeRole}
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
          {isEditing ? "Save changes" : "Create role"}
        </Button>
      </div>
    </form>
  );
}
