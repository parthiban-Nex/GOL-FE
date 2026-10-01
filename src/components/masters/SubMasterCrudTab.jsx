import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import SingleSelect from "@/components/ui/SingleSelect";
import Multiselect from "@/components/ui/Multiselect";
import { useServerTable } from "@/hooks/useServerTable";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const SEARCH_DEBOUNCE_MS = 400;

export default function SubMasterCrudTab({
  title,
  api,
  columns,
  fields,
  canCreate,
  canUpdate,
  getRowId = (row) => row.id,
  toFormValues,
  toPayload,
  searchPlaceholder = "Search",
  onSaved,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef(null);

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
  } = useServerTable(list, api.listKey);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      search(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchInput, search]);

  function blankForm() {
    return {
      ...Object.fromEntries(
        fields.map((f) => [
          f.name,
          f.type === "multiselect" ? [] : f.type === "toggle" ? 0 : "",
        ]),
      ),
      status: 1,
    };
  }

  function openCreate() {
    setEditingRow(null);
    setForm(blankForm());
    setErrors({});
    setIsModalOpen(true);
  }

  function openEdit(row) {
    setEditingRow(row);
    setForm({
      ...blankForm(),
      ...Object.fromEntries(
        fields
          .filter(
            (f) =>
              f.type !== "multiselect" &&
              row[f.name] !== undefined &&
              row[f.name] !== null,
          )
          .map((f) => [
            f.name,
            f.type === "toggle" ? (row[f.name] ? 1 : 0) : String(row[f.name]),
          ]),
      ),
      status: row.status ? 1 : 0,
      ...(toFormValues?.(row) ?? {}),
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const missing = {};
    for (const field of fields) {
      if (!field.required) continue;
      const value = form[field.name];
      const isEmpty = Array.isArray(value)
        ? value.length === 0
        : !String(value ?? "").trim();
      if (isEmpty) missing[field.name] = "This field is required.";
    }
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }

    setIsSubmitting(true);
    try {
      const base = toPayload ? toPayload(form, editingRow) : { ...form };
      // Every one of these masters keys its update on the record's own id.
      const payload = editingRow ? { ...base, id: editingRow.id } : base;

      const response = editingRow
        ? await api.update(payload)
        : await api.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(response, `Couldn't save ${title.toLowerCase()}.`),
        );
      }

      showToast.success(
        responseMessage(
          response,
          editingRow ? `${title} updated.` : `${title} created.`,
        ),
      );
      setIsModalOpen(false);
      refetch();
      onSaved?.();
    } catch (err) {
      showToast.error(err.message || `Couldn't save ${title.toLowerCase()}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const tableColumns = [
    ...columns,
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status ? "success" : "neutral"}>
          {row.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    ...(canUpdate
      ? [
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <button
                className="cursor-pointer text-brand-500 hover:text-brand-700"
                aria-label={`Edit ${getRowId(row)}`}
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
      <div className="flex items-center justify-end">
        {canCreate && (
          <Button icon={Plus} onClick={openCreate}>
            Add {title}
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
          emptyTitle={`No ${title.toLowerCase()} records found`}
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
        title={editingRow ? `Edit ${title}` : `Add ${title}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {fields
              .filter((field) => field.type !== "toggle")
              .map((field) =>
                field.type === "multiselect" ? (

                  <div key={field.name} className="-mt-1.5">
                    <Multiselect
                      label={field.label}
                      required={field.required}
                      options={field.options ?? []}
                      value={
                        Array.isArray(form[field.name]) ? form[field.name] : []
                      }
                      onChange={(value) => update(field.name, value)}
                      placeholder={
                        field.placeholder ??
                        `Select ${field.label.toLowerCase()}`
                      }
                      error={errors[field.name]}
                    />
                  </div>
                ) : field.type === "select" ? (
                  <div key={field.name} className="-mt-2.5">
                    <SingleSelect
                      label={field.label}
                      required={field.required}
                      placeholder={
                        field.placeholder ??
                        `Select ${field.label.toLowerCase()}`
                      }
                      value={form[field.name] ?? ""}
                      onChange={(value) => update(field.name, value)}
                      error={errors[field.name]}
                      options={field.options ?? []}
                    />
                  </div>
                ) : (
                  <Input
                    key={field.name}
                    label={field.label}
                    type={field.type ?? "text"}
                    required={field.required}
                    variant="underline"
                    value={form[field.name] ?? ""}
                    onChange={(e) => update(field.name, e.target.value)}
                    error={errors[field.name]}
                  />
                ),
              )}
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            {fields
              .filter((field) => field.type === "toggle")
              .map((field) => (
                <label
                  key={field.name}
                  className="flex items-center gap-2 text-sm font-medium text-ink-700"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
                    checked={form[field.name] === 1}
                    onChange={(e) =>
                      update(field.name, e.target.checked ? 1 : 0)
                    }
                  />
                  {field.label}
                </label>
              ))}

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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingRow ? "Save changes" : `Create ${title.toLowerCase()}`}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
