import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Multiselect from "@/components/ui/Multiselect";
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

export default function RoleMenuSettingTab() {
  const { canUpdate: canEdit } = useTabPermissions("Role Menu Setting");

  const roleOptions = useDropdownOptions(
    () => roleApi.list(),
    (r) => ({
      value: String(r.id ?? r.roleId),
      label: r.roleName ?? r.employeeRole,
    }),
    roleApi.listKey,
  );

  const [selectedRole, setSelectedRole] = useState("");
  const [allMenus, setAllMenus] = useState([]);
  const [subMenus, setSubMenus] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    menuApi
      .getAllMenus()
      .then((response) =>
        setAllMenus(extractList(response, menuApi.menuListKey)),
      )
      .catch(() => setAllMenus([]));
  }, []);
  useEffect(() => {
    if (!selectedRole || allMenus.length === 0) {
      setAssignments({});
      return;
    }

    setIsLoading(true);
    menuApi
      .getMenuListByRole(selectedRole)
      .then((response) => {
        const granted = extractList(response, menuApi.roleMenuListKey);
        const next = {};

        for (const entry of granted) {
          const matched = allMenus.find((m) => m.title === entry.title);
          if (!matched) continue;

          const grantedSubTitles = (entry.submenu ?? []).map((s) => s.title);
          next[matched.id] = {
            checked: entry.status ? entry.status === "Active" : true,
            buttons: decodeButtons(entry.buttons ?? entry.button_operation),
            subMenuIds: subMenus
              .filter((s) => grantedSubTitles.includes(s.title))
              .map((s) => String(s.id)),
          };
        }

        setAssignments(next);
      })
      .catch(() => setAssignments({}))
      .finally(() => setIsLoading(false));
  }, [selectedRole, allMenus, subMenus]);

  useEffect(() => {
    if (!selectedRole) {
      setSubMenus([]);
      return;
    }
    menuApi
      .getAllSubMenusForRole(selectedRole)
      .then((response) =>
        setSubMenus(extractList(response, menuApi.roleSubMenuListKey)),
      )
      .catch(() => setSubMenus([]));
  }, [selectedRole]);

  const subMenuOptions = useMemo(
    () => subMenus.map((s) => ({ value: String(s.id), label: s.title })),
    [subMenus],
  );

  // // Load what the role already has, and reconcile it against the menu
  // // master by title (see the note in the component docblock).
  // useEffect(() => {
  //   if (!selectedRole || allMenus.length === 0) {
  //     setAssignments({});
  //     return;
  //   }

  //   setIsLoading(true);
  //   menuApi
  //     .getMenuListByRole(selectedRole)
  //     .then((response) => {
  //       const granted = extractList(response, menuApi.roleMenuListKey);
  //       const next = {};

  //       for (const entry of granted) {
  //         const matched = allMenus.find((m) => m.title === entry.title);
  //         if (!matched) continue;

  //         const grantedSubTitles = (entry.submenu ?? []).map((s) => s.title);
  //         next[matched.id] = {
  //           checked: entry.status ? entry.status === "Active" : true,
  //           buttons: decodeButtons(entry.buttons ?? entry.button_operation),
  //           subMenuIds: subMenus
  //             .filter((s) => grantedSubTitles.includes(s.title))
  //             .map((s) => String(s.id)),
  //         };
  //       }

  //       setAssignments(next);
  //     })
  //     .catch(() => setAssignments({}))
  //     .finally(() => setIsLoading(false));
  // }, [selectedRole, allMenus, subMenus]);

  function stateFor(menuId) {
    return (
      assignments[menuId] ?? {
        checked: false,
        buttons: new Set(),
        subMenuIds: [],
      }
    );
  }

  function toggleMenu(menuId, checked) {
    setAssignments((prev) => {
      const current = prev[menuId] ?? { buttons: new Set([2]), subMenuIds: [] };
      return { ...prev, [menuId]: { ...current, checked } };
    });
  }

  function toggleButton(menuId, code) {
    setAssignments((prev) => {
      const current = prev[menuId] ?? {
        checked: true,
        buttons: new Set(),
        subMenuIds: [],
      };
      const buttons = new Set(current.buttons);
      if (buttons.has(code)) buttons.delete(code);
      else buttons.add(code);
      return { ...prev, [menuId]: { ...current, buttons } };
    });
  }

  function updateSubMenus(menuId, subMenuIds) {
    setAssignments((prev) => {
      const current = prev[menuId] ?? { checked: true, buttons: new Set([2]) };
      return { ...prev, [menuId]: { ...current, subMenuIds } };
    });
  }

  async function handleSave() {
    if (!selectedRole) {
      showToast.error("Select a role first.");
      return;
    }

    // Every menu is submitted, with status carrying the assign/unassign
    // decision - see the docblock.
    const roleMenuSetting = allMenus.map((menu) => {
      const state = stateFor(menu.id);
      return {
        menu: { id: menu.id, title: menu.title },
        SubMenu: (state.subMenuIds ?? []).join(","),
        button_operation: encodeButtons(state.buttons),
        status: Boolean(state.checked),
      };
    });

    setIsSaving(true);
    try {
      const response = await menuApi.submitRoleMenuSetting({
        roleId: selectedRole,
        roleMenuSetting,
      });
      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(response, "Couldn't save menu permissions."),
        );
      }
      showToast.success(responseMessage(response, "Menu permissions saved."));
    } catch (err) {
      showToast.error(err.message || "Couldn't save menu permissions.");
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
          ) : allMenus.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">
              No menus defined yet — add them on the Menu List tab first.
            </p>
          ) : (
            <div className="divide-y divide-ink-100">
              {allMenus.map((menu) => {
                const state = stateFor(menu.id);
                return (
                  <div key={menu.id} className="space-y-3 px-5 py-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
                        checked={state.checked}
                        disabled={!canEdit}
                        onChange={(e) => toggleMenu(menu.id, e.target.checked)}
                      />
                      {menu.title}
                    </label>

                    {state.checked && (
                      <div className="ml-6 space-y-3">
                        <div className="flex flex-wrap gap-4">
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
                                onChange={() => toggleButton(menu.id, b.code)}
                              />
                              {b.label}
                            </label>
                          ))}
                        </div>

                        <div className="max-w-md">
                          <Multiselect
                            label="SubMenus"
                            placeholder="Select submenus"
                            options={subMenuOptions}
                            value={state.subMenuIds ?? []}
                            onChange={(ids) => updateSubMenus(menu.id, ids)}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {selectedRole && canEdit && allMenus.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={isSaving}>
            Save permissions
          </Button>
        </div>
      )}
    </div>
  );
}
