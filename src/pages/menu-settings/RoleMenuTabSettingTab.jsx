import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SingleSelect from "@/components/ui/SingleSelect";
import { useServerTable } from "@/hooks/useServerTable";
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

/**
 * Defines the TABS that appear inside a menu or submenu page, per role,
 * and which button operations the role gets on each tab.
 *
 * This is the layer above Role Menu Setting: that screen says a role can
 * reach "Menu Settings"; this one says which of its tabs (Menu List,
 * Role Menu Setting, …) that role actually sees, and what it may do on
 * each. MenuSettings.jsx reads exactly these records back out of the
 * logged-in user's menu tree to decide which tabs to render.
 *
 * A record attaches to EITHER a menu or a submenu - the backend stores
 * the unused side as 0, which is what the toggle below switches between.
 */
const SEARCH_DEBOUNCE_MS = 400;

const ATTACH_TO_OPTIONS = [
  { value: "menu", label: "Menu" },
  { value: "submenu", label: "SubMenu" },
];

export default function RoleMenuTabSettingTab() {
  // Create (id 1) opens the Add form; Update (id 3) enables the row
  // pencil - both scoped to this tab's own backend record.
  const { canCreate, canUpdate } = useTabPermissions("Role Menu Tab Setting");

  const roleOptions = useDropdownOptions(
    () => roleApi.list(),
    (r) => ({
      value: String(r.id ?? r.roleId),
      label: r.roleName ?? r.employeeRole,
    }),
    roleApi.listKey,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [form, setForm] = useState(blankForm());
  const [menus, setMenus] = useState([]);
  const [subMenus, setSubMenus] = useState([]);
  const searchTimerRef = useRef(null);

  const list = useCallback((body) => menuApi.getRoleMenuTabs(body), []);
  const {
    rows,
    totalItems,
    totalPages,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    refetch,
  } = useServerTable(list, menuApi.tabListKey);

  // Menu and submenu options are both scoped to the chosen role, so they
  // reload whenever it changes.
  useEffect(() => {
    if (!form.roleId) {
      setMenus([]);
      setSubMenus([]);
      return;
    }

    menuApi
      .getAllMenus({ roleId: form.roleId })
      .then((response) => setMenus(extractList(response, menuApi.menuListKey)))
      .catch(() => setMenus([]));

    menuApi
      .getAllSubMenus({ roleId: form.roleId })
      .then((response) =>
        setSubMenus(extractList(response, menuApi.roleSubMenuListKey)),
      )
      .catch(() => setSubMenus([]));
  }, [form.roleId]);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      search(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchInput, search]);
  const menuOptions = useMemo(
    () => menus.map((m) => ({ value: String(m.id), label: m.title })),
    [menus],
  );
  const subMenuOptions = useMemo(
    () => subMenus.map((s) => ({ value: String(s.id), label: s.title })),
    [subMenus],
  );

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleOperation(code) {
    setForm((f) => {
      const operations = new Set(f.operations);
      if (operations.has(code)) operations.delete(code);
      else operations.add(code);
      return { ...f, operations };
    });
  }

  function openCreate() {
    setEditingRow(null);
    setForm(blankForm());
    setIsModalOpen(true);
  }

  function openEdit(row) {
    setEditingRow(row);
    const attachedToSubMenu = Boolean(row.subMenuTitle);
    setForm({
      roleId: "",
      roleName: row.roleName ?? "",
      attachTo: attachedToSubMenu ? "submenu" : "menu",
      menuTitle: row.menuTitle ?? "",
      subMenuTitle: row.subMenuTitle ?? "",
      menuId: "",
      submenuId: "",
      tabName: row.tab_name ?? "",
      operations: decodeButtons(row.tab_menu_operation),
    });
    setIsModalOpen(true);
  }

  // Resolve the title the grid gave us back to an id, once the
  // role-scoped menu/submenu lists have arrived.
  useEffect(() => {
    if (!editingRow) return;
    if (form.roleName && !form.roleId) {
      const match = roleOptions.find((r) => r.label === form.roleName);
      if (match) update("roleId", match.value);
    }
    if (form.menuTitle && !form.menuId) {
      const match = menus.find((m) => m.title === form.menuTitle);
      if (match) update("menuId", String(match.id));
    }
    if (form.subMenuTitle && !form.submenuId) {
      const match = subMenus.find((s) => s.title === form.subMenuTitle);
      if (match) update("submenuId", String(match.id));
    }
  }, [
    editingRow,
    roleOptions,
    menus,
    subMenus,
    form.roleName,
    form.menuTitle,
    form.subMenuTitle,
    form.menuId,
    form.submenuId,
  ]);

  async function handleSubmit(e) {
    e.preventDefault();

    const attachedId =
      form.attachTo === "submenu" ? form.submenuId : form.menuId;
    if (!form.roleId || !attachedId || !form.tabName.trim()) {
      showToast.error(
        "Role, tab name, and the menu or submenu it belongs to are all required.",
      );
      return;
    }

    const payload = {
      roleId: Number(form.roleId) || form.roleId,
      // Exactly one side is populated; the other is sent as 0, matching
      // how the backend stores these records.
      menuId: form.attachTo === "menu" ? Number(form.menuId) || 0 : 0,
      submenuId: form.attachTo === "submenu" ? Number(form.submenuId) || 0 : 0,
      tabName: form.tabName.trim(),
      tabMenuOperations: encodeButtons(form.operations),
    };

    setIsSubmitting(true);
    try {
      const response = editingRow
        ? await menuApi.updateRoleMenuTab({ id: editingRow.id, ...payload })
        : await menuApi.addRoleMenuTab(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(response, "Couldn't save the tab setting."),
        );
      }

      showToast.success(
        responseMessage(response, editingRow ? "Tab updated." : "Tab created."),
      );
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast.error(err.message || "Couldn't save the tab setting.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns = [
    { key: "roleName", header: "Role" },
    { key: "tab_name", header: "Tab Name" },
    { key: "menuTitle", header: "Menu", render: (row) => row.menuTitle || "-" },
    {
      key: "subMenuTitle",
      header: "SubMenu",
      render: (row) => row.subMenuTitle || "-",
    },
    {
      key: "tab_menu_operation",
      header: "Operations",
      render: (row) => labelOperations(row.tab_menu_operation),
    },
    ...(canUpdate
      ? [
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <button
                className="cursor-pointer text-brand-500 hover:text-brand-700"
                aria-label={`Edit ${row.tab_name}`}
                onClick={() => openEdit(row)}
              >
                <Pencil className="h-4 w-4" />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">
            Role Menu Tab Setting
          </h1>
        </div>
        {canCreate && (
          <Button icon={Plus} onClick={openCreate}>
            Add Tab
          </Button>
        )}
      </div>

      <Card padded={false}>
        <div className="max-w-sm px-5 py-3">
          <Input
            icon={Search}
            placeholder="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          data={rows}
          isLoading={isLoading}
          getRowId={(row) => row.id}
          emptyTitle="No tab settings found"
        />
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRow ? "Edit Tab Setting" : "Add Tab Setting"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="role-menu-tab-form"
              isLoading={isSubmitting}
            >
              Save
            </Button>
          </>
        }
      >
        <form
          id="role-menu-tab-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <SingleSelect
            label="Role"
            required
            placeholder="Select a role"
            value={form.roleId}
            onChange={(value) => update("roleId", value)}
            options={roleOptions}
          />

          <SingleSelect
            label="Attach to"
            value={form.attachTo}
            onChange={(value) => update("attachTo", value)}
            options={ATTACH_TO_OPTIONS}
            clearable={false}
          />

          {form.attachTo === "menu" ? (
            <SingleSelect
              label="Menu"
              required
              placeholder={
                form.roleId ? "Select a menu" : "Select a role first"
              }
              value={form.menuId}
              onChange={(value) => update("menuId", value)}
              options={menuOptions}
              disabled={!form.roleId}
            />
          ) : (
            <SingleSelect
              label="SubMenu"
              required
              placeholder={
                form.roleId ? "Select a submenu" : "Select a role first"
              }
              value={form.submenuId}
              onChange={(value) => update("submenuId", value)}
              options={subMenuOptions}
              disabled={!form.roleId}
            />
          )}

          <Input
            label="Tab Name"
            required
            variant="underline"
            value={form.tabName}
            onChange={(e) => update("tabName", e.target.value)}
            placeholder="e.g. Menu List"
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-700">
              Tab Operations
            </span>
            <div className="flex flex-wrap gap-4">
              {BUTTON_OPERATIONS.map((b) => (
                <label
                  key={b.code}
                  className="flex items-center gap-1.5 text-sm text-ink-600"
                >
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer rounded border-ink-300 text-brand-600"
                    checked={form.operations.has(b.code)}
                    onChange={() => toggleOperation(b.code)}
                  />
                  {b.label}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function blankForm() {
  return {
    roleId: "",
    roleName: "",
    attachTo: "menu",
    menuId: "",
    submenuId: "",
    menuTitle: "",
    subMenuTitle: "",
    tabName: "",
    operations: new Set([2]),
  };
}

function labelOperations(raw) {
  const codes = decodeButtons(raw);
  const labels = BUTTON_OPERATIONS.filter((b) => codes.has(b.code)).map(
    (b) => b.label,
  );
  return labels.length ? labels.join(", ") : "-";
}
