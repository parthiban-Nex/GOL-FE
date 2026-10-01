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
import { sourceApi } from "@/services";
import AddSourceForm from "./AddSourceForm";

const SEARCH_DEBOUNCE_MS = 400;

export default function SourceTab() {
  const { canCreate, canUpdate } = usePagePermissions();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const searchTimerRef = useRef(null);

  const list = useCallback((body) => sourceApi.list(body), []);
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
  } = useServerTable(list, sourceApi.listKey);

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
    { key: "sourceName", header: "Source Name" },
    {
      key: "companies",
      header: "Company",
      render: (row) => row.companies || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge tone={row.status ? "success" : "neutral"}>
          {row.status ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "bridge_status",
      header: "Bridge Status",
      render: (row) => (
        <Badge tone={row.bridge_status ? "success" : "danger"}>
          {row.bridge_status ? "Active" : "Inactive"}
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
                aria-label={`Edit ${row.sourceName}`}
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
      <div className="flex items-center justify-end">
        {canCreate && (
          <Button icon={Plus} onClick={() => setIsAddOpen(true)}>
            Add Source
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
          emptyTitle="No sources found"
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
        title="Add Source"
      >
        <AddSourceForm
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
        title="Edit Source"
      >
        <AddSourceForm
          source={editTarget}
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
