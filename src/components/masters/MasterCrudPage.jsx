import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Search, Trash2 } from "lucide-react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmModal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import SingleSelect from "@/components/ui/SingleSelect";
import Badge from "@/components/ui/Badge";
import Multiselect from "@/components/ui/Multiselect";
import { useServerTable } from "@/hooks/useServerTable";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";
const SEARCH_DEBOUNCE_MS = 400;
export default function MasterCrudPage({
  title,
  description,
  api,
  columns,
  fields,
  listKey,
  getRowId = (row) => row.id,
  hasStatus = true,

  toFormValues,
  toPayload,

  onFieldChange,
  searchPlaceholder = "Search…",
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { canCreate, canUpdate, canDelete } = usePagePermissions();
  const singular = title.replace(/ies$/, "y").replace(/s$/, "");

  const list = useCallback((body) => api.list(body), [api]);
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
  } = useServerTable(list, listKey);
  const searchTimerRef = useRef(null);
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      search(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchInput, search]);
  function blankForm() {
    const blank = Object.fromEntries(
      fields.map((f) => [
        f.name,
        f.type === "multiselect" ? [] : f.type === "toggle" ? 0 : "",
      ]),
    );
    if (hasStatus) blank.status = 1;
    return blank;
  }

  function openCreate() {
    setEditingRow(null);
    setForm(blankForm());
    setIsModalOpen(true);
  }

  function openEdit(row) {
    setEditingRow(row);
    setForm({
      ...blankForm(),
      ...Object.fromEntries(
        fields
          .filter((f) => row[f.name] !== undefined && row[f.name] !== null)
          .map((f) => [f.name, row[f.name]]),
      ),
      ...(hasStatus ? { status: row.status ? 1 : 0 } : {}),
      ...(toFormValues?.(row) ?? {}),
    });
    setIsModalOpen(true);
  }

  function updateField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));

    if (!onFieldChange) return;
    // Resolved asynchronously so a lookup (pincode -> state/city) can
    // patch the form once it returns, without blocking typing. A failed
    // lookup simply leaves the derived fields as they were.
    Promise.resolve()
      .then(() => onFieldChange(name, value, { ...form, [name]: value }))
      .then((patch) => {
        if (patch && typeof patch === "object") {
          setForm((f) => ({ ...f, ...patch }));
        }
      })
      .catch(() => {});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const base = toPayload ? toPayload(form, editingRow) : { ...form };
      // The backend keys updates on the record's own `id`, regardless of
      // whatever business key (employeeCode, outletCode…) the grid shows.
      const payload = editingRow ? { ...base, id: editingRow.id } : base;

      const response = editingRow
        ? await api.update(payload)
        : await api.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(response, "Something went wrong. Please try again."),
        );
      }

      showToast.success(
        responseMessage(
          response,
          editingRow ? "Updated successfully." : "Created successfully.",
        ),
      );
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      showToast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    try {
      const response = await api.remove({ id: deleteTarget.id });
      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(response, "Couldn't delete the record."),
        );
      }
      showToast.success(responseMessage(response, "Deleted successfully."));
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      showToast.error(err.message || "Couldn't delete the record.");
    } finally {
      setIsDeleting(false);
    }
  }

  const tableColumns = [
    ...columns,
    ...(hasStatus
      ? [
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Badge tone={row.status ? "success" : "neutral"}>
                {row.status ? "Active" : "Inactive"}
              </Badge>
            ),
          },
        ]
      : []),
    // The Action column disappears entirely when the role has neither
    // Update nor Delete, rather than rendering an empty header.
    ...(canUpdate || canDelete
      ? [
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <div className="flex items-center gap-3">
                {canUpdate && (
                  <button
                    className="cursor-pointer text-brand-500 hover:text-brand-700"
                    aria-label={`Edit ${getRowId(row)}`}
                    onClick={() => openEdit(row)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {canDelete && api.remove && (
                  <button
                    className="cursor-pointer text-danger-500 hover:text-red-700"
                    aria-label={`Delete ${getRowId(row)}`}
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  // Toggle fields (checkboxes) render on the same row as the Active
  // checkbox rather than stacked in with the text/select fields.
  const visibleFields = fields.filter((field) => field.visible?.(form) ?? true);
  const regularFields = visibleFields.filter(
    (field) => field.type !== "toggle",
  );
  const toggleFields = visibleFields.filter((field) => field.type === "toggle");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">{title}</h1>
          {description && <p className="text-sm text-ink-500">{description}</p>}
        </div>
        {canCreate && (
          <Button icon={Plus} onClick={openCreate}>
            Add {singular}
          </Button>
        )}
      </div>

      <Card padded={false}>
        <div className="max-w-sm px-5 py-3">
          <Input
            icon={Search}
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <Table
          columns={tableColumns}
          data={rows}
          isLoading={isLoading}
          getRowId={getRowId}
          emptyTitle={`No ${title.toLowerCase()} found`}
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
        title={editingRow ? `Edit ${singular}` : `Add ${singular}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="master-crud-form"
              isLoading={isSubmitting}
            >
              Save
            </Button>
          </>
        }
      >
        <form
          id="master-crud-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {regularFields.map((field) => (
            <MasterField
              key={field.name}
              field={field}
              value={form[field.name]}
              onChange={(value) => updateField(field.name, value)}
            />
          ))}

          {(toggleFields.length > 0 || hasStatus) && (
            <div className="flex flex-wrap gap-6 pt-1">
              {toggleFields.map((field) => (
                <MasterField
                  key={field.name}
                  field={field}
                  value={form[field.name]}
                  onChange={(value) => updateField(field.name, value)}
                />
              ))}

              {hasStatus && (
                <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
                    checked={form.status === 1}
                    onChange={(e) =>
                      updateField("status", e.target.checked ? 1 : 0)
                    }
                  />
                  Active
                </label>
              )}
            </div>
          )}
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${singular.toLowerCase()}`}
        description={`Are you sure you want to delete ${
          deleteTarget ? getRowId(deleteTarget) : ""
        }? This can't be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}

function MasterField({ field, value, onChange }) {
  if (field.type === "toggle") {
    return (
      <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
          checked={value === 1}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
        />
        {field.label}
        {field.hint && (
          <span className="text-xs font-normal text-ink-400">{field.hint}</span>
        )}
      </label>
    );
  }

  if (field.type === "multiselect") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <Multiselect
          label={field.label}
          options={field.options ?? []}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          placeholder={
            field.placeholder ?? `Select ${field.label.toLowerCase()}`
          }
        />
      </div>
    );
  }

  if (field.type === "singleselect") {
    return (
      <SingleSelect
        label={field.label}
        required={field.required}
        value={value ?? ""}
        onChange={onChange}
        options={field.options ?? []}
        placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Select
        label={field.label}
        required={field.required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        options={field.options ?? []}
        placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
      />
    );
  }

  return (
    <Input
      label={field.label}
      type={field.type ?? "text"}
      required={field.required}
      variant="underline"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      readOnly={field.readOnly}
      className={field.readOnly ? "bg-ink-50 text-ink-500" : undefined}
    />
  );
}
