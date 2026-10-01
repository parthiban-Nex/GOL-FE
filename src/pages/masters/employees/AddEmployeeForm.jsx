import { useEffect, useMemo, useState } from "react";
import SingleSelect from "@/components/ui/SingleSelect";
import Multiselect from "@/components/ui/Multiselect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { employeeApi } from "@/services";
import { employeeRoleApi } from "@/services";
import { outletApi } from "@/services";
import { companyApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const baseRules = {
  employeeRoleId: [[isRequired, "Select an employee role."]],
  employeeName: [[isRequired, "Employee name is required."]],
  employeeCode: [[isRequired, "Employee code is required."]],
  mobileNumber: [[isRequired, "Mobile number is required."]],
  email: [[isRequired, "Email is required."]],
  outletId: [[isRequired, "Select an outlet."]],
};

const isReportingUser = (form) => form.reports === 1;

export default function AddEmployeeForm({ employee, onCreated, onCancel }) {
  const isEditing = Boolean(employee);

  const roleOptions = useDropdownOptions(
    () => employeeRoleApi.getAll(),
    (r) => ({ value: String(r.id), label: r.employeeRole }),
    employeeRoleApi.listKey,
  );
  const outletOptions = useDropdownOptions(
    () => outletApi.getAll(),
    (o) => ({
      value: String(o.id),
      label: o.outletCode,
      companyId: o.companyId,
    }),
    outletApi.listKey,
  );
  const companyOptions = useDropdownOptions(
    () => companyApi.getAll(),
    (c) => ({ value: String(c.id), label: c.name }),
    companyApi.listKey,
  );

  const [form, setForm] = useState({
    employeeRoleId: "",
    employeeName: "",
    employeeCode: "",
    mobileNumber: "",
    email: "",
    reports: 0,
    outletId: "",
    companyIds: [],
    status: 1,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reporting = isReportingUser(form);
  const companyIds = useMemo(() => {
    const outlet = outletOptions.find((o) => o.value === form.outletId);
    return outlet?.companyId != null ? [String(outlet.companyId)] : [];
  }, [form.outletId, outletOptions]);
  const rules = useMemo(
    () => ({
      ...baseRules,

      ...(reporting
        ? { companyIds: [[isRequired, "Select at least one company."]] }
        : {}),
    }),
    [reporting],
  );

  useEffect(() => {
    if (!employee) return;

    const roleLabel =
      typeof employee.employeeRole === "string"
        ? employee.employeeRole
        : employee.employeeRole?.employeeRole;
    const employeeRoleId = String(
      employee.employeeRole?.id ??
        employee.employeeRoleId ??
        roleOptions.find((r) => r.label === roleLabel)?.value ??
        "",
    );

    const outletCode = employee.outlet?.outletCode ?? employee.outletCode;
    const outletId = String(
      employee.outlet?.id ??
        employee.outletId ??
        employee.outlets?.[0]?.id ??
        outletOptions.find(
          (o) =>
            o.label === outletCode || o.label.startsWith(`${outletCode} -`),
        )?.value ??
        "",
    );

    setForm({
      employeeRoleId,
      employeeName: employee.employeeName ?? "",
      employeeCode: employee.employeeCode ?? "",
      mobileNumber: employee.mobileNumber ?? "",
      email: employee.email ?? "",
      reports: employee.reports ? 1 : 0,
      outletId,
      companyIds: (employee.companies ?? employee.companyIds ?? []).map((c) =>
        String(c?.id ?? c),
      ),
      status: employee.status ? 1 : 0,
    });
  }, [employee, roleOptions, outletOptions, companyOptions]);

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
      const primaryOutlet = Number(form.outletId) || null;

      const payload = {
        employeeName: form.employeeName,
        employeeCode: form.employeeCode,
        mobileNumber: form.mobileNumber,
        email: form.email,
        employeeRoleId: Number(form.employeeRoleId) || form.employeeRoleId,
        outletId: primaryOutlet,
        outletIds: primaryOutlet ? [primaryOutlet] : [],
        companyIds: reporting
          ? (form.companyIds ?? []).map(Number).filter(Boolean)
          : [],
        reports: reporting ? 1 : 0,
        status: form.status,
      };
      if (isEditing) payload.id = employee.id;

      const response = isEditing
        ? await employeeApi.update(payload)
        : await employeeApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing
              ? "Couldn't update employee."
              : "Couldn't create employee.",
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
            ? "Couldn't update employee."
            : "Couldn't create employee."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SingleSelect
        label="Employee Role"
        required
        placeholder="Select a role"
        value={form.employeeRoleId}
        onChange={(value) => update("employeeRoleId", value)}
        error={errors.employeeRoleId}
        options={roleOptions}
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
        label="Employee Code"
        required
        variant="underline"
        value={form.employeeCode}
        onChange={(e) => update("employeeCode", e.target.value)}
        error={errors.employeeCode}
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
        required
        variant="underline"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        error={errors.email}
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

      {reporting && (
        <Multiselect
          label="Companies"
          required
          options={companyOptions}
          value={companyIds}
          onChange={(value) => update("companyIds", value)}
          placeholder="Select companies"
          closeOnSelect
          error={errors.companyIds}
        />
      )}

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
            checked={form.reports === 1}
            onChange={(e) => update("reports", e.target.checked ? 1 : 0)}
          />
          Reports
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
          {isEditing ? "Save changes" : "Create employee"}
        </Button>
      </div>
    </form>
  );
}
