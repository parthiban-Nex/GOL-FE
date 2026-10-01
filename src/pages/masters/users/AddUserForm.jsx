import { useEffect, useMemo, useRef, useState } from "react";
import SingleSelect from "@/components/ui/SingleSelect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { userApi, employeeApi, roleApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { extractList, isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const baseRules = {
  employeeId: [[isRequired, "Select an employee."]],
  user_id: [[isRequired, "User name is required."]],
  role: [[isRequired, "Select a primary role."]],
};

export default function AddUserForm({ user, onCreated, onCancel }) {
  const isEditing = Boolean(user);

  const rules = useMemo(
    () => ({
      ...baseRules,
      ...(isEditing
        ? {}
        : { password: [[isRequired, "Password is required."]] }),
    }),
    [isEditing],
  );

  const employeeOptions = useDropdownOptions(
    () => employeeApi.getAll(),
    (e) => ({
      value: String(e.id),
      label: e.employeeCode
        ? `${e.employeeCode} - ${e.employeeName}`
        : e.employeeName,
    }),
    employeeApi.listKey,
  );

  // The whole role row rides along on each option: getSecondryRoles
  // expects the full object as its body, not just an id.
  const roleOptions = useDropdownOptions(
    () => roleApi.list(),
    (r) => ({
      value: String(r.id ?? r.roleId),
      label: r.roleName ?? r.employeeRole,
      row: r,
    }),
    roleApi.listKey,
  );

  const [form, setForm] = useState({
    employeeId: "",
    user_id: "",
    role: "",
    secondaryRole: "",
    password: "",
    status: 1,
    blocked: 0,
  });
  const [secondaryRoleOptions, setSecondaryRoleOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // On edit the row gives us the secondary role's NAME; it can only be
  // resolved to an id once the secondary list has been fetched, which
  // itself waits on the primary role. Parked here until then.
  const pendingSecondaryNameRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const idForName = (name) =>
      roleOptions.find((r) => r.label === String(name ?? "").trim())?.value ??
      "";

    const firstSecondary = String(user.secondryRoleName ?? "")
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)[0];
    pendingSecondaryNameRef.current = firstSecondary ?? null;

    setForm({
      employeeId: user.employeeId != null ? String(user.employeeId) : "",
      user_id: user.user_id ?? "",
      role: idForName(user.roleName),
      secondaryRole: "",
      password: "",
      status: user.status ? 1 : 0,
      blocked: user.wrong_count > 0 ? 1 : 0,
    });
  }, [user, roleOptions]);

  /**
   * Secondary roles come from the server, not from filtering the primary
   * list client-side: POST /users/getSecondryRoles takes the selected
   * role OBJECT as its body and returns { menuList: [...] } with that
   * role already excluded.
   */
  useEffect(() => {
    if (!form.role) {
      setSecondaryRoleOptions([]);
      return;
    }

    const selected = roleOptions.find((r) => r.value === form.role);
    if (!selected?.row) return; // options still loading

    let cancelled = false;
    (async () => {
      try {
        const response = await roleApi.listSecondary(selected.row);
        if (cancelled) return;
        const options = extractList(response, roleApi.listKey).map((r) => ({
          value: String(r.id ?? r.roleId),
          label: r.roleName ?? r.employeeRole,
          row: r,
        }));
        setSecondaryRoleOptions(options);

        // Resolve the parked name from the edit prefill, now that the
        // list it belongs to exists.
        const pending = pendingSecondaryNameRef.current;
        if (pending) {
          const match = options.find((o) => o.label === pending);
          if (match) setForm((f) => ({ ...f, secondaryRole: match.value }));
          pendingSecondaryNameRef.current = null;
        }
      } catch {
        if (!cancelled) setSecondaryRoleOptions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.role, roleOptions]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // A secondary role from the previous primary must not survive.
      if (field === "role") next.secondaryRole = "";
      return next;
    });
    if (field === "role") pendingSecondaryNameRef.current = null;
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
      const primary = roleOptions.find((r) => r.value === form.role);
      const secondary = secondaryRoleOptions.find(
        (r) => r.value === form.secondaryRole,
      );

      const payload = {
        status: form.status,
        employeeId: Number(form.employeeId) || form.employeeId,
        role: Number(form.role) || form.role,
        roles: secondary?.row ? [secondary.row] : [],
        user_id: form.user_id,
        roleName: primary?.label ?? "",
        wrong_count: form.blocked ? 3 : 0,
      };

      if (form.password) payload.password = form.password;
      if (isEditing) payload.id = user.id;

      const response = isEditing
        ? await userApi.update(payload)
        : await userApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update user." : "Couldn't create user.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.user_id} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update user." : "Couldn't create user."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SingleSelect
        label="Employee"
        required
        placeholder="Select an employee"
        value={form.employeeId}
        onChange={(value) => update("employeeId", value)}
        error={errors.employeeId}
        options={employeeOptions}
      />
      <Input
        label="User Name"
        required
        variant="underline"
        value={form.user_id}
        onChange={(e) => update("user_id", e.target.value.trimStart())}
        error={errors.user_id}
      />
      <SingleSelect
        label="Primary Role"
        required
        placeholder="Select a role"
        value={form.role}
        onChange={(value) => update("role", value)}
        error={errors.role}
        options={roleOptions}
      />

      <SingleSelect
        label="Secondary Role"
        placeholder={
          form.role ? "Secondary Role" : "Select a primary role first"
        }
        options={secondaryRoleOptions}
        value={form.secondaryRole}
        onChange={(value) => update("secondaryRole", value)}
      />

      <Input
        label={
          isEditing ? "Password (leave blank to keep current)" : "Password"
        }
        type="password"
        required={!isEditing}
        variant="underline"
        value={form.password}
        onChange={(e) => update("password", e.target.value)}
        error={errors.password}
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

        <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
            checked={form.blocked === 1}
            onChange={(e) => update("blocked", e.target.checked ? 1 : 0)}
          />
          Blocked
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
