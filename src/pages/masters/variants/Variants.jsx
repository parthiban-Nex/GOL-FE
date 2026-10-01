import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useServerTable } from "@/hooks/useServerTable";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { variantApi } from "@/services";
import AddVariantForm from "./AddVariantForm";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * Masters > Variant. The backend spells the column "varient" - the
 * rows below use its spelling, the labels use ours.
 *
 * There is no delete endpoint for this master, so no delete action is
 * rendered regardless of the role's button ids.
 */
export default function Variants() {
  const { canCreate, canUpdate } = usePagePermissions();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef(null);

  const list = useCallback((body) => variantApi.list(body), []);
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
  } = useServerTable(list, variantApi.listKey);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      search(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchInput, search]);

  const columns = [
    { key: "varientName", header: "Variant Name" },
    { key: "varientDescription", header: "Variant Description" },

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
                aria-label={`Edit ${row.varientName}`}
                onClick={() => setEditTarget(row)}
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
        <h1 className="text-lg font-semibold text-ink-800">Variant</h1>
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsAddOpen(true)}>
            Add Variant
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
          emptyTitle="No variants found"
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
        title="Add Variant"
      >
        <AddVariantForm
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
        title="Edit Variant"
      >
        <AddVariantForm
          variant={editTarget}
          onCancel={() => setEditTarget(null)}
          onCreated={() => {
            setEditTarget(null);
            refetch();
          }}
        />
      </Modal>
    </div>
  );
}
