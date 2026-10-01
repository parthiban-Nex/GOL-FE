import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { useTabPermissions } from "@/hooks/usePagePermissions";
import { menuApi } from "@/services";
import { roleApi } from "@/services";
import {
  BUTTON_OPERATIONS,
  decodeButtons,
  encodeButtons,
} from "@/menu/buttonOperations";
import { extractList, isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

export default function RoleSubMenuSettingTab() {
  const { canUpdate: canEdit } = useTabPermissions("Role SubMenu Setting");

  const roleOptions = useDropdownOptions(
    () => roleApi.list(),
    (r) => ({
      value: String(r.id ?? r.roleId),
      label: r.roleName ?? r.employeeRole,
    }),
    roleApi.listKey,
  );

  const [selectedRole, setSelectedRole] = useState("");
  const [allSubMenus, setAllSubMenus] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    menuApi
      .getAllSubMenus()
      .then((response) =>
        setAllSubMenus(extractList(response, menuApi.subMenuListKey)),
      )
      .catch(() => setAllSubMenus([]));
  }, []);

  useEffect(() => {
    if (!selectedRole || allSubMenus.length === 0) {
      setAssignments({});
      return;
    }

    setIsLoading(true);
    menuApi
      .getMenuListByRole(selectedRole) 
      .then((response) => {
        const granted = extractList(response, menuApi.roleMenuListKey);
        const next = {};
        for (const menu of granted) {
          for (const sub of menu.submenu ?? []) {
            const matched = allSubMenus.find((s) => s.title === sub.title);
            if (!matched) continue;
            next[matched.id] = {
              checked: true,
              buttons: decodeButtons(sub.buttons ?? sub.button_operation),
            };
          }
        }

        setAssignments(next);
      })
      .catch(() => setAssignments({}))
      .finally(() => setIsLoading(false));
  }, [selectedRole, allSubMenus]);
  function stateFor(id) {
    return assignments[id] ?? { checked: false, buttons: new Set() };
  }

  function toggleSubMenu(id, checked) {
    setAssignments((prev) => {
      const current = prev[id] ?? { buttons: new Set([2]) };
      return { ...prev, [id]: { ...current, checked } };
    });
  }

  function toggleButton(id, code) {
    setAssignments((prev) => {
      const current = prev[id] ?? { checked: true, buttons: new Set() };
      const buttons = new Set(current.buttons);
      if (buttons.has(code)) buttons.delete(code);
      else buttons.add(code);
      return { ...prev, [id]: { ...current, buttons } };
    });
  }

  async function handleSave() {
    if (!selectedRole) {
      showToast.error("Select a role first.");
      return;
    }

    const roleSubMenuSetting = allSubMenus.map((sub) => {
      const state = stateFor(sub.id);
      return {
        SubMenu: sub.id,
        button_operation: encodeButtons(state.buttons),
        status: Boolean(state.checked),
      };
    });

    setIsSaving(true);
    try {
      const response = await menuApi.submitRoleSubMenuSetting({
        roleId: selectedRole,
        roleSubMenuSetting,
      });
      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(response, "Couldn't save submenu permissions."),
        );
      }
      showToast.success(
        responseMessage(response, "SubMenu permissions saved."),
      );
    } catch (err) {
      showToast.error(err.message || "Couldn't save submenu permissions.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="max-w-sm">
        <Select
          label="Role"
          placeholder="Select a role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          options={roleOptions}
        />
      </Card>

      {selectedRole && (
        <Card padded={false}>
          {isLoading ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">
              Loading…
            </p>
          ) : allSubMenus.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">
              No submenus defined yet — add them on the SubMenu List tab first.
            </p>
          ) : (
            <div className="divide-y divide-ink-100">
              {allSubMenus.map((sub) => {
                const state = stateFor(sub.id);
                return (
                  <div
                    key={sub.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
                        checked={state.checked}
                        disabled={!canEdit}
                        onChange={(e) =>
                          toggleSubMenu(sub.id, e.target.checked)
                        }
                      />
                      <span>
                        {sub.title}
                        {sub.path && (
                          <span className="ml-2 text-xs font-normal text-ink-400">
                            {sub.path}
                          </span>
                        )}
                      </span>
                    </label>

                    {state.checked && (
                      <div className="ml-6 flex flex-wrap gap-4 sm:ml-0">
                        {BUTTON_OPERATIONS.map((b) => (
                          <label
                            key={b.code}
                            className="flex items-center gap-1.5 text-sm text-ink-600"
                          >
                            <input
                              type="checkbox"
                              className="h-3.5 w-3.5 cursor-pointer rounded border-ink-300 text-brand-600"
                              checked={state.buttons.has(b.code)}
                              disabled={!canEdit}
                              onChange={() => toggleButton(sub.id, b.code)}
                            />
                            {b.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {selectedRole && canEdit && allSubMenus.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={isSaving}>
            Save permissions
          </Button>
        </div>
      )}
    </div>
  );
}
