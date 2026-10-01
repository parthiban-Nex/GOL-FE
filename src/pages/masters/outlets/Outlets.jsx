import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal, { ConfirmModal } from "@/components/ui/Modal";
import { useServerTable } from "@/hooks/useServerTable";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { outletApi } from "@/services";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";
import AddOutletForm from "./AddOutletForm";

const SEARCH_DEBOUNCE_MS = 400;

const columns = [
  { key: "outletCode", header: "Outlet Code" },
  { key: "outletName", header: "Outlet Name" },
  {
    key: "companyName",
    header: "Company",
    render: (row) => row.companyName ?? "-",
  },
];

export default function Outlets() {
  const { canCreate, canUpdate, canDelete } = usePagePermissions();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef(null);

  const list = useCallback((body) => outletApi.list(body), []);
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
  } = useServerTable(list, outletApi.listKey);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      search(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchInput, search]);

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    try {
      const response = await outletApi.remove({ id: deleteTarget.id });
      if (!isSuccess(response)) {
        throw new Error(responseMessage(response, "Couldn't delete outlet."));
      }
      showToast.success(responseMessage(response, "Outlet deleted."));
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      showToast.error(err.message || "Couldn't delete outlet.");
    } finally {
      setIsDeleting(false);
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
                    aria-label={`Edit ${row.outletCode}`}
                    onClick={() => setEditTarget(row)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {/* {canDelete && (
                  <button
                    className="cursor-pointer text-danger-500 hover:text-red-700"
                    aria-label={`Delete ${row.outletCode}`}
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )} */}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">Outlets</h1>
        </div>
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsAddOpen(true)}>
            Add Outlet
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
          columns={tableColumns}
          data={rows}
          isLoading={isLoading}
          getRowId={(row) => row.id ?? row.outletCode}
          emptyTitle="No outlets found"
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
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Outlet"
        size="xl"
      >
        <AddOutletForm
          onCancel={() => setIsAddOpen(false)}
          onCreated={() => {
            setIsAddOpen(false);
            refetch();
          }}
        />
      </Modal>

      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit Outlet"
        size="xl"
      >
        <AddOutletForm
          outlet={editTarget}
          onCancel={() => setEditTarget(null)}
          onCreated={() => {
            setEditTarget(null);
            refetch();
          }}
        />
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete outlet"
        description={`Are you sure you want to delete ${deleteTarget?.outletName}? This can't be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
